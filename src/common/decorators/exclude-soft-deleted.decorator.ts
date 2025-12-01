import { SetMetadata } from '@nestjs/common'

/**
 * 装饰器：标记该路由应该排除软删除的数据
 * 默认情况下，所有查询都会排除软删除的数据
 * 可以使用 @IncludeSoftDeleted() 装饰器来显式包含软删除的数据
 */
export const EXCLUDE_SOFT_DELETED_KEY = 'excludeSoftDeleted'
export const ExcludeSoftDeleted = () => SetMetadata(EXCLUDE_SOFT_DELETED_KEY, true)

/**
 * 装饰器：标记该路由应该包含软删除的数据
 */
export const INCLUDE_SOFT_DELETED_KEY = 'includeSoftDeleted'
export const IncludeSoftDeleted = () => SetMetadata(INCLUDE_SOFT_DELETED_KEY, true)
