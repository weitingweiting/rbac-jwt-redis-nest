import * as Joi from 'joi'

/**
 * 环境变量验证 Schema
 * 使用 Joi 进行严格的环境变量验证
 */
export const validationSchema = Joi.object({
  // 应用环境
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // 日志配置
  LOG_TO_FILE: Joi.string().valid('true', 'false').default('false'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'http', 'debug').default('info'),

  // 数据库配置
  DATABASE_HOST: Joi.string().default('localhost'),
  DATABASE_PORT: Joi.number().default(3306),
  DATABASE_USER: Joi.string().default('root'),
  DATABASE_PASSWORD: Joi.string().default('password'),
  DATABASE_NAME: Joi.string().default('rbac_demo'),

  // Redis 配置
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  // JWT 配置
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET 必须至少 32 个字符',
    'any.required': 'JWT_SECRET 是必需的环境变量'
  }),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d')
})
