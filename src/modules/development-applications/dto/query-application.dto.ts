import { IsOptional, IsString, IsEnum, IsInt } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationDto } from '@/shared/dto/pagination.dto'
import { DevelopmentStatus } from '../constants/development-status.enum'
import { ApplicationType } from '../constants/application-type.enum'

/**
 * 查询研发申请列表 DTO
 */
export class QueryApplicationListDto extends PaginationDto {
  @IsOptional()
  @IsEnum(DevelopmentStatus, { message: '状态值不正确' })
  status?: DevelopmentStatus

  @IsOptional()
  @IsEnum(ApplicationType, { message: '申请类型不正确' })
  applicationType?: ApplicationType

  @IsOptional()
  @IsString({ message: '组件ID必须是字符串' })
  componentId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '申请人ID必须是整数' })
  applicantId?: number

  @IsOptional()
  @IsString({ message: '关键词必须是字符串' })
  keyword?: string
}
