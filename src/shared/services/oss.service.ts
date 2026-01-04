import { Injectable, BadRequestException, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as OSS from 'ali-oss'
import * as crypto from 'crypto'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import {
  createOSSClient,
  generateUniqueFileName,
  getOSSDirectory,
  OSS_CONFIG,
  OSSFileType
} from '@/shared/config/oss.config'

/**
 * OSS 签名参数接口
 */
export interface IOSSSignatureParams {
  accessKeyId: string
  policy: string
  signature: string
  dir: string
  host: string
  expire: number
  callback?: string
}

/**
 * OSS 回调参数接口
 */
export interface IOSSCallbackBody {
  bucket: string
  object: string
  etag: string
  size: number
  mimeType: string
  imageInfo?: {
    height: { value: string }
    width: { value: string }
    format: { value: string }
  }
}

/**
 * 阿里云 OSS 服务
 * 提供文件上传签名、回调验证等功能
 */
@Injectable()
export class OSSService {
  private readonly client: OSS
  private readonly bucket: string
  private readonly callbackUrl: string
  private readonly localMode: boolean

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.client = createOSSClient(configService)
    this.bucket = configService.get<string>('oss.bucket')!
    this.callbackUrl = configService.get<string>('oss.callbackUrl')!
    this.localMode = configService.get<boolean>('oss.localMode')!

    if (this.localMode) {
      this.logger.warn('⚠️  OSS 本地开发模式已启用，不使用回调功能')
    }
  }

  /**
   * 生成前端直传 OSS 所需的签名参数
   * @param fileType 文件类型（决定上传到哪个目录）
   * @param fileName 原始文件名
   * @param mimeType 文件 MIME 类型
   * @returns 签名参数
   */
  async getUploadSignature(
    fileType?: OSSFileType,
    fileName?: string,
    mimeType?: string
  ): Promise<IOSSSignatureParams> {
    try {
      // 确定上传目录
      const dir = fileType || (mimeType ? getOSSDirectory(mimeType) : OSSFileType.OTHER)

      // 生成唯一文件名
      const uniqueFileName = fileName
        ? generateUniqueFileName(fileName)
        : `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      const objectKey = `${dir}/${uniqueFileName}`

      // 设置过期时间（当前时间 + 30分钟）
      const expireTime = Date.now() + OSS_CONFIG.SIGNATURE_EXPIRES * 1000
      const expiration = new Date(expireTime).toISOString()

      // 构建 Policy
      const policyText = {
        expiration,
        conditions: [
          ['content-length-range', 0, OSS_CONFIG.MAX_FILE_SIZE], // 限制文件大小
          ['starts-with', '$key', dir] // 限制上传路径
        ]
      }

      const policy = Buffer.from(JSON.stringify(policyText)).toString('base64')

      // 计算签名
      const signature = crypto
        .createHmac('sha1', this.configService.get<string>('oss.accessKeySecret')!)
        .update(policy)
        .digest('base64')

      // 获取 OSS 域名
      const region = this.configService.get<string>('oss.region')!
      const host = `https://${this.bucket}.${region}.aliyuncs.com`

      // 根据模式决定是否使用回调
      const result: IOSSSignatureParams = {
        accessKeyId: this.configService.get<string>('oss.accessKeyId')!,
        policy,
        signature,
        dir: objectKey,
        host,
        expire: Math.floor(expireTime / 1000)
      }

      // 只在非本地模式下添加回调参数
      if (!this.localMode) {
        result.callback = this.buildCallbackParams()
      }

      return result
    } catch (error) {
      this.logger.error('生成 OSS 上传签名失败', error)
      throw new BadRequestException('生成上传签名失败')
    }
  }

  /**
   * 构建 OSS 回调参数
   * @returns Base64 编码的回调参数
   */
  private buildCallbackParams(): string {
    const callbackParams = {
      callbackUrl: this.callbackUrl,
      callbackBody:
        'bucket=${bucket}&object=${object}&etag=${etag}&size=${size}&mimeType=${mimeType}&imageInfo.height=${imageInfo.height}&imageInfo.width=${imageInfo.width}&imageInfo.format=${imageInfo.format}',
      callbackBodyType: 'application/x-www-form-urlencoded'
    }

    return Buffer.from(JSON.stringify(callbackParams)).toString('base64')
  }

  /**
   * 验证 OSS 回调请求的合法性
   * @param authorizationHeader Authorization 请求头
   * @param publicKeyUrl x-oss-pub-key-url 请求头
   * @param requestUrl 请求的完整 URL
   * @param body 请求体
   * @returns 是否验证通过
   */
  async verifyOSSCallback(
    authorizationHeader: string,
    publicKeyUrl: string,
    requestUrl: string,
    body: any
  ): Promise<boolean> {
    try {
      // 1. 获取公钥
      const pubKeyUrlDecoded = Buffer.from(publicKeyUrl, 'base64').toString('utf-8')

      // 安全检查：确保公钥 URL 是阿里云官方域名
      if (!pubKeyUrlDecoded.startsWith('https://gosspublic.alicdn.com/')) {
        this.logger.warn('非法的公钥 URL', pubKeyUrlDecoded)
        return false
      }

      // 2. 构造待签名字符串
      const path = new URL(requestUrl).pathname
      const queryString = new URL(requestUrl).search.substring(1)
      const bodyString = new URLSearchParams(body).toString()
      const stringToSign = decodeURIComponent(path + queryString + '\n' + bodyString)

      // 3. 获取签名
      const signature = Buffer.from(authorizationHeader, 'base64')

      // 4. 下载公钥并验证签名
      const https = await import('https')
      return new Promise((resolve) => {
        https.get(pubKeyUrlDecoded, (res) => {
          let pubKeyData = ''
          res.on('data', (chunk) => {
            pubKeyData += chunk
          })
          res.on('end', () => {
            try {
              const verifier = crypto.createVerify('RSA-SHA1')
              verifier.update(stringToSign, 'utf-8')
              const result = verifier.verify(pubKeyData, signature)
              resolve(result)
            } catch (error) {
              this.logger.error('验证签名失败', error)
              resolve(false)
            }
          })
        })
      })
    } catch (error) {
      this.logger.error('验证 OSS 回调失败', error)
      return false
    }
  }

  /**
   * 获取文件访问 URL
   * @param objectKey OSS 对象键名
   * @param expiresInSeconds 过期时间（秒），默认 3600 秒（1小时）
   * @returns 签名 URL
   */
  async getSignedUrl(objectKey: string, expiresInSeconds: number = 3600): Promise<string> {
    try {
      return this.client.signatureUrl(objectKey, {
        expires: expiresInSeconds
      })
    } catch (error) {
      this.logger.error('生成签名 URL 失败', error)
      throw new BadRequestException('生成文件访问链接失败')
    }
  }

  /**
   * 删除 OSS 文件
   * @param objectKey OSS 对象键名
   */
  async deleteFile(objectKey: string): Promise<void> {
    try {
      await this.client.delete(objectKey)
      this.logger.info('删除 OSS 文件成功', { objectKey })
    } catch (error) {
      this.logger.error('删除 OSS 文件失败', { objectKey, error })
      throw new BadRequestException('删除文件失败')
    }
  }

  /**
   * 批量删除 OSS 文件
   * @param objectKeys OSS 对象键名数组
   */
  async deleteFiles(objectKeys: string[]): Promise<void> {
    try {
      await this.client.deleteMulti(objectKeys, { quiet: true })
      this.logger.info('批量删除 OSS 文件成功', { count: objectKeys.length })
    } catch (error) {
      this.logger.error('批量删除 OSS 文件失败', { error })
      throw new BadRequestException('批量删除文件失败')
    }
  }

  /**
   * 从完整 URL 中提取 OSS 对象键名
   * @param url 完整的 OSS URL
   * @returns 对象键名
   */
  extractObjectKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      // 去掉开头的 /
      return urlObj.pathname.substring(1)
    } catch (error) {
      this.logger.error('解析 URL 失败', error)
      throw new BadRequestException('无效的 URL 格式')
    }
  }

  /**
   * 上传文件到 OSS
   * @param objectKey OSS 对象键名（包含路径）
   * @param buffer 文件内容（Buffer）
   * @param options 上传选项
   * @returns 上传结果（包含 URL）
   */
  async uploadFile(
    objectKey: string,
    buffer: Buffer,
    options?: {
      contentType?: string
      cacheControl?: string
      headers?: Record<string, string>
    }
  ): Promise<{ url: string; name: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': options?.contentType || 'application/octet-stream',
        'Cache-Control': options?.cacheControl || 'public, max-age=31536000',
        ...(options?.headers || {})
      }

      const result = await this.client.put(objectKey, buffer, { headers })

      this.logger.info('上传文件到 OSS 成功', {
        objectKey,
        size: buffer.length,
        url: result.url
      })

      return {
        url: result.url,
        name: result.name
      }
    } catch (error) {
      this.logger.error('上传文件到 OSS 失败', { objectKey, error })
      throw new BadRequestException(`上传文件失败: ${error.message || '未知错误'}`)
    }
  }

  /**
   * 批量上传文件到 OSS
   * @param files 文件列表 { objectKey, buffer, contentType }[]
   * @returns 上传结果列表
   */
  async uploadFiles(
    files: Array<{
      objectKey: string
      buffer: Buffer
      contentType?: string
    }>
  ): Promise<Array<{ objectKey: string; url: string }>> {
    const results: Array<{ objectKey: string; url: string }> = []
    const uploadedKeys: string[] = []

    try {
      for (const file of files) {
        const result = await this.uploadFile(file.objectKey, file.buffer, {
          contentType: file.contentType
        })

        results.push({
          objectKey: file.objectKey,
          url: result.url
        })
        uploadedKeys.push(file.objectKey)
      }

      return results
    } catch (error) {
      // 上传失败，清理已上传的文件
      if (uploadedKeys.length > 0) {
        this.logger.warn('批量上传失败，清理已上传的文件', { count: uploadedKeys.length })
        await this.deleteFiles(uploadedKeys).catch((cleanupError) => {
          this.logger.error('清理失败文件时出错', cleanupError)
        })
      }
      throw error
    }
  }
}
