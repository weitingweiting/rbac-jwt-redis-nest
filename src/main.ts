import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER)
  app.useLogger(logger)

  // 全局启用 ClassSerializerInterceptor，自动应用 @Exclude 装饰器
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  // 全局验证管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动过滤掉 DTO 中未定义的属性
      whitelist: true,
      // true: 在验证时抛出错误。false: 不报错，仅移除非白名单属性
      forbidNonWhitelisted: true,
      // 自动转换类型（例如：将字符串 "1" 转换为数字 1）
      transform: true,
      // 启用隐式类型转换
      transformOptions: {
        enableImplicitConversion: true
      },
      // 在验证失败时禁止未知值
      forbidUnknownValues: true,
      // 详细错误信息
      disableErrorMessages: false,
      // 验证组
      validationError: {
        target: false, // 不返回目标对象
        value: false // 不返回值
      }
    })
  )

  // 启用 CORS
  app.enableCors()

  app.setGlobalPrefix('api')

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v'
  })

  const port = configService.get<number>('app.port', 3000)
  await app.listen(port)

  const nodeEnv = configService.get<string>('app.nodeEnv')
  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap')
  logger.log(`API endpoint: http://localhost:${port}/api`, 'Bootstrap')
  logger.log(`Environment: ${nodeEnv}`, 'Bootstrap')
  logger.log(`Log level: ${configService.get<string>('app.logLevel')}`, 'Bootstrap')
}

// 🔥 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('🚨 Unhandled Promise Rejection:', reason)
  console.error('Promise:', promise)
  // 记录错误但不退出进程，让 PM2 决定是否重启
})

// 捕获未捕获的异常
// - Redis 缓存错误由 KeyvRedis 的 throwOnErrors: false 处理
// - BullMQ 错误由 ioredis 的 retryStrategy 处理
// - 此处只捕获真正的程序错误
process.on('uncaughtException', (error: Error) => {
  console.error('🚨 Uncaught Exception:', error.name, error.message)
  console.error('Stack:', error.stack)

  // 严重错误，退出进程让 PM2 重启
  console.error('💥 严重错误，进程将退出')
  process.exit(1)
})

// 🔥 捕获 SIGTERM 信号（优雅关闭）
process.on('SIGTERM', () => {
  console.log('📡 收到 SIGTERM 信号，准备优雅关闭...')
  process.exit(0)
})

// 🔥 捕获 SIGINT 信号（Ctrl+C）
process.on('SIGINT', () => {
  console.log('📡 收到 SIGINT 信号，准备优雅关闭...')
  process.exit(0)
})

bootstrap()
