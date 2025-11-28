import { Injectable, Inject } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { QUEUE_NAMES, JOB_TYPES } from '@/shared/constants/queue.constant'

/**
 * 邮件生产者
 * 负责将邮件任务添加到队列中
 */
@Injectable()
export class EmailProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL)
    private emailQueue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    try {
      const job = await this.emailQueue.add(
        JOB_TYPES.EMAIL.SEND_WELCOME,
        {
          email,
          username
        },
        {
          priority: 1, // 优先级（数字越小优先级越高）
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      )

      this.logger.info('📧 Welcome Email Job Added', {
        jobId: job.id,
        email,
        username
      })
    } catch (error: unknown) {
      this.logger.error('❌ Failed to add Welcome Email Job', {
        email,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 发送验证邮件
   */
  async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
    try {
      const job = await this.emailQueue.add(
        JOB_TYPES.EMAIL.SEND_VERIFICATION,
        {
          email,
          verificationCode
        },
        {
          priority: 1, // 高优先级
          attempts: 5, // 更多重试次数
          removeOnComplete: true // 完成后立即删除
        }
      )

      this.logger.info('📧 Verification Email Job Added', {
        jobId: job.id,
        email
      })
    } catch (error: unknown) {
      this.logger.error('❌ Failed to add Verification Email Job', {
        email,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const job = await this.emailQueue.add(
        JOB_TYPES.EMAIL.SEND_PASSWORD_RESET,
        {
          email,
          resetToken
        },
        {
          priority: 1,
          attempts: 3
        }
      )

      this.logger.info('📧 Password Reset Email Job Added', {
        jobId: job.id,
        email
      })
    } catch (error: unknown) {
      this.logger.error('❌ Failed to add Password Reset Email Job', {
        email,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 批量发送邮件
   */
  async sendBulkEmails(emails: Array<{ email: string; username: string }>): Promise<void> {
    try {
      const jobs = emails.map((data) => ({
        name: JOB_TYPES.EMAIL.SEND_WELCOME,
        data,
        opts: {
          priority: 3, // 低优先级
          attempts: 2
        }
      }))

      await this.emailQueue.addBulk(jobs)

      this.logger.info('📧 Bulk Email Jobs Added', {
        count: emails.length
      })
    } catch (error: unknown) {
      this.logger.error('❌ Failed to add Bulk Email Jobs', {
        count: emails.length,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 延迟发送邮件（定时任务）
   */
  async scheduledEmail(email: string, username: string, delayInMinutes: number): Promise<void> {
    try {
      const job = await this.emailQueue.add(
        JOB_TYPES.EMAIL.SEND_WELCOME,
        {
          email,
          username
        },
        {
          delay: delayInMinutes * 60 * 1000 // 转换为毫秒
        }
      )

      this.logger.info('📧 Scheduled Email Job Added', {
        jobId: job.id,
        email,
        delayInMinutes,
        scheduledFor: new Date(Date.now() + delayInMinutes * 60 * 1000).toISOString()
      })
    } catch (error: unknown) {
      this.logger.error('❌ Failed to add Scheduled Email Job', {
        email,
        error: (error as Error).message
      })
      throw error
    }
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount()
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    }
  }
}
