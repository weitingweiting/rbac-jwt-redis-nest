import { PickType } from '@nestjs/mapped-types'
import { BaseUserDto } from '../../users/dto/user.dto'

/**
 * 用户登录 DTO
 * 只需要用户名和密码
 */
export class LoginDto extends PickType(BaseUserDto, ['username', 'password'] as const) {
  // 仅包含用户名和密码字段
}
