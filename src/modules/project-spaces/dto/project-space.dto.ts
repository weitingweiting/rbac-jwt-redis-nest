import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsInt,
  IsEnum
} from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { PaginationDto } from '@/shared/dto/pagination.dto'

/**
 * 创建项目空间 DTO
 */
export class CreateProjectSpaceDto {
  @IsString({ message: '名称必须是字符串' })
  @IsNotEmpty({ message: '名称不能为空' })
  @MaxLength(50, { message: '名称最多50个字符' })
  name!: string

  @IsString({ message: '描述必须是字符串' })
  @MaxLength(200, { message: '描述最多200个字符' })
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

// 创建枚举类型
export enum BelongType {
  OWNER = 'owner',
  MEMBER = 'member',
  ALL = 'all'
}

export class QueryProjectSpaceDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOpen?: boolean

  @IsOptional()
  @IsEnum(BelongType, {
    message: 'belong 必须是 owner、member 或 all'
  })
  belong?: BelongType
}
