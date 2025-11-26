import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

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
import { FiltersModule } from './common/filters/filters.module';

// 数据库和种子服务
import { DatabaseModule } from './database/database.module';
import { SeedService } from './database/seeds/seed.service';
import { TestModule } from './common/test/test.module';

@Module({
  imports: [
    LoggerModule,
    FiltersModule, // 全局异常过滤器模块
    RedisConfig,
    DatabaseModule,
    AuthModule,
    UsersModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeedService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    }
  ],
})
export class AppModule { }
