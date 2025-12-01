import { IsOptional, IsEnum, IsUrl, IsInt, MaxLength, IsObject, Min } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'

/**
 * 创建项目资源 DTO
 */
export class CreateProjectAssetDto {
  @IsInt({ message: '项目ID必须是整数' })
  projectId!: number

  @IsUrl({}, { message: '资源地址必须是有效的URL' })
  @MaxLength(500, { message: '资源地址最多500个字符' })
  url!: string

  @IsEnum(['image', 'json', 'js', 'other'], {
    message: '资源类型只能是image、json、js或other'
  })
  type!: 'image' | 'json' | 'js' | 'other'

  @IsOptional()
  @IsInt({ message: '资源大小必须是整数' })
  @Min(0, { message: '资源大小不能为负数' })
  size?: number

  @IsOptional()
  @IsObject({ message: '元数据必须是对象' })
  meta?: Record<string, any>
}

/**
 * 更新项目资源 DTO
 */
export class UpdateProjectAssetDto extends PartialType(CreateProjectAssetDto) {}

/**
 * 查询项目资源 DTO
 */
export class QueryProjectAssetDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  projectId?: number

  @IsOptional()
  @IsEnum(['image', 'json', 'js', 'other'])
  type?: 'image' | 'json' | 'js' | 'other'
}
