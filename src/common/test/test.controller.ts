import { Controller, Get } from '@nestjs/common';
import { Public } from '../../modules/auth/decorators/public.decorator';
import { BusinessException } from '../../shared/exceptions/business.exception';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant';
import { HttpStatus } from '@nestjs/common';

@Controller('test')
export class TestController {

  @Get('business-error')
  @Public()
  testBusinessError() {
    throw new BusinessException(
      '这是一个测试业务异常',
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.OPERATION_NOT_ALLOWED
    );
  }

  @Get('user-not-found')
  @Public()
  testUserNotFound() {
    throw new BusinessException(
      '用户不存在',
      HttpStatus.NOT_FOUND,
      ERROR_CODES.USER_NOT_FOUND
    );
  }

  @Get('conflict')
  @Public()
  testConflict() {
    throw new BusinessException(
      '用户名已存在',
      HttpStatus.CONFLICT,
      ERROR_CODES.USERNAME_EXISTS
    );
  }

  @Get('success')
  @Public()
  testSuccess() {
    return {
      message: '成功响应测试',
      timestamp: new Date().toISOString(),
    };
  }
}