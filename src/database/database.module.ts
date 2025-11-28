import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '@/shared/entities/user.entity'
import { Role } from '@/shared/entities/role.entity'
import { Permission } from '@/shared/entities/permission.entity'
import { getDatabaseConfig } from '@/shared/config/database.config'

@Module({
  imports: [getDatabaseConfig(), TypeOrmModule.forFeature([User, Role, Permission])],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
