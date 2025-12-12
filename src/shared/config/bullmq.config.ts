import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'

/**
 * BullMQ 队列配置
 * 使用 ioredis 作为 Redis 客户端
 * 配置说明：
 * - maxRetriesPerRequest: null - 不限制单个请求的重试次数
 * - enableReadyCheck: false - 禁用就绪检查，加快启动速度
 * - retryStrategy - 自定义重连策略，防止连接失败时无限重连
 */
export const getBullMQConfig = () =>
  BullModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      connection: {
        host: configService.get<string>('redis.host'),
        port: configService.get<number>('redis.port'),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        // 重连策略：指数退避，最多重连10次
        retryStrategy: (times: number) => {
          if (times > 10) {
            console.error('❌ BullMQ Redis 连接失败，已达到最大重试次数')
            return null // 停止重连
          }
          const delay = Math.min(times * 200, 3000)
          console.log(`🔄 BullMQ Redis 重连中... (${times}/10) 延迟 ${delay}ms`)
          return delay
        }
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: {
          age: 3600,
          count: 20
        },
        removeOnFail: {
          age: 24 * 3600
        }
      }
    })
  })
