import { SetMetadata } from '@nestjs/common'

export const EXCLUDE_SOFT_DELETED_KEY = 'excludeSoftDeleted'
export const ExcludeSoftDeleted = () => SetMetadata(EXCLUDE_SOFT_DELETED_KEY, true)

export const INCLUDE_SOFT_DELETED_KEY = 'includeSoftDeleted'
export const IncludeSoftDeleted = () => SetMetadata(INCLUDE_SOFT_DELETED_KEY, true)
