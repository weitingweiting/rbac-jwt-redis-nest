/**
 * 研发申请状态枚举
 *
 * 状态流转：
 * pending_info → awaiting_upload → uploaded → under_review → approved → completed
 *                                                         ↘ rejected → awaiting_upload
 * pending_info/awaiting_upload → cancelled (版本号释放)
 */
export enum DevelopmentStatus {
  /**
   * 待完善信息
   * - 研发申请刚创建的初始状态
   * - 可执行：编辑信息、取消申请
   */
  PENDING_INFO = 'pending_info',

  /**
   * 等待上传
   * - 信息已完善，等待上传组件包
   * - 可执行：上传文件、编辑信息、取消申请
   */
  AWAITING_UPLOAD = 'awaiting_upload',

  /**
   * 已上传待审核
   * - 组件包已上传，等待提交审核
   * - 可执行：删除上传文件（回到等待上传）、提交审核
   */
  UPLOADED = 'uploaded',

  /**
   * 审核中
   * - 已提交审核，审核人员处理中
   * - 可执行：审核通过、审核不通过
   */
  UNDER_REVIEW = 'under_review',

  /**
   * 审核不通过
   * - 审核未通过，需重新上传
   * - 可执行：上传新文件、查看审核意见
   * - 自动回退到 awaiting_upload
   */
  REJECTED = 'rejected',

  /**
   * 审核通过
   * - 审核通过，版本已创建为 draft 状态
   * - 可执行：发布版本
   */
  APPROVED = 'approved',

  /**
   * 已完成
   * - 版本已发布为 published
   * - 最终状态，不可变更
   */
  COMPLETED = 'completed',

  /**
   * 已取消
   * - 申请已取消，版本号已释放
   * - 最终状态，不可变更
   */
  CANCELLED = 'cancelled'
}

/**
 * 研发申请状态标签映射（用于前端展示）
 */
export const DEVELOPMENT_STATUS_LABELS: Record<DevelopmentStatus, string> = {
  [DevelopmentStatus.PENDING_INFO]: '待完善信息',
  [DevelopmentStatus.AWAITING_UPLOAD]: '等待上传',
  [DevelopmentStatus.UPLOADED]: '已上传',
  [DevelopmentStatus.UNDER_REVIEW]: '审核中',
  [DevelopmentStatus.REJECTED]: '审核不通过',
  [DevelopmentStatus.APPROVED]: '审核通过',
  [DevelopmentStatus.COMPLETED]: '已完成',
  [DevelopmentStatus.CANCELLED]: '已取消'
}

/**
 * 可取消的状态列表
 */
export const CANCELLABLE_STATUSES: DevelopmentStatus[] = [
  DevelopmentStatus.PENDING_INFO,
  DevelopmentStatus.AWAITING_UPLOAD
]

/**
 * 可编辑信息的状态列表
 */
export const EDITABLE_STATUSES: DevelopmentStatus[] = [
  DevelopmentStatus.PENDING_INFO,
  DevelopmentStatus.AWAITING_UPLOAD
]

/**
 * 可上传文件的状态列表
 */
export const UPLOADABLE_STATUSES: DevelopmentStatus[] = [
  DevelopmentStatus.AWAITING_UPLOAD,
  DevelopmentStatus.REJECTED
]

/**
 * 最终状态列表（不可再变更）
 */
export const FINAL_STATUSES: DevelopmentStatus[] = [
  DevelopmentStatus.COMPLETED,
  DevelopmentStatus.CANCELLED
]
