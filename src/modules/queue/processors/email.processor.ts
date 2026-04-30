import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Inject } from '@nestjs/common'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { QUEUE_NAMES, JOB_TYPES } from '@/shared/constants/queue.constant'

/**
 * 邮件队列处理器
 */
@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    super()
  }

  async process(job: Job): Promise<any> {
    this.logger.info('📧 Email Job Started', {
      jobId: job.id,
      jobType: job.name,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts
    })

    try {
      // 对列中的任务有不同的类型，根据任务类型调用不同的处理方法
      switch (job.name) {
        case JOB_TYPES.EMAIL.SEND_WELCOME:
          return await this.sendWelcomeEmail(job.data)

        case JOB_TYPES.EMAIL.SEND_VERIFICATION:
          return await this.sendVerificationEmail(job.data)

        case JOB_TYPES.EMAIL.SEND_PASSWORD_RESET:
          return await this.sendPasswordResetEmail(job.data)

        default:
          throw new Error(`Unknown job type: ${job.name}`)
      }
    } catch (error: any) {
      this.logger.error('❌ Email Job Failed', {
        jobId: job.id,
        jobType: job.name,
        error: error.message,
        stack: error.stack
      })
      throw error // 重新抛出错误以触发重试
    }
  }

  private async sendWelcomeEmail(data: { email: string; username: string }): Promise<void> {
    this.logger.info('📨 Sending Welcome Email', {
      email: data.email,
      username: data.username
    })

    // 模拟发送延迟
    await this.sleep(1000)

    this.logger.info('✅ Welcome Email Sent', {
      email: data.email
    })
  }

  private async sendVerificationEmail(data: {
    email: string
    verificationCode: string
  }): Promise<void> {
    this.logger.info('📨 Sending Verification Email', {
      email: data.email
    })

    await this.sleep(1000)

    this.logger.info('✅ Verification Email Sent', {
      email: data.email
    })
  }

  /**
   * 发送密码重置邮件
   */
  private async sendPasswordResetEmail(data: { email: string; resetToken: string }): Promise<void> {
    this.logger.info('📨 Sending Password Reset Email', {
      email: data.email
    })

    // TODO: 实现实际的邮件发送逻辑
    await this.sleep(1000)

    this.logger.info('✅ Password Reset Email Sent', {
      email: data.email
    })
  }

  /**
   * 任务完成回调
   */
  onCompleted(job: Job, _result: any) {
    this.logger.info('✅ Email Job Completed', {
      jobId: job.id,
      jobType: job.name,
      processedOn: new Date(job.processedOn!).toISOString(),
      finishedOn: new Date(job.finishedOn!).toISOString(),
      duration: `${job.finishedOn! - job.processedOn!}ms`
    })
  }

  /**
   * 任务失败回调
   */
  onFailed(job: Job, error: Error) {
    this.logger.error('❌ Email Job Failed Permanently', {
      jobId: job.id,
      jobType: job.name,
      attempts: job.attemptsMade,
      error: error.message
    })
  }

  /**
   * 延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
