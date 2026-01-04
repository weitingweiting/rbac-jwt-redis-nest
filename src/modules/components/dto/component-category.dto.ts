import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, MaxLength, Min } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { PaginationDto } from '@/shared/dto/pagination.dto'

/**
 * 创建组件分类 DTO
 */
export class CreateComponentCategoryDto {
  @IsString({ message: '分类编码必须是字符串' })
  @IsNotEmpty({ message: '分类编码不能为空' })
  @MaxLength(50, { message: '分类编码最多50个字符' })
  code!: string

  @IsString({ message: '分类名称必须是字符串' })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @MaxLength(100, { message: '分类名称最多100个字符' })
  name!: string

  @IsInt({ message: '分类层级必须是整数' })
  @Min(1, { message: '分类层级必须是1或2' })
  level!: number

  @IsOptional()
  @IsInt({ message: '父分类ID必须是整数' })
  parentId?: number

  @IsOptional()
  @IsString({ message: '分类描述必须是字符串' })
  description?: string

  @IsOptional()
  @IsString({ message: '图标URL必须是字符串' })
  @MaxLength(255, { message: '图标URL最多255个字符' })
  icon?: string

  @IsOptional()
  @IsInt({ message: '排序序号必须是整数' })
  @Min(0, { message: '排序序号不能为负数' })
  sortOrder?: number

  @IsOptional()
  @IsBoolean({ message: '是否启用必须是布尔值' })
  isActive?: boolean
}

/**
 * 更新组件分类 DTO
 */
export class UpdateComponentCategoryDto extends PartialType(CreateComponentCategoryDto) {}

/**
 * 查询组件分类 DTO
 */
export class QueryComponentCategoryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  level?: number

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  parentId?: number

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean
}
