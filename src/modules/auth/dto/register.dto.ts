import { BaseUserDto } from '@/shared/dto/base-user.dto';

/**
 * 用户注册 DTO
 * 继承基础用户字段验证
 */
export class RegisterDto extends BaseUserDto {
  // 如果注册需要特殊字段，可以在这里添加
  // 例如：验证码、邀请码等
}
