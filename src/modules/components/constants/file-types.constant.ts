/**
 * 组件管理模块文件类型常量
 *
 * 注意：
 * - 通用文件类型和 OSS 配置： @/shared/config/oss.config.ts
 * - 通用 MIME 类型定义： OSS_CONFIG.ALLOWED_IMAGE_TYPES
 */

import { OSS_CONFIG } from '@/shared/config/oss.config'

export const ALLOWED_ZIP_MIME_TYPES = [
  'application/zip',
  'application/x-zip',
  'application/x-zip-compressed',
  'application/octet-stream'
] as const

export const ALLOWED_IMAGE_MIME_TYPES = OSS_CONFIG.ALLOWED_IMAGE_TYPES

/**
 * 允许的资源文件扩展名（从 zip 中提取）
 */
export const ALLOWED_ASSET_EXTENSIONS = [
  // JavaScript
  '.js',
  '.mjs',
  '.cjs',

  // CSS
  '.css',

  // 图片
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.ico',

  // 字体
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',

  // JSON/配置文件
  '.json',
  '.map',

  // 其他资源
  '.txt',
  '.md'
] as const

export const META_JSON_FILENAME = 'component.meta.json' as const

export const ENTRY_FILE_PATTERNS = [
  /^index\.js$/,
  /^main\.js$/,
  /^[a-zA-Z0-9_-]+\.umd\.js$/
] as const

export enum AssetType {
  JAVASCRIPT = 'javascript',
  CSS = 'css',
  IMAGE = 'image',
  FONT = 'font',
  JSON = 'json',
  OTHER = 'other'
}

export const EXTENSION_TO_TYPE_MAP: Record<string, AssetType> = {
  '.js': AssetType.JAVASCRIPT,
  '.mjs': AssetType.JAVASCRIPT,
  '.cjs': AssetType.JAVASCRIPT,

  '.css': AssetType.CSS,

  '.jpg': AssetType.IMAGE,
  '.jpeg': AssetType.IMAGE,
  '.png': AssetType.IMAGE,
  '.gif': AssetType.IMAGE,
  '.webp': AssetType.IMAGE,
  '.svg': AssetType.IMAGE,
  '.ico': AssetType.IMAGE,

  '.woff': AssetType.FONT,
  '.woff2': AssetType.FONT,
  '.ttf': AssetType.FONT,
  '.eot': AssetType.FONT,
  '.otf': AssetType.FONT,

  '.json': AssetType.JSON,
  '.map': AssetType.JSON
}

export function getAssetType(filename: string): AssetType {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!ext) return AssetType.OTHER
  return EXTENSION_TO_TYPE_MAP[ext] || AssetType.OTHER
}
