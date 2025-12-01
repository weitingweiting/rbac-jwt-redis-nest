import { BaseUserDto } from '@/shared/dto/base-user.dto'
import { PickType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsString } from 'class-validator'

export class LoginDto extends PickType(BaseUserDto, ['username', 'password'] as const) {
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string
}
