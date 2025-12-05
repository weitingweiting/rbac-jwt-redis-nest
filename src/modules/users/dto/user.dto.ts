import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsUrl,
  IsInt,
  IsArray,
  ArrayNotEmpty
} from 'class-validator'
import { Exclude, Expose, Transform, Type } from 'class-transformer'
import { PartialType, OmitType } from '@nestjs/mapped-types'
import { PaginationDto } from '@/shared/dto/pagination.dto'
import { Role } from '@/shared/entities/role.entity'

/**
 * 用户基础字段 DTO
 * 定义用户的核心字段和验证规则
 */
export class BaseUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线'
  })
  username!: string

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]+$/, {
    message: '密码必须包含大写字母、小写字母和数字，且不能包含空格'
  })
  password!: string

  @IsOptional()
  @IsString({ message: '头像地址必须是字符串' })
  @IsUrl({}, { message: '头像地址必须是有效的URL' })
  avatarUrl?: string
}

/**
 * 创建用户 DTO
 * 用于管理员创建新用户
 */
export class CreateUserDto extends BaseUserDto {
  // 继承所有基础字段
}

/**
 * 更新用户 DTO
 * 排除密码字段，密码修改应使用专门的接口
 */
export class UpdateUserDto extends PartialType(OmitType(BaseUserDto, ['password'] as const)) {
  // 所有字段自动变为可选，排除密码字段
}

/**
 * 查询用户 DTO
 * 用于用户列表查询和过滤
 */
export class QueryUserDto extends PaginationDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名至少2个字符' })
  username?: string

  @IsOptional()
  @IsString({ message: '角色必须是字符串' })
  role?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '项目空间ID必须是数字' })
  projectSpaceId?: number
}

/**
 * 分配角色 DTO
 * 用于为用户分配角色
 */
export class AssignRolesDto {
  @IsArray({ message: '角色ID必须是数组' })
  @ArrayNotEmpty({ message: '角色ID数组不能为空' })
  @IsInt({ each: true, message: '角色ID必须是整数' })
  roleIds: number[]
}

/**
 * 用户响应 DTO
 * 用于返回给客户端的用户信息，自动排除敏感字段（如密码）
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  id: number

  @Expose()
  username: string

  @Expose()
  avatarUrl: string

  @Expose()
  @Transform(({ obj }) => obj.roles || [], { toClassOnly: true })
  roles: Role[]

  // @Expose()
  // createdAt: Date

  // @Expose()
  // updatedAt: Date

  // @Expose()
  // deletedAt: Date | null
}

export class UserSimpleResponseDto extends OmitType(UserResponseDto, ['roles'] as const) {}

/**
 * 修改密码 DTO
 */
export class ChangePasswordDto {
  @IsString({ message: '原密码必须是字符串' })
  @IsNotEmpty({ message: '原密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  oldPassword!: string

  @IsString({ message: '新密码必须是字符串' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]+$/, {
    message: '新密码必须包含大写字母、小写字母和数字，且不能包含空格'
  })
  newPassword!: string
}

/**
 * 管理员重置密码 DTO
 */
export class ResetPasswordDto {
  @IsString({ message: '新密码必须是字符串' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]+$/, {
    message: '新密码必须包含大写字母、小写字母和数字，且不能包含空格'
  })
  newPassword!: string
}
