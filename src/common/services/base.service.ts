import { Repository, FindOptionsWhere, FindManyOptions, FindOneOptions } from 'typeorm'
import { BaseEntity } from '../../shared/entities/base.entity'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { HttpStatus } from '@nestjs/common'
import { ERROR_CODES } from '../../shared/constants/error-codes.constant'

/**
 * 基础服务类，提供通用的 CRUD 操作和软删除支持
 */
export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * 查找所有记录（默认排除软删除）
   */
  async findAll(options?: FindManyOptions<T>, includeSoftDeleted = false): Promise<T[]> {
    if (!includeSoftDeleted) {
      return this.repository.find({
        ...options,
        withDeleted: false
      })
    }
    return this.repository.find({ ...options, withDeleted: true })
  }

  /**
   * 查找单个记录（默认排除软删除）
   */
  async findOne(options: FindOneOptions<T>, includeSoftDeleted = false): Promise<T | null> {
    if (!includeSoftDeleted) {
      return this.repository.findOne({
        ...options,
        withDeleted: false
      })
    }
    return this.repository.findOne({ ...options, withDeleted: true })
  }

  /**
   * 根据 ID 查找记录，不存在时抛出异常
   */
  async findOneById(id: number, relations: string[] = [], includeSoftDeleted = false): Promise<T> {
    const entity = await this.findOne(
      {
        where: { id } as FindOptionsWhere<T>,
        relations
      },
      includeSoftDeleted
    )

    if (!entity) {
      throw new BusinessException(
        `记录 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    return entity
  }

  /**
   * 创建记录
   */
  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any)
    const saved = await this.repository.save(entity)
    return Array.isArray(saved) ? saved[0] : saved
  }

  /**
   * 更新记录
   */
  async update(id: number, data: Partial<T>): Promise<T> {
    await this.findOneById(id) // 验证记录存在
    await this.repository.update(id, data as any)
    return this.findOneById(id)
  }

  /**
   * 软删除记录
   */
  async softDelete(id: number): Promise<void> {
    await this.findOneById(id) // 验证记录存在
    await this.repository.softDelete(id)
  }

  /**
   * 硬删除记录（物理删除）
   */
  async hardDelete(id: number): Promise<void> {
    const entity = await this.findOneById(id, [], true) // 允许查找软删除的记录
    await this.repository.remove(entity)
  }

  /**
   * 恢复软删除的记录
   */
  async restore(id: number): Promise<T> {
    // 查找已软删除的记录
    const entity = await this.findOne(
      {
        where: { id } as FindOptionsWhere<T>
      },
      true
    )

    if (!entity) {
      throw new BusinessException(
        `记录 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    if (!entity.deletedAt) {
      throw new BusinessException(
        `记录 ID ${id} 未被删除`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_OPERATION
      )
    }

    await this.repository.restore(id)
    return this.findOneById(id)
  }

  /**
   * 批量软删除
   */
  async softDeleteMany(ids: number[]): Promise<void> {
    await this.repository.softDelete(ids)
  }

  /**
   * 统计记录数量（排除软删除）
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where, withDeleted: false })
  }
}
