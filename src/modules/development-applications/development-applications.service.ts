import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Not, In, FindOptionsWhere } from 'typeorm'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import {
  DevelopmentApplication,
  IReviewInfo
} from '@/shared/entities/development-application.entity'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto'
import {
  DevelopmentStatus,
  CANCELLABLE_STATUSES,
  EDITABLE_STATUSES,
  DEVELOPMENT_STATUS_LABELS
} from './constants/development-status.enum'
import { ApplicationType, APPLICATION_TYPE_LABELS } from './constants/application-type.enum'
import {
  CreateDevelopmentApplicationDto,
  UpdateDevelopmentApplicationDto,
  ReviewApplicationDto,
  ReviewAction,
  QueryApplicationListDto,
  DevelopmentApplicationResponseDto,
  CreateApplicationResponseDto,
  ReviewSuccessResponseDto,
  CancelApplicationResponseDto
} from './dto'

/**
 * supplement 文件接口
 */
export interface IComponentMetaSupplement {
  id: string
  name: string
  version: string
  classification: {
    level1: string
    level2: string
    displayName: {
      level1: string
      level2: string
    }
  }
  _metadata: {
    applicationId: number
    applicationNo: string
    exportTime: string
    signature?: string
    isReplacement?: boolean
    originalVersionId?: number
  }
}

