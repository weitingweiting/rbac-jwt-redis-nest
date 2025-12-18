import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  LoggerService
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { ProxyRequestDto, RequestHttpEnum } from './dto/proxy-request.dto'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'

/**
 * 代理转发服务
 * 负责将前端请求转发到第三方服务，并返回结果
 */
@Injectable()
export class ProxyService {
  private readonly allowedDomains: string[]
  private readonly timeout: number
  private readonly maxRetries: number

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {
    // 从配置中读取允许的域名白名单（安全性考虑）
    this.allowedDomains = this.configService
      .get<string>('proxy.allowedDomains', '')
      .split(',')
      .filter((domain) => domain.trim())

    // 请求超时时间（默认 30 秒）
    this.timeout = this.configService.get<number>('proxy.timeout', 30000)

    // 最大重试次数（默认 0，不重试）
    // 注意：如果前端已配置定时刷新（如 40 秒一次），不建议启用重试，避免请求堆积
    this.maxRetries = this.configService.get<number>('proxy.maxRetries', 0)
  }

  /**
   * 转发请求到目标服务
   * @param proxyRequest 代理请求参数
   * @param user 当前用户信息（用于日志记录和审计）
   * @returns 目标服务的响应数据
   */
  async forwardRequest(proxyRequest: ProxyRequestDto, user: CurrentUserDto): Promise<any> {
    const { targetUrl, targetMethod, targetData, targetParams, targetHeaders } = proxyRequest

    // 1. 安全性验证：检查目标 URL 是否在白名单内
    this.validateTargetUrl(targetUrl)

    // 2. 记录请求日志
    this.logger.log({
      message: '代理转发请求',
      userId: user.id,
      username: user.username,
      targetUrl,
      targetMethod,
      context: 'ProxyService'
    })

    try {
      // 3. 构建请求参数
      const url = this.buildUrl(targetUrl, targetParams)
      const options = this.buildFetchOptions(targetMethod, targetData, targetHeaders)

      // 4. 发送请求（使用原生 fetch API）
      // Node.js 18+ 原生支持 fetch，无需额外依赖
      // fetch 是流式处理，不会因为响应大而断开连接
      // axios 在前端等待响应，代理服务使用 fetch 等待三方服务，连接不会断开
      const response = await this.fetchWithRetry(url, options, this.timeout, this.maxRetries)

      // 5. 处理响应
      const result = await this.handleResponse(response)

      // 6. 记录成功日志
      this.logger.log({
        message: '代理转发成功',
        userId: user.id,
        username: user.username,
        targetUrl,
        statusCode: response.status,
        context: 'ProxyService'
      })

      return result
    } catch (error) {
      // 7. 错误处理
      this.logger.error({
        message: '代理转发失败',
        userId: user.id,
        username: user.username,
        targetUrl,
        error: error.message,
        stack: error.stack,
        context: 'ProxyService'
      })

      throw this.handleError(error)
    }
  }

