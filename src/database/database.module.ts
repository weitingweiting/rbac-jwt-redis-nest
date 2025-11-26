import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../shared/entities/user.entity';
import { Role } from '../shared/entities/role.entity';
import { Permission } from '../shared/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '3306') || 3306,
      username: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'rbac_demo',
      synchronize: process.env.NODE_ENV === 'development', // 生产环境禁用
      logging: process.env.NODE_ENV === 'development',
      entities: [User, Role, Permission],
    }),
    TypeOrmModule.forFeature([User, Role, Permission]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule { }