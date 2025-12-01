import { PartialType, PickType, OmitType } from '@nestjs/mapped-types'
import { BaseUserDto } from './base-user.dto'

/**
 * 更新用户 DTO - 使用 PartialType 让所有字段变为可选
 * 排除密码字段，因为密码修改应该有单独的接口
 */
export class UpdateUserPartialDto extends PartialType(
  OmitType(BaseUserDto, ['password'] as const)
) {}

/**
 * 用户信息 DTO - 只包含用户名
 */
export class UserInfoOnlyDto extends PickType(BaseUserDto, ['username'] as const) {}

/**
 * 修改密码 DTO - 单独的密码修改接口
 */
export class ChangePasswordDto extends PickType(BaseUserDto, ['password'] as const) {
  // 可以添加确认密码字段
  // confirmPassword: string;
}
