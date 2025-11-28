import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from '@/shared/constants/queue.constant'
import { EmailProcessor } from './processors/email.processor'
import { EmailProducer } from './producers/email.producer'
import { QueueController } from './queue.controller'

/**
 * 队列模块
 * 管理所有后台任务队列
 */
@Module({
  imports: [
    // 注册邮件队列
    BullModule.registerQueue({
      name: QUEUE_NAMES.EMAIL
    }),
    // 注册通知队列
    BullModule.registerQueue({
      name: QUEUE_NAMES.NOTIFICATION
    }),
    // 注册数据同步队列
    BullModule.registerQueue({
      name: QUEUE_NAMES.DATA_SYNC
    })
  ],
  controllers: [QueueController],
  providers: [EmailProcessor, EmailProducer],
  exports: [EmailProducer] // 导出 Producer 供其他模块使用
})
export class QueueModule {}
