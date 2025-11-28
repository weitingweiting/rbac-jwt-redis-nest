import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AllExceptionsFilter } from './all-exceptions.filter'
import { HttpExceptionFilter } from './http-exception.filter'
import { BusinessExceptionFilter } from './business-exception.filter'
import { ValidationExceptionFilter } from './validation-exception.filter'

@Module({
  imports: [],
  providers: [
    // 执行顺序：ValidationException → BusinessException → HttpException → AllExceptions
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: BusinessExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter
    }
  ],
  exports: []
})
export class FiltersModule {}
