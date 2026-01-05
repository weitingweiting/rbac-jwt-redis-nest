import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { UpdateComponentDto, QueryComponentDto } from '../dto/component.dto'
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto'
import { ComponentMetaDto } from '../dto/component-meta.dto'
import {
  ComponentOverviewDto,
  ICategoryNode,
  IComponentNode,
  IVersionNode,
  OverviewTreeNode
} from '../dto/component-overview.dto'

@Injectable()
export class ComponentsService {
  constructor(
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
    @InjectRepository(ComponentVersion)
    private versionRepository: Repository<ComponentVersion>,
    @InjectRepository(ComponentCategory)
    private categoryRepository: Repository<ComponentCategory>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 获取组件列表（带分页和查询）
   */
  async findAllWithPagination(query: QueryComponentDto): Promise<PaginatedResponseDto<Component>> {
    const queryBuilder = this.componentRepository
      .createQueryBuilder('component')
      .where('component.deletedAt IS NULL')

    // 关键字搜索
    if (query.keyword) {
      queryBuilder.andWhere(
        '(component.name LIKE :keyword OR component.componentId LIKE :keyword OR component.description LIKE :keyword)',
        { keyword: `%${query.keyword}%` }
      )
    }

    // 分类过滤
    if (query.classificationLevel1) {
      queryBuilder.andWhere('component.classificationLevel1 = :level1', {
        level1: query.classificationLevel1
      })
    }

    if (query.classificationLevel2) {
      queryBuilder.andWhere('component.classificationLevel2 = :level2', {
        level2: query.classificationLevel2
      })
    }

    // 是否有已发布版本过滤（关键查询）
    if (query.hasPublishedVersion === true) {
      queryBuilder.andWhere('component.publishedVersionCount > 0')
    } else if (query.hasPublishedVersion === false) {
      queryBuilder.andWhere('component.publishedVersionCount = 0')
    }

    // 是否官方组件过滤
    if (query.isOfficial !== undefined) {
      queryBuilder.andWhere('component.isOfficial = :isOfficial', {
        isOfficial: query.isOfficial
      })
    }

    // 排序
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'DESC'
    queryBuilder.orderBy(`component.${sortBy}`, sortOrder)

    // 分页
    queryBuilder.skip(query.skip).take(query.take)

    const [components, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(components, total, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * 根据组件ID查找单个组件
   * @param componentId - Component.componentId（主键，string）
   */
  async findOneComponent(componentId: string): Promise<Component> {
    const component = await this.componentRepository.findOne({
      where: { componentId },
      withDeleted: false
    })

    if (!component) {
      throw new BusinessException(
        `组件 ${componentId} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_NOT_FOUND
      )
    }

    return component
  }

  /**
   * 根据 componentId 查找组件
   */
  async findByComponentId(componentId: string): Promise<Component | null> {
    return await this.componentRepository.findOne({
      where: { componentId },
      withDeleted: false
    })
  }

  /**
   * 从 meta.json 创建或更新组件
   * 用于组件上传服务（这是创建组件的唯一正确入口）
   *
   * 注意：
   * - 只更新 Component 表的共享字段（name, description, classification）
   * - type, framework, author, license 等版本专属信息存储在 ComponentVersion 表
   * - 这样可以保证不同版本可以有不同的技术栈和维护者
   * - 会验证分类信息是否存在，不存在则上传失败
   */
  async createOrUpdateFromMeta(
    meta: ComponentMetaDto,
    userId: number
  ): Promise<{ component: Component; isNew: boolean }> {
    const existingComponent = await this.findByComponentId(meta.id)

    if (existingComponent) {
      // 更新现有组件（只更新共享字段）
      existingComponent.name = meta.name
      existingComponent.description = meta.description || null
      existingComponent.updatedBy = userId

      // 分类信息（classification 是必填的）
      existingComponent.classificationLevel1 = meta.classification.level1
      existingComponent.classificationLevel2 = meta.classification.level2
      existingComponent.classificationLevel1Name =
        meta.classification.displayName?.level1 || meta.classification.level1
      existingComponent.classificationLevel2Name =
        meta.classification.displayName?.level2 || meta.classification.level2

      const updated = await this.componentRepository.save(existingComponent)
      return { component: updated, isNew: false }
    } else {
      // 创建新组件（只设置共享字段）
      const component = new Component()
      component.componentId = meta.id
      component.name = meta.name
      component.description = meta.description || null

      // 分类信息（classification 是必填的）
      component.classificationLevel1 = meta.classification.level1
      component.classificationLevel2 = meta.classification.level2
      component.classificationLevel1Name =
        meta.classification.displayName?.level1 || meta.classification.level1
      component.classificationLevel2Name =
        meta.classification.displayName?.level2 || meta.classification.level2

      component.createdBy = userId
      component.updatedBy = userId

      const created = await this.componentRepository.save(component)
      return { component: created, isNew: true }
    }
  }

  /**
   * 更新组件（不推荐直接使用）
   *
   * @deprecated 组件信息应该由 meta.json 决定，通过上传新版本自动更新。
   * 此方法保留仅用于管理后台手动修复数据的特殊场景。
   *
   * 注意：v2 上传会更新 Component 表的共享字段（name, description, classification）
   * @param componentId - Component.componentId（主键，string）
   */
  async updateComponent(componentId: string, updateDto: UpdateComponentDto): Promise<Component> {
    const component = await this.findOneComponent(componentId)

    // 如果更新 componentId，检查是否重复
    if (updateDto.componentId && updateDto.componentId !== component.componentId) {
      const existingComponent = await this.findByComponentId(updateDto.componentId)
      if (existingComponent) {
        throw new BusinessException(
          `组件ID ${updateDto.componentId} 已存在`,
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.COMPONENT_ALREADY_EXISTS
        )
      }
    }

    Object.assign(component, updateDto)
    return await this.componentRepository.save(component)
  }

  /**
   * 更新组件的已发布版本计数（重要：版本状态变更时调用）
   * @param componentId - Component.componentId（主键，string）
   */
  async updatePublishedVersionCount(componentId: string): Promise<void> {
    try {
      const publishedCount = await this.versionRepository.count({
        where: {
          componentId,
          status: 'published',
          deletedAt: null as any
        }
      })

      await this.componentRepository.update(
        { componentId },
        { publishedVersionCount: publishedCount }
      )

      this.logger.info('更新组件已发布版本计数', {
        componentId,
        publishedVersionCount: publishedCount
      })
    } catch (error: any) {
      this.logger.error('更新组件已发布版本计数失败', {
        componentId,
        error: error.message
      })
      throw new BusinessException(
        '更新组件版本计数失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.COMPONENT_UPDATE_FAILED
      )
    }
  }

  /**
   * 更新组件的版本总数
   * @param componentId - Component.componentId（主键，string）
   */
  async updateVersionCount(componentId: string): Promise<void> {
    try {
      const versionCount = await this.versionRepository.count({
        where: {
          componentId,
          deletedAt: null as any
        }
      })

      await this.componentRepository.update({ componentId }, { versionCount })

      this.logger.info('更新组件版本总数', {
        componentId,
        versionCount
      })
    } catch (error: any) {
      this.logger.error('更新组件版本总数失败', {
        componentId,
        error: error.message
      })
      throw new BusinessException(
        '更新组件版本计数失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.COMPONENT_UPDATE_FAILED
      )
    }
  }

  /**
   * 软删除组件
   * @param componentId - Component.componentId（主键，string）
   */
  async deleteComponent(componentId: string): Promise<void> {
    const component = await this.findOneComponent(componentId)

    // 检查是否有已发布的版本
    if (component.publishedVersionCount > 0) {
      throw new BusinessException(
        '该组件还有已发布的版本，无法删除。请先删除或下架所有已发布版本',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_HAS_PUBLISHED_VERSIONS
      )
    }

    // 软删除组件（级联软删除所有版本）
    await this.componentRepository.softDelete({ componentId })

    // 软删除所有关联版本
    await this.versionRepository.softDelete({ componentId })
  }

  /**
   * 统计指定分类下的组件数量
   */
  async countByCategory(categoryId: string): Promise<number> {
    return await this.componentRepository.count({
      where: [{ classificationLevel1: categoryId }, { classificationLevel2: categoryId }]
    })
  }

  /**
   * 增加组件使用次数（预留功能）
   *
   * @deprecated 当前未使用，预留给未来的组件使用统计功能。
   * 如果实现此功能，建议配合 Redis 做计数缓存，定时同步到数据库。
   * @param componentId - Component.componentId（主键，string）
   */
  async incrementUsedCount(componentId: string): Promise<void> {
    await this.componentRepository.increment({ componentId }, 'usedCount', 1)
  }

  /**
   * 获取组件总览数据（树形结构）
   * 用于管理员页面的树形表格展示
   * 返回: 分类树 → 组件 → 版本 的4层嵌套结构
   */
  async getComponentOverview(query: ComponentOverviewDto): Promise<OverviewTreeNode[]> {
    this.logger.info('获取组件总览数据', { query })

    // 1. 获取所有分类（两级）
    const categories = await this.categoryRepository.find({
      where: { deletedAt: null },
      order: { level: 'ASC', sortOrder: 'ASC', id: 'ASC' }
    })

    // 2. 获取所有组件
    const componentsQuery = this.componentRepository
      .createQueryBuilder('component')
      .where('component.deletedAt IS NULL')

    // 应用筛选条件
    if (query.keyword) {
      componentsQuery.andWhere(
        '(component.name LIKE :keyword OR component.componentId LIKE :keyword OR component.description LIKE :keyword)',
        { keyword: `%${query.keyword}%` }
      )
    }

    componentsQuery.orderBy('component.createdAt', 'DESC')

    const components = await componentsQuery.getMany()

    // 3. 获取所有版本
    const versionsQuery = this.versionRepository
      .createQueryBuilder('version')
      .where('version.deletedAt IS NULL')
      .orderBy('version.createdAt', 'DESC')

    // 应用版本状态筛选
    if (query.status === 'draft') {
      versionsQuery.andWhere('version.status = :status', { status: 'draft' })
    } else if (query.status === 'published') {
      versionsQuery.andWhere('version.status = :status', { status: 'published' })
    } else if (query.status === 'latest') {
      versionsQuery.andWhere('version.isLatest = :isLatest', { isLatest: true })
    }

    const versions = await versionsQuery.getMany()

    // 4. 构建组件到版本的映射
    const componentVersionsMap = new Map<string, IVersionNode[]>()
    for (const version of versions) {
      if (!componentVersionsMap.has(version.componentId)) {
        componentVersionsMap.set(version.componentId, [])
      }
      componentVersionsMap.get(version.componentId)!.push({
        key: `version-${version.id}`,
        type: 'version',
        id: version.id,
        version: version.version,
        status: version.status,
        isLatest: version.isLatest,
        fileSize: version.fileSize,
        entryUrl: version.entryUrl,
        styleUrl: version.styleUrl,
        publishedAt: version.publishedAt?.toISOString(),
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString()
      })
    }

    // 5. 构建分类到组件的映射
    const categoryComponentsMap = new Map<string, IComponentNode[]>()
    for (const component of components) {
      const categoryKey = `${component.classificationLevel1}-${component.classificationLevel2}`
      if (!categoryComponentsMap.has(categoryKey)) {
        categoryComponentsMap.set(categoryKey, [])
      }

      const componentVersions = componentVersionsMap.get(component.componentId) || []

      categoryComponentsMap.get(categoryKey)!.push({
        key: `component-${component.componentId}`,
        type: 'component',
        componentId: component.componentId,
        name: component.name,
        displayName: component.name,
        description: component.description || undefined,
        classificationLevel1: component.classificationLevel1,
        classificationLevel1Name: component.classificationLevel1Name,
        classificationLevel2: component.classificationLevel2,
        classificationLevel2Name: component.classificationLevel2Name,
        createdBy: component.createdBy,
        createdAt: component.createdAt.toISOString(),
        updatedAt: component.updatedAt.toISOString(),
        publishedVersionCount: component.publishedVersionCount,
        totalVersionCount: component.versionCount,
        children: componentVersions
      })
    }

    // 6. 构建完整的树形结构
    const level1Categories = categories.filter((cat) => cat.level === 1)
    const level2Categories = categories.filter((cat) => cat.level === 2)

    // 构建二级分类到一级分类的映射
    const level2ToLevel1Map = new Map<string, string>()
    for (const level2 of level2Categories) {
      if (level2.parentId) {
        const parent = categories.find((c) => c.id === level2.parentId)
        if (parent) {
          level2ToLevel1Map.set(level2.code, parent.code)
        }
      }
    }

    // 构建树形结构
    const tree: ICategoryNode[] = []

    // 正常分类树构建
    for (const level1Cat of level1Categories) {
      const level1Node: ICategoryNode = {
        key: `category-${level1Cat.id}`,
        type: 'category',
        level: 1,
        id: level1Cat.id,
        code: level1Cat.code,
        name: level1Cat.name,
        icon: level1Cat.icon,
        description: level1Cat.description,
        sortOrder: level1Cat.sortOrder,
        children: []
      }

      // 找到该一级分类下的所有二级分类
      const childLevel2Categories = level2Categories.filter((cat) => cat.parentId === level1Cat.id)

      for (const level2Cat of childLevel2Categories) {
        const categoryKey = `${level1Cat.code}-${level2Cat.code}`
        const componentsInCategory = categoryComponentsMap.get(categoryKey) || []

        const level2Node: ICategoryNode = {
          key: `category-${level2Cat.id}`,
          type: 'category',
          level: 2,
          id: level2Cat.id,
          code: level2Cat.code,
          name: level2Cat.name,
          icon: level2Cat.icon,
          description: level2Cat.description,
          sortOrder: level2Cat.sortOrder,
          children: componentsInCategory as any
        }

        level1Node.children!.push(level2Node)
      }

      tree.push(level1Node)
    }

    this.logger.info('组件总览数据构建完成', {
      categoriesCount: categories.length,
      componentsCount: components.length,
      versionsCount: versions.length,
      treeNodesCount: tree.length
    })

    return tree
  }
}
