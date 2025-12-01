import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Role } from '../../shared/entities/role.entity'
import { Permission } from '../../shared/entities/permission.entity'
import { BaseService } from '../../common/services/base.service'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { ERROR_CODES } from '../../shared/constants/error-codes.constant'
import { CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto/role.dto'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto'

@Injectable()
export class RolesService extends BaseService<Role> {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {
    super(roleRepository)
  }

  /**
   * 获取角色列表（带分页和查询）
   */
  async findAllWithPagination(
    pagination: PaginationDto,
    query: QueryRoleDto
  ): Promise<PaginatedResponseDto<Role>> {
    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.deletedAt IS NULL')

    if (query.name) {
      queryBuilder.andWhere('role.name LIKE :name', {
        name: `%${query.name}%`
      })
    }

    queryBuilder.skip(pagination.skip).take(pagination.take)

    const [roles, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(roles, total, pagination.page ?? 1, pagination.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个角色
   */
  async findOneRole(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
      withDeleted: false
    })

    if (!role) {
      throw new BusinessException(
        `角色 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.ROLE_NOT_FOUND
      )
    }

    return role
  }

  /**
   * 创建角色
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { permissionIds, ...roleData } = createRoleDto

    // 检查角色名是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { name: roleData.name },
      withDeleted: false
    })

    if (existingRole) {
      throw new BusinessException(
        '角色名已存在',
        HttpStatus.CONFLICT,
        ERROR_CODES.RESOURCE_CONFLICT
      )
    }

    const role = this.roleRepository.create(roleData)

    // 如果提供了权限 ID，关联权限
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds) }
      })

      if (permissions.length !== permissionIds.length) {
        throw new BusinessException(
          '部分权限ID不存在',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.RESOURCE_NOT_FOUND
        )
      }

      role.permissions = permissions
    }

    return this.roleRepository.save(role)
  }

  /**
   * 更新角色
   */
  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOneRole(id)
    const { permissionIds, ...roleData } = updateRoleDto

    // 检查角色名是否被其他角色使用
    if (roleData.name && roleData.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
        withDeleted: false
      })

      if (existingRole) {
        throw new BusinessException(
          '角色名已被其他角色使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.RESOURCE_CONFLICT
        )
      }
    }

    // 更新权限关联
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionRepository.find({
          where: { id: In(permissionIds) }
        })

        if (permissions.length !== permissionIds.length) {
          throw new BusinessException(
            '部分权限ID不存在',
            HttpStatus.BAD_REQUEST,
            ERROR_CODES.RESOURCE_NOT_FOUND
          )
        }

        role.permissions = permissions
      } else {
        role.permissions = []
      }
    }

    // 更新角色基本信息
    Object.assign(role, roleData)
    return this.roleRepository.save(role)
  }

  /**
   * 为角色分配权限
   */
  async assignPermissions(id: number, permissionIds: number[]): Promise<Role> {
    const role = await this.findOneRole(id)

    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) }
    })

    if (permissions.length !== permissionIds.length) {
      throw new BusinessException(
        '部分权限ID不存在',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    role.permissions = permissions
    return this.roleRepository.save(role)
  }

  /**
   * 软删除角色
   */
  async deleteRole(id: number): Promise<void> {
    await this.findOneRole(id)
    await this.roleRepository.softDelete(id)
  }
}
