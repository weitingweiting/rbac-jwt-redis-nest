import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { BaseService } from '@/common/services/base.service'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import {
  CreateComponentCategoryDto,
  UpdateComponentCategoryDto,
  QueryComponentCategoryDto
} from '../dto/component-category.dto'
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto'

@Injectable()
export class ComponentCategoriesService extends BaseService<ComponentCategory> {
  constructor(
    @InjectRepository(ComponentCategory)
    private categoryRepository: Repository<ComponentCategory>
  ) {
    super(categoryRepository)
  }

  /**
   * 获取分类树结构
   */
  async getCategoryTree(): Promise<ComponentCategory[]> {
    // 查询所有一级分类
    const level1Categories = await this.categoryRepository.find({
      where: { level: 1, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    })

    // 查询所有二级分类
    const level2Categories = await this.categoryRepository.find({
      where: { level: 2, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' }
    })

    // 构建树形结构
    const categoryTree = level1Categories.map((parent) => {
      const children = level2Categories.filter((child) => child.parentId === parent.id)
      return {
        ...parent,
        children
      }
    })

    return categoryTree as any
  }

  /**
   * 获取分类列表（带分页和查询）
   */
  async findAllWithPagination(
    query: QueryComponentCategoryDto
  ): Promise<PaginatedResponseDto<ComponentCategory>> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.deletedAt IS NULL')

    if (query.code) {
      queryBuilder.andWhere('category.code LIKE :code', { code: `%${query.code}%` })
    }

    if (query.name) {
      queryBuilder.andWhere('category.name LIKE :name', { name: `%${query.name}%` })
    }

    if (query.level) {
      queryBuilder.andWhere('category.level = :level', { level: query.level })
    }

    if (query.parentId !== undefined) {
      if (query.parentId === null) {
        queryBuilder.andWhere('category.parentId IS NULL')
      } else {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId: query.parentId })
      }
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: query.isActive })
    }

    queryBuilder.orderBy('category.sortOrder', 'ASC').addOrderBy('category.createdAt', 'ASC')

    queryBuilder.skip(query.skip).take(query.take)

    const [categories, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(categories, total, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个分类
   */
  async findOneCategory(id: number): Promise<ComponentCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: false
    })

    if (!category) {
      throw new BusinessException(
        `分类 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_CATEGORY_NOT_FOUND
      )
    }

    return category
  }

  /**
   * 创建分类
   */
  async createCategory(createDto: CreateComponentCategoryDto): Promise<ComponentCategory> {
    // 检查分类编码是否已存在
    const existingCategory = await this.categoryRepository.findOne({
      where: { code: createDto.code },
      withDeleted: true
    })

    if (existingCategory) {
      if (existingCategory.deletedAt) {
        throw new BusinessException(
          `分类编码 ${createDto.code} 已存在但已被删除，请使用其他编码`,
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.COMPONENT_CATEGORY_CODE_EXISTS
        )
      }
      throw new BusinessException(
        `分类编码 ${createDto.code} 已存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_CATEGORY_CODE_EXISTS
      )
    }

    // 验证层级关系
    if (createDto.level === 2 && !createDto.parentId) {
      throw new BusinessException(
        '二级分类必须指定父分类',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_CATEGORY_PARENT_REQUIRED
      )
    }

    if (createDto.level === 1 && createDto.parentId) {
      throw new BusinessException(
        '一级分类不能指定父分类',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_CATEGORY_INVALID_PARENT
      )
    }

    // 如果是二级分类，验证父分类存在且为一级分类
    if (createDto.level === 2 && createDto.parentId) {
      const parentCategory = await this.findOneCategory(createDto.parentId)
      if (parentCategory.level !== 1) {
        throw new BusinessException(
          '父分类必须是一级分类',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.COMPONENT_CATEGORY_INVALID_PARENT
        )
      }
    }

    const category = this.categoryRepository.create(createDto)
    return await this.categoryRepository.save(category)
  }

  /**
   * 更新分类
   */
  async updateCategory(
    id: number,
    updateDto: UpdateComponentCategoryDto
  ): Promise<ComponentCategory> {
    const category = await this.findOneCategory(id)

    // 如果更新编码，检查是否重复
    if (updateDto.code && updateDto.code !== category.code) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { code: updateDto.code },
        withDeleted: true
      })

      if (existingCategory) {
        throw new BusinessException(
          `分类编码 ${updateDto.code} 已存在`,
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.COMPONENT_CATEGORY_CODE_EXISTS
        )
      }
    }

    // 验证层级关系
    if (updateDto.level === 2 && !updateDto.parentId && !category.parentId) {
      throw new BusinessException(
        '二级分类必须指定父分类',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_CATEGORY_PARENT_REQUIRED
      )
    }

    Object.assign(category, updateDto)
    return await this.categoryRepository.save(category)
  }

  /**
   * 软删除分类
   */
  async deleteCategory(id: number): Promise<void> {
    const category = await this.findOneCategory(id)

    // 检查是否有子分类
    if (category.level === 1) {
      const childrenCount = await this.categoryRepository.count({
        where: { parentId: id }
      })

      if (childrenCount > 0) {
        throw new BusinessException(
          '该分类下还有子分类，无法删除',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.COMPONENT_CATEGORY_HAS_CHILDREN
        )
      }
    }

    // 检查是否有组件使用该分类
    // 注意：这里需要在实现 ComponentsService 后添加检查逻辑
    // const componentsCount = await this.componentsService.countByCategory(id)
    // if (componentsCount > 0) {
    //   throw new BusinessException('该分类下还有组件，无法删除')
    // }

    await this.categoryRepository.softDelete(id)
  }
}
