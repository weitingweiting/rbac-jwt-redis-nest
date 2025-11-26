import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

export const RedisConfig = CacheModule.register({
  isGlobal: true,
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379') || 6379,
  ttl: 3600, // 默认缓存时间：1小时（秒）
});
