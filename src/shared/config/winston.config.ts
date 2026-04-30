/**
 * Winston 日志配置
 *
 * 环境配置：
 *    - LOG_TO_FILE 和 LOG_LEVEL 等日志相关配置仍然使用 process.env
 *    - 确保在应用启动前通过 .env 文件或环境变量设置这些值
 *    - 其他业务配置（数据库、Redis、JWT 等）使用 ConfigService

 *    - 在 main.ts 或应用启动脚本中，在最开始调用 dotenv.config() 确保环境变量已加载
 *    - 日志配置保持简单独立，避免与其他模块产生依赖
 */

import * as winston from 'winston'
import * as path from 'path'
import { utilities as nestWinstonModuleUtilities } from 'nest-winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

// 日志颜色配置
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
}

winston.addColors(colors)

// 日志格式配置
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// 控制台日志格式
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.ms(),
  nestWinstonModuleUtilities.format.nestLike('RBAC-Demo', {
    colors: true,
    prettyPrint: true
  })
)

// 创建传输器
const transports: winston.transport[] = []

transports.push(
  new winston.transports.Console({
    format: consoleFormat
  })
)

// 使用项目外部目录
const LOG_DIR = path.resolve(__dirname, '../../../..', 'logs')

// 记录到文件（开发环境不记录到文件。生产环境记录到文件）
if (process.env.LOG_TO_FILE === 'true') {
  // 文件传输器 - 所有日志
  transports.push(
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format
    })
  )

  // 文件传输器 - 错误日志
  transports.push(
    new DailyRotateFile({
      level: 'error',
      filename: path.join(LOG_DIR, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: format
    })
  )

  // 文件传输器 - HTTP 日志
  transports.push(
    new DailyRotateFile({
      level: 'http',
      filename: path.join(LOG_DIR, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
      format: format
    })
  )
}

// Winston 配置
export const winstonConfig = {
  levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'rejections.log')
    })
  ]
}
