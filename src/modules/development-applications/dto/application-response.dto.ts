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
  /** 申请ID */
  id: number

  /** 申请单号 */
  applicationNo: string

  /** 申请类型 */
  applicationType: ApplicationType

  /** 申请类型标签 */
  applicationTypeLabel: string

  /** 组件ID */
  componentId: string

  /** 组件名称 */
  name: string | null

  /** 组件描述 */
  description: string | null

  /** 一级分类标识 */
  classificationLevel1: string | null

  /** 二级分类标识 */
  classificationLevel2: string | null

  /** 一级分类显示名称 */
  classificationLevel1Name: string | null

  /** 二级分类显示名称 */
  classificationLevel2Name: string | null

  /** 目标版本号 */
  targetVersion: string

  /** 版本更新日志 */
  changelog: string | null

  /** 研发申请状态 */
  developmentStatus: DevelopmentStatus

  /** 状态标签 */
  developmentStatusLabel: string

  /** 上传文件信息 */
  uploadInfo: IUploadInfo | null

  /** 审核信息 */
  reviewInfo: IReviewInfo | null

  /** 关联的组件版本ID */
  componentVersionId: number | null

  /** 关联的现有版本ID（替换场景） */
  existingVersionId: number | null

  /** 申请人信息 */
  applicant: IApplicantInfo

  /** 审核人信息 */
  reviewer: IReviewerInfo | null

  /** 提交审核时间 */
  submittedAt: Date | null

  /** 审核完成时间 */
  reviewedAt: Date | null

  /** 完成时间 */
  completedAt: Date | null

  /** 创建时间 */
  createdAt: Date

  /** 更新时间 */
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
 * 上传成功响应
 */
export class UploadSuccessResponseDto {
  applicationNo: string
  developmentStatus: DevelopmentStatus
  uploadInfo: IUploadInfo
  validationResult: {
    supplementMatch: boolean
    metaValid: boolean
    filesComplete: boolean
  }
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
