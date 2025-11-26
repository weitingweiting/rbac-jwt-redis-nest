import { BaseUserDto } from '@/shared/dto/base-user.dto';
import { PickType } from '@nestjs/mapped-types';

export class LoginDto extends PickType(BaseUserDto, ['username', 'password'] as const) {

}
