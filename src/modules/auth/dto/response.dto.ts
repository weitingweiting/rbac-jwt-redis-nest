import { Exclude, Expose, Type } from 'class-transformer'

/**
 * 用户信息 DTO（用于响应）
 * 对应 User Entity 的公开字段
 */
@Exclude()
export class UserInfoDto {
  @Expose()
  id!: number

  @Expose()
  username!: string

  @Expose()
  avatarUrl?: string

  @Expose()
  roles?: any[]

  @Expose()
  permissions?: any[]

  @Expose()
  createdAt?: Date

  @Expose()
  updatedAt?: Date
}

/**
 * 登录响应 DTO
 */
export class LoginResponseDto {
  @Expose()
  accessToken!: string

  @Expose()
  @Type(() => UserInfoDto)
  user!: UserInfoDto
}

/**
 * Token 响应 DTO
 */
export class TokenResponseDto {
  @Expose()
  accessToken!: string
}

/**
 * 通用消息响应 DTO
 */
export class MessageResponseDto {
  @Expose()
  message!: string
}
