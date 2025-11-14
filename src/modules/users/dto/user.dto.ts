export class CreateUserDto {
  username: string;
  email: string;
  password: string;
}

export class UpdateUserDto {
  username?: string;
  email?: string;
}

export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}