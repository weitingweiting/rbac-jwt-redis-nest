import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { User } from '../entities/user.entity'
import { Role } from '../entities/role.entity'
import { Permission } from '../entities/permission.entity'
import { ProjectSpace } from '../entities/project-space.entity'
import { Project } from '../entities/project.entity'
import { ProjectAsset } from '../entities/project-asset.entity'

/**
 * TypeORM 数据库配置工厂函数
 * 使用 ConfigService 动态获取配置
 */
export const getDatabaseConfig = () =>
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const nodeEnv = configService.get<string>('app.nodeEnv')
      const isProduction = nodeEnv === 'production'

      // 根据环境配置连接池大小
      const poolSize = isProduction ? 50 : 10
      const connectTimeout = isProduction ? 10000 : 60000 // 生产10秒，开发60秒
      const maxQueryTime = isProduction ? 3000 : 5000 // 生产3秒，开发5秒
      const retryAttempts = isProduction ? 10 : 5 // 生产更积极重连

      return {
        type: 'mysql' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        charset: 'utf8mb4',
        synchronize: nodeEnv === 'development', // ⚠️ 仅开发环境自动同步
        extra: {
          connectionLimit: poolSize, // 开发10，生产50
          waitForConnections: true,
          queueLimit: 0, // 无限制队列
          connectTimeout, // 开发60秒，生产10秒
          keepAliveInitialDelay: 10000, // 10秒后开始keepalive
          enableKeepAlive: true // 启用TCP keepalive
        },
        poolSize, // TypeORM 连接池大小
        maxQueryExecutionTime: maxQueryTime, // 慢查询警告阈值
        logging: isProduction ? ['error'] : ['error', 'warn', 'query'], // 生产仅错误
        logger: 'advanced-console',
        entities: [User, Role, Permission, ProjectSpace, Project, ProjectAsset],
        // 🔥 自动重连配置
        retryAttempts, // 开发5次，生产10次
        retryDelay: 3000, // 每次重试延迟3秒
        autoLoadEntities: false, // 手动指定实体
        // 🔥 连接钩子 - 用于监控连接状态
        subscribers: [],
        migrations: []
      }
    }
  })
