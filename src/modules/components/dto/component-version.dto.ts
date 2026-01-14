import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  Matches,
  IsObject,
  IsDateString,
  IsUrl
} from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { PaginationDto } from '@/shared/dto/pagination.dto'
import { VersionStatus } from '../constants/version-status.enum'

/**
 * 创建组件版本 DTO
 * 注意：通常不直接创建版本，而是通过上传 zip 包自动创建
 */
export class CreateComponentVersionDto {
  @IsString({ message: '组件ID必须是字符串' })
  @IsNotEmpty({ message: '组件ID不能为空' })
  componentId!: string // Component.componentId（主键，string 类型）

  @IsString({ message: '版本号必须是字符串' })
  @IsNotEmpty({ message: '版本号不能为空' })
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, {
    message: '版本号格式不正确，应为 x.y.z 或 x.y.z-beta.1'
  })
  version!: string

  @IsString({ message: '入口文件必须是字符串' })
  @IsNotEmpty({ message: '入口文件不能为空' })
  entryFile!: string

  @IsOptional()
  @IsString({ message: '样式文件必须是字符串' })
  styleFile?: string

  @IsOptional()
  @IsString({ message: '预览文件必须是字符串' })
  previewFile?: string

  @IsString({ message: 'OSS基础路径必须是字符串' })
  @IsNotEmpty({ message: 'OSS基础路径不能为空' })
  ossBasePath!: string

  @IsUrl({}, { message: '入口文件URL必须是有效URL' })
  entryUrl!: string

  @IsOptional()
  @IsUrl({}, { message: '样式文件URL必须是有效URL' })
  styleUrl?: string

  @IsOptional()
  @IsUrl({}, { message: '预览文件URL必须是有效URL' })
  previewUrl?: string

  @IsDateString({}, { message: '构建时间必须是有效日期' })
  buildTime!: string

  @IsString({ message: '构建哈希必须是字符串' })
  @IsNotEmpty({ message: '构建哈希不能为空' })
  buildHash!: string

  @IsString({ message: 'CLI版本必须是字符串' })
  @IsNotEmpty({ message: 'CLI版本不能为空' })
  cliVersion!: string

  @IsString({ message: '组件类型必须是字符串' })
  @IsNotEmpty({ message: '组件类型不能为空' })
  type!: string

  @IsString({ message: '开发框架必须是字符串' })
  @IsNotEmpty({ message: '开发框架不能为空' })
  framework!: string

  @IsOptional()
  @IsString({ message: '作者组织必须是字符串' })
  authorOrganization?: string

  @IsOptional()
  @IsString({ message: '作者用户名必须是字符串' })
  authorUsername?: string

  @IsOptional()
  @IsString({ message: '许可证必须是字符串' })
  license?: string

  @IsOptional()
  @IsInt({ message: '文件大小必须是整数' })
  fileSize?: number

  @IsOptional()
  @IsObject({ message: '资源清单必须是对象' })
  assetsManifest?: Record<string, any>

  @IsObject({ message: 'meta.json内容必须是对象' })
  metaJson!: Record<string, any>

  @IsOptional()
  @IsEnum(VersionStatus, { message: '状态必须是 draft 或 published' })
  status?: VersionStatus

  @IsOptional()
  @IsBoolean({ message: '是否推荐版本必须是布尔值' })
  isLatest?: boolean

  @IsOptional()
  @IsString({ message: '更新日志必须是字符串' })
  changelog?: string
}

/**
 * 更新组件版本 DTO
 */
export class UpdateComponentVersionDto extends PartialType(CreateComponentVersionDto) {
  // 继承所有字段，但都变为可选
}

/**
 * 发布版本 DTO
 */
export class PublishVersionDto {
  @IsOptional()
  @IsString({ message: '更新日志必须是字符串' })
  changelog?: string
}

/**
 * 设置推荐版本 DTO
 */
export class SetLatestVersionDto {
  @IsString({ message: '版本ID必须是字符串' })
  @IsNotEmpty({ message: '版本ID不能为空' })
  versionId!: string
}

/**
 * 查询组件版本 DTO
 */
export class QueryComponentVersionDto extends PaginationDto {
  @IsOptional()
  @IsString()
  componentId?: string

  @IsOptional()
  @IsEnum(VersionStatus, { message: '状态必须是 draft 或 published' })
  status?: VersionStatus

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isLatest?: boolean
}

/**
 * 版本详情响应 DTO
 */
export class ComponentVersionResponseDto {
  id!: string
  componentId!: string
  version!: string
  entryFile!: string
  styleFile?: string
  previewFile?: string
  ossBasePath!: string
  entryUrl!: string
  styleUrl?: string
  previewUrl?: string
  buildTime!: Date
  buildHash!: string
  cliVersion!: string
  type!: string
  framework!: string
  authorOrganization?: string
  authorUsername?: string
  license?: string
  fileSize?: number
  assetsManifest?: Record<string, any>
  metaJson!: Record<string, any>
  status!: VersionStatus
  isLatest!: boolean
  publishedAt?: Date
  changelog?: string
  createdAt!: Date
  updatedAt!: Date
}
