import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'

/**
 * 数据库健康监控服务
 * 定期检查数据库连接状态，防止连接池耗尽
 */
@Injectable()
export class DatabaseHealthService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseHealthService.name)
  private checkInterval: NodeJS.Timeout | null = null

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  onModuleInit() {
    // 启动健康检查（每30秒检查一次）
    this.startHealthCheck()
  }

  /**
   * 启动定期健康检查
   */
  private startHealthCheck() {
    this.logger.log('🏥 启动数据库健康检查监控')

    this.checkInterval = setInterval(
      async () => {
        try {
          await this.checkDatabaseHealth()
        } catch (error) {
          this.logger.error('❌ 数据库健康检查失败', error)
        }
      },
      30000 // 30秒检查一次
    )
  }

  /**
   * 检查数据库健康状态
   */
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      if (!this.dataSource.isInitialized) {
        this.logger.warn('⚠️ 数据库未初始化，尝试重新连接...')
        await this.dataSource.initialize()
        return false
      }

      // 执行简单查询测试连接
      await this.dataSource.query('SELECT 1')

      // 获取连接池信息
      const driver = this.dataSource.driver as any
      if (driver.pool) {
        const allConnections = driver.pool._allConnections?.length || 0
        const freeConnections = driver.pool._freeConnections?.length || 0
        const acquiringConnections = driver.pool._acquiringConnections?.length || 0

        // 连接池使用率
        const usageRate = ((allConnections - freeConnections) / allConnections) * 100

        // 如果连接池使用率超过 90%，记录警告
        if (usageRate > 90) {
          this.logger.warn(
            `⚠️ 数据库连接池使用率过高: ${usageRate.toFixed(2)}% (${allConnections - freeConnections}/${allConnections})`
          )
        }

        // 如果有太多挂起的连接请求，记录警告
        if (acquiringConnections > 5) {
          this.logger.warn(`⚠️ 数据库连接池有 ${acquiringConnections} 个挂起的连接请求`)
        }

        this.logger.debug(
          `✅ 数据库连接正常 - 连接池状态: ${allConnections}总/${freeConnections}空闲/${acquiringConnections}等待`
        )
      }

      return true
    } catch (error) {
      this.logger.error('❌ 数据库健康检查失败:', error.message)

      // 尝试重新连接
      if (!this.dataSource.isInitialized) {
        try {
          await this.dataSource.initialize()
          this.logger.log('✅ 数据库重新连接成功')
        } catch (reconnectError) {
          this.logger.error('❌ 数据库重新连接失败:', reconnectError.message)
        }
      }

      return false
    }
  }

  /**
   * 清理资源
   */
  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.logger.log('🛑 数据库健康检查监控已停止')
    }
  }
}
