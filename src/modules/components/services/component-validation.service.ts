import { Injectable, HttpStatus, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { ComponentMetaDto } from '../dto/component-meta.dto'
import { plainToClass } from 'class-transformer'
import { validate } from 'class-validator'
import { COMPONENT_FILE_UPLOAD_RULES } from '../constants/validation-rules.constant'
import { ZipUtil } from '../utils/zip.util'

@Injectable()
export class ComponentValidationService {
  constructor(
    @InjectRepository(ComponentCategory)
    private categoryRepository: Repository<ComponentCategory>,
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
   * 解析并验证 component.meta.json
   */
  async parseAndValidateMetaJson(zipBuffer: Buffer): Promise<ComponentMetaDto> {
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
        console.log('🚀 ~ ComponentValidationService ~ parseAndValidateMetaJson ~ error:', error)
        throw new BusinessException(
          'component.meta.json 格式不正确，请检查 JSON 语法',
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.META_JSON_INVALID
        )
      }

      // 转换为 DTO 并验证
      const metaDto = plainToClass(ComponentMetaDto, metaJson)
      const errors = await validate(metaDto)

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

      return metaDto
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
   * 验证 meta.json 中声明的文件是否存在
   */
  async validateMetaFiles(zipBuffer: Buffer, meta: ComponentMetaDto): Promise<void> {
    const entries = ZipUtil.getCleanEntries(zipBuffer)
    const fileNames = entries.map((entry) => entry.entryName)

    // 验证主入口文件
    if (!ZipUtil.fileExists(fileNames, meta.files.entry)) {
      throw new BusinessException(
        `主入口文件 ${meta.files.entry} 不存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_REQUIRED_FILES
      )
    }

    // 验证样式文件（可选）
    if (meta.files.style && !ZipUtil.fileExists(fileNames, meta.files.style)) {
      throw new BusinessException(
        `样式文件 ${meta.files.style} 不存在`,
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_DECLARED_FILES
      )
    }

    // 验证预览图（可选）
    if (meta.files.preview && !ZipUtil.fileExists(fileNames, meta.files.preview)) {
      throw new BusinessException(
        `预览图 ${meta.files.preview} 不存在`,
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
}
