import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { DevelopmentApplication } from '@/shared/entities/development-application.entity'
import { ComponentBuildMetaDto } from '../dto/component-build-meta.dto'
import { ComponentSupplementDto } from '../dto/component-supplement.dto'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { COMPONENT_FILE_UPLOAD_RULES } from '../constants/validation-rules.constant'
import { ZipUtil } from '../utils/zip.util'
import {
  UPLOADABLE_STATUSES,
  DEVELOPMENT_STATUS_LABELS
} from '@/modules/development-applications/constants'

@Injectable()
export class ComponentValidationService {
  constructor(
    @InjectRepository(ComponentCategory)
    private categoryRepository: Repository<ComponentCategory>,
    @InjectRepository(DevelopmentApplication)
    private applicationRepository: Repository<DevelopmentApplication>,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}
  /**
   * 验证上传的 ZIP 文件
   */
  async validateZipFile(file: Express.Multer.File): Promise<{
    passed: boolean
    warnings: string[]
  }> {
    const warnings: string[] = []

    // 1. 验证文件类型
    if (file.mimetype !== 'application/zip' && !file.originalname.endsWith('.zip')) {
      throw new BusinessException(
        '只支持 .zip 格式的文件',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_ZIP_FILE
      )
    }

    // 2. 验证文件大小
    if (file.size > COMPONENT_FILE_UPLOAD_RULES.MAX_ZIP_SIZE) {
      throw new BusinessException(
        `ZIP 文件大小不能超过 ${COMPONENT_FILE_UPLOAD_RULES.MAX_ZIP_SIZE / 1024 / 1024}MB`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.FILE_SIZE_EXCEEDED
      )
    }

    // 3. 验证 ZIP 文件结构
    try {
      const entries = ZipUtil.getCleanEntries(file.buffer)

      // 检查是否包含 component.meta.json（可能在根目录或子目录中）
      const metaEntry = ZipUtil.findMetaEntry(entries)
      if (!metaEntry) {
        throw new BusinessException(
          'ZIP 文件中缺少 component.meta.json',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.META_JSON_NOT_FOUND
        )
      }

      // 验证总文件数量
      if (entries.length > COMPONENT_FILE_UPLOAD_RULES.MAX_FILE_COUNT) {
        warnings.push(`文件数量较多（${entries.length}），建议精简组件资源`)
      }

      // 验证是否包含必要的文件类型
      const hasJsFile = entries.some((entry) => entry.entryName.endsWith('.js'))
      if (!hasJsFile) {
        throw new BusinessException(
          'ZIP 文件中缺少 JavaScript 入口文件',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.MISSING_REQUIRED_FILES
        )
      }

      return { passed: true, warnings }
    } catch (error: any) {
      if (error instanceof BusinessException) {
        throw error
      }
      throw new BusinessException(
        'ZIP 文件损坏或格式不正确',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_ZIP_FILE
      )
    }
  }

  /**
   * 解析并验证 component.meta.json（构建信息）
   * 该文件由 abd-cli 生成，只包含构建相关的技术信息
   */
  async parseAndValidateBuildMeta(zipBuffer: Buffer): Promise<ComponentBuildMetaDto> {
    try {
      const entries = ZipUtil.getCleanEntries(zipBuffer)

      // 查找 component.meta.json（可能在根目录或子目录中）
      const metaEntry = ZipUtil.findMetaEntry(entries)

      if (!metaEntry) {
        throw new BusinessException(
          'ZIP 文件中缺少 component.meta.json',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.META_JSON_NOT_FOUND
        )
      }

      // 解析 JSON
      const metaContent = metaEntry.getData().toString('utf8')
      let metaJson: any

      try {
        metaJson = JSON.parse(metaContent)
      } catch (error) {
        console.log('🚀 ~ ComponentValidationService ~ parseAndValidateBuildMeta ~ error:', error)
        throw new BusinessException(
          'component.meta.json 格式不正确，请检查 JSON 语法',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.META_JSON_INVALID
        )
      }

      // 转换为 DTO 并验证（只验证构建相关字段）
      const buildMetaDto = plainToClass(ComponentBuildMetaDto, metaJson)
      const errors = await validate(buildMetaDto)

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(', '))
          .join('; ')

        throw new BusinessException(
          `component.meta.json 验证失败: ${errorMessages}`,
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.META_JSON_INVALID
        )
      }

