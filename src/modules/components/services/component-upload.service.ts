import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { ComponentValidationService } from './component-validation.service'
import { ComponentsService } from './components.service'
import { ComponentVersionsService } from './component-versions.service'
import { CreateComponentVersionDto } from '../dto/component-version.dto'
import { ComponentBuildMetaDto } from '../dto/component-build-meta.dto'
import { ComponentSupplementDto } from '../dto/component-supplement.dto'
import { VersionStatus } from '../constants/version-status.enum'
import { OSSService } from '@/shared/services/oss.service'
import { ZipUtil } from '../utils/zip.util'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'
import {
  DevelopmentApplication,
  IUploadInfo
} from '@/shared/entities/development-application.entity'
import { DevelopmentStatus, ApplicationType } from '@/modules/development-applications/constants'

/**
 * 组件上传服务
 *
 * 职责：处理组件 ZIP 包的上传、解析、验证和存储
 *
 * 新流程：先审批，后开发
 * 1. 解析 supplement.json（来自研发申请系统，包含业务凭证）
 * 2. 验证与研发申请记录的一致性（防篡改）
 * 3. 解析 meta.json（来自 abd-cli 构建，包含技术信息）
 * 4. 上传到 OSS
 * 5. 根据申请类型（NEW/VERSION/REPLACE）创建或更新组件版本
 * 6. 更新申请状态为 COMPLETED
 */