  /**
   * 验证目标 URL 是否在白名单内
   */
  private validateTargetUrl(targetUrl: string): void {
    // 如果未配置白名单，则允许所有域名（开发环境）
    if (this.allowedDomains.length === 0) {
      this.logger.warn({
        message: '未配置代理域名白名单，允许所有域名（仅用于开发环境）',
        context: 'ProxyService'
      })
      return
    }

    try {
      const url = new URL(targetUrl)
      const hostname = url.hostname

      // 检查域名是否在白名单内
      const isAllowed = this.allowedDomains.some((domain) => {
        // 支持精确匹配和通配符匹配
        if (domain.startsWith('*.')) {
          // 例如：*.example.com 可以匹配 api.example.com
          const baseDomain = domain.slice(2)
          return hostname.endsWith(baseDomain)
        }
        return hostname === domain
      })

      if (!isAllowed) {
        throw new BadRequestException(`目标域名 ${hostname} 不在允许的白名单内`)
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('无效的目标 URL')
    }
  }

  /**
   * 构建完整的 URL（包含查询参数）
   */
  private buildUrl(targetUrl: string, targetParams?: Record<string, any>): string {
    if (!targetParams || Object.keys(targetParams).length === 0) {
      return targetUrl
    }

    const url = new URL(targetUrl)
    Object.entries(targetParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    return url.toString()
  }

  /**
   * 构建 Fetch API 的请求选项
   */
  private buildFetchOptions(
    method: RequestHttpEnum,
    data?: Record<string, any>,
    headers?: Record<string, string>
  ): RequestInit {
    const options: RequestInit = {
      method: method || RequestHttpEnum.GET,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LowCodeAgileProxy/1.0',
        ...headers
      }
    }

    // 如果有请求体数据，则添加
    if (
      data &&
      [RequestHttpEnum.POST, RequestHttpEnum.PUT, RequestHttpEnum.PATCH].includes(method)
    ) {
      options.body = JSON.stringify(data)
    }

    return options
  }

  /**
   * 带超时和重试的 fetch 请求
   * @param url 请求 URL
   * @param options 请求选项
   * @param timeout 超时时间（毫秒）
   * @param maxRetries 最大重试次数
   * @returns Response 对象
   *
   * 重试策略说明：
   * 1. 仅对网络错误（ECONNREFUSED、ETIMEDOUT等）进行重试
   * 2. 不对 4xx/5xx 状态码重试（这些是业务错误）
   * 3. 采用指数退避策略：第 n 次重试等待 2^n 秒
   * 4. 如果前端已配置定时刷新，建议将 maxRetries 设为 0
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    timeout: number,
    maxRetries: number
  ): Promise<Response> {
    let lastError: any

    // 总共尝试 1 + maxRetries 次
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // 如果是重试，则等待一段时间（指数退避）
        if (attempt > 0) {
          const waitTime = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s, 8s...
          this.logger.log({
            message: `代理请求重试中 (${attempt}/${maxRetries})`,
            url,
            waitTime,
            context: 'ProxyService'
          })
          await this.sleep(waitTime)
        }

        // 执行请求
        const response = await this.fetchWithTimeout(url, options, timeout)
        return response
      } catch (error) {
        lastError = error

        // 如果是超时错误或网络错误，可以重试
        const isRetryableError =
          error.name === 'AbortError' ||
          error.name === 'TypeError' ||
          error.message?.includes('fetch')

        // 如果不是可重试错误，或已经是最后一次尝试，则抛出错误
        if (!isRetryableError || attempt === maxRetries) {
          throw error
        }
      }
    }

    throw lastError
  }

  /**
   * 带超时的 fetch 请求
   * 使用 Node.js 18+ 原生 fetch API
   *
   * 优势：
   * 1. 原生支持，无需额外依赖
   * 2. 基于 Streams API，支持大文件传输
   * 3. 现代化的 Promise API
   * 4. 与浏览器 fetch 行为一致
   *
   * 关于连接稳定性：
   * - fetch 使用 HTTP Keep-Alive，连接复用
   * - 超时控制通过 AbortController 实现
   * - 前端的 axios 和后端的 fetch 是两个独立的连接
   * - 只要不超时，连接不会断开
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new HttpException('请求超时', HttpStatus.REQUEST_TIMEOUT)
      }
      throw error
    }
  }

  /**
   * 等待指定时间（用于重试延迟）
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 处理目标服务的响应
   */
  private async handleResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type')

    // 如果响应不是成功状态码，抛出异常
    if (!response.ok) {
      let errorMessage = `目标服务返回错误: ${response.status} ${response.statusText}`
      try {
        const errorBody = await response.text()
        if (errorBody) {
          errorMessage += ` - ${errorBody}`
        }
      } catch (e) {
        // 忽略解析错误
      }
      throw new HttpException(errorMessage, response.status)
    }

    // 根据 Content-Type 解析响应
    if (contentType?.includes('application/json')) {
      return await response.json()
    } else if (contentType?.includes('text/')) {
      return await response.text()
    } else {
      // 其他类型返回 ArrayBuffer
      return await response.arrayBuffer()
    }
  }

  /**
   * 统一错误处理
   */
  private handleError(error: any): HttpException {
    if (error instanceof HttpException) {
      return error
    }

    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new HttpException(
        '无法连接到目标服务，请检查网络或目标服务是否可用',
        HttpStatus.BAD_GATEWAY
      )
    }

    // 其他未知错误
    return new HttpException(
      error.message || '代理转发失败',
      error.status || HttpStatus.INTERNAL_SERVER_ERROR
    )
  }
}
