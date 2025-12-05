import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config'
import KeyvRedis from '@keyv/redis'

export const getRedisConfig = () =>
  CacheModule.registerAsync({
    isGlobal: true,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const host = configService.get<string>('redis.host', 'localhost')
      const port = configService.get<number>('redis.port', 6379)
      const password = configService.get<string>('redis.password')
      const db = configService.get<number>('redis.db', 0)

      const redisConfig = {
        host,
        port,
        password,
        db,
        connectTimeout: 10000,
        retryStrategy: (times) => Math.min(times * 100, 3000)
      }

      console.log(
        '🔧 Redis 配置:',
        `redis://${password ? `:${password}@` : ''}${host}:${port}/${db}`
      )

      // 官方推荐方式：
      // @nestjs/cache-manager v3 + cache-manager v6 + Keyv 生态(@keyv/redis、@keyv/sqlite、@keyv/mongo) + ioredis + redisServer
      // cache-manager -> 使用 keyv 做统一存储接口。配器连接不同存储 (Redis、MongoDB、SQLite 等)
      const redisStore = new KeyvRedis(redisConfig)

      return {
        stores: [redisStore],
        ttl: 3600 * 1000,
        isCacheableValue: (val) => val !== undefined && val !== null // 过滤 undefined 和 null
      }
    }
  })
