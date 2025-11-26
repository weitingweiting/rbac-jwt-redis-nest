import { IsNotEmpty } from 'class-validator'

/**
 * 刷新 Token DTO
 */
export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Token 不能为空' })
  token?: string // 可选，如果从 header 获取则不需要
}
