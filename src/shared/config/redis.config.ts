import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config'
import KeyvRedis from '@keyv/redis'

/**
 * Redis 缓存配置
 * 技术栈：@nestjs/cache-manager v3 + cache-manager v6 + @keyv/redis v5
 * 参考：https://docs.nestjs.com/techniques/caching
 *
 * 配置说明：
 * - 使用简单的 URL 连接，@keyv/redis 内部有完善的重连机制
 * - 添加基本容错配置，防止 Redis 问题影响应用
 * - 监听错误事件用于日志记录和监控
 */
export const getRedisConfig = () =>
  CacheModule.registerAsync({
    isGlobal: true,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const host = configService.get<string>('redis.host', 'localhost')
      const port = configService.get<number>('redis.port', 6379)
      const password = configService.get<string>('redis.password')
      const db = configService.get<number>('redis.db', 0)

      const redisUrl = password
        ? `redis://:${password}@${host}:${port}/${db}`
        : `redis://${host}:${port}/${db}`

      console.log(`🔧 Redis 缓存配置: ${redisUrl.replace(/:[^:@]*@/, ':****@')}`)

      // 创建 KeyvRedis 实例，配置基本的容错选项
      const keyvRedis = new KeyvRedis(redisUrl, {
        // 连接失败时不抛出异常，保证应用正常启动
        throwOnConnectError: false,
        // 操作失败时不抛出异常，返回 undefined/void
        throwOnErrors: false,
        // 连接超时设置（5秒）
        connectionTimeout: 5000
      })

      // 监听 Redis 错误事件（用于日志记录）
      keyvRedis.on('error', (err) => {
        console.error('❌ Redis 缓存错误:', err.message)
        // 错误已被捕获，不会影响应用运行
      })

      return {
        stores: [keyvRedis],
        ttl: 3600 * 1000
      }
    }
  })
