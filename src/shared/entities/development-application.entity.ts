import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '@/shared/entities/base.entity'
import { User } from '@/shared/entities/user.entity'
import {
  DevelopmentStatus,
  ApplicationType
} from '@/modules/development-applications/constants/index'

/**
 * 上传文件信息接口
 */
export interface IUploadInfo {
  /** 文件名 */
  fileName?: string
  /** 文件大小（字节） */
  fileSize?: number
  /** 上传时间 */
  uploadTime?: Date
  /** 临时存储路径 */
  tempPath?: string
  /** 文件校验和 */
  checksum?: string
}

/**
 * 审核信息接口
 */
export interface IReviewInfo {
  /** 审核人ID */
  reviewerId?: number
  /** 审核人用户名 */
  reviewerName?: string
  /** 审核时间 */
  reviewTime?: Date
  /** 审核动作 */
  reviewAction?: 'approve' | 'reject'
  /** 审核意见 */
  reviewComment?: string
}

/**
 * 组件研发申请实体
 *
 * 用于管理组件研发的完整生命周期：
 * - 新组件创建
 * - 版本迭代
 * - 版本替换
 */
@Entity('development_applications')
@Index(['applicationNo'], { unique: true })
@Index(['componentId'])
@Index(['developmentStatus'])
@Index(['applicantId'])
@Index(['reviewerId'])
@Index(['componentId', 'targetVersion'])
@Index(['existingVersionId'])
export class DevelopmentApplication extends BaseEntity {
  /**
   * 申请单号（唯一）
   * 格式：APP-YYYYMMDD-XXXX
   * 如：APP-20260107-0001
   */
  @Column({ type: 'varchar', length: 50, unique: true, name: 'application_no' })
  applicationNo: string

  /**
   * 申请类型
   * - new: 新组件创建
   * - version: 版本迭代
   * - replace: 替换版本
   */
  @Column({ type: 'varchar', length: 20, name: 'application_type' })
  applicationType: ApplicationType

  /**
   * 组件ID
   * 新组件时由用户填写，已有组件时由用户选择
   */
  @Column({ type: 'varchar', length: 100, name: 'component_id' })
  componentId: string

  /**
   * 组件名称
   * 新组件时必填，版本迭代/替换时从已有组件继承
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null

  /**
   * 组件描述
   */
  @Column({ type: 'text', nullable: true })
  description: string | null

  /**
   * 一级分类标识
   * 如：chart, table, form
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'classification_level1' })
  classificationLevel1: string | null

  /**
   * 二级分类标识
   * 如：bar, line, pie
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'classification_level2' })
  classificationLevel2: string | null

  /**
   * 一级分类显示名称
   * 用于导出 supplement 文件
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'classification_level1_name' })
  classificationLevel1Name: string | null

  /**
   * 二级分类显示名称
   * 用于导出 supplement 文件
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'classification_level2_name' })
  classificationLevel2Name: string | null

  /**
   * 目标版本号
   * 遵循 Semver 规范，如：1.0.0, 2.1.0
   */
  @Column({ type: 'varchar', length: 50, name: 'target_version' })
  targetVersion: string

  /**
   * 版本更新日志
   */
  @Column({ type: 'text', nullable: true })
  changelog: string | null

  /**
   * 研发申请状态
   * 新流程：pending_review → approved → completed
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: DevelopmentStatus.PENDING_REVIEW,
    name: 'development_status'
  })
  developmentStatus: DevelopmentStatus

  /**
   * 上传文件信息（JSON）
   * 包含：文件名、大小、上传时间、临时路径、校验和
   */
  @Column({ type: 'json', nullable: true, name: 'upload_info' })
  uploadInfo: IUploadInfo | null

  /**
   * 审核信息（JSON）
   * 包含：审核人、审核时间、审核动作、审核意见
   */
  @Column({ type: 'json', nullable: true, name: 'review_info' })
  reviewInfo: IReviewInfo | null

  /**
   * 关联的组件版本ID
   * 审核通过后创建的 ComponentVersion 的 ID
   */
  @Column({ type: 'int', nullable: true, name: 'component_version_id' })
  componentVersionId: number | null

  /**
   * 关联的现有版本ID
   * 仅替换版本场景使用，指向要被替换的 draft 版本
   */
  @Column({ type: 'int', nullable: true, name: 'existing_version_id' })
  existingVersionId: number | null

  /**
   * 申请人ID
   */
  @Column({ type: 'int', name: 'applicant_id' })
  applicantId: number

  /**
   * 申请人关系
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicant_id' })
  applicant: User

  /**
   * 审核人ID
   */
  @Column({ type: 'int', nullable: true, name: 'reviewer_id' })
  reviewerId: number | null

  /**
   * 审核人关系
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User | null

  /**
   * 提交审核时间
   */
  @Column({ type: 'timestamp', nullable: true, name: 'submitted_at' })
  submittedAt: Date | null

  /**
   * 审核完成时间
   */
  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewedAt: Date | null

  /**
   * 完成时间（版本发布后）
   */
  @Column({ type: 'timestamp', nullable: true, name: 'completed_at' })
  completedAt: Date | null
}
