import { DevelopmentStatus } from '../constants/development-status.enum'
import { ApplicationType } from '../constants/application-type.enum'
import { IUploadInfo, IReviewInfo } from '@/shared/entities/development-application.entity'

/**
 * 申请人信息
 */
export interface IApplicantInfo {
  id: number
  username: string
}

/**
 * 审核人信息
 */
export interface IReviewerInfo {
  id: number
  username: string
}

/**
 * 研发申请响应 DTO
 */
export class DevelopmentApplicationResponseDto {
  id: number

  applicationNo: string

  applicationType: ApplicationType

  applicationTypeLabel: string

  componentId: string

  name: string | null

  description: string | null

  classificationLevel1: string | null

  classificationLevel2: string | null

  classificationLevel1Name: string | null

  classificationLevel2Name: string | null

  targetVersion: string

  changelog: string | null

  developmentStatus: DevelopmentStatus

  developmentStatusLabel: string

  uploadInfo: IUploadInfo | null

  reviewInfo: IReviewInfo | null

  componentVersionId: number | null

  existingVersionId: number | null

  applicant: IApplicantInfo

  reviewer: IReviewerInfo | null

  submittedAt: Date | null

  reviewedAt: Date | null

  completedAt: Date | null

  createdAt: Date

  updatedAt: Date
}

/**
 * 创建申请成功响应
 */
export class CreateApplicationResponseDto {
  id: number
  applicationNo: string
  developmentStatus: DevelopmentStatus
  createdAt: Date
}

/**
 * 审核成功响应
 */
export class ReviewSuccessResponseDto {
  developmentStatus: DevelopmentStatus
  componentVersionId: number | null
  reviewInfo: IReviewInfo
}

/**
 * 取消申请响应
 */
export class CancelApplicationResponseDto {
  developmentStatus: DevelopmentStatus
  cancelledAt: Date
}
