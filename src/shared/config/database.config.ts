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
      return {
        type: 'mysql' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        charset: 'utf8mb4',
        synchronize: nodeEnv === 'development', // 仅在开发环境自动同步
        extra: {
          connectionLimit: 10,
          waitForConnections: true,
          queueLimit: 0
        },
        logging: ['error'], // 只记录错误日志，不打印SQL查询
        logger: 'advanced-console',
        entities: [User, Role, Permission, ProjectSpace, Project, ProjectAsset]
      }
    }
  })
