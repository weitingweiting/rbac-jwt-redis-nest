import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength, IsInt } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { PaginationDto } from '@/shared/dto/pagination.dto'

/**
 * 创建项目空间 DTO
 */
export class CreateProjectSpaceDto {
  @IsString({ message: '空间名称必须是字符串' })
  @IsNotEmpty({ message: '空间名称不能为空' })
  @MaxLength(100, { message: '空间名称最多100个字符' })
  name!: string

  @IsString({ message: '空间描述必须是字符串' })
  @MaxLength(500, { message: '空间描述最多500个字符' })
  description!: string

  @IsOptional()
  @IsBoolean({ message: 'isOpen必须是布尔值' })
  @Type(() => Boolean)
  isOpen?: boolean
}

/**
 * 更新项目空间 DTO
 */
export class UpdateProjectSpaceDto extends PartialType(CreateProjectSpaceDto) {}

/**
 * 添加用户到空间 DTO
 */
export class AddUsersToSpaceDto {
  @IsInt({ each: true, message: '用户ID必须是整数' })
  userIds!: number[]
}

/**
 * 查询项目空间 DTO
 */
export class QueryProjectSpaceDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOpen?: boolean
}
