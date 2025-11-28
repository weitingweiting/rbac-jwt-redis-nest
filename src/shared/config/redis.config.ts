import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-ioredis-yet'

export const getRedisConfig = () =>
  CacheModule.registerAsync({
    isGlobal: true,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      store: await redisStore({
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        ttl: 3600 // 默认缓存时间：1小时（秒）
      })
    })
  })
