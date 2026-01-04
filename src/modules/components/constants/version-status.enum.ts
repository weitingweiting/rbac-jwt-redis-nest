/**
 * 组件版本状态枚举（简化版）
 *
 * 状态流转：draft → published → 软删除
 */
export enum VersionStatus {
  /**
   * 草稿状态
   * - 版本刚上传时的初始状态
   * - 不在前端版本列表中展示
   * - 仅管理员可见
   */
  DRAFT = 'draft',

  /**
   * 已发布状态
   * - 审核通过后的状态
   * - 在前端版本列表中展示
   * - 所有用户可见和使用
   */
  PUBLISHED = 'published'
}

/**
 * 版本状态标签映射（用于前端展示）
 */
export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  [VersionStatus.DRAFT]: '草稿',
  [VersionStatus.PUBLISHED]: '已发布'
}

/**
 * 版本状态说明
 */
export const VERSION_STATUS_DESCRIPTIONS: Record<VersionStatus, string> = {
  [VersionStatus.DRAFT]: '待审核，前端不可见',
  [VersionStatus.PUBLISHED]: '已发布，前端可查询和使用'
}
