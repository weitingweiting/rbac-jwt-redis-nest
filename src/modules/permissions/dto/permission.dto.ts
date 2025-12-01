import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'

/**
 * 创建权限 DTO
 */
export class CreatePermissionDto {
  @IsString({ message: '权限代码必须是字符串' })
  @IsNotEmpty({ message: '权限代码不能为空' })
  @MaxLength(100, { message: '权限代码最多100个字符' })
  @Matches(/^[a-z0-9._-]+$/, {
    message: '权限代码只能包含小写字母、数字、点号、下划线和横杠（如：project.create）'
  })
  code!: string

  @IsString({ message: '权限名称必须是字符串' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  @MaxLength(50, { message: '权限名称最多50个字符' })
  name!: string

  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  @MaxLength(200, { message: '权限描述最多200个字符' })
  description?: string
}

/**
 * 更新权限 DTO
 */
export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}

/**
 * 查询权限 DTO
 */
export class QueryPermissionDto {
  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  name?: string
}