@Injectable()
export class ComponentUploadService {
  constructor(
    @InjectRepository(DevelopmentApplication)
    private readonly applicationRepository: Repository<DevelopmentApplication>,
    private readonly validationService: ComponentValidationService,
    private readonly componentsService: ComponentsService,
    private readonly versionsService: ComponentVersionsService,
    private readonly ossService: OSSService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 处理组件上传（集成研发申请流程）
   *
   * 新流程说明：
   * - 组件包中必须包含 supplement.json（从研发申请系统下载）
   * - 验证前端传递的 applicationNo 与 supplement.json 中的一致性（防止混用）
   * - 验证 supplement 与申请记录一致
   * - 验证 meta.json 与 supplement 一致
   * - 上传成功后自动更新申请状态为 COMPLETED
   */
  async processUpload(
    file: Express.Multer.File,
    applicationNo: string,
    userId: number
  ): Promise<{
    component: Component
    version: ComponentVersion
    isNewComponent: boolean
    isNewVersion: boolean
    warnings: string[]
    applicationNo?: string
  }> {
    this.logger.info('开始处理组件上传', {
      userId,
      fileName: file.originalname,
      fileSize: file.size
    })

    try {
      // 1. 验证 ZIP 文件基本格式
      const { passed: _passed, warnings } = await this.validationService.validateZipFile(file)

      // 2. 解析并验证 supplement.json（来自研发申请系统）
      const supplement = await this.validationService.parseAndValidateSupplementJson(file.buffer)

      this.logger.info('解析 supplement.json 成功', {
        componentId: supplement.id,
        version: supplement.version,
        applicationId: supplement._metadata.applicationId,
        applicationNo: supplement._metadata.applicationNo
      })

      // 3. 验证前端传递的 applicationNo 与 supplement.json 中的一致性（防止混用不同申请的组件包）
      this.validationService.validateApplicationNoConsistency(
        applicationNo,
        supplement._metadata.applicationNo
      )

      this.logger.info('申请单号一致性验证通过', {
        requestedApplicationNo: applicationNo,
        supplementApplicationNo: supplement._metadata.applicationNo
      })

      // 4. 验证 supplement 与研发申请记录的一致性
      const application = await this.validationService.validateSupplementWithApplication(supplement)

      // 5. 检查申请状态（只有 APPROVED 状态才能上传）
      this.validationService.validateApplicationStatus(application)

      // 6. 解析并验证 meta.json（来自 abd-cli 构建，只包含技术信息）
      const buildMeta = await this.validationService.parseAndValidateBuildMeta(file.buffer)

      this.logger.info('解析 meta.json 成功', {
        hasFiles: !!buildMeta.files,
        type: buildMeta.type,
        framework: buildMeta.framework
      })

      // 7. 验证 meta 中声明的文件是否存在
      this.validationService.validateBuildMetaFiles(file.buffer, buildMeta)

      // 8. 验证分类信息是否存在（使用 supplement 中的分类，已在申请时验证过）
      await this.validationService.validateClassification(
        supplement.classification.level1,
        supplement.classification.level2
      )

      this.logger.info('分类验证通过', {
        level1: supplement.classification.level1,
        level2: supplement.classification.level2
      })

      // 9. 上传文件到 OSS
      const ossBasePath = this.generateOSSPath(supplement.id, supplement.version)
      this.logger.info('开始上传文件到 OSS', { ossBasePath })

      const uploadedFiles = await this.uploadToOSS(file.buffer, ossBasePath)

      this.logger.info('文件上传 OSS 成功', {
        fileCount: Object.keys(uploadedFiles).length
      })

      // 10. 根据申请类型处理组件记录
      const { component, isNew } = await this.handleComponentByApplicationType(
        supplement,
        application,
        userId
      )

      // 11. 创建或替换版本记录（根据申请类型决定）
      const { version, isNewVersion } = await this.handleVersionByApplicationType(
        component,
        supplement,
        buildMeta,
        file,
        ossBasePath,
        uploadedFiles,
        application,
        userId
      )

      // 12. 更新研发申请状态为 COMPLETED
      await this.completeApplication(application, file, version.id)

      this.logger.info('组件上传处理完成', {
        componentId: component.componentId,
        versionId: version.id,
        applicationNo: application.applicationNo,
        isNewComponent: isNew,
        isNewVersion
      })

      return {
        component,
        version,
        isNewComponent: isNew,
        isNewVersion,
        warnings,
        applicationNo: application.applicationNo
      }
    } catch (error: any) {
      console.log('🚀 ~ ComponentUploadService ~ processUpload ~ error:', error)
      this.logger.error('组件上传处理失败', {
        userId,
        fileName: file.originalname,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * 根据申请类型处理组件记录
   *
   * - NEW: 创建新组件
   * - VERSION/REPLACE: 获取已存在的组件（不修改组件表）
   */
  private async handleComponentByApplicationType(
    supplement: ComponentSupplementDto,
    application: DevelopmentApplication,
    userId: number
  ): Promise<{ component: Component; isNew: boolean }> {
    if (application.applicationType === ApplicationType.NEW) {
      // 新组件申请：创建组件记录
      const component = await this.componentsService.createComponent(
        {
          id: supplement.id,
          name: supplement.name,
          description: undefined,
          classification: supplement.classification
        },
        userId
      )

      this.logger.info('新组件创建完成', {
        componentId: component.componentId,
        applicationType: application.applicationType
      })

      return { component, isNew: true }
    } else {
      // VERSION/REPLACE 申请：获取已存在的组件
      const component = await this.componentsService.getExistingComponent(supplement.id)

      this.logger.info('获取已存在组件', {
        componentId: component.componentId,
        applicationType: application.applicationType
      })

      return { component, isNew: false }
    }
  }

  /**
   * 根据申请类型处理版本记录
   *
   * - NEW/VERSION: 创建新版本
   * - REPLACE: 替换已有 draft 版本
   */
  private async handleVersionByApplicationType(
    component: Component,
    supplement: ComponentSupplementDto,
    buildMeta: ComponentBuildMetaDto,
    file: Express.Multer.File,
    ossBasePath: string,
    uploadedFiles: Record<string, string>,
    application: DevelopmentApplication,
    userId: number
  ): Promise<{ version: ComponentVersion; isNewVersion: boolean }> {
    if (application.applicationType === ApplicationType.REPLACE) {
      return this.replaceVersion(
        component,
        supplement,
        buildMeta,
        file,
        ossBasePath,
        uploadedFiles,
        application,
        userId
      )
    } else {
      // NEW 或 VERSION 类型都创建新版本
      return this.createNewVersion(
        component,
        supplement,
        buildMeta,
        file,
        ossBasePath,
        uploadedFiles,
        application,
        userId
      )
    }
  }

  /**
   * 创建新版本（用于 NEW 和 VERSION 类型申请）
   */
  private async createNewVersion(
    component: Component,
    supplement: ComponentSupplementDto,
    buildMeta: ComponentBuildMetaDto,
    file: Express.Multer.File,
    ossBasePath: string,
    uploadedFiles: Record<string, string>,
    application: DevelopmentApplication,
    userId: number
  ): Promise<{ version: ComponentVersion; isNewVersion: boolean }> {
    const versionDto = this.buildVersionDto(
      component,
      supplement,
      buildMeta,
      file,
      ossBasePath,
      uploadedFiles
    )

    const version = await this.versionsService.createVersion(versionDto, userId)

    this.logger.info('新版本创建完成', {
      componentId: component.componentId,
      versionId: version.id,
      version: version.version,
      applicationType: application.applicationType
    })

    return { version, isNewVersion: true }
  }

  /**
   * 替换已有版本（用于 REPLACE 类型申请）
   */
  private async replaceVersion(
    component: Component,
    supplement: ComponentSupplementDto,
    buildMeta: ComponentBuildMetaDto,
    file: Express.Multer.File,
    ossBasePath: string,
    uploadedFiles: Record<string, string>,
    application: DevelopmentApplication,
    userId: number
  ): Promise<{ version: ComponentVersion; isNewVersion: boolean }> {
    if (!application.existingVersionId) {
      throw new BusinessException(
        '替换版本申请缺少 existingVersionId',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_APPLICATION_DATA
      )
    }

    const versionDto = this.buildVersionDto(
      component,
      supplement,
      buildMeta,
      file,
      ossBasePath,
      uploadedFiles
    )

    const version = await this.versionsService.updateVersion(
      application.existingVersionId,
      versionDto,
      userId
    )

    this.logger.info('替换版本完成', {
      componentId: component.componentId,
      versionId: version.id,
      version: version.version,
      applicationType: application.applicationType
    })

    return { version, isNewVersion: false }
  }

  /**
   * 构建版本 DTO
   */
  private buildVersionDto(
    component: Component,
    supplement: ComponentSupplementDto,
    buildMeta: ComponentBuildMetaDto,
    file: Express.Multer.File,
    ossBasePath: string,
    uploadedFiles: Record<string, string>
  ): CreateComponentVersionDto {
    return {
      componentId: component.componentId,
      version: supplement.version, // 使用 supplement 中的版本号
      entryFile: buildMeta.files.entry,
      styleFile: buildMeta.files.style,
      previewFile: buildMeta.files.preview,
      ossBasePath,
      entryUrl: uploadedFiles[buildMeta.files.entry],
      styleUrl: buildMeta.files.style ? uploadedFiles[buildMeta.files.style] : undefined,
      previewUrl: buildMeta.files.preview ? uploadedFiles[buildMeta.files.preview] : undefined,
      buildTime: buildMeta.buildInfo.buildTime,
      buildHash: buildMeta.buildInfo.hash,
      cliVersion: buildMeta.buildInfo.cliVersion,
      // 版本专属字段
      type: buildMeta.type || 'vue-echarts',
      framework: buildMeta.framework || 'vue3',
      authorOrganization: buildMeta.author?.organization,
      authorUsername: buildMeta.author?.userName,
      license: buildMeta?.license ?? 'MIT',
      // 其他字段
      fileSize: this.validationService.calculateZipSize(file.buffer),
      assetsManifest: { files: Object.keys(uploadedFiles) },
      metaJson: buildMeta as any,
      status: VersionStatus.DRAFT
    }
  }

  /**
   * 完成研发申请
   * 更新申请状态为 COMPLETED，记录上传信息
   */
  private async completeApplication(
    application: DevelopmentApplication,
    file: Express.Multer.File,
    componentVersionId: number
  ): Promise<void> {
    const uploadInfo: IUploadInfo = {
      fileName: file.originalname,
      fileSize: file.size,
      uploadTime: new Date()
    }

    application.uploadInfo = uploadInfo
    application.componentVersionId = componentVersionId
    application.developmentStatus = DevelopmentStatus.COMPLETED
    application.completedAt = new Date()

    await this.applicationRepository.save(application)

    this.logger.info('研发申请已完成', {
      applicationId: application.id,
      applicationNo: application.applicationNo,
      componentVersionId
    })
  }

  /**
   * 生成组件在 OSS 中的存储路径
   *
   * 路径规则: components/{componentId}/{version}/
   * 示例: components/BarChart/1.0.0/index.esm.js
   *
   * 说明：
   * - 所有组件文件统一存储在 'components' 目录下
   * - 使用组件ID和版本号构建层级目录
   * - 便于版本管理和 CDN 缓存
   */
  private generateOSSPath(componentId: string, version: string): string {
    return `components/${componentId}/${version}`
  }

  /**
   * 上传文件到 OSS（使用共享的 OSSService）
   */
  private async uploadToOSS(
    zipBuffer: Buffer,
    ossBasePath: string
  ): Promise<Record<string, string>> {
    const uploadedFiles: Record<string, string> = {}

    try {
      // 获取清理后的文件列表（已移除第一层目录）
      const cleanEntries = ZipUtil.getCleanEntriesWithoutPrefix(zipBuffer)

      // 准备所有待上传的文件
      const filesToUpload = cleanEntries.map(({ cleanPath, entry }) => ({
        objectKey: `${ossBasePath}/${cleanPath}`,
        buffer: entry.getData(),
        contentType: this.getMimeType(entry.entryName)
      }))

      this.logger.info('准备上传文件到 OSS', {
        basePath: ossBasePath,
        fileCount: filesToUpload.length
      })

      // 使用 OSSService 批量上传
      const results = await this.ossService.uploadFiles(filesToUpload)

      // 构建文件名到 URL 的映射
      for (const result of results) {
        // 从完整路径中提取文件名（移除 basePath 前缀）
        const fileName = result.objectKey.replace(`${ossBasePath}/`, '')
        uploadedFiles[fileName] = result.url
      }

      return uploadedFiles
    } catch (error: any) {
      this.logger.error('上传到 OSS 失败', {
        basePath: ossBasePath,
        error: error.message
      })

      throw new BusinessException(
        `上传到 OSS 失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ERROR_CODES.OSS_UPLOAD_FAILED
      )
    }
  }

  /**
   * 根据文件扩展名获取 MIME 类型
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase()

    const mimeTypes: Record<string, string> = {
      js: 'application/javascript',
      json: 'application/json',
      css: 'text/css',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      map: 'application/json'
    }

    return mimeTypes[ext || ''] || 'application/octet-stream'
  }
}
