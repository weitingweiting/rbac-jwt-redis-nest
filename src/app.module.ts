import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// 应用核心
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 模块
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// 共享配置
import { RedisConfig } from './shared/config/redis.config';

// 守卫和拦截器
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// 通用模块
import { LoggerModule } from './common/logger/logger.module';
import { LoggingInterceptor } from './common/logger/logging.interceptor';

// 数据库和种子服务
import { DatabaseModule } from './database/database.module';
import { SeedService } from './database/seeds/seed.service';

@Module({
  imports: [
    LoggerModule,
    RedisConfig,
    DatabaseModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeedService,
    // 全局应用 JWT Guard（所有接口默认需要认证，除非标记 @Public()）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局应用日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
