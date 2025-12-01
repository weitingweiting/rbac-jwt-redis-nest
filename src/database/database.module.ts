import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '@/shared/entities/user.entity'
import { Role } from '@/shared/entities/role.entity'
import { Permission } from '@/shared/entities/permission.entity'
import { ProjectSpace } from '@/shared/entities/project-space.entity'
import { Project } from '@/shared/entities/project.entity'
import { ProjectAsset } from '@/shared/entities/project-asset.entity'
import { getDatabaseConfig } from '@/shared/config/database.config'

@Module({
  imports: [
    getDatabaseConfig(),
    TypeOrmModule.forFeature([User, Role, Permission, ProjectSpace, Project, ProjectAsset])
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
