import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from './entities/user.entity'
import { Role } from './entities/role.entity'
import { Permission } from './entities/permission.entity'
import { UserPermissionsService } from './services/user-permissions.service'
import { TokenBlacklistService } from './services/token-blacklist.service'

/**
 * 共享模块
 * 统一管理跨模块共享的 services，避免重复注册导致多实例问题
 *
 * 导出的服务：
 * - UserPermissionsService: 用户权限查询服务（带缓存）
 * - TokenBlacklistService: Token 黑名单服务
 */
@Module({
  imports: [
    // 注册实体以供 services 使用
    TypeOrmModule.forFeature([User, Role, Permission])
  ],
  providers: [UserPermissionsService, TokenBlacklistService],
  exports: [UserPermissionsService, TokenBlacklistService]
})
export class SharedModule {}
