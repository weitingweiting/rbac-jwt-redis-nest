import { PickType } from '@nestjs/mapped-types'
import { BaseUserDto } from '../../users/dto/user.dto'

/**
 * 用户注册 DTO
 * 使用完整的用户验证规则
 */
export class RegisterDto extends PickType(BaseUserDto, ['username', 'password'] as const) {
  // 如果注册需要额外字段，验证码、邀请码等
}
