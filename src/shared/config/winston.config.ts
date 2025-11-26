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

// 是否记录到文件（开发环境不记录到文件。生产环境记录到文件）
if (process.env.LOG_TO_FILE === 'true') {
  // 文件传输器 - 所有日志
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'application-%DATE%.log'),
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
      filename: path.join('logs', 'error-%DATE%.log'),
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
      filename: path.join('logs', 'http-%DATE%.log'),
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
      filename: path.join('logs', 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log')
    })
  ]
}
