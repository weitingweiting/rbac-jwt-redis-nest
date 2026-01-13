import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { ComponentVersion } from '@/shared/entities/component-version.entity'
import { BaseService } from '@/common/services/base.service'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import {
  CreateComponentVersionDto,
  UpdateComponentVersionDto,
  QueryComponentVersionDto,
  PublishVersionDto
} from '../dto/component-version.dto'
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto'
import { VersionStatus } from '../constants/version-status.enum'
import { ComponentsService } from './components.service'

@Injectable()
export class ComponentVersionsService extends BaseService<ComponentVersion> {
  constructor(
    @InjectRepository(ComponentVersion)
    private versionRepository: Repository<ComponentVersion>,
    private componentsService: ComponentsService,
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    super(versionRepository)
  }

  /**
   * 获取版本列表（带分页和查询）
   */
  async findAllWithPagination(
    query: QueryComponentVersionDto
  ): Promise<PaginatedResponseDto<ComponentVersion>> {
    const queryBuilder = this.versionRepository
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.component', 'component')
      .leftJoinAndSelect(
        'version.developmentApplications',
        'application',
        "application.developmentStatus = 'completed'"
      )
      .leftJoinAndSelect('application.applicant', 'applicant')
      .where('version.deletedAt IS NULL')

    // 按组件ID过滤
    if (query.componentId) {
      queryBuilder.andWhere('version.componentId = :componentId', {
        componentId: query.componentId
      })
    }

    // 按状态过滤
    if (query.status) {
      queryBuilder.andWhere('version.status = :status', { status: query.status })
    } else if (!query.all) {
      // 默认只返回已发布版本（除非指定 all=true）
      queryBuilder.andWhere('version.status = :status', { status: VersionStatus.PUBLISHED })
    }

    // 按是否推荐版本过滤
    if (query.isLatest !== undefined) {
      queryBuilder.andWhere('version.isLatest = :isLatest', { isLatest: query.isLatest })
    }

    // 按版本号降序排列
    queryBuilder.orderBy('version.createdAt', 'DESC')

    // 分页
    queryBuilder.skip(query.skip).take(query.take)

    const [versions, total] = await queryBuilder.getManyAndCount()

    // 将 developmentApplications 数组转换为单个对象（方便前端使用）
    const versionsWithApp = versions.map((version) => {
      const { developmentApplications, ...rest } = version as any
      return {
        ...rest,
        developmentApplication: developmentApplications?.[0] || null
      }
    })

    return new PaginatedResponseDto(versionsWithApp, total, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个版本
   * @param id - ComponentVersion.id (数据库主键 number)
   */
  async findOneVersion(id: number): Promise<ComponentVersion> {
    const version = await this.versionRepository
      .createQueryBuilder('version')
      .leftJoinAndSelect('version.component', 'component')
      .leftJoinAndSelect(
        'version.developmentApplications',
        'application',
        "application.developmentStatus = 'completed'"
      )
      .leftJoinAndSelect('application.applicant', 'applicant')
      .where('version.id = :id', { id })
      .andWhere('version.deletedAt IS NULL')
      .getOne()

    if (!version) {
      throw new BusinessException(
        `组件版本 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_VERSION_NOT_FOUND
      )
    }

    // 将 developmentApplications 数组转换为单个对象（方便前端使用）
    const { developmentApplications, ...rest } = version as any
    return {
      ...rest,
      developmentApplication: developmentApplications?.[0] || null
    } as ComponentVersion
  }

  /**
   * 根据 ID 查找单个版本（不加载关联，内部使用）
   */
  private async findOneVersionSimple(id: number): Promise<ComponentVersion> {
    const version = await this.versionRepository.findOne({
      where: { id },
      relations: ['component'],
      withDeleted: false
    })

    if (!version) {
      throw new BusinessException(
        `组件版本 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_VERSION_NOT_FOUND
      )
    }

    return version
  }

  /**
   * 根据组件ID和版本号查找版本
   * @param componentId - Component.componentId（主键，string）
   * @param version - 版本号
   */
  async findByComponentAndVersion(
    componentId: string,
    version: string
  ): Promise<ComponentVersion | null> {
    return await this.versionRepository.findOne({
      where: { componentId, version },
      withDeleted: false
    })
  }

  /**
   * 获取组件的最新推荐版本
   * @param componentId - Component.componentId（主键，string）
   */
  async getLatestVersion(componentId: string): Promise<ComponentVersion | null> {
    return await this.versionRepository.findOne({
      where: {
        componentId,
        status: VersionStatus.PUBLISHED,
        isLatest: true
      },
      withDeleted: false
    })
  }

  /**
   * 创建组件版本（通常由上传服务调用）
   */
  async createVersion(
    createDto: CreateComponentVersionDto,
    userId: number
  ): Promise<ComponentVersion> {
    // 验证组件是否存在
    await this.componentsService.findOneComponent(createDto.componentId)

    // 检查版本号是否已存在
    const existingVersion = await this.findByComponentAndVersion(
      createDto.componentId,
      createDto.version
    )

    if (existingVersion) {
      throw new BusinessException(
        `组件版本 ${createDto.version} 已存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_ALREADY_EXISTS
      )
    }

    const version = this.versionRepository.create(createDto)
    version.status = createDto.status || VersionStatus.DRAFT
    version.isLatest = false // 新创建的版本默认不是推荐版本
    version.createdBy = userId
    version.updatedBy = userId

    const saved = await this.versionRepository.save(version)

    // 更新组件的版本计数
    await this.componentsService.updateVersionCount(createDto.componentId)

    return saved
  }

  /**
   * 更新版本
   * @param id - ComponentVersion.id (数据库主键 number)
   */
  async updateVersion(
    id: number,
    updateDto: UpdateComponentVersionDto,
    userId?: number
  ): Promise<ComponentVersion> {
    const version = await this.findOneVersionSimple(id)

    Object.assign(version, updateDto)
    if (userId) {
      version.updatedBy = userId
    }
    return await this.versionRepository.save(version)
  }

  /**
   * 发布版本（draft → published）
   * 重要：需要更新 publishedVersionCount
   * @param id - ComponentVersion.id (数据库主键 number)
   */
  async publishVersion(id: number, publishDto?: PublishVersionDto): Promise<ComponentVersion> {
    const version = await this.findOneVersionSimple(id)

    if (version.status === VersionStatus.PUBLISHED) {
      throw new BusinessException(
        '该版本已经是发布状态',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_ALREADY_PUBLISHED
      )
    }

    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. 更新版本状态
      version.status = VersionStatus.PUBLISHED
      version.publishedAt = new Date()
      if (publishDto?.changelog) {
        version.changelog = publishDto.changelog
      }
      await queryRunner.manager.save(version)

      // 2. 在事务内部直接更新 Component 表的发布版本计数
      const publishedCount = await queryRunner.manager.count(ComponentVersion, {
        where: {
          componentId: version.componentId,
          status: VersionStatus.PUBLISHED,
          deletedAt: null as any
        }
      })

      await queryRunner.manager.update(
        'Component',
        { componentId: version.componentId },
        { publishedVersionCount: publishedCount }
      )

      await queryRunner.commitTransaction()

      this.logger.info('版本发布成功', {
        versionId: id,
        componentId: version.componentId,
        version: version.version,
        publishedCount
      })

      // 3. 如果是该组件的第一个发布版本，自动设为推荐版本
      if (publishedCount === 1) {
        this.logger.info('检测到首个发布版本，自动设为推荐版本', {
          componentId: version.componentId,
          versionId: id
        })

        try {
          await this.setLatestVersion(version.componentId, id)
          this.logger.info('首个发布版本已自动设为推荐版本', {
            componentId: version.componentId,
            versionId: id
          })
        } catch (error: any) {
          // 设置推荐版失败不影响发布流程，只记录警告
          this.logger.warn('自动设置推荐版本失败', {
            componentId: version.componentId,
            versionId: id,
            error: error.message
          })
        }
      }

      return version
    } catch (error: any) {
      await queryRunner.rollbackTransaction()
      this.logger.error('发布版本失败', {
        versionId: id,
        error: error.message
      })
      throw new BusinessException(
        `发布版本失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.COMPONENT_VERSION_PUBLISH_FAILED
      )
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * 撤回发布（published → draft）
   * 重要：需要更新 publishedVersionCount
   * @param id - ComponentVersion.id (数据库主键 number)
   */
  async unpublishVersion(id: number): Promise<ComponentVersion> {
    const version = await this.findOneVersionSimple(id)

    if (version.status === VersionStatus.DRAFT) {
      throw new BusinessException(
        '该版本已经是草稿状态',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_ALREADY_DRAFT
      )
    }

    // 检查是否是推荐版本
    if (version.isLatest) {
      throw new BusinessException(
        '推荐版本不能撤回发布，请先设置其他版本为推荐版',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_IS_LATEST
      )
    }

    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. 更新版本状态
      version.status = VersionStatus.DRAFT
      version.publishedAt = null
      await queryRunner.manager.save(version)

      // 2. 在事务内部直接更新 Component 表的发布版本计数
      const publishedCount = await queryRunner.manager.count(ComponentVersion, {
        where: {
          componentId: version.componentId,
          status: VersionStatus.PUBLISHED,
          deletedAt: null as any
        }
      })

      await queryRunner.manager.update(
        'Component',
        { componentId: version.componentId },
        { publishedVersionCount: publishedCount }
      )

      await queryRunner.commitTransaction()

      this.logger.info('版本撤回发布成功', {
        versionId: id,
        componentId: version.componentId,
        version: version.version,
        publishedCount
      })

      return version
    } catch (error: any) {
      await queryRunner.rollbackTransaction()
      this.logger.error('撤回版本发布失败', {
        versionId: id,
        error: error.message
      })
      throw new BusinessException(
        `撤回版本发布失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.COMPONENT_VERSION_UNPUBLISH_FAILED
      )
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * 设置推荐版本
   * 将当前版本设为推荐版本，其他版本取消推荐
   * @param componentId - Component.componentId（主键，string）
   * @param versionId - ComponentVersion.id（版本主键，number）
   */
  async setLatestVersion(componentId: string, versionId: number): Promise<ComponentVersion> {
    const version = await this.findOneVersionSimple(versionId)

    // 验证版本属于指定组件
    if (version.componentId !== componentId) {
      throw new BusinessException(
        '版本ID与组件ID不匹配',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_COMPONENT_MISMATCH
      )
    }

    // 验证版本已发布
    if (version.status !== VersionStatus.PUBLISHED) {
      throw new BusinessException(
        '只能将已发布的版本设为推荐版本',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_NOT_PUBLISHED
      )
    }

    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 取消该组件的所有推荐版本
      await queryRunner.manager.update(
        ComponentVersion,
        { componentId, isLatest: true },
        { isLatest: false }
      )

      // 设置新的推荐版本
      version.isLatest = true
      await queryRunner.manager.save(version)

      await queryRunner.commitTransaction()

      this.logger.info('设置推荐版本成功', {
        componentId,
        versionId,
        version: version.version
      })

      return version
    } catch (error: any) {
      await queryRunner.rollbackTransaction()
      this.logger.error('设置推荐版本失败', {
        componentId,
        versionId,
        error: error.message
      })
      throw new BusinessException(
        `设置推荐版本失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.COMPONENT_VERSION_UPDATE_FAILED
      )
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * 软删除版本
   * 重要：需要更新 publishedVersionCount 和 versionCount
   * @param id - ComponentVersion.id (数据库主键 number)
   */
  async deleteVersion(id: number): Promise<void> {
    const version = await this.findOneVersionSimple(id)

    // 如果是推荐版本，不允许删除
    if (version.isLatest) {
      throw new BusinessException(
        '无法删除推荐版本，请先设置其他版本为推荐版本',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_IS_LATEST
      )
    }

    const wasPublished = version.status === VersionStatus.PUBLISHED

    // 使用事务确保数据一致性
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. 软删除版本
      await queryRunner.manager.softDelete(ComponentVersion, id)

      // 2. 在事务内部直接更新 Component 表的计数
      const versionCount = await queryRunner.manager.count(ComponentVersion, {
        where: { componentId: version.componentId, deletedAt: null as any }
      })

      const updateData: any = { versionCount }

      // 如果删除的是已发布版本，更新发布版本计数
      if (wasPublished) {
        const publishedCount = await queryRunner.manager.count(ComponentVersion, {
          where: {
            componentId: version.componentId,
            status: VersionStatus.PUBLISHED,
            deletedAt: null as any
          }
        })
        updateData.publishedVersionCount = publishedCount
      }

      await queryRunner.manager.update(
        'Component',
        { componentId: version.componentId },
        updateData
      )

      await queryRunner.commitTransaction()

      this.logger.info('删除版本成功', {
        versionId: id,
        componentId: version.componentId,
        version: version.version,
        wasPublished,
        newVersionCount: versionCount
      })
    } catch (error: any) {
      await queryRunner.rollbackTransaction()
      this.logger.error('删除版本失败', {
        versionId: id,
        error: error.message
      })
      throw new BusinessException(
        `删除版本失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.COMPONENT_VERSION_DELETE_FAILED
      )
    } finally {
      await queryRunner.release()
    }
  }
}
