/**
 * 组件 supplement.json 映射 DTO
 * 用于解析和验证研发申请系统导出的 component.meta.supplement.json 文件
 *
 * 该文件由研发申请系统在审核通过后生成，包含：
 * - 组件基本信息（id, name, version）
 * - 分类信息（分类标识和显示名称）
 * - 申请元数据（applicationId, applicationNo, exportTime）
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Matches,
  MaxLength
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 分类显示名称 DTO
 */
export class SupplementDisplayNameDto {
  @IsString({ message: '一级分类显示名称必须是字符串' })
  @IsNotEmpty({ message: '一级分类显示名称不能为空' })
  level1!: string

  @IsString({ message: '二级分类显示名称必须是字符串' })
  @IsNotEmpty({ message: '二级分类显示名称不能为空' })
  level2!: string
}

/**
 * 分类信息 DTO（supplement 文件版本）
 */
export class SupplementClassificationDto {
  @IsString({ message: '一级分类必须是字符串' })
  @IsNotEmpty({ message: '一级分类不能为空' })
  level1!: string

  @IsString({ message: '二级分类必须是字符串' })
  @IsNotEmpty({ message: '二级分类不能为空' })
  level2!: string

  @ValidateNested()
  @Type(() => SupplementDisplayNameDto)
  displayName!: SupplementDisplayNameDto
}

/**
 * 申请元数据 DTO
 */
export class SupplementMetadataDto {
  @IsNumber({}, { message: 'applicationId 必须是数字' })
  applicationId!: number

  @IsString({ message: 'applicationNo 必须是字符串' })
  @IsNotEmpty({ message: 'applicationNo 不能为空' })
  applicationNo!: string

  @IsString({ message: 'exportTime 必须是字符串' })
  @IsNotEmpty({ message: 'exportTime 不能为空' })
  exportTime!: string

  @IsOptional()
  @IsString({ message: 'signature 必须是字符串' })
  signature?: string

  @IsOptional()
  @IsBoolean({ message: 'isReplacement 必须是布尔值' })
  isReplacement?: boolean

  @IsOptional()
  @IsNumber({}, { message: 'originalVersionId 必须是数字' })
  originalVersionId?: number
}

/**
 * 组件 supplement.json 完整结构 DTO
 *
 * 文件结构示例：
 * ```json
 * {
 *   "id": "BarChart",
 *   "name": "柱状图",
 *   "version": "1.0.0",
 *   "classification": {
 *     "level1": "chart",
 *     "level2": "bar",
 *     "displayName": {
 *       "level1": "图表组件",
 *       "level2": "柱状图"
 *     }
 *   },
 *   "_metadata": {
 *     "applicationId": 123,
 *     "applicationNo": "APP-20260107-0001",
 *     "exportTime": "2026-01-07T10:30:00.000Z"
 *   }
 * }
 * ```
 */
export class ComponentSupplementDto {
  @IsString({ message: '组件ID必须是字符串' })
  @IsNotEmpty({ message: '组件ID不能为空' })
  @MaxLength(100, { message: '组件ID最多100个字符' })
  id!: string

  @IsString({ message: '组件名称必须是字符串' })
  @IsNotEmpty({ message: '组件名称不能为空' })
  @MaxLength(200, { message: '组件名称最多200个字符' })
  name!: string

  @IsString({ message: '版本号必须是字符串' })
  @IsNotEmpty({ message: '版本号不能为空' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  version!: string

  @ValidateNested()
  @Type(() => SupplementClassificationDto)
  classification!: SupplementClassificationDto

  @ValidateNested()
  @Type(() => SupplementMetadataDto)
  _metadata!: SupplementMetadataDto
}
