import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator'
import { ApplicationType } from '../constants/application-type.enum'

/**
 * 创建研发申请 DTO - 基础字段
 */
class BaseCreateApplicationDto {
  @IsEnum(ApplicationType, { message: '申请类型必须是 new、version 或 replace' })
  @IsNotEmpty({ message: '申请类型不能为空' })
  applicationType: ApplicationType

  @IsString({ message: '组件ID必须是字符串' })
  @IsNotEmpty({ message: '组件ID不能为空' })
  @MaxLength(100, { message: '组件ID最多100个字符' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/, {
    message: '组件ID必须以字母开头，只能包含字母和数字'
  })
  componentId: string

  @IsOptional()
  @IsString({ message: '版本更新日志必须是字符串' })
  @MaxLength(2000, { message: '版本更新日志最多2000个字符' })
  changelog?: string
}

/**
 * 创建新组件申请 DTO
 */
export class CreateNewComponentApplicationDto extends BaseCreateApplicationDto {
  applicationType: ApplicationType.NEW = ApplicationType.NEW

  @IsString({ message: '组件名称必须是字符串' })
  @IsNotEmpty({ message: '组件名称不能为空' })
  @MaxLength(100, { message: '组件名称最多100个字符' })
  @MinLength(2, { message: '组件名称至少2个字符' })
  name: string

  @IsOptional()
  @IsString({ message: '组件描述必须是字符串' })
  @MaxLength(500, { message: '组件描述最多500个字符' })
  description?: string

  @IsString({ message: '一级分类必须是字符串' })
  @IsNotEmpty({ message: '一级分类不能为空' })
  @MaxLength(50, { message: '一级分类最多50个字符' })
  classificationLevel1: string

  @IsString({ message: '二级分类必须是字符串' })
  @IsNotEmpty({ message: '二级分类不能为空' })
  @MaxLength(50, { message: '二级分类最多50个字符' })
  classificationLevel2: string

  @IsOptional()
  @IsString({ message: '版本号必须是字符串' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  targetVersion?: string = '1.0.0'
}

/**
 * 创建版本迭代申请 DTO
 */
export class CreateVersionApplicationDto extends BaseCreateApplicationDto {
  applicationType: ApplicationType.VERSION = ApplicationType.VERSION

  @IsString({ message: '版本号必须是字符串' })
  @IsNotEmpty({ message: '版本号不能为空' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  targetVersion: string
}

/**
 * 创建替换版本申请 DTO
 */
export class CreateReplaceApplicationDto extends BaseCreateApplicationDto {
  applicationType: ApplicationType.REPLACE = ApplicationType.REPLACE

  @IsString({ message: '版本号必须是字符串' })
  @IsNotEmpty({ message: '版本号不能为空' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  targetVersion: string

  @IsInt({ message: '现有版本ID必须是整数' })
  @IsNotEmpty({ message: '现有版本ID不能为空' })
  existingVersionId: number
}

/**
 * 创建研发申请 DTO（统一入口）
 * 根据 applicationType 区分不同场景
 */
export class CreateDevelopmentApplicationDto {
  @IsEnum(ApplicationType, { message: '申请类型必须是 new、version 或 replace' })
  @IsNotEmpty({ message: '申请类型不能为空' })
  applicationType: ApplicationType

  @IsString({ message: '组件ID必须是字符串' })
  @IsNotEmpty({ message: '组件ID不能为空' })
  @MaxLength(100, { message: '组件ID最多100个字符' })
  @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/, {
    message: '组件ID必须以字母开头，只能包含字母和数字'
  })
  componentId: string

  @IsOptional()
  @IsString({ message: '组件名称必须是字符串' })
  @MaxLength(100, { message: '组件名称最多100个字符' })
  @MinLength(2, { message: '组件名称至少2个字符' })
  name?: string

  @IsOptional()
  @IsString({ message: '组件描述必须是字符串' })
  @MaxLength(500, { message: '组件描述最多500个字符' })
  description?: string

  @IsOptional()
  @IsString({ message: '一级分类必须是字符串' })
  @MaxLength(50, { message: '一级分类最多50个字符' })
  classificationLevel1?: string

  @IsOptional()
  @IsString({ message: '二级分类必须是字符串' })
  @MaxLength(50, { message: '二级分类最多50个字符' })
  classificationLevel2?: string

  @IsOptional()
  @IsString({ message: '版本号必须是字符串' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  targetVersion?: string

  @IsOptional()
  @IsInt({ message: '现有版本ID必须是整数' })
  existingVersionId?: number

  @IsOptional()
  @IsString({ message: '版本更新日志必须是字符串' })
  @MaxLength(2000, { message: '版本更新日志最多2000个字符' })
  changelog?: string
}
