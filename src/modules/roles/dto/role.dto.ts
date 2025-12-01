import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, MaxLength } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'

/**
 * 创建角色 DTO
 */
export class CreateRoleDto {
  @IsString({ message: '角色名称必须是字符串' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MaxLength(50, { message: '角色名称最多50个字符' })
  name!: string

  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  @MaxLength(200, { message: '角色描述最多200个字符' })
  description?: string

  @IsOptional()
  @IsArray({ message: '权限ID必须是数组' })
  @IsInt({ each: true, message: '权限ID必须是整数' })
  permissionIds?: number[]
}

/**
 * 更新角色 DTO
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

/**
 * 分配权限给角色 DTO
 */
export class AssignPermissionsDto {
  @IsArray({ message: '权限ID必须是数组' })
  @IsInt({ each: true, message: '权限ID必须是整数' })
  permissionIds!: number[]
}

/**
 * 查询角色 DTO
 */
export class QueryRoleDto {
  @IsOptional()
  @IsString()
  name?: string
}
