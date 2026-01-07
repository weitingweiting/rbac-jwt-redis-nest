import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator'

/**
 * 审核动作枚举
 */
export enum ReviewAction {
  APPROVE = 'approve',
  REJECT = 'reject'
}

/**
 * 审核申请 DTO
 *
 * 适用状态：under_review
 */
export class ReviewApplicationDto {
  @IsEnum(ReviewAction, { message: '审核动作必须是 approve 或 reject' })
  @IsNotEmpty({ message: '审核动作不能为空' })
  reviewAction: ReviewAction

  @IsOptional()
  @IsString({ message: '审核意见必须是字符串' })
  @MaxLength(1000, { message: '审核意见最多1000个字符' })
  reviewComment?: string
}
