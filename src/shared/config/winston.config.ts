/**
 * Winston 日志配置
 *
 * ⚠️ 重要说明：为什么这里仍然使用 process.env 而不是 ConfigService？
 *
 * 1. 初始化时机问题：
 *    - Winston 配置在应用启动的最早期被加载（在 LoggerModule 中）
 *    - ConfigModule 虽然是全局的，但在某些情况下可能还未完全初始化
 *    - LoggerModule 需要在 app.module.ts 中最先导入，用于记录后续模块的加载日志
 *
 * 2. 循环依赖风险：
 *    - 如果 Winston 依赖 ConfigService，而 ConfigService 的加载过程可能需要日志记录
 *    - 这会导致循环依赖问题
 *
 * 3. 日志配置的特殊性：
 *    - 日志系统是基础设施，应该独立于应用配置系统
 *    - 使用环境变量直接访问确保日志系统总是可用的
 *
 * 4. 解决方案：
 *    - LOG_TO_FILE 和 LOG_LEVEL 等日志相关配置仍然使用 process.env
 *    - 确保在应用启动前通过 .env 文件或环境变量设置这些值
 *    - 其他业务配置（数据库、Redis、JWT 等）使用 ConfigService
 *
 * 5. 最佳实践：
 *    - 在 main.ts 或应用启动脚本中，可以在最开始调用 dotenv.config() 确保环境变量已加载
 *    - 日志配置保持简单和独立，避免与其他模块产生依赖
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

// 日志目录配置 - 使用项目外部目录
const LOG_DIR = path.resolve(__dirname, '../../../..', 'logs')

// 是否记录到文件（开发环境不记录到文件。生产环境记录到文件）
// 注意：这里使用 process.env 是有意为之的，原因见文件顶部的详细说明
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
// 注意：LOG_LEVEL 和 NODE_ENV 仍然使用 process.env，原因见文件顶部说明
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
