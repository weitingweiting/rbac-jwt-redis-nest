import { ConfigService } from '@nestjs/config'
import OSS from 'ali-oss'

/**
 * 创建 OSS 客户端实例
 */
export const createOSSClient = (configService: ConfigService): OSS => {
  const config = {
    region: configService.get<string>('oss.region')!,
    accessKeyId: configService.get<string>('oss.accessKeyId')!,
    accessKeySecret: configService.get<string>('oss.accessKeySecret')!,
    bucket: configService.get<string>('oss.bucket')!,
    timeout: configService.get<number>('oss.timeout'),
    internal: configService.get<boolean>('oss.internal'),
    // 启用 V4 签名算法（更安全）
    authorizationV4: configService.get<boolean>('oss.authorizationV4')
  }

  // 如果配置了自定义 endpoint，使用自定义的
  const endpoint = configService.get<string>('oss.endpoint')
  if (endpoint) {
    return new OSS({ ...config, endpoint })
  }

  return new OSS(config)
}

/**
 * OSS 文件类型枚举
 */
export enum OSSFileType {
  IMAGE = 'images',
  VIDEO = 'videos',
  ASSET = 'assets',
  DOCUMENT = 'documents',
  OTHER = 'other'
}

/**
 * 根据文件 MIME 类型获取存储目录
 */
export function getOSSDirectory(mimeType: string): OSSFileType {
  if (mimeType.startsWith('image/')) {
    return OSSFileType.IMAGE
  }
  if (mimeType.startsWith('video/')) {
    return OSSFileType.VIDEO
  }
  if (
    mimeType.startsWith('application/json') ||
    mimeType.startsWith('application/javascript') ||
    mimeType.startsWith('text/javascript')
  ) {
    return OSSFileType.ASSET
  }
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.startsWith('application/msword') ||
    mimeType.startsWith('application/vnd.')
  ) {
    return OSSFileType.DOCUMENT
  }
  return OSSFileType.OTHER
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const ext = originalName.substring(originalName.lastIndexOf('.'))
  return `${timestamp}_${randomStr}${ext}`
}

/**
 * OSS 上传配置常量
 */
export const OSS_CONFIG = {
  // 最大文件大小 (20MB)
  MAX_FILE_SIZE: 20 * 1024 * 1024,
  // 签名过期时间 (30分钟)
  SIGNATURE_EXPIRES: 30 * 60,
  // 允许的图片类型
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  // 允许的视频类型
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  // 允许的资源类型
  ALLOWED_ASSET_TYPES: ['application/json', 'application/javascript', 'text/javascript']
}
