import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Inject,
  Req
} from '@nestjs/common'
import { OSSService } from '@/shared/services/oss.service'
import { GetOSSSignatureDto, OSSCallbackDto } from '@/shared/dto/oss.dto'
import { Public } from '@/modules/auth/decorators/public.decorator'
import { Request } from 'express'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { ConfigService } from '@nestjs/config'

/**
 * OSS 对象存储控制器
 */
@Controller('oss')
export class OSSController {
  constructor(
    private readonly ossService: OSSService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 获取 OSS 上传签名
   * GET /api/oss/signature?fileType=images&fileName=test.jpg&mimeType=image/jpeg
   */
  @Get('signature')
  async getUploadSignature(@Query() query: GetOSSSignatureDto) {
    this.logger.info('获取上传签名', { query })
    return await this.ossService.getUploadSignature(query.fileType, query.fileName, query.mimeType)
  }

  /**
   * OSS 上传回调接口
   * POST /api/oss/callback
   */
  @Post('callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleOSSCallback(
    @Body() body: OSSCallbackDto,
    @Headers('authorization') authorization: string,
    @Headers('x-oss-pub-key-url') pubKeyUrl: string,
    @Req() req: Request
  ) {
    this.logger.info('📞 收到 OSS 回调', {
      object: body.object,
      size: body.size,
      mimeType: body.mimeType
    })

    const requestUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    const isValid = await this.ossService.verifyOSSCallback(
      authorization,
      pubKeyUrl,
      requestUrl,
      body
    )

    if (!isValid) {
      this.logger.warn('❌ OSS 回调验证失败')
      throw new BadRequestException('回调验证失败')
    }

    this.logger.info('✅ 签名验证通过')

    // const fileUrl = `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
    const region = this.configService.get<string>('oss.region')!
    const bucket = this.configService.get<string>('oss.bucket')!
    const fileUrl = `https://${bucket}.${region}.aliyuncs.com/${body.object}`
    const response = {
      success: true,
      data: {
        // 基础信息
        url: fileUrl,
        objectKey: body.object,
        size: parseInt(body.size),
        mimeType: body.mimeType,

        // 图片信息（如果是图片）
        imageInfo: body['imageInfo.width']
          ? {
              width: parseInt(body['imageInfo.width'] || '0'),
              height: parseInt(body['imageInfo.height'] || '0'),
              format: body['imageInfo.format']
            }
          : undefined

        // uploadedAt: new Date().toISOString(),
        // cdnUrl: `https://cdn.example.com/${body.object}`,
        // thumbnailUrl: `${fileUrl}?x-oss-process=image/resize,w_200`
      }
    }

    this.logger.info('✅ OSS 回调处理成功，返回数据给前端', { response })

    return response
  }
}
