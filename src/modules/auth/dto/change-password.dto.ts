import { IsString, IsNotEmpty, MinLength } from 'class-validator'
import { IsMatch, IsStrongPassword } from '../../../common/validators/custom.validator'

/**
 * 修改密码 DTO
 * 展示自定义验证器 @IsMatch 和 @IsStrongPassword 的使用
 */
export class ChangePasswordDto {
  @IsString({ message: '旧密码必须是字符串' })
  @IsNotEmpty({ message: '旧密码不能为空' })
  oldPassword!: string

  @IsString({ message: '新密码必须是字符串' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '新密码至少需要8个字符' })
  @IsStrongPassword({ message: '密码必须包含大小写字母、数字和特殊字符' })
  newPassword!: string

  @IsString({ message: '确认密码必须是字符串' })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @IsMatch('newPassword', { message: '两次输入的密码不一致' })
  confirmPassword!: string
}
