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
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // 阿里云 OSS 配置
  OSS_REGION: Joi.string().default('oss-cn-shanghai'),
  OSS_ACCESS_KEY_ID: Joi.string().required().messages({
    'any.required': 'OSS_ACCESS_KEY_ID 是必需的环境变量'
  }),
  OSS_ACCESS_KEY_SECRET: Joi.string().required().messages({
    'any.required': 'OSS_ACCESS_KEY_SECRET 是必需的环境变量'
  }),
  OSS_BUCKET: Joi.string().required().messages({
    'any.required': 'OSS_BUCKET 是必需的环境变量'
  }),
  OSS_ENDPOINT: Joi.string().optional().allow(''),
  OSS_INTERNAL: Joi.string().valid('true', 'false').default('false'),
  OSS_TIMEOUT: Joi.number().default(60000),
  OSS_CALLBACK_URL: Joi.string()
    .uri({ scheme: ['https'] })
    .messages({
      'string.uri': 'OSS_CALLBACK_URL 必须是有效的 HTTPS URL'
    }),
  OSS_ACL: Joi.string().valid('private', 'public-read', 'public-read-write').default('public-read'),
  OSS_AUTH_V4: Joi.string().valid('true', 'false').default('true'),
  OSS_LOCAL_MODE: Joi.string().valid('true', 'false').default('false'),

  // 代理服务配置
  PROXY_ALLOWED_DOMAINS: Joi.string()
    .optional()
    .allow('')
    .custom((value, helpers) => {
      if (value && process.env.NODE_ENV === 'production') {
        // 生产环境建议配置白名单
        if (!value.trim()) {
          return helpers.warn('proxy.emptyWhitelist', {
            message: '⚠️  生产环境建议配置 PROXY_ALLOWED_DOMAINS 白名单'
          })
        }
      }
      return value
    }),
  PROXY_TIMEOUT: Joi.number().min(1000).max(300000).default(30000).messages({
    'number.min': 'PROXY_TIMEOUT 不能少于 1000 毫秒（1秒）',
    'number.max': 'PROXY_TIMEOUT 不能超过 300000 毫秒（5分钟）'
  }),
  PROXY_MAX_RETRIES: Joi.number().min(0).max(5).default(0).messages({
    'number.min': 'PROXY_MAX_RETRIES 不能为负数',
    'number.max': 'PROXY_MAX_RETRIES 不建议超过 5 次'
  })
})
