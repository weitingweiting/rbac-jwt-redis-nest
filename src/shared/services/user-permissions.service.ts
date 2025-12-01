import { Injectable, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { User } from '../entities/user.entity'

@Injectable()
export class UserPermissionsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  /**
   * 获取用户权限列表（带缓存）
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const cacheKey = `user:${userId}:permissions`

    // 1. 尝试从缓存读取
    const cached = await this.cacheManager.get<string[]>(cacheKey)
    if (cached) {
      console.log(`✅ Cache hit for user ${userId} permissions`)
      return cached
    }

    // 2. 缓存未命中，从数据库加载
    console.log(`❌ Cache miss for user ${userId} permissions, loading from DB`)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions']
    })

    if (!user || !user.roles) {
      return []
    }

    // 3. 提取所有权限 code（使用 code 而不是 name）
    const permissions = user.roles
      .flatMap((role) => role.permissions || [])
      .map((permission) => permission.code)

    // 4. 去重（避免重复权限）
    const uniquePermissions = [...new Set(permissions)]

    // 5. 写入缓存（默认 TTL 3600秒）
    await this.cacheManager.set(cacheKey, uniquePermissions)

    return uniquePermissions
  }

  /**
   * 获取用户角色列表（带缓存）
   */
  async getUserRoles(userId: number): Promise<string[]> {
    const cacheKey = `user:${userId}:roles`

    const cached = await this.cacheManager.get<string[]>(cacheKey)
    if (cached) {
      console.log(`✅ Cache hit for user ${userId} roles`)
      return cached
    }

    console.log(`❌ Cache miss for user ${userId} roles, loading from DB`)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    })

    if (!user || !user.roles) {
      return []
    }

    const roles = user.roles.map((role) => role.name)
    await this.cacheManager.set(cacheKey, roles)

    return roles
  }

  /**
   * 清除用户权限缓存（当用户角色/权限变更时调用）
   */
  async clearUserCache(userId: number): Promise<void> {
    await this.cacheManager.del(`user:${userId}:permissions`)
    await this.cacheManager.del(`user:${userId}:roles`)
    console.log(`🗑️  Cache cleared for user ${userId}`)
  }

  /**
   * 批量清除多个用户的缓存
   */
  async clearMultipleUsersCache(userIds: number[]): Promise<void> {
    const keys = userIds.flatMap((id) => [`user:${id}:permissions`, `user:${id}:roles`])
    await Promise.all(keys.map((key) => this.cacheManager.del(key)))
    console.log(`🗑️  Cache cleared for users: ${userIds.join(', ')}`)
  }
}