      return buildMetaDto
    } catch (error: any) {
      if (error instanceof BusinessException) {
        throw error
      }
      throw new BusinessException(
        '解析 component.meta.json 失败',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.META_JSON_INVALID
      )
    }
  }

  /**
   * 验证构建元信息中声明的文件是否存在
   */
  validateBuildMetaFiles(zipBuffer: Buffer, buildMeta: ComponentBuildMetaDto): void {
    const entries = ZipUtil.getCleanEntries(zipBuffer)
    const fileNames = entries.map((entry) => entry.entryName)

    // 验证主入口文件
    if (!ZipUtil.fileExists(fileNames, buildMeta.files.entry)) {
      throw new BusinessException(
        `主入口文件 ${buildMeta.files.entry} 不存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FILES
      )
    }

    // 验证样式文件（可选）
    if (buildMeta.files.style && !ZipUtil.fileExists(fileNames, buildMeta.files.style)) {
      throw new BusinessException(
        `样式文件 ${buildMeta.files.style} 不存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_DECLARED_FILES
      )
    }

    // 验证预览图（可选）
    if (buildMeta.files.preview && !ZipUtil.fileExists(fileNames, buildMeta.files.preview)) {
      throw new BusinessException(
        `预览图 ${buildMeta.files.preview} 不存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_DECLARED_FILES
      )
    }
  }

  /**
   * 获取 ZIP 文件列表（用于生成资源清单）
   */
  getZipFileList(zipBuffer: Buffer): string[] {
    return ZipUtil.getFileList(zipBuffer)
  }

  /**
   * 计算 ZIP 文件总大小
   */
  calculateZipSize(zipBuffer: Buffer): number {
    return ZipUtil.calculateSize(zipBuffer)
  }

  /**
   * 验证分类信息是否存在
   * @throws BusinessException 如果分类不存在
   */
  async validateClassification(level1Code: string, level2Code: string): Promise<void> {
    // 查询一级分类
    const level1Category = await this.categoryRepository.findOne({
      where: {
        code: level1Code,
        level: 1,
        isActive: true,
        deletedAt: null
      }
    })

    if (!level1Category) {
      throw new BusinessException(
        `一级分类 "${level1Code}" 不存在或未启用，请检查组件的分类配置`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_CLASSIFICATION
      )
    }

    // 查询二级分类（必须是该一级分类的子分类）
    const level2Category = await this.categoryRepository.findOne({
      where: {
        code: level2Code,
        level: 2,
        parentId: level1Category.id,
        isActive: true,
        deletedAt: null
      }
    })

    if (!level2Category) {
      throw new BusinessException(
        `二级分类 "${level1Code}-${level2Code}" 不存在或未启用，请检查组件的分类配置`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_CLASSIFICATION
      )
    }

    this.logger.debug('分类验证通过', {
      level1: { code: level1Code, name: level1Category.name },
      level2: { code: level2Code, name: level2Category.name }
    })
  }

  /**
   * 解析并验证 component.meta.supplement.json
   * 该文件由研发申请系统在审核通过后生成，包含组件基本信息和申请元数据
   */
  async parseAndValidateSupplementJson(zipBuffer: Buffer): Promise<ComponentSupplementDto> {
    try {
      const entries = ZipUtil.getCleanEntries(zipBuffer)

      // 查找 component.meta.supplement.json
      const supplementEntry = ZipUtil.findSupplementEntry(entries)

      if (!supplementEntry) {
        throw new BusinessException(
          'ZIP 文件中缺少 component.meta.supplement.json，该文件应从研发申请系统下载并放入组件包中',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.SUPPLEMENT_JSON_NOT_FOUND
        )
      }

      // 解析 JSON
      const supplementContent = supplementEntry.getData().toString('utf8')
      let supplementJson: any

      try {
        supplementJson = JSON.parse(supplementContent)
      } catch {
        throw new BusinessException(
          'component.meta.supplement.json 格式不正确，请重新从研发申请系统下载',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.SUPPLEMENT_JSON_INVALID
        )
      }

      // 转换为 DTO 并验证
      const supplementDto = plainToClass(ComponentSupplementDto, supplementJson)
      const errors = await validate(supplementDto)

      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(', '))
          .join('; ')

        throw new BusinessException(
          `component.meta.supplement.json 验证失败: ${errorMessages}`,
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.SUPPLEMENT_JSON_INVALID
        )
      }

      return supplementDto
    } catch (error: any) {
      if (error instanceof BusinessException) {
        throw error
      }
      throw new BusinessException(
        '解析 component.meta.supplement.json 失败',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.SUPPLEMENT_JSON_INVALID
      )
    }
  }

  /**
   * 验证 supplement.json 与研发申请记录的一致性
   * 确保上传的组件包确实对应一个已审核通过的申请
   *
   * @param supplement 解析后的 supplement.json
   * @returns 返回对应的研发申请记录
   */
  async validateSupplementWithApplication(
    supplement: ComponentSupplementDto
  ): Promise<DevelopmentApplication> {
    const { applicationId, applicationNo } = supplement._metadata

    // 查询申请记录
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId }
    })

    if (!application) {
      throw new BusinessException(
        `研发申请 #${applicationId} 不存在，请检查 supplement.json 是否正确`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.APPLICATION_NOT_FOUND
      )
    }

    // 验证申请单号一致
    if (application.applicationNo !== applicationNo) {
      throw new BusinessException(
        `申请单号不匹配: supplement.json 中为 "${applicationNo}"，系统记录为 "${application.applicationNo}"`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.APPLICATION_MISMATCH
      )
    }

    // 验证组件信息一致
    if (application.componentId !== supplement.id) {
      throw new BusinessException(
        `组件ID不匹配: supplement.json 中为 "${supplement.id}"，申请记录为 "${application.componentId}"`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.APPLICATION_MISMATCH
      )
    }

    // 验证版本号一致
    if (application.targetVersion !== supplement.version) {
      throw new BusinessException(
        `版本号不匹配: supplement.json 中为 "${supplement.version}"，申请记录为 "${application.targetVersion}"`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.APPLICATION_MISMATCH
      )
    }

    this.logger.debug('申请记录验证通过', {
      applicationId,
      applicationNo,
      componentId: supplement.id,
      version: supplement.version
    })

    return application
  }

  /**
   * 验证申请状态是否允许上传
   * 只有 APPROVED 状态的申请才能上传组件包
   */
  validateApplicationStatus(application: DevelopmentApplication): void {
    if (!UPLOADABLE_STATUSES.includes(application.developmentStatus)) {
      throw new BusinessException(
        `当前申请状态为 "${DEVELOPMENT_STATUS_LABELS[application.developmentStatus]}"，` +
          `只有 "已审核通过" 状态的申请才能上传组件包`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.APPLICATION_STATUS_INVALID
      )
    }
  }
}
