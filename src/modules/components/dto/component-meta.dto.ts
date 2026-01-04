/**
 * 组件 meta.json 映射 DTO
 * 用于解析和验证上传的 component.meta.json 文件
 */

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
 * 文件信息 DTO（对应 meta.json 的 files 字段）
 */
export class ComponentFilesDto {
  @IsString({ message: '主入口文件必须是字符串' })
  @IsNotEmpty({ message: '主入口文件不能为空' })
  entry!: string

  @IsOptional()
  @IsString({ message: '样式文件必须是字符串' })
  style?: string

  @IsOptional()
  @IsString({ message: '预览图必须是字符串' })
  preview?: string
}

/**
 * 构建信息 DTO（对应 meta.json 的 buildInfo 字段）
 */
export class ComponentBuildInfoDto {
  @IsString({ message: '构建时间必须是字符串' })
  @IsNotEmpty({ message: '构建时间不能为空' })
  buildTime!: string

  @IsString({ message: '文件哈希值必须是字符串' })
  @IsNotEmpty({ message: '文件哈希值不能为空' })
  hash!: string

  @IsString({ message: 'CLI版本必须是字符串' })
  @IsNotEmpty({ message: 'CLI版本不能为空' })
  cliVersion!: string
}

/**
 * 分类显示名称 DTO
 */
export class ComponentClassificationDisplayNameDto {
  @IsOptional()
  @IsString({ message: '一级分类显示名称必须是字符串' })
  level1?: string

  @IsOptional()
  @IsString({ message: '二级分类显示名称必须是字符串' })
  level2?: string
}

/**
 * 分类信息 DTO（对应 meta.json 的 classification 字段）
 * 注意：组件必须有完整的分类信息
 */
export class ComponentClassificationDto {
  @IsString({ message: '一级分类必须是字符串' })
  @IsNotEmpty({ message: '一级分类不能为空' })
  level1!: string

  @IsString({ message: '二级分类必须是字符串' })
  @IsNotEmpty({ message: '二级分类不能为空' })
  level2!: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentClassificationDisplayNameDto)
  displayName?: ComponentClassificationDisplayNameDto
}

/**
 * 作者信息 DTO
 */
export class ComponentAuthorDto {
  @IsOptional()
  @IsString({ message: '组织名称必须是字符串' })
  organization?: string

  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  userName?: string
}

/**
 * 组件 meta.json 完整结构 DTO
 */
export class ComponentMetaDto {
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

  @IsOptional()
  @IsString({ message: '组件描述必须是字符串' })
  description?: string

  @ValidateNested()
  @Type(() => ComponentFilesDto)
  files!: ComponentFilesDto

  @ValidateNested()
  @Type(() => ComponentBuildInfoDto)
  buildInfo!: ComponentBuildInfoDto

  @ValidateNested()
  @Type(() => ComponentClassificationDto)
  classification!: ComponentClassificationDto

  @IsOptional()
  @IsString({ message: '组件类型必须是字符串' })
  type?: string

  @IsOptional()
  @IsString({ message: '开发框架必须是字符串' })
  framework?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentAuthorDto)
  author?: ComponentAuthorDto

  @IsOptional()
  @IsString({ message: '许可证必须是字符串' })
  license?: string
}
