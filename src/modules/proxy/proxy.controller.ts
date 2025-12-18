import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ProxyService } from './proxy.service'
import { ProxyRequestDto } from './dto/proxy-request.dto'
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator'
import { CurrentUserDto } from '@/shared/dto/current-user.dto'

/**
 * 代理转发控制器
 * 提供统一的代理转发接口，用于将前端请求转发到第三方服务
 */
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  /**
   * 代理转发接口
   * POST /api/v1/proxy
   *
   * @description
   * 前端通过此接口发送代理请求，后端会将请求转发到目标服务，并返回结果
   *
   * @security
   * - 需要通过 JWT 认证（全局守卫）
   * - 目标 URL 必须在白名单内（通过环境变量 PROXY_ALLOWED_DOMAINS 配置）
   *
   * @example
   * ```typescript
   * // 前端请求示例
   * axiosInstance({
   *   url: '/proxy',
   *   method: 'POST',
   *   data: {
   *     targetUrl: 'https://api.example.com/users',
   *     targetMethod: 'GET',
   *     targetParams: { page: 1, size: 10 },
   *     targetHeaders: { 'X-API-Key': 'abc123' }
   *   }
   * })
   * ```
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async forward(@Body() proxyRequest: ProxyRequestDto, @CurrentUser() user: CurrentUserDto) {
    // 调用服务层转发请求，传入当前用户信息
    const result = await this.proxyService.forwardRequest(proxyRequest, user)

    // 直接返回目标服务的响应结果
    return result
  }
}
