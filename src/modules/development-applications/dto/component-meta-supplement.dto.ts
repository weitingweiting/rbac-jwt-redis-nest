import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  Matches,
  MaxLength
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 分类显示名称 DTO
 */
export class ClassificationDisplayNameDto {
  @IsString({ message: '一级分类显示名称必须是字符串' })
  @IsNotEmpty({ message: '一级分类显示名称不能为空' })
  level1: string

  @IsString({ message: '二级分类显示名称必须是字符串' })
  @IsNotEmpty({ message: '二级分类显示名称不能为空' })
  level2: string
}

/**
 * 分类信息 DTO
 */
export class SupplementClassificationDto {
  @IsString({ message: '一级分类必须是字符串' })
  @IsNotEmpty({ message: '一级分类不能为空' })
  level1: string

  @IsString({ message: '二级分类必须是字符串' })
  @IsNotEmpty({ message: '二级分类不能为空' })
  level2: string

  @ValidateNested()
  @Type(() => ClassificationDisplayNameDto)
  displayName: ClassificationDisplayNameDto
}

/**
 * 元数据信息 DTO（用于追溯和防篡改）
 */
export class SupplementMetadataDto {
  @IsOptional()
  applicationId?: number

  @IsOptional()
  applicationNo?: string

  @IsOptional()
  applicationType?: string

  @IsOptional()
  originalVersionId?: number

  @IsOptional()
  exportTime?: string

  @IsOptional()
  signature?: string
}

/**
 * 组件元数据补充文件 DTO
 *
 * 对应 component.meta.supplement.json 文件
 * 由研发申请系统生成，用户下载后放入组件包
 */
export class ComponentMetaSupplementDto {
  @IsString({ message: '组件ID必须是字符串' })
  @IsNotEmpty({ message: '组件ID不能为空' })
  @MaxLength(100, { message: '组件ID最多100个字符' })
  id: string

  @IsString({ message: '组件名称必须是字符串' })
  @IsNotEmpty({ message: '组件名称不能为空' })
  @MaxLength(100, { message: '组件名称最多100个字符' })
  name: string

  @IsString({ message: '版本号必须是字符串' })
  @IsNotEmpty({ message: '版本号不能为空' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  version: string

  @ValidateNested()
  @Type(() => SupplementClassificationDto)
  classification: SupplementClassificationDto

  @IsOptional()
  @ValidateNested()
  @Type(() => SupplementMetadataDto)
  _metadata?: SupplementMetadataDto
}

/**
 * 生成 supplement 文件内容
 */
export interface IGenerateSupplementOptions {
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
  _metadata?: {
    applicationId: number
    applicationNo: string
    applicationType?: string
    originalVersionId?: number
    exportTime: string
    signature?: string
  }
}
