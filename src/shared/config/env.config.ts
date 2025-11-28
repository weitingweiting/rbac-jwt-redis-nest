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
