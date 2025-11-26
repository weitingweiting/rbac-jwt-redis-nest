import { Response } from 'express';

/**
 * 响应头设置工具类
 * 统一管理所有API响应头的设置，避免代码重复
 */
export class ResponseHeadersUtil {
  /**
   * 设置通用的API响应头
   * @param response Express响应对象
   * @param options 可选的配置选项
   */
  static setCommonHeaders(
    response: Response,
    options?: {
      traceId?: string;
      responseTime?: number;
      errorType?: string;
    }
  ): void {
    // 设置API版本
    response.setHeader('X-API-Version', '1.0');

    // 设置响应时间（如果提供）
    if (options?.responseTime !== undefined) {
      response.setHeader('X-Response-Time', `${options.responseTime}ms`);
    }

    // 设置追踪ID（如果提供）
    if (options?.traceId) {
      response.setHeader('X-Error-Trace-ID', options.traceId);
    }

    // 设置错误类型（如果提供）
    if (options?.errorType) {
      response.setHeader('X-Error-Type', options.errorType);
    }

    // 设置安全相关的响应头
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
  }

  /**
   * 生成追踪ID
   * @returns 9位随机字符串
   */
  static generateTraceId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}