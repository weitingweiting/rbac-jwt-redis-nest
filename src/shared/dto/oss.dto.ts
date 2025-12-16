import { IsEnum, IsOptional, IsString, IsMimeType } from 'class-validator'
import { OSSFileType } from '../config/oss.config'

/**
 * 获取 OSS 上传签名 DTO
 */
export class GetOSSSignatureDto {
  @IsOptional()
  @IsEnum(OSSFileType)
  fileType?: OSSFileType

  @IsOptional()
  @IsString()
  fileName?: string

  @IsOptional()
  @IsString()
  @IsMimeType()
  mimeType?: string
}

/**
 * OSS 回调 DTO
 */
export class OSSCallbackDto {
  @IsString()
  bucket!: string

  @IsString()
  object!: string

  @IsString()
  etag!: string

  @IsString()
  size!: string

  @IsString()
  mimeType!: string

  @IsOptional()
  @IsString()
  'imageInfo.height'?: string

  @IsOptional()
  @IsString()
  'imageInfo.width'?: string

  @IsOptional()
  @IsString()
  'imageInfo.format'?: string
}

/**
 * 更新项目封面 URL DTO
 */
export class UpdateProjectCoverDto {
  @IsString()
  projectId!: string

  @IsString()
  coverUrl!: string
}
