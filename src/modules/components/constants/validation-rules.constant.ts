/**
 * 组件管理模块验证规则常量
 *
 * 注意：
 * - 分页相关规则请使用 @/shared/dto/pagination.dto.ts 中的 PaginationDto
 * - 通用文件上传规则请参考 @/shared/config/oss.config.ts 中的 OSS_CONFIG
 * - 具体验证规则已在 DTO 中通过 class-validator 装饰器实现
 */

/**
 * 文件上传限制（组件专用）
 * 注意：通用文件上传限制请参考 @/shared/config/oss.config.ts 中的 OSS_CONFIG
 */
export const COMPONENT_FILE_UPLOAD_RULES = {
  // zip 文件最大 50MB（组件包）
  MAX_ZIP_SIZE: 50 * 1024 * 1024,
  MAX_ZIP_SIZE_MB: 50,

  // 单个资源文件最大 10MB
  MAX_ASSET_SIZE: 10 * 1024 * 1024,
  MAX_ASSET_SIZE_MB: 10,

  // 缩略图最大 2MB
  MAX_THUMBNAIL_SIZE: 2 * 1024 * 1024,
  MAX_THUMBNAIL_SIZE_MB: 2,

  // 最大文件数量限制
  MAX_FILE_COUNT: 200
} as const
