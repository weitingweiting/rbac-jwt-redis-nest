import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { User } from '@/shared/entities/user.entity'
import { Role } from '@/shared/entities/role.entity'
import { Permission } from '@/shared/entities/permission.entity'
import { ProjectSpace } from '@/shared/entities/project-space.entity'
import { Project } from '@/shared/entities/project.entity'
import { ProjectAsset } from '@/shared/entities/project-asset.entity'
import { ComponentCategory } from '@/shared/entities/component-category.entity'
import { Component } from '@/shared/entities/component.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'
import { DevelopmentApplication } from '@/shared/entities/development-application.entity'

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
        synchronize: nodeEnv === 'development',
        extra: {
          connectionLimit: poolSize,
          waitForConnections: true,
          queueLimit: 0,
          connectTimeout,
          keepAliveInitialDelay: 10000,
          enableKeepAlive: true
        },
        poolSize,
        maxQueryExecutionTime: maxQueryTime, // 慢查询警告阈值
        logging: isProduction ? ['error'] : ['error', 'warn'], // 生产仅错误
        logger: 'advanced-console',
        entities: [
          User,
          Role,
          Permission,
          ProjectSpace,
          Project,
          ProjectAsset,
          ComponentCategory,
          Component,
          ComponentVersion,
          DevelopmentApplication
        ],
        retryAttempts,
        retryDelay: 3000,
        autoLoadEntities: false,
        subscribers: [],
        migrations: []
      }
    }
  })
