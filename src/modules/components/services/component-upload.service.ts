import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { ComponentValidationService } from './component-validation.service'
import { ComponentsService } from './components.service'
import { ComponentVersionsService } from './component-versions.service'
import { CreateComponentVersionDto } from '../dto/component-version.dto'
import { VersionStatus } from '../constants/version-status.enum'
import { OSSService } from '@/shared/services/oss.service'
import { ZipUtil } from '../utils/zip.util'

/**
 * 组件上传服务
 *
 * 职责：处理组件 ZIP 包的上传、解析、验证和存储
 * 使用 OSSService 提供的通用文件存储能力
 */
@Injectable()
export class ComponentUploadService {
  constructor(
    private readonly validationService: ComponentValidationService,
    private readonly componentsService: ComponentsService,
    private readonly versionsService: ComponentVersionsService,
    private readonly ossService: OSSService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 处理组件上传
   */
  async processUpload(
    file: Express.Multer.File,
    userId: number
  ): Promise<{
    component: any
    version: any
    isNewComponent: boolean
    isNewVersion: boolean
    warnings: string[]
  }> {
    this.logger.info('开始处理组件上传', {
      userId,
      fileName: file.originalname,
      fileSize: file.size
    })

    try {
      // 1. 验证 ZIP 文件
      const { passed: _passed, warnings } = await this.validationService.validateZipFile(file)

      // 2. 解析并验证 meta.json
      const meta = await this.validationService.parseAndValidateMetaJson(file.buffer)

      this.logger.info('解析 meta.json 成功', {
        componentId: meta.id,
        version: meta.version
      })

      // 3. 验证 meta 中声明的文件是否存在
      await this.validationService.validateMetaFiles(file.buffer, meta)

      // 4. 验证分类信息是否存在（在上传 OSS 之前验证，避免浪费存储资源）
      await this.validationService.validateClassification(
        meta.classification.level1,
        meta.classification.level2
      )

      this.logger.info('分类验证通过', {
        level1: meta.classification.level1,
        level2: meta.classification.level2
      })

      // 5. 检查版本状态，决定是创建还是更新
      const versionCheck = await this.checkVersionStatus(meta.id, meta.version)

      // 6. 上传文件到 OSS
      const ossBasePath = this.generateOSSPath(meta.id, meta.version)
      this.logger.info('开始上传文件到 OSS', { ossBasePath })

      const uploadedFiles = await this.uploadToOSS(file.buffer, ossBasePath)

      this.logger.info('文件上传 OSS 成功', {
        fileCount: Object.keys(uploadedFiles).length
      })

      // 7. 创建或更新组件记录（分类验证已在步骤4完成）
      const { component, isNew } = await this.componentsService.createOrUpdateFromMeta(meta, userId)

      // 8. 创建版本记录（包含版本专属信息）
      const versionDto: CreateComponentVersionDto = {
        componentId: component.componentId, // 使用组件主键 componentId（string）
        version: meta.version,
        entryFile: meta.files.entry,
        styleFile: meta.files.style,
        previewFile: meta.files.preview,
        ossBasePath,
        entryUrl: uploadedFiles[meta.files.entry],
        styleUrl: meta.files.style ? uploadedFiles[meta.files.style] : undefined,
        previewUrl: meta.files.preview ? uploadedFiles[meta.files.preview] : undefined,
        buildTime: meta.buildInfo.buildTime,
        buildHash: meta.buildInfo.hash,
        cliVersion: meta.buildInfo.cliVersion,
        // 版本专属字段（每个版本可以不同）
        type: meta.type || 'vue-echarts',
        framework: meta.framework || 'vue3',
        authorOrganization: meta.author?.organization,
        authorUsername: meta.author?.userName,
        license: meta?.license ?? 'MIT',
        // 其他字段
        fileSize: this.validationService.calculateZipSize(file.buffer),
        assetsManifest: { files: Object.keys(uploadedFiles) }, // 使用实际上传的文件列表（已移除 dist/ 前缀）
        metaJson: meta as any,
        status: VersionStatus.DRAFT // 默认为草稿状态
      }

      let version
      if (versionCheck.isUpdate) {
        // 更新草稿版本
        version = await this.versionsService.updateVersion(
          versionCheck.versionId!,
          versionDto,
          userId
        )
        this.logger.info('草稿版本更新完成', {
          componentId: component.componentId,
          versionId: version.id,
          version: version.version
        })
      } else {
        // 创建新版本
        version = await this.versionsService.createVersion(versionDto, userId)
        this.logger.info('新版本创建完成', {
          componentId: component.componentId,
          versionId: version.id,
          version: version.version
        })
      }

      this.logger.info('组件上传处理完成', {
        componentId: component.componentId,
        versionId: version.id,
        isNewComponent: isNew,
        isNewVersion: !versionCheck.isUpdate
      })

      return {
        component,
        version,
        isNewComponent: isNew,
        isNewVersion: !versionCheck.isUpdate,
        warnings
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
   * 检查版本状态，决定是创建还是更新
   */
  private async checkVersionStatus(
    componentId: string,
    version: string
  ): Promise<{ isUpdate: boolean; versionId?: number }> {
    const existingComponent = await this.componentsService.findByComponentId(componentId)

    // 组件不存在，返回创建操作
    if (!existingComponent) {
      return { isUpdate: false }
    }

    const existingVersion = await this.versionsService.findByComponentAndVersion(
      existingComponent.componentId,
      version
    )

    // 版本不存在，返回创建操作
    if (!existingVersion) {
      return { isUpdate: false }
    }

    // 版本存在，检查状态
    if (existingVersion.status === VersionStatus.DRAFT) {
      // 草稿状态，允许更新
      this.logger.info('检测到草稿版本，允许更新', {
        componentId,
        version,
        versionId: existingVersion.id
      })
      return { isUpdate: true, versionId: existingVersion.id }
    } else {
      // 已发布状态，不允许覆盖
      throw new BusinessException(
        `组件 ${componentId} 的版本 ${version} 已发布，无法覆盖。请修改版本号后重新上传`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.COMPONENT_VERSION_ALREADY_EXISTS
      )
    }
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
