import { Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  getAppInfo() {
    return {
      name: 'RBAC JWT Redis Demo',
      version: '1.0.0',
      description: 'NestJS 后端管理系统脚手架'
    }
  }

  async onModuleInit() {
    try {
      // 测试缓存功能：设置、获取、删除
      const testKey = 'app-service-test'
      const testValue = {
        timestamp: Date.now(),
        message: 'AppService 的 Redis 连接测试'
      }

      // 设置缓存（10分钟过期）
      await this.cacheManager.set(testKey, testValue, 600000)
      console.log('✅ 缓存写入成功')

      // 读取缓存
      const retrieved = await this.cacheManager.get(testKey)
      console.log('✅ 缓存读取成功:', retrieved)

      console.log('✅ Redis 缓存功能正常')
    } catch (error) {
      console.error('❌ 缓存测试失败:', (error as Error).message)
    }
  }
}
