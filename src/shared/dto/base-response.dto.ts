export class BaseResponseDto<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;

  constructor(success: boolean, data?: T, message?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data?: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }

  static error(message: string): BaseResponseDto {
    return new BaseResponseDto(false, null, message);
  }
}