/**
 * 研发申请类型枚举
 */
export enum ApplicationType {
  /**
   * 新组件创建
   * - 首次创建组件
   * - 需填写 componentId、name、选择分类
   * - 默认版本 1.0.0
   */
  NEW = 'new',

  /**
   * 版本迭代
   * - 为已有组件添加新版本
   * - 选择已有组件，填写新版本号（不能冲突）
   */
  VERSION = 'version',

  /**
   * 替换版本
   * - 替换已有的 draft 版本
   * - 选择已有组件和 draft 版本，使用相同版本号
   */
  REPLACE = 'replace'
}

/**
 * 申请类型标签映射（用于前端展示）
 */
export const APPLICATION_TYPE_LABELS: Record<ApplicationType, string> = {
  [ApplicationType.NEW]: '新组件创建',
  [ApplicationType.VERSION]: '版本迭代',
  [ApplicationType.REPLACE]: '替换版本'
}

/**
 * 申请类型描述（用于前端提示）
 */
export const APPLICATION_TYPE_DESCRIPTIONS: Record<ApplicationType, string> = {
  [ApplicationType.NEW]: '创建全新的组件，默认版本 1.0.0',
  [ApplicationType.VERSION]: '为已有组件添加新版本',
  [ApplicationType.REPLACE]: '替换已有的 draft 状态版本'
}
