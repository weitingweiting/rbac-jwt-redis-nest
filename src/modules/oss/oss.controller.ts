import {
  Controller,
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
import { OSSService } from '../../shared/services/oss.service'
import { GetOSSSignatureDto, OSSCallbackDto } from '../../shared/dto/oss.dto'
import { Public } from '../auth/decorators/public.decorator'
import { Request } from 'express'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '../../shared/entities/project.entity'
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
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}

  /**
   * 获取 OSS 上传签名
   * GET /api/oss/signature?fileType=imgs&fileName=test.jpg&mimeType=image/jpeg
   */
  @Post('signature')
  async getUploadSignature(@Query() query: GetOSSSignatureDto) {
    this.logger.info('获取上传签名', { query })
    return await this.ossService.getUploadSignature(query.fileType, query.fileName, query.mimeType)
  }

  /**
   * OSS 上传回调接口
   * POST /api/oss/callback
   *
   * 🔄 流程说明：
   * 1. 前端上传文件到 OSS（携带 callback 参数）
   * 2. OSS 保存文件成功后，自动调用此接口
   * 3. 此接口验证签名、处理业务逻辑、返回响应
   * 4. OSS 将此接口的响应原样转发给前端
   *
   * ⚠️ 关键点：
   * - 前端收到的响应是此接口返回的 JSON，不是 OSS 的 XML
   * - 这里可以执行入库、更新关联业务等操作
   * - 保证数据一致性：上传成功 = 业务处理完成
   *
   * 📖 详细说明：docs/为什么需要OSS回调.md
   */
  @Post('callback')
  @Public() // OSS 回调不需要认证（使用签名验证代替 JWT）
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

    // ============================================
    // 步骤 1：验证回调签名（防止伪造请求）
    // ============================================
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

    // ============================================
    // 步骤 2：构建完整的文件 URL
    // ============================================
    // ⚠️ 重要说明：
    // 1. OSS 只返回 object key（如 imgs/xxx.jpg），不返回完整URL
    // 2. 后端需要根据 bucket + region + object 构建完整访问地址
    // 3. 必须使用 https 协议（OSS 服务器强制要求，与本地开发环境无关）
    // 4. 如果不使用回调（本地模式），前端需要自己构建URL：
    //    const fileUrl = `https://${bucket}.${region}.aliyuncs.com/${objectKey}`
    const region = this.configService.get<string>('oss.region')!
    const bucket = this.configService.get<string>('oss.bucket')!
    const fileUrl = `https://${bucket}.${region}.aliyuncs.com/${body.object}`

    // ============================================
    // 步骤 3：业务逻辑处理（根据需求扩展）
    // ============================================

    // 🔥 TODO: 这里可以添加业务逻辑
    //
    // 示例 1：入库保存文件记录
    // await this.fileRepository.save({
    //   objectKey: body.object,
    //   url: fileUrl,
    //   size: parseInt(body.size),
    //   mimeType: body.mimeType,
    //   uploadedBy: body['x:userId'],  // 前端传的自定义参数
    //   projectId: body['x:projectId']
    // })
    //
    // 示例 2：自动更新项目封面
    // if (body['x:projectId']) {
    //   await this.projectRepository.update(
    //     body['x:projectId'],
    //     { coverUrl: fileUrl }
    //   )
    // }
    //
    // 示例 3：异步生成缩略图
    // if (body.mimeType.startsWith('image/')) {
    //   await this.queueService.add('generate-thumbnail', {
    //     objectKey: body.object,
    //     width: 200,
    //     height: 200
    //   })
    // }
    //
    // 示例 4：更新用户存储使用量
    // if (body['x:userId']) {
    //   await this.userService.incrementStorageUsage(
    //     body['x:userId'],
    //     parseInt(body.size)
    //   )
    // }

    // ============================================
    // 步骤 4：构建响应数据
    // ============================================
    // 📦 这个响应会被 OSS 原样转发给前端
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

        // 🔥 TODO: 可以添加业务数据
        // uploadedAt: new Date().toISOString(),
        // cdnUrl: `https://cdn.example.com/${body.object}`,
        // thumbnailUrl: `${fileUrl}?x-oss-process=image/resize,w_200`
      }
    }

    this.logger.info('✅ OSS 回调处理成功，返回数据给前端', { response })

    // ⚠️ 重要：OSS 会将此响应原样返回给前端
    // 前端的 await fetch(ossUrl) 拿到的就是这个 JSON
    return response
  }

  /**
   * 更新项目封面 URL
   * POST /api/oss/update-project-cover
   */
  @Post('update-project-cover')
  async updateProjectCover(@Body() body: { projectId: string; coverUrl: string }) {
    const { projectId, coverUrl } = body

    // 查找项目
    const project = await this.projectRepository.findOne({ where: { id: parseInt(projectId) } })
    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    // 如果项目已有封面，删除旧的封面文件
    if (project.coverUrl) {
      try {
        const oldObjectKey = this.ossService.extractObjectKeyFromUrl(project.coverUrl)
        await this.ossService.deleteFile(oldObjectKey)
        this.logger.info('删除旧封面', { oldObjectKey })
      } catch (error) {
        this.logger.warn('删除旧封面失败', { error })
        // 不抛出异常，继续更新
      }
    }

    // 更新封面 URL
    project.coverUrl = coverUrl
    await this.projectRepository.save(project)

    this.logger.info('更新项目封面成功', { projectId })
    return {
      success: true,
      message: '封面更新成功',
      data: { coverUrl }
    }
  }

  /**
   * 删除项目封面
   * POST /api/oss/delete-project-cover
   */
  @Post('delete-project-cover')
  async deleteProjectCover(@Body() body: { projectId: string }) {
    const { projectId } = body

    const project = await this.projectRepository.findOne({ where: { id: parseInt(projectId) } })
    if (!project) {
      throw new BadRequestException('项目不存在')
    }

    if (!project.coverUrl) {
      throw new BadRequestException('项目没有封面')
    }

    // 删除 OSS 文件
    const objectKey = this.ossService.extractObjectKeyFromUrl(project.coverUrl)
    await this.ossService.deleteFile(objectKey)

    // 清空封面 URL
    project.coverUrl = undefined
    await this.projectRepository.save(project)

    this.logger.info('删除项目封面成功', { projectId })
    return {
      success: true,
      message: '封面删除成功'
    }
  }
}
