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
      .where('user.deletedAt IS NULL') // 排除软删除的用户

    // 应用查询条件
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

    // 应用分页
    queryBuilder.skip(query.skip).take(query.take)

    // 执行查询
    const [users, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(users, total, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * 内部方法：查找用户实体（包含 password）
   * 仅在需要完整实体操作时使用（如密码验证）
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
   * 推荐用于所有需要返回用户信息的场景
   */
  async findOneUser(id: number): Promise<UserResponseDto> {
    const user = await this.findUserEntity(id)
    const resUser = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true // 只包含标记了 @Expose() 的字段
    })
    return resUser
  }

  /**
   * 创建用户-给管理员用的
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
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
      withDeleted: true // 包含软删除用户
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
        .andWhere('user.deletedAt IS NULL') // 只统计未删除的管理员
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

    // 执行软删除
    await this.userRepository.softDelete(id)
  }

  /**
   * 修改用户密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    // 查找用户（需要密码字段进行验证）
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'], // 明确选择密码字段
      withDeleted: false
    })

    if (!user) {
      throw new BusinessException('用户不存在', HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
    }

    // 验证旧密码
    const isOldPasswordValid = PasswordUtil.verifyPassword(oldPassword, user.password)
    if (!isOldPasswordValid) {
      throw new BusinessException(
        '原密码错误',
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS
      )
    }

    // 验证新密码不能与旧密码相同
    if (oldPassword === newPassword) {
      throw new BusinessException(
        '新密码不能与原密码相同',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.RESOURCE_CONFLICT
      )
    }

    // 加密新密码
    const hashedPassword = PasswordUtil.hashPassword(newPassword)

    // 更新密码
    await this.userRepository.update(userId, { password: hashedPassword })

    // 将用户踢出登录状态，要求重新登录
    await this.authService.forceLogout(userId)
  }

  /**
   * 管理员重置用户密码
   */
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    // 验证用户是否存在
    await this.findOneUser(userId)

    // 加密新密码
    const hashedPassword = PasswordUtil.hashPassword(newPassword)

    // 更新密码
    await this.userRepository.update(userId, { password: hashedPassword })

    // 将用户踢出登录状态，要求重新登录
    await this.authService.forceLogout(userId)
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

    // 返回 DTO
    return updatedUser
  }
}
