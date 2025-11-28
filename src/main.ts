import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER)
  app.useLogger(logger)

  // 全局验证管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动过滤掉 DTO 中未定义的属性
      whitelist: true,
      // 当发现非白名单属性时抛出错误
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
bootstrap()
