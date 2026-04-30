import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * 业务异常基类
 * 用于抛出标准化的业务错误
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly errorCode?: string
  ) {
    super(
      {
        success: false,
        message,
        errorCode
      },
      statusCode
    )
  }
}
