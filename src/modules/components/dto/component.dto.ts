import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, IsEnum } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import { PaginationDto } from '@/shared/dto/pagination.dto'

/**
 * 创建组件 DTO
 * 注意：通常不直接创建组件，而是通过上传 zip 包自动创建
 * 此 DTO 用于内部服务或特殊场景
 */
export class CreateComponentDto {
  @IsString({ message: '组件ID必须是字符串' })
  @IsNotEmpty({ message: '组件ID不能为空' })
  @MaxLength(100, { message: '组件ID最多100个字符' })
  componentId!: string

  @IsString({ message: '组件名称必须是字符串' })
  @IsNotEmpty({ message: '组件名称不能为空' })
  @MaxLength(200, { message: '组件名称最多200个字符' })
  name!: string

  @IsOptional()
  @IsString({ message: '组件描述必须是字符串' })
  description?: string

  @IsString({ message: '一级分类必须是字符串' })
  @IsNotEmpty({ message: '一级分类不能为空' })
  classificationLevel1!: string

  @IsString({ message: '一级分类显示名称必须是字符串' })
  @IsNotEmpty({ message: '一级分类显示名称不能为空' })
  classificationLevel1Name!: string

  @IsString({ message: '二级分类必须是字符串' })
  @IsNotEmpty({ message: '二级分类不能为空' })
  classificationLevel2!: string

  @IsString({ message: '二级分类显示名称必须是字符串' })
  @IsNotEmpty({ message: '二级分类显示名称不能为空' })
  classificationLevel2Name!: string

  @IsOptional()
  @IsString({ message: '缩略图URL必须是字符串' })
  @MaxLength(500, { message: '缩略图URL最多500个字符' })
  thumbnailUrl?: string

  @IsOptional()
  @IsBoolean({ message: '是否官方组件必须是布尔值' })
  isOfficial?: boolean
}

/**
 * 更新组件 DTO
 * 注意：组件信息通常由 component.meta.json 决定
 * 直接更新组件字段仅用于管理后台特殊场景
 */
export class UpdateComponentDto extends PartialType(CreateComponentDto) {}

/**
 * 查询组件列表 DTO
 */
export class QueryComponentDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  classificationLevel1?: string

  @IsOptional()
  @IsString()
  classificationLevel2?: string

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  hasPublishedVersion?: boolean

  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  @IsBoolean()
  isOfficial?: boolean

  @IsOptional()
  @IsEnum(['usedCount', 'versionCount', 'createdAt', 'updatedAt'], {
    message: '排序字段只能是 usedCount, versionCount, createdAt, updatedAt'
  })
  sortBy?: 'usedCount' | 'versionCount' | 'createdAt' | 'updatedAt'

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: '排序方向只能是 ASC 或 DESC' })
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * 组件详情响应 DTO（用于标准化返回数据）
 */
export class ComponentResponseDto {
  componentId!: string
  name!: string
  description?: string
  classificationLevel1!: string
  classificationLevel2!: string
  classificationLevel1Name!: string
  classificationLevel2Name!: string
  thumbnailUrl?: string
  isOfficial!: boolean
  usedCount!: number
  versionCount!: number
  publishedVersionCount!: number
  createdAt!: Date
  updatedAt!: Date
}
