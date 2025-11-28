/**
 * 队列名称常量
 * 集中管理所有队列名称，避免硬编码
 */
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  DATA_SYNC: 'data-sync-queue',
  REPORT: 'report-queue'
} as const

/**
 * 任务类型常量
 */
export const JOB_TYPES = {
  EMAIL: {
    SEND_WELCOME: 'send-welcome-email',
    SEND_VERIFICATION: 'send-verification-email',
    SEND_PASSWORD_RESET: 'send-password-reset-email'
  },
  NOTIFICATION: {
    PUSH: 'push-notification',
    SMS: 'send-sms'
  },
  DATA_SYNC: {
    SYNC_USER_PERMISSIONS: 'sync-user-permissions',
    SYNC_ROLES: 'sync-roles'
  },
  REPORT: {
    GENERATE_DAILY: 'generate-daily-report',
    GENERATE_MONTHLY: 'generate-monthly-report'
  }
} as const
