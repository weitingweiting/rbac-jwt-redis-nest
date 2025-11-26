import { IsOptional } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { BaseUserDto } from '@/shared/dto/base-user.dto';

/**
 * 创建用户 DTO
 * 继承基础用户字段验证
 */
export class CreateUserDto extends BaseUserDto {
  // 如果管理员创建用户需要特殊字段，可以在这里添加
  // 例如：初始角色、部门等
}

/**
 * 更新用户 DTO
 * 使用 PartialType 让所有字段变为可选，排除密码字段
 */
export class UpdateUserDto extends PartialType(
  OmitType(BaseUserDto, ['password'] as const)
) {
  // 所有字段自动变为可选
  // 排除了密码字段，密码修改应该有单独的接口
}

@Exclude()
export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  username!: string;

  @Expose()
  email!: string;

  @Expose()
  roles!: string[];

  @Expose()
  permissions!: string[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

// 导出所有 DTO
export * from './query-user.dto';