import { Module } from '@nestjs/common'
import { ProxyController } from './proxy.controller'
import { ProxyTestController } from './proxy-test.controller'
import { ProxyService } from './proxy.service'

/**
 * 代理转发模块
 * 提供统一的代理转发功能，用于将前端请求转发到第三方服务
 */
@Module({
  controllers: [ProxyController, ProxyTestController],
  providers: [ProxyService],
  exports: [ProxyService]
})
export class ProxyModule {}
