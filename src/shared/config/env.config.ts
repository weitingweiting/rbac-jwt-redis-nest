import { registerAs } from '@nestjs/config'

/**
 * 应用配置
 */
export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logToFile: process.env.LOG_TO_FILE === 'true',
  logLevel: process.env.LOG_LEVEL || 'info'
}))

/**
 * 数据库配置
 */
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'rbac_demo'
}))

/**
 * Redis 配置
 */
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10)
}))

/**
 * JWT 配置
 */
export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
}))

/**
 * 代理服务配置
 */
export const proxyConfig = registerAs('proxy', () => ({
  // 允许的目标域名白名单（多个域名用逗号分隔）
  // 支持精确匹配：api.example.com
  // 支持通配符：*.example.com
  // 留空表示允许所有域名（仅用于开发环境）
  allowedDomains: process.env.PROXY_ALLOWED_DOMAINS || '',
  // 请求超时时间（毫秒）
  timeout: parseInt(process.env.PROXY_TIMEOUT || '30000', 10),
  // 最大重试次数
  // 注意：如果前端已配置定时刷新，建议设为 0，避免请求堆积造成雪崩
  maxRetries: parseInt(process.env.PROXY_MAX_RETRIES || '0', 10)
}))

/**
 * 阿里云 OSS 配置
 */
export const ossConfig = registerAs('oss', () => {
  // ⚠️ 重要：OSS endpoint 必须使用 https，无论是本地开发还是生产环境
  const endpoint = process.env.OSS_ENDPOINT || ''
  return {
    region: process.env.OSS_REGION || 'oss-cn-shanghai',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
    // 如果配置了 endpoint，确保使用 https 协议
    endpoint: endpoint
      ? endpoint.startsWith('http')
        ? endpoint
        : `https://${endpoint}`
      : undefined,
    internal: process.env.OSS_INTERNAL === 'true',
    timeout: parseInt(process.env.OSS_TIMEOUT || '60000', 10),
    // ⚠️ 注意：callback URL 必须是 https 且公网可访问
    // 本地开发模式（OSS_LOCAL_MODE=true）不使用回调，此值不重要
    // 生产环境必须配置为 https 公网地址，如：https://api.example.com/api/oss/callback
    callbackUrl: process.env.OSS_CALLBACK_URL || 'https://localhost:3000/api/oss/callback',
    acl: process.env.OSS_ACL || 'public-read',
    authorizationV4: process.env.OSS_AUTH_V4 === 'true',
    localMode: process.env.OSS_LOCAL_MODE === 'true'
  }
})
