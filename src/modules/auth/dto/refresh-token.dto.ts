import { IsNotEmpty } from 'class-validator'

/**
 * 刷新 Token DTO
 */
export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Token 不能为空' })
  token?: string
}
