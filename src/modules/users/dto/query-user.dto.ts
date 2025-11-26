import { IsString, IsOptional, MinLength, MaxLength, IsEmail } from 'class-validator'
import { IsPhoneNumber } from '../../../common/validators/custom.validator'

/**
 * 查询用户 DTO
 * 展示可选字段验证和分页继承
 */
export class QueryUserDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少3个字符' })
  username?: string

  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string

  @IsOptional()
  @IsString({ message: '角色必须是字符串' })
  role?: string
}

/**
 * 更新用户资料 DTO
 * 展示自定义手机号验证器的使用
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  nickname?: string

  @IsOptional()
  @IsPhoneNumber({ message: '请输入有效的中国手机号' })
  phone?: string

  @IsOptional()
  @IsString({ message: '地址必须是字符串' })
  @MaxLength(200, { message: '地址最多200个字符' })
  address?: string
}