@Injectable()
export class DevelopmentApplicationsService {
  constructor(
    @InjectRepository(DevelopmentApplication)
    private readonly applicationRepository: Repository<DevelopmentApplication>,
    @InjectRepository(Component)
    private readonly componentRepository: Repository<Component>,
    @InjectRepository(ComponentVersion)
    private readonly componentVersionRepository: Repository<ComponentVersion>,
    @InjectRepository(ComponentCategory)
    private readonly categoryRepository: Repository<ComponentCategory>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 生成申请单号
   * 格式：APP-YYYYMMDD-XXXX
   */
  private async generateApplicationNo(): Promise<string> {
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const prefix = `APP-${dateStr}-`

    // 查询当天最大序号
    const latestApplication = await this.applicationRepository
      .createQueryBuilder('app')
      .where('app.applicationNo LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('app.applicationNo', 'DESC')
      .getOne()

    let sequence = 1
    if (latestApplication) {
      const lastSequence = parseInt(latestApplication.applicationNo.slice(-4), 10)
      sequence = lastSequence + 1
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`
  }

  /**
   * 检查版本号是否可用（排除已取消的申请）
   */
  private async isVersionAvailable(
    componentId: string,
    targetVersion: string,
    excludeId?: number
  ): Promise<boolean> {
    const whereCondition: FindOptionsWhere<DevelopmentApplication> = {
      componentId,
      targetVersion,
      developmentStatus: Not(In([DevelopmentStatus.CANCELLED]))
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: whereCondition
    })

    // 如果找到申请且不是当前申请（编辑场景），则版本号不可用
    if (existingApplication && existingApplication.id !== excludeId) {
      return false
    }

    // 也需要检查 ComponentVersion 中是否已存在该版本
    const existingVersion = await this.componentVersionRepository.findOne({
      where: { componentId, version: targetVersion }
    })

    return !existingVersion
  }

  /**
   * 验证分类是否存在
   */
  private async validateClassification(
    classificationLevel1: string,
    classificationLevel2: string
  ): Promise<{ level1Name: string; level2Name: string }> {
    // 查询一级分类
    const level1Category = await this.categoryRepository.findOne({
      where: { code: classificationLevel1, level: 1, isActive: true }
    })

    if (!level1Category) {
      throw new BusinessException(
        `一级分类 "${classificationLevel1}" 不存在或已禁用`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_CLASSIFICATION
      )
    }

    // 查询二级分类
    const level2Category = await this.categoryRepository.findOne({
      where: {
        code: classificationLevel2,
        level: 2,
        parentId: level1Category.id,
        isActive: true
      }
    })

    if (!level2Category) {
      throw new BusinessException(
        `二级分类 "${classificationLevel2}" 不存在或不属于 "${classificationLevel1}"`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_CLASSIFICATION
      )
    }

    return {
      level1Name: level1Category.name,
      level2Name: level2Category.name
    }
  }

  /**
   * 创建研发申请
   */
  async createApplication(
    dto: CreateDevelopmentApplicationDto,
    applicantId: number
  ): Promise<CreateApplicationResponseDto> {
    const { applicationType } = dto

    // 根据申请类型执行不同的验证逻辑
    let application: DevelopmentApplication

    switch (applicationType) {
      case ApplicationType.NEW:
        application = await this.createNewComponentApplication(dto, applicantId)
        break
      case ApplicationType.VERSION:
        application = await this.createVersionApplication(dto, applicantId)
        break
      case ApplicationType.REPLACE:
        application = await this.createReplaceApplication(dto, applicantId)
        break
      default:
        throw new BusinessException(
          '无效的申请类型',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.INVALID_OPERATION
        )
    }

    return {
      id: application.id,
      applicationNo: application.applicationNo,
      developmentStatus: application.developmentStatus,
      createdAt: application.createdAt
    }
  }

  /**
   * 创建新组件申请
   */
  private async createNewComponentApplication(
    dto: CreateDevelopmentApplicationDto,
    applicantId: number
  ): Promise<DevelopmentApplication> {
    const {
      componentId,
      name,
      description,
      classificationLevel1,
      classificationLevel2,
      targetVersion,
      changelog
    } = dto

    // 验证必填字段
    if (!name || !classificationLevel1 || !classificationLevel2) {
      throw new BusinessException(
        '新组件申请必须填写组件名称和分类信息',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_OPERATION
      )
    }

    // 检查组件ID是否已存在
    const existingComponent = await this.componentRepository.findOne({
      where: { componentId }
    })
    if (existingComponent) {
      throw new BusinessException(
        `组件ID "${componentId}" 已存在`,
        HttpStatus.CONFLICT,
        ERROR_CODES.COMPONENT_ALREADY_EXISTS
      )
    }

    // 验证分类有效性
    const { level1Name, level2Name } = await this.validateClassification(
      classificationLevel1,
      classificationLevel2
    )

    // 新组件默认版本 1.0.0
    const version = targetVersion || '1.0.0'

    // 检查版本号是否可用
    const versionAvailable = await this.isVersionAvailable(componentId, version)
    if (!versionAvailable) {
      throw new BusinessException(
        `版本号 "${version}" 已被占用`,
        HttpStatus.CONFLICT,
        ERROR_CODES.COMPONENT_VERSION_ALREADY_EXISTS
      )
    }

    // 生成申请单号
    const applicationNo = await this.generateApplicationNo()

    // 创建申请（初始状态为待审核）
    const application = this.applicationRepository.create({
      applicationNo,
      applicationType: ApplicationType.NEW,
      componentId,
      name,
      description: description || null,
      classificationLevel1,
      classificationLevel2,
      classificationLevel1Name: level1Name,
      classificationLevel2Name: level2Name,
      targetVersion: version,
      changelog: changelog || null,
      developmentStatus: DevelopmentStatus.PENDING_REVIEW,
      applicantId
    })

    return await this.applicationRepository.save(application)
  }

  /**
   * 创建版本迭代申请
   */
  private async createVersionApplication(
    dto: CreateDevelopmentApplicationDto,
    applicantId: number
  ): Promise<DevelopmentApplication> {
    const { componentId, targetVersion, changelog } = dto

    // 验证必填字段
    if (!targetVersion) {
      throw new BusinessException(
        '版本迭代申请必须填写目标版本号',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_OPERATION
      )
    }

    // 检查组件是否存在
    const component = await this.componentRepository.findOne({
      where: { componentId }
    })
    if (!component) {
      throw new BusinessException(
        `组件 "${componentId}" 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_NOT_FOUND
      )
    }

    // 检查版本号是否可用
    const versionAvailable = await this.isVersionAvailable(componentId, targetVersion)
    if (!versionAvailable) {
      throw new BusinessException(
        `版本号 "${targetVersion}" 已被占用`,
        HttpStatus.CONFLICT,
        ERROR_CODES.COMPONENT_VERSION_ALREADY_EXISTS
      )
    }

    // 生成申请单号
    const applicationNo = await this.generateApplicationNo()

    // 继承组件的基本信息（初始状态为待审核）
    const application = this.applicationRepository.create({
      applicationNo,
      applicationType: ApplicationType.VERSION,
      componentId,
      name: component.name,
      description: component.description,
      classificationLevel1: component.classificationLevel1,
      classificationLevel2: component.classificationLevel2,
      // 需要查询分类名称
      classificationLevel1Name: null,
      classificationLevel2Name: null,
      targetVersion,
      changelog: changelog || null,
      developmentStatus: DevelopmentStatus.PENDING_REVIEW,
      applicantId
    })

    const { level1Name, level2Name } = await this.validateClassification(
      component.classificationLevel1,
      component.classificationLevel2
    )
    application.classificationLevel1Name = level1Name
    application.classificationLevel2Name = level2Name

    return await this.applicationRepository.save(application)
  }

  /**
   * 创建替换版本申请
   * 说明：版本号自动从 existingVersion 获取，无需用户传入
   */
  private async createReplaceApplication(
    dto: CreateDevelopmentApplicationDto,
    applicantId: number
  ): Promise<DevelopmentApplication> {
    const { componentId, existingVersionId, changelog } = dto

    // 验证必填字段
    if (!existingVersionId) {
      throw new BusinessException(
        '替换版本申请必须填写现有版本ID',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_OPERATION
      )
    }

    // 检查组件是否存在
    const component = await this.componentRepository.findOne({
      where: { componentId }
    })
    if (!component) {
      throw new BusinessException(
        `组件 "${componentId}" 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_NOT_FOUND
      )
    }

    // 检查现有版本是否存在且为 draft 状态
    const existingVersion = await this.componentVersionRepository.findOne({
      where: { id: existingVersionId, componentId }
    })
    if (!existingVersion) {
      throw new BusinessException(
        `版本ID "${existingVersionId}" 不存在或不属于该组件`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.COMPONENT_VERSION_NOT_FOUND
      )
    }
    if (existingVersion.status !== 'draft') {
      throw new BusinessException(
        '只能替换 draft 状态的版本',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.OPERATION_NOT_ALLOWED
      )
    }

    // 版本号直接从现有版本获取（替换操作不改变版本号）
    const targetVersion = existingVersion.version

    // 生成申请单号
    const applicationNo = await this.generateApplicationNo()

    // 继承组件的基本信息（初始状态为待审核）
    const application = this.applicationRepository.create({
      applicationNo,
      applicationType: ApplicationType.REPLACE,
      componentId,
      name: component.name,
      description: component.description,
      classificationLevel1: component.classificationLevel1,
      classificationLevel2: component.classificationLevel2,
      classificationLevel1Name: null,
      classificationLevel2Name: null,
      targetVersion,
      changelog: changelog || null,
      developmentStatus: DevelopmentStatus.PENDING_REVIEW,
      existingVersionId,
      applicantId
    })

    // 查询并设置分类名称
    try {
      const { level1Name, level2Name } = await this.validateClassification(
        component.classificationLevel1,
        component.classificationLevel2
      )
      application.classificationLevel1Name = level1Name
      application.classificationLevel2Name = level2Name
    } catch {
      // 分类可能已被删除，使用空值
    }

    return await this.applicationRepository.save(application)
  }

  /**
   * 获取申请详情
   * @param applicationNo 申请单号（业务单号，如 APP-20260108-0001）
   */
  async getApplicationDetail(applicationNo: string): Promise<DevelopmentApplicationResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { applicationNo },
      relations: ['applicant', 'reviewer']
    })

    if (!application) {
      throw new BusinessException(
        '研发申请不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    return this.toResponseDto(application)
  }

  /**
   * 查询申请列表
   */
  async getApplicationList(
    query: QueryApplicationListDto
  ): Promise<PaginatedResponseDto<DevelopmentApplicationResponseDto>> {
    const { status, applicationType, componentId, applicantId, keyword } = query

    const queryBuilder = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.applicant', 'applicant')
      .leftJoinAndSelect('app.reviewer', 'reviewer') // 列表需要显示审核人信息

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('app.developmentStatus = :status', { status })
    }

    // 申请类型筛选
    if (applicationType) {
      queryBuilder.andWhere('app.applicationType = :applicationType', { applicationType })
    }

    // 组件ID筛选
    if (componentId) {
      queryBuilder.andWhere('app.componentId = :componentId', { componentId })
    }

    // 申请人筛选
    if (applicantId) {
      queryBuilder.andWhere('app.applicantId = :applicantId', { applicantId })
    }

    // 关键词搜索（搜索申请单号、组件ID、组件名称）
    if (keyword) {
      queryBuilder.andWhere(
        '(app.applicationNo LIKE :keyword OR app.componentId LIKE :keyword OR app.name LIKE :keyword)',
        { keyword: `%${keyword}%` }
      )
    }

    // 排序：最新优先
    queryBuilder.orderBy('app.createdAt', 'DESC')

    // 分页（使用继承自 PaginationDto 的属性）
    queryBuilder.skip(query.skip).take(query.take)

    const [items, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(
      items.map((item) => this.toResponseDto(item)),
      total,
      query.page,
      query.limit
    )
  }

  /**
   * 更新申请信息
   * @param applicationNo 申请单号（业务单号）
   */
  async updateApplication(
    applicationNo: string,
    dto: UpdateDevelopmentApplicationDto,
    userId: number
  ): Promise<DevelopmentApplicationResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { applicationNo },
      relations: ['applicant']
    })

    if (!application) {
      throw new BusinessException(
        '研发申请不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    // 检查是否可编辑
    if (!EDITABLE_STATUSES.includes(application.developmentStatus)) {
      throw new BusinessException(
        `当前状态 "${DEVELOPMENT_STATUS_LABELS[application.developmentStatus]}" 不允许编辑`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.OPERATION_NOT_ALLOWED
      )
    }

    // 检查是否为申请人本人
    if (application.applicantId !== userId) {
      throw new BusinessException(
        '只能编辑自己的申请',
        HttpStatus.FORBIDDEN,
        ERROR_CODES.PERMISSION_DENIED
      )
    }

    // 根据申请类型限制可编辑字段
    const { name, description, classificationLevel1, classificationLevel2, changelog } = dto

    // 所有类型都可修改 description 和 changelog
    if (description !== undefined) {
      application.description = description
    }
    if (changelog !== undefined) {
      application.changelog = changelog
    }

    // 仅新组件可修改 name 和分类
    if (application.applicationType === ApplicationType.NEW) {
      if (name !== undefined) {
        application.name = name
      }
      if (classificationLevel1 !== undefined && classificationLevel2 !== undefined) {
        const { level1Name, level2Name } = await this.validateClassification(
          classificationLevel1,
          classificationLevel2
        )
        application.classificationLevel1 = classificationLevel1
        application.classificationLevel2 = classificationLevel2
        application.classificationLevel1Name = level1Name
        application.classificationLevel2Name = level2Name
      }
    }

    await this.applicationRepository.save(application)

    return this.toResponseDto(application)
  }

  /**
   * 导出组件元数据补充文件
   *
   * 新流程说明：
   * - 只有审核通过（APPROVED）状态才允许下载
   * - 这确保了管理员先批准申请，用户才能开始开发
   * @param applicationNo 申请单号（业务单号）
   */
  async exportMetaSupplement(applicationNo: string): Promise<IComponentMetaSupplement> {
    const application = await this.applicationRepository.findOne({
      where: { applicationNo }
    })

    if (!application) {
      throw new BusinessException(
        '研发申请不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    // 只有审核通过的申请才允许下载 supplement 文件
    if (application.developmentStatus !== DevelopmentStatus.APPROVED) {
      throw new BusinessException(
        '只有审核通过的申请才能下载元数据文件',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.OPERATION_NOT_ALLOWED
      )
    }

    const supplement: IComponentMetaSupplement = {
      id: application.componentId,
      name: application.name || '',
      version: application.targetVersion,
      classification: {
        level1: application.classificationLevel1 || '',
        level2: application.classificationLevel2 || '',
        displayName: {
          level1: application.classificationLevel1Name || '',
          level2: application.classificationLevel2Name || ''
        }
      },
      _metadata: {
        applicationId: application.id,
        applicationNo: application.applicationNo,
        exportTime: new Date().toISOString()
      }
    }

    // 替换版本场景，添加额外标记
    if (application.applicationType === ApplicationType.REPLACE && application.existingVersionId) {
      supplement._metadata.isReplacement = true
      supplement._metadata.originalVersionId = application.existingVersionId
    }

    return supplement
  }

  /**
   * 审核申请
   *
   * 新流程说明：
   * - 管理员审核的是"是否允许开发该组件"
   * - 审核通过后，用户才可以下载 supplement.json 开始开发
   * - 抢单模式：审核人在审核时才确定
   * @param applicationNo 申请单号（业务单号）
   */
  async reviewApplication(
    applicationNo: string,
    dto: ReviewApplicationDto,
    reviewerId: number,
    reviewerName: string,
    isSelfApprove: boolean = false
  ): Promise<ReviewSuccessResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { applicationNo }
    })

    if (!application) {
      throw new BusinessException(
        '研发申请不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    // 只有待审核状态可以审核
    if (application.developmentStatus !== DevelopmentStatus.PENDING_REVIEW) {
      throw new BusinessException(
        '只有待审核状态的申请可以审核',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.OPERATION_NOT_ALLOWED
      )
    }

    // 非自助审批时，不能审核自己的申请
    if (!isSelfApprove && application.applicantId === reviewerId) {
      throw new BusinessException(
        '不能审核自己的申请',
        HttpStatus.FORBIDDEN,
        ERROR_CODES.PERMISSION_DENIED
      )
    }

    const { reviewAction, reviewComment } = dto
    const now = new Date()

    const reviewInfo: IReviewInfo = {
      reviewerId,
      reviewerName,
      reviewTime: now,
      reviewAction,
      reviewComment: isSelfApprove
        ? `管理员自助审批${reviewComment ? `: ${reviewComment}` : ''}`
        : reviewComment
    }

    application.reviewInfo = reviewInfo
    application.reviewerId = reviewerId
    application.reviewedAt = now

    if (reviewAction === ReviewAction.APPROVE) {
      // 审核通过 - 用户可以开始开发并上传组件
      application.developmentStatus = DevelopmentStatus.APPROVED
    } else {
      // 审核不通过 - 终态
      application.developmentStatus = DevelopmentStatus.REJECTED
    }

    await this.applicationRepository.save(application)

    return {
      developmentStatus: application.developmentStatus,
      componentVersionId: application.componentVersionId,
      reviewInfo: application.reviewInfo
    }
  }

  /**
   * 取消申请
   * @param applicationNo 申请单号（业务单号）
   */
  async cancelApplication(
    applicationNo: string,
    userId: number
  ): Promise<CancelApplicationResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { applicationNo }
    })

    if (!application) {
      throw new BusinessException(
        '研发申请不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    // 检查是否可取消
    if (!CANCELLABLE_STATUSES.includes(application.developmentStatus)) {
      throw new BusinessException(
        `当前状态 "${DEVELOPMENT_STATUS_LABELS[application.developmentStatus]}" 不允许取消`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.OPERATION_NOT_ALLOWED
      )
    }

    // 检查是否为申请人本人
    if (application.applicantId !== userId) {
      throw new BusinessException(
        '只能取消自己的申请',
        HttpStatus.FORBIDDEN,
        ERROR_CODES.PERMISSION_DENIED
      )
    }

    const now = new Date()
    application.developmentStatus = DevelopmentStatus.CANCELLED
    await this.applicationRepository.save(application)

    return {
      developmentStatus: application.developmentStatus,
      cancelledAt: now
    }
  }

  /**
   * 生成正式 OSS 路径
   * 格式：components/{componentId}/{version}/
   *
   * 新流程说明：
   * - 上传直接到正式路径，无临时目录
   * - 由上传服务在校验成功后使用此路径
   */
  generateOSSPath(componentId: string, version: string): string {
    return `components/${componentId}/${version}`
  }

  /**
   * 转换为响应 DTO
   */
  private toResponseDto(application: DevelopmentApplication): DevelopmentApplicationResponseDto {
    return {
      id: application.id,
      applicationNo: application.applicationNo,
      applicationType: application.applicationType,
      applicationTypeLabel: APPLICATION_TYPE_LABELS[application.applicationType],
      componentId: application.componentId,
      name: application.name,
      description: application.description,
      classificationLevel1: application.classificationLevel1,
      classificationLevel2: application.classificationLevel2,
      classificationLevel1Name: application.classificationLevel1Name,
      classificationLevel2Name: application.classificationLevel2Name,
      targetVersion: application.targetVersion,
      changelog: application.changelog,
      developmentStatus: application.developmentStatus,
      developmentStatusLabel: DEVELOPMENT_STATUS_LABELS[application.developmentStatus],
      uploadInfo: application.uploadInfo,
      reviewInfo: application.reviewInfo,
      componentVersionId: application.componentVersionId,
      existingVersionId: application.existingVersionId,
      applicant: {
        id: application.applicant?.id || application.applicantId,
        username: application.applicant?.username || ''
      },
      reviewer: application.reviewer
        ? {
            id: application.reviewer.id,
            username: application.reviewer.username
          }
        : null,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      completedAt: application.completedAt,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt
    }
  }
}
