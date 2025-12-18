import { IsNotEmpty, IsEnum, IsObject, IsOptional, IsUrl } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * HTTP 请求方法枚举
 */
export enum RequestHttpEnum {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

/**
 * 代理请求 DTO
 * 前端通过此 DTO 向代理服务发送请求，代理服务会将请求转发到目标服务
 */
export class ProxyRequestDto {
  /**
   * 目标服务的完整 URL
   * @example 'https://api.example.com/users'
   */
  @IsNotEmpty({ message: '目标URL不能为空' })
  @IsUrl({ require_tld: false }, { message: '目标URL格式不正确' })
  targetUrl: string

  /**
   * 目标服务的 HTTP 方法
   * @example 'GET'
   */
  @IsEnum(RequestHttpEnum, { message: '不支持的HTTP方法' })
  @IsOptional()
  targetMethod?: RequestHttpEnum = RequestHttpEnum.GET

  /**
   * 目标服务的请求体数据（用于 POST、PUT、PATCH 等）
   * @example { name: 'John', age: 30 }
   */
  @IsOptional()
  @IsObject({ message: '请求体数据必须是对象格式' })
  @Type(() => Object)
  targetData?: Record<string, any>

  /**
   * 目标服务的查询参数（用于 GET 等）
   * @example { page: 1, size: 10 }
   */
  @IsOptional()
  @IsObject({ message: '查询参数必须是对象格式' })
  @Type(() => Object)
  targetParams?: Record<string, any>

  /**
   * 目标服务需要的请求头
   * @example { 'Content-Type': 'application/json', 'X-API-Key': 'abc123' }
   */
  @IsOptional()
  @IsObject({ message: '请求头必须是对象格式' })
  @Type(() => Object)
  targetHeaders?: Record<string, string>
}
