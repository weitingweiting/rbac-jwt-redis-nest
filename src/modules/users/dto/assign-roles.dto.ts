import { IsArray, ArrayNotEmpty, IsInt } from 'class-validator'

/**
 * 为用户分配角色 DTO
 */
export class AssignRolesDto {
  @IsArray({ message: '角色ID必须是数组' })
  @ArrayNotEmpty({ message: '角色ID数组不能为空' })
  @IsInt({ each: true, message: '角色ID必须是整数' })
  roleIds!: number[]
}
