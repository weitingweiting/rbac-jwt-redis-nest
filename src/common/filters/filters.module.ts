import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpExceptionFilter } from './http-exception.filter';
import { BusinessExceptionFilter } from './business-exception.filter';

@Module({
  imports: [],
  providers: [
    // 按优先级顺序注册过滤器
    {
      provide: APP_FILTER,
      useClass: BusinessExceptionFilter, // 业务异常最优先（不需要 Winston）
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // HTTP 异常次优先（不需要 Winston）
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter, // 捕获所有其他异常（使用 Winston 记录日志）
    },
  ],
  exports: [],
})
export class FiltersModule { }