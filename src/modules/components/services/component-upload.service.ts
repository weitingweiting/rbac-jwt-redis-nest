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
import { ApplicationType } from '@/modules/development-applications/constants'

/**
 * 组件上传服务
 * 职责：处理组件 ZIP 包的上传、解析、验证和存储
 * 先审批，后开发
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
      const { passed: _passed, warnings } = await this.validationService.validateZipFile(file)

      const supplement = await this.validationService.parseAndValidateSupplementJson(file.buffer)

      this.logger.info('解析 supplement.json 成功', {
        componentId: supplement.id,
        version: supplement.version,
        applicationId: supplement._metadata.applicationId,
        applicationNo: supplement._metadata.applicationNo,
        requestedApplicationNo: applicationNo
      })

      if (applicationNo !== supplement._metadata.applicationNo) {
        throw new BusinessException(
          `申请单号不匹配：当前操作的申请为 "${applicationNo}"，但组件包属于 "${supplement._metadata.applicationNo}"。` +
            `请确认上传的组件包是否正确，或检查是否下载了错误的 supplement.json`,
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.APPLICATION_MISMATCH
        )
      }

      this.logger.info('申请单号一致性验证通过', {
        applicationNo,
        supplementApplicationNo: supplement._metadata.applicationNo
      })

      const application = await this.validationService.validateSupplementWithApplication(supplement)

      this.validationService.validateApplicationStatus(application)

      const buildMeta = await this.validationService.parseAndValidateBuildMeta(file.buffer)

      this.logger.info('解析 meta.json 成功', {
        hasFiles: !!buildMeta.files,
        type: buildMeta.type,
        framework: buildMeta.framework
      })

      this.validationService.validateBuildMetaFiles(file.buffer, buildMeta)

      await this.validationService.validateClassification(
        supplement.classification.level1,
        supplement.classification.level2
      )

      this.logger.info('分类验证通过', {
        level1: supplement.classification.level1,
        level2: supplement.classification.level2
      })

      // 上传文件到 OSS
      const ossBasePath = this.generateOSSPath(supplement.id, supplement.version)
      this.logger.info('开始上传文件到 OSS', { ossBasePath })

      const uploadedFiles = await this.uploadToOSS(file.buffer, ossBasePath)

      this.logger.info('文件上传 OSS 成功', {
        fileCount: Object.keys(uploadedFiles).length
      })

      const { component, isNew } = await this.handleComponentByApplicationType(
        supplement,
        application,
        userId
      )

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

      await this.updateApplicationUploadInfo(application, file, version.id)

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
   */
  private async handleComponentByApplicationType(
    supplement: ComponentSupplementDto,
    application: DevelopmentApplication,
    userId: number
  ): Promise<{ component: Component; isNew: boolean }> {
    if (application.applicationType === ApplicationType.NEW) {
      let component = await this.componentsService.findByComponentId(supplement.id)
      let isNew = false

      if (!component) {
        component = await this.componentsService.createComponent(
          {
            id: supplement.id,
            name: supplement.name,
            description: undefined,
            classification: supplement.classification
          },
          userId
        )
        isNew = true

        this.logger.info('新组件创建完成', {
          componentId: component.componentId,
          applicationType: application.applicationType
        })
      } else {
        this.logger.info('组件已存在，使用现有记录', {
          componentId: component.componentId,
          applicationType: application.applicationType
        })
      }

      return { component, isNew }
    } else {
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
      version: supplement.version,
      entryFile: buildMeta.files.entry,
      // styleFile: buildMeta.files.style,
      styleFile: null,
      previewFile: buildMeta.files.preview,
      ossBasePath,
      entryUrl: uploadedFiles[buildMeta.files.entry],
      styleUrl: null,
      previewUrl: buildMeta.files.preview ? uploadedFiles[buildMeta.files.preview] : undefined,
      buildTime: buildMeta.buildInfo.buildTime,
      buildHash: buildMeta.buildInfo.hash,
      cliVersion: buildMeta.buildInfo.cliVersion,
      type: buildMeta.type || 'vue-echarts',
      framework: buildMeta.framework || 'vue3',
      authorOrganization: buildMeta.author?.organization,
      authorUsername: buildMeta.author?.userName,
      license: buildMeta?.license ?? 'MIT',
      fileSize: this.validationService.calculateZipSize(file.buffer),
      assetsManifest: { files: Object.keys(uploadedFiles) },
      metaJson: buildMeta as any,
      status: VersionStatus.DRAFT
    }
  }

  /**
   * 更新申请的上传信息
   * 保持 APPROVED 状态，允许开发者多次上传调试
   */
  private async updateApplicationUploadInfo(
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
    // 申请状态在版本发布（publishVersion）时才变更为 COMPLETED

    await this.applicationRepository.save(application)

    this.logger.info('申请上传信息已更新', {
      applicationId: application.id,
      applicationNo: application.applicationNo,
      componentVersionId,
      status: application.developmentStatus // 保持 approved
    })
  }

  /**
   * 生成组件在 OSS 中的存储路径
   */
  private generateOSSPath(componentId: string, version: string): string {
    return `components/${componentId}/${version}`
  }

  /**
   * 上传文件到 OSS
   */
  private async uploadToOSS(
    zipBuffer: Buffer,
    ossBasePath: string
  ): Promise<Record<string, string>> {
    const uploadedFiles: Record<string, string> = {}

    try {
      const cleanEntries = ZipUtil.getCleanEntriesWithoutPrefix(zipBuffer)

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

      for (const result of results) {
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
