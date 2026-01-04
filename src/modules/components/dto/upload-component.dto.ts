import { IsOptional, IsString } from 'class-validator'

/**
 * 上传组件 DTO
 * 文件通过 @UploadedFile() 装饰器获取
 */
export class UploadComponentDto {
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  remarks?: string
}

/**
 * 组件上传结果 DTO
 */
export class UploadComponentResultDto {
  componentId!: string
  componentName!: string
  version!: string
  status!: string
  message!: string
  warnings?: string[]
}
