import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { User } from '../../shared/entities/user.entity'
import { Role } from '../../shared/entities/role.entity'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { ERROR_CODES } from '../../shared/constants/error-codes.constant'
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto'
import { BaseService } from '../../common/services/base.service'
import { UserPermissionsService } from '../../shared/services/user-permissions.service'

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private userPermissionsService: UserPermissionsService
  ) {
    super(userRepository)
  }

  /**
   * 获取用户列表（带分页和查询）
   */
  async findAllWithPagination(
    pagination: PaginationDto,
    query: QueryUserDto
  ): Promise<PaginatedResponseDto<User>> {
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
    queryBuilder.skip(pagination.skip).take(pagination.take)

    // 执行查询
    const [users, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(users, total, pagination.page ?? 1, pagination.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个用户
   */
  async findOneUser(id: number): Promise<User> {
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
   * 创建用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在（排除软删除）
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
      withDeleted: false
    })

    if (existingUser) {
      throw new BusinessException('用户名已存在', HttpStatus.CONFLICT, ERROR_CODES.USERNAME_EXISTS)
    }

    const user = this.userRepository.create(createUserDto)
    return this.userRepository.save(user)
  }

  /**
   * 更新用户
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneUser(id) // 这里会抛出 BusinessException 如果用户不存在

    // 检查用户名是否被其他用户使用（排除软删除）
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
        withDeleted: false
      })

      if (existingUser) {
        throw new BusinessException(
          '用户名已被其他用户使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.USERNAME_EXISTS
        )
      }
    }

    await this.userRepository.update(id, updateUserDto)
    return this.findOneUser(id)
  }

  /**
   * 软删除用户
   */
  async delete(id: number): Promise<void> {
    const user = await this.findOneUser(id) // 这里会抛出 BusinessException 如果用户不存在

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

    // 使用软删除
    await this.userRepository.softDelete(id)
  }

  /**
   * 为用户分配角色
   */
  async assignRoles(userId: number, roleIds: number[]): Promise<User> {
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
    console.log(`🔄 用户 ID ${userId} 的角色已更新，已清空权限缓存`)

    return updatedUser
  }
}
