import { Controller, Get } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { Public } from './modules/auth/decorators/public.decorator'
import { BaseResponseDto } from './shared/dto/base-response.dto'

@Controller()
export class AppController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @Public()
  getHello(): BaseResponseDto<any> {
    return BaseResponseDto.success(
      {
        name: 'RBAC JWT Redis Demo',
        version: '1.0.0',
        description: 'NestJS RBAC + JWT + Redis 后端管理系统'
      },
      'API 运行正常'
    )
  }

  @Get('health')
  @Public()
  async healthCheck(): Promise<BaseResponseDto<any>> {
    // 检查数据库连接
    let dbStatus = 'disconnected'
    let dbPoolInfo = null

    try {
      if (this.dataSource.isInitialized) {
        // 执行简单查询测试连接
        await this.dataSource.query('SELECT 1')
        dbStatus = 'connected'

        // 获取连接池信息
        const driver = this.dataSource.driver as any
        if (driver.pool) {
          dbPoolInfo = {
            allConnections: driver.pool._allConnections?.length || 0,
            freeConnections: driver.pool._freeConnections?.length || 0,
            acquiringConnections: driver.pool._acquiringConnections?.length || 0
          }
        }
      }
    } catch (error) {
      dbStatus = `error: ${error.message}`
    }

    return BaseResponseDto.success(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
        },
        database: {
          status: dbStatus,
          pool: dbPoolInfo
        }
      },
      '系统健康检查'
    )
  }
}
