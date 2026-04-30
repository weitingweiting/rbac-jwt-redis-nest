import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'

/**
 * BullMQ 队列配置
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
        retryStrategy: (times: number) => {
          if (times > 10) {
            console.error('❌ BullMQ Redis 连接失败，已达到最大重试次数')
            return null
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
