import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AllExceptionsFilter } from './all-exceptions.filter'
import { HttpExceptionFilter } from './http-exception.filter'
import { BusinessExceptionFilter } from './business-exception.filter'
import { ValidationExceptionFilter } from './validation-exception.filter'

@Module({
  imports: [],
  providers: [
    // ⚠️ 注意：APP_FILTER 的执行顺序是相反的（后注册的先执行）
    // 执行顺序：ValidationException → BusinessException → HttpException → AllExceptions
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter // 最后执行：捕获所有其他异常
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter // 第三执行：一般 HTTP 异常
    },
    {
      provide: APP_FILTER,
      useClass: BusinessExceptionFilter // 第二执行：业务异常
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter // 最先执行：验证异常（最具体）
    }
  ],
  exports: []
})
export class FiltersModule {}
