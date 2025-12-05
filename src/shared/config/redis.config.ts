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

      // 构建 Redis URL
      const redisUrl = `redis://${password ? `:${password}@` : ''}${host}:${port}/${db}`

      console.log('🔧 Redis 配置:', {
        host,
        port,
        db,
        hasPassword: !!password,
        // url: redisUrl.replace(/:[^:@]*@/, ':****@') // 隐藏密码
        url: redisUrl
      })

      // 直接使用 KeyvRedis，NestJS @nestjs/cache-manager v3 + cache-manager v6 的官方推荐方式
      const store = new KeyvRedis(redisUrl)

      console.log('✅ Redis Store (KeyvRedis) 创建成功')

      return {
        stores: [store],
        ttl: 3600 * 1000 // 毫秒
      }
    }
  })
