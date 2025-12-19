import { Module } from '@nestjs/common'
import { ProxyController } from './proxy.controller'
import { ProxyTestChartsController } from './proxy-test-charts.controller'
import { ProxyService } from './proxy.service'

/**
 * 代理转发模块
 * 提供统一的代理转发功能，用于将前端请求转发到第三方服务
 */
@Module({
  controllers: [ProxyController, ProxyTestChartsController],
  providers: [ProxyService],
  exports: [ProxyService]
})
export class ProxyModule {}
