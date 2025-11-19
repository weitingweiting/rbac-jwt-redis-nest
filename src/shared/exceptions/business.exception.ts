import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常基类
 * 用于抛出标准化的业务错误
 * 
 * @example
 * throw new BusinessException('用户不存在', HttpStatus.NOT_FOUND, 'USER_NOT_FOUND');
 * throw new BusinessException('权限不足', HttpStatus.FORBIDDEN, 'PERMISSION_DENIED');
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly errorCode?: string,
  ) {
    super(
      {
        success: false,
        message,
        errorCode,
      },
      statusCode,
    );
  }
}
