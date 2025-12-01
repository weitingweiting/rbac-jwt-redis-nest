import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Permission } from '../../shared/entities/permission.entity'
import { BaseService } from '../../common/services/base.service'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { ERROR_CODES } from '../../shared/constants/error-codes.constant'
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto/permission.dto'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto'

@Injectable()
export class PermissionsService extends BaseService<Permission> {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>
  ) {
    super(permissionRepository)
  }

  /**
   * 获取权限列表（带分页和查询）
   */
  async findAllWithPagination(
    pagination: PaginationDto,
    query: QueryPermissionDto
  ): Promise<PaginatedResponseDto<Permission>> {
    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.deletedAt IS NULL')

    if (query.code) {
      queryBuilder.andWhere('permission.code LIKE :code', {
        code: `%${query.code}%`
      })
    }

    if (query.name) {
      queryBuilder.andWhere('permission.name LIKE :name', {
        name: `%${query.name}%`
      })
    }

    queryBuilder.skip(pagination.skip).take(pagination.take)

    const [permissions, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(
      permissions,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 10
    )
  }

  /**
   * 根据 ID 查找单个权限
   */
  async findOnePermission(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      withDeleted: false
    })

    if (!permission) {
      throw new BusinessException(
        `权限 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    return permission
  }

  /**
   * 创建权限
   */
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限代码是否已存在
    const existingCode = await this.permissionRepository.findOne({
      where: { code: createPermissionDto.code },
      withDeleted: false
    })

    if (existingCode) {
      throw new BusinessException(
        '权限代码已存在',
        HttpStatus.CONFLICT,
        ERROR_CODES.RESOURCE_CONFLICT
      )
    }

    // 检查权限名称是否已存在
    const existingName = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name },
      withDeleted: false
    })

    if (existingName) {
      throw new BusinessException(
        '权限名称已存在',
        HttpStatus.CONFLICT,
        ERROR_CODES.RESOURCE_CONFLICT
      )
    }

    const permission = this.permissionRepository.create(createPermissionDto)
    return this.permissionRepository.save(permission)
  }

  /**
   * 更新权限
   */
  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionDto
  ): Promise<Permission> {
    const permission = await this.findOnePermission(id)

    // 检查权限代码是否被其他权限使用
    if (updatePermissionDto.code && updatePermissionDto.code !== permission.code) {
      const existingCode = await this.permissionRepository.findOne({
        where: { code: updatePermissionDto.code },
        withDeleted: false
      })

      if (existingCode) {
        throw new BusinessException(
          '权限代码已被其他权限使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.RESOURCE_CONFLICT
        )
      }
    }

    // 检查权限名称是否被其他权限使用
    if (updatePermissionDto.name && updatePermissionDto.name !== permission.name) {
      const existingName = await this.permissionRepository.findOne({
        where: { name: updatePermissionDto.name },
        withDeleted: false
      })

      if (existingName) {
        throw new BusinessException(
          '权限名称已被其他权限使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.RESOURCE_CONFLICT
        )
      }
    }

    await this.permissionRepository.update(id, updatePermissionDto)
    return this.findOnePermission(id)
  }

  /**
   * 软删除权限
   */
  async deletePermission(id: number): Promise<void> {
    await this.findOnePermission(id)
    await this.permissionRepository.softDelete(id)
  }
}
