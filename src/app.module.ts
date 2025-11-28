import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'

// 应用核心
import { AppController } from './app.controller'
import { AppService } from './app.service'

// 模块
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'

// 共享配置
import { RedisConfig } from './shared/config/redis.config'

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
    LoggerModule,
    FiltersModule, // 全局异常过滤器模块
    RedisConfig,
    DatabaseModule,
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
    consumer.apply(RequestIdMiddleware).forRoutes('*')

    // 为所有路由应用限流中间件
    consumer.apply(RateLimitMiddleware).forRoutes('*')
  }
}
