/**
 * 组件构建元信息 DTO
 *
 * 用于校验 abd-cli 生成的 component.meta.json 文件
 * 该文件只包含构建相关的技术信息，不包含业务信息（id、name、version、classification）
 * 业务信息来自 supplement.json
 */

import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 文件信息 DTO
 */
export class BuildMetaFilesDto {
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
 * 构建信息 DTO
 */
export class BuildMetaBuildInfoDto {
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
 * 作者信息 DTO
 */
export class BuildMetaAuthorDto {
  @IsOptional()
  @IsString({ message: '组织名称必须是字符串' })
  organization?: string

  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  userName?: string
}

/**
 * 组件构建元信息 DTO（component.meta.json）
 *
 * 职责：只校验 abd-cli 生成的构建信息
 * - files: 入口文件、样式文件、预览图路径
 * - buildInfo: 构建时间、哈希、CLI版本
 * - type/framework: 组件类型和框架
 * - author: 作者信息
 * - license: 许可证
 * - description: 组件描述
 *
 * 注意：不包含 id、name、version、classification，这些来自 supplement.json
 */
export class ComponentBuildMetaDto {
  @ValidateNested()
  @Type(() => BuildMetaFilesDto)
  files!: BuildMetaFilesDto

  @ValidateNested()
  @Type(() => BuildMetaBuildInfoDto)
  buildInfo!: BuildMetaBuildInfoDto

  @IsOptional()
  @IsString({ message: '组件类型必须是字符串' })
  type?: string

  @IsOptional()
  @IsString({ message: '开发框架必须是字符串' })
  framework?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => BuildMetaAuthorDto)
  author?: BuildMetaAuthorDto

  @IsOptional()
  @IsString({ message: '许可证必须是字符串' })
  license?: string

  @IsOptional()
  @IsString({ message: '组件描述必须是字符串' })
  description?: string
}
