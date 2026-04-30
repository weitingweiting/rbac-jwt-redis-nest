import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { plainToInstance } from 'class-transformer'
import { User } from '../../shared/entities/user.entity'
import { Role } from '../../shared/entities/role.entity'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { ERROR_CODES } from '../../shared/constants/error-codes.constant'
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUserDto,
  UserResponseDto,
  UserSimpleResponseDto
} from './dto'
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto'
import { BaseService } from '../../common/services/base.service'
import { UserPermissionsService } from '../../shared/services/user-permissions.service'
import { PasswordUtil } from '../../common/utils/password.util'
import { AuthService } from '../auth/auth.service'
import { MessageResponseDto } from '../auth/dto'

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private userPermissionsService: UserPermissionsService,
    private authService: AuthService
  ) {
    super(userRepository)
  }

  /**
   * 获取用户列表（带分页和查询）
   */
  async findAllWithPagination(query: QueryUserDto): Promise<PaginatedResponseDto<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('user.deletedAt IS NULL')

    if (query.username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${query.username}%`
      })
    }

    if (query.role) {
      queryBuilder.andWhere('role.name = :roleName', {
        roleName: query.role
      })
    }

    queryBuilder.skip(query.skip).take(query.take)

    const [users, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(users, total, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * 查找用户实体（含 password）
   * @private
   */
  private async findUserEntity(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
      withDeleted: false
    })

    if (!user) {
      throw new BusinessException(
        `用户 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
      )
    }

    return user
  }

  /**
   * 根据 ID 查找单个用户（返回 DTO，不包含密码）
   */
  async findOneUser(id: number): Promise<UserResponseDto> {
    const user = await this.findUserEntity(id)
    const resUser = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true
    })
    return resUser
  }

  /**
   * 创建用户-给管理员用的
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
      withDeleted: true // 包含软删除用户
    })

    if (existingUser) {
      throw new BusinessException('用户名已存在', HttpStatus.CONFLICT, ERROR_CODES.USERNAME_EXISTS)
    }

    if (createUserDto?.password) {
      createUserDto.password = PasswordUtil.hashPassword(createUserDto.password)
    }

    const user = this.userRepository.create(createUserDto)
    return this.userRepository.save(user)
  }

  /**
   * 更新用户 - 改名、头像。参考 updateUserDto
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<UserSimpleResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { username: updateUserDto.username },
      withDeleted: true
    })

    if (existingUser) {
      throw new BusinessException(
        '用户名已被其他用户使用',
        HttpStatus.CONFLICT,
        ERROR_CODES.USERNAME_EXISTS
      )
    }

    await this.userRepository.update(id, updateUserDto)

    const user = await this.findOneUser(id)

    const { roles: _, ...restUser } = user

    return restUser
  }

  /**
   * 软删除用户
   */
  async deleteUser(id: number): Promise<void> {
    const user = await this.findOneUser(id)

    // 检查是否是最后一个管理员
    const userRoles = user.roles || []
    const isAdmin = userRoles.some((role) => role.name === 'admin')

    if (isAdmin) {
      const adminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :roleName', { roleName: 'admin' })
        .andWhere('user.deletedAt IS NULL')
        .getCount()

      if (adminCount <= 1) {
        throw new BusinessException(
          '无法删除最后一个管理员账户',
          HttpStatus.FORBIDDEN,
          ERROR_CODES.CANNOT_DELETE_LAST_ADMIN
        )
      }
    }

    // 清空用户权限缓存
    await this.userPermissionsService.clearUserCache(id)

    await this.userRepository.softDelete(id)
  }

  /**
   * 修改用户密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
      withDeleted: false
    })

    if (!user) {
      throw new BusinessException('用户不存在', HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
    }

    const isOldPasswordValid = PasswordUtil.verifyPassword(oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new BusinessException(
        '原密码错误',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }

    if (oldPassword === newPassword) {
      throw new BusinessException(
        '新密码不能与原密码相同',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.RESOURCE_CONFLICT
      )
    }

    const hashedPassword = PasswordUtil.hashPassword(newPassword)

    await this.userRepository.update(userId, { password: hashedPassword })

    // 将用户踢出登录状态，要求重新登录
    await this.authService.forceLogout(userId)
  }

  /**
   * 管理员重置用户密码
   */
  async resetPassword(userId: number, newPassword: string): Promise<MessageResponseDto> {
    await this.findOneUser(userId)

    // 加密新密码
    const hashedPassword = PasswordUtil.hashPassword(newPassword)

    // 更新密码
    await this.userRepository.update(userId, { password: hashedPassword })

    // 将用户踢出登录状态，要求重新登录
    return await this.authService.forceLogout(userId)
  }

  /**
   * 为用户分配角色
   */
  async assignRoles(userId: number, roleIds: number[]): Promise<UserResponseDto> {
    const user = await this.findOneUser(userId)

    // 验证角色是否存在
    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) }
    })

    if (roles.length !== roleIds.length) {
      throw new BusinessException(
        '部分角色ID不存在',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    // 分配角色
    user.roles = roles
    const updatedUser = await this.userRepository.save(user)

    // 清空用户权限缓存
    await this.userPermissionsService.clearUserCache(userId)

    return updatedUser
  }
}
