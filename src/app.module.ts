import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'

// 应用核心
import { AppController } from './app.controller'
import { AppService } from './app.service'

// 模块
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { QueueModule } from './modules/queue/queue.module'

// 共享配置
import { getRedisConfig } from './shared/config/redis.config'
import { appConfig, databaseConfig, redisConfig, jwtConfig } from './shared/config/env.config'
import { validationSchema } from './shared/config/env.validation'
import { getBullMQConfig } from './shared/config/bullmq.config'

// 守卫和拦截器
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard'

// 中间件
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'

// 通用模块
import { FiltersModule } from './common/filters/filters.module'
import { LoggerModule } from './common/logger/logger.module'
import { LoggingInterceptor } from './common/logger/logging.interceptor'

// 数据库和种子服务
import { TestModule } from './common/test/test.module'
import { DatabaseModule } from './database/database.module'
import { SeedService } from './database/seeds/seed.service'

@Module({
  imports: [
    // 全局配置模块（必须在最前面，以便其他模块使用）
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用，无需在每个模块中导入
      envFilePath: ['.env.local', '.env'], // 支持多个环境文件，优先级从左到右
      load: [appConfig, databaseConfig, redisConfig, jwtConfig], // 加载配置
      cache: true, // 缓存环境变量以提高性能
      expandVariables: true, // 支持变量展开 ${VAR}
      validationSchema, // Joi 验证 schema
      validationOptions: {
        allowUnknown: true, // 允许未知的环境变量
        abortEarly: false // 显示所有验证错误，而不是第一个错误后停止
      }
    }),
    LoggerModule,
    FiltersModule,
    getRedisConfig(),
    getBullMQConfig(), // BullMQ 队列全局配置
    DatabaseModule,
    QueueModule,
    AuthModule,
    UsersModule,
    TestModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeedService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 为所有路由应用请求 ID 中间件（优先级最高）
    consumer.apply(RequestIdMiddleware).forRoutes('*path')
    // 为所有路由应用限流中间件
    consumer.apply(RateLimitMiddleware).forRoutes('*path')
  }

  // 执行顺序：onModuleInit -> onApplicationBootstrap -> beforeApplicationShutdown -> onModuleDestroy
  // 测试生命周期钩子
  async onModuleInit() {
    console.log('AppModule initialized')
  }

  async onApplicationBootstrap() {
    console.log('Application bootstrap completed')
  }

  async beforeApplicationShutdown() {
    console.log('Application is shutting down soon')
  }

  async onModuleDestroy() {
    console.log('AppModule destroyed')
  }
}
