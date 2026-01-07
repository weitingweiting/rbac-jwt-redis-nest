import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator'

/**
 * 更新研发申请 DTO
 *
 * 适用状态：pending_info、awaiting_upload
 *
 * 可编辑字段规则：
 * - name: 仅新组件可修改
 * - description: 所有类型可修改
 * - classificationLevel1/Level2: 仅新组件可修改
 * - changelog: 所有类型可修改
 *
 * 注意：字段的可编辑性由 Service 层根据 applicationType 控制
 */
export class UpdateDevelopmentApplicationDto {
  @IsOptional()
  @IsString({ message: '组件名称必须是字符串' })
  @MaxLength(100, { message: '组件名称最多100个字符' })
  @MinLength(2, { message: '组件名称至少2个字符' })
  name?: string

  @IsOptional()
  @IsString({ message: '组件描述必须是字符串' })
  @MaxLength(500, { message: '组件描述最多500个字符' })
  description?: string

  @IsOptional()
  @IsString({ message: '一级分类必须是字符串' })
  @MaxLength(50, { message: '一级分类最多50个字符' })
  classificationLevel1?: string

  @IsOptional()
  @IsString({ message: '二级分类必须是字符串' })
  @MaxLength(50, { message: '二级分类最多50个字符' })
  classificationLevel2?: string

  @IsOptional()
  @IsString({ message: '版本更新日志必须是字符串' })
  @MaxLength(2000, { message: '版本更新日志最多2000个字符' })
  changelog?: string
}
