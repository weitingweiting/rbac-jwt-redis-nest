import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
  MaxLength,
  IsObject
} from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { ProjectStatus } from '@/shared/entities/project.entity'
import { PaginationDto } from '@/shared/dto/pagination.dto'

/**
 * 创建项目 DTO
 */
export class CreateProjectDto {
  @IsString({ message: '项目名称必须是字符串' })
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(100, { message: '项目名称最多100个字符' })
  name!: string

  @IsInt({ message: '项目空间ID必须是整数' })
  projectSpaceId!: number

  @IsOptional()
  @IsString({ message: '项目描述必须是字符串' })
  @MaxLength(500, { message: '项目描述最多500个字符' })
  description?: string

  @IsOptional()
  @IsObject({ message: 'sceneJson必须是对象' })
  sceneJson?: Record<string, any>

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'], {
    message: '项目状态只能是draft、published或archived'
  })
  status?: ProjectStatus

  @IsOptional()
  @IsUrl({}, { message: '封面地址必须是有效的URL' })
  coverUrl?: string
}

/**
 * 更新项目 DTO
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

/**
 * 发布项目 DTO
 */
export class PublishProjectDto {
  @IsOptional()
  @IsUrl({}, { message: '发布地址必须是有效的URL' })
  @MaxLength(500, { message: '发布地址最多500个字符' })
  publishUrl?: string
}

/**
 * 查询项目 DTO
 */
export class QueryProjectDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: ProjectStatus

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectSpaceId?: number
}
