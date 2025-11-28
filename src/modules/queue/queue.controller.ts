import { Controller, Post, Body, Get } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { EmailProducer } from './producers/email.producer'

/**
 * 队列测试控制器
 * 用于测试和管理队列任务
 */
@Controller('queue')
export class QueueController {
  constructor(private readonly emailProducer: EmailProducer) {}

  /**
   * 发送欢迎邮件测试
   */
  @Public()
  @Post('email/welcome')
  async sendWelcomeEmail(@Body() body: { email: string; username: string }) {
    await this.emailProducer.sendWelcomeEmail(body.email, body.username)

    return {
      success: true,
      message: '欢迎邮件已加入队列',
      data: {
        email: body.email,
        username: body.username
      }
    }
  }

  /**
   * 发送验证邮件测试
   */
  @Public()
  @Post('email/verification')
  async sendVerificationEmail(@Body() body: { email: string; code: string }) {
    await this.emailProducer.sendVerificationEmail(body.email, body.code)

    return {
      success: true,
      message: '验证邮件已加入队列',
      data: {
        email: body.email
      }
    }
  }

  /**
   * 批量发送邮件测试
   */
  @Public()
  @Post('email/bulk')
  async sendBulkEmails(@Body() body: { emails: Array<{ email: string; username: string }> }) {
    await this.emailProducer.sendBulkEmails(body.emails)

    return {
      success: true,
      message: `${body.emails.length} 封邮件已加入队列`,
      data: {
        count: body.emails.length
      }
    }
  }

  /**
   * 延迟发送邮件测试
   */
  @Public()
  @Post('email/scheduled')
  async scheduledEmail(@Body() body: { email: string; username: string; delayInMinutes: number }) {
    await this.emailProducer.scheduledEmail(body.email, body.username, body.delayInMinutes)

    return {
      success: true,
      message: `邮件将在 ${body.delayInMinutes} 分钟后发送`,
      data: {
        email: body.email,
        scheduledFor: new Date(Date.now() + body.delayInMinutes * 60 * 1000).toISOString()
      }
    }
  }

  /**
   * 获取队列统计信息
   */
  @Public()
  @Get('stats')
  async getQueueStats() {
    const stats = await this.emailProducer.getQueueStats()

    return {
      success: true,
      message: '队列统计信息',
      data: stats
    }
  }
}
