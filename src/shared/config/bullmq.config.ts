import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'

/**
 * BullMQ 队列配置工厂函数
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
        enableReadyCheck: false
      },
      defaultJobOptions: {
        attempts: 3, // 任务失败重试次数
        backoff: {
          type: 'exponential', // 使用指数退避算法。每次重试的等待时间会指数级增长，减少系统压力
          delay: 1000 // 初始延迟 1 秒
        },
        removeOnComplete: {
          age: 3600, // 1小时后删除已完成的任务
          count: 20 // 保留最近 20 个已完成的任务
        },
        removeOnFail: {
          age: 24 * 3600 // 24小时后删除失败的任务
        }
      }
    })
  })
