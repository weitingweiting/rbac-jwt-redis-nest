/**
 * 研发申请状态枚举
 *
 * 新流程设计：
 * 1. 创建申请 → PENDING_REVIEW（待审核，管理员审批"是否允许开发"）
 * 2. 管理员审核 → APPROVED（通过，可下载supplement.json） / REJECTED（拒绝，终态）
 * 3. 开发者开发组件，构建后上传组件包
 * 4. 上传成功+校验通过 → COMPLETED（组件入库draft，终态）
 * 5. 上传校验失败 → 保持 APPROVED（用户可重新上传）
 *
 * 状态流转图：
 * PENDING_REVIEW → APPROVED → COMPLETED
 *                ↘ REJECTED（终态）
 *                ↘ CANCELLED（终态）
 */
export enum DevelopmentStatus {
  /**
   * 待审核
   * - 研发申请创建后的初始状态
   * - 等待管理员审批"是否允许开发该组件"
   * - 可执行：审核通过/驳回、取消申请、编辑信息
   */
  PENDING_REVIEW = 'pending_review',

  /**
   * 审核通过
   * - 管理员已批准该组件的开发申请
   * - 可执行：下载 supplement.json、上传组件包
   * - 上传成功后自动变为 COMPLETED
   */
  APPROVED = 'approved',

  /**
   * 审核不通过
   * - 管理员驳回了该组件的开发申请
   * - 最终状态，不可变更
   */
  REJECTED = 'rejected',

  /**
   * 已完成
   * - 组件包上传成功，版本已创建为 draft 状态
   * - 最终状态，不可变更
   */
  COMPLETED = 'completed',

  /**
   * 已取消
   * - 申请人主动取消申请，版本号已释放
   * - 最终状态，不可变更
   */
  CANCELLED = 'cancelled'
}

/**
 * 研发申请状态标签映射（用于前端展示）
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
 * 只有待审核状态可以取消
 */
export const CANCELLABLE_STATUSES: DevelopmentStatus[] = [DevelopmentStatus.PENDING_REVIEW]

/**
 * 可编辑信息的状态列表
 * 待审核状态可以编辑申请信息
 */
export const EDITABLE_STATUSES: DevelopmentStatus[] = [DevelopmentStatus.PENDING_REVIEW]

/**
 * 可上传文件的状态列表
 * 审核通过后才可以上传组件包
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
