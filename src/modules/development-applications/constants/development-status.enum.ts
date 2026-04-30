/**
 * 研发申请状态枚举
 */
export enum DevelopmentStatus {
  /**
   * 待审核
   * - 研发申请创建后的初始状态
   * - 等待管理员审批"是否允许开发该组件"
   */
  PENDING_REVIEW = 'pending_review',

  /**
   * 审核通过
   * - 管理员已批准该组件的开发申请
   */
  APPROVED = 'approved',

  /**
   * 审核不通过
   * - 管理员驳回了该组件的开发申请
   */
  REJECTED = 'rejected',

  /**
   * 已完成
   * - 组件包上传成功，版本已创建为 draft 状态
   */
  COMPLETED = 'completed',

  /**
   * 已取消
   * - 申请人主动取消申请，版本号已释放
   */
  CANCELLED = 'cancelled'
}

/**
 * 研发申请状态标签映射
 */
export const DEVELOPMENT_STATUS_LABELS: Record<DevelopmentStatus, string> = {
  [DevelopmentStatus.PENDING_REVIEW]: '待审核',
  [DevelopmentStatus.APPROVED]: '审核通过',
  [DevelopmentStatus.REJECTED]: '审核不通过',
  [DevelopmentStatus.COMPLETED]: '已完成',
  [DevelopmentStatus.CANCELLED]: '已取消'
}

/**
 * 可取消的状态列表
 */
export const CANCELLABLE_STATUSES: DevelopmentStatus[] = [DevelopmentStatus.PENDING_REVIEW]

/**
 * 可编辑信息的状态列表
 */
export const EDITABLE_STATUSES: DevelopmentStatus[] = [DevelopmentStatus.PENDING_REVIEW]

/**
 * 可上传文件的状态列表
 */
export const UPLOADABLE_STATUSES: DevelopmentStatus[] = [DevelopmentStatus.APPROVED]

/**
 * 最终状态列表（不可再变更）
 */
export const FINAL_STATUSES: DevelopmentStatus[] = [
  DevelopmentStatus.COMPLETED,
  DevelopmentStatus.REJECTED,
  DevelopmentStatus.CANCELLED
]
