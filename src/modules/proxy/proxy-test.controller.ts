import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common'
import { Public } from '@/modules/auth/decorators/public.decorator'

/**
 * 代理测试控制器
 * 用于开发阶段测试代理转发功能，模拟第三方服务的各种响应
 *
 * 使用方式：
 * 1. 前端配置 targetUrl: 'http://localhost:3000/api/v1/proxy-test/xxx'
 * 2. 通过代理服务转发到这些测试接口
 *
 * 注意：生产环境可以删除此控制器
 */
@Controller('proxy-test')
@Public() // 测试接口不需要认证
export class ProxyTestController {
  /**
   * 测试成功响应
   * GET /api/v1/proxy-test/success
   */
  @Get('success')
  testSuccess() {
    return {
      code: 0,
      message: '成功',
      data: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        timestamp: Date.now()
      }
    }
  }

  /**
   * 测试列表数据
   * GET /api/v1/proxy-test/list
   */
  @Get('list')
  testList() {
    return {
      code: 0,
      message: '成功',
      data: {
        total: 100,
        page: 1,
        pageSize: 10,
        items: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
          status: i % 2 === 0 ? 'active' : 'inactive'
        }))
      }
    }
  }

  /**
   * 测试慢响应（5秒）
   * GET /api/v1/proxy-test/slow
   * 用于测试超时机制
   */
  @Get('slow')
  async testSlow() {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    return {
      code: 0,
      message: '慢速响应（5秒延迟）',
      timestamp: Date.now()
    }
  }

  /**
   * 测试极慢响应（40秒）
   * GET /api/v1/proxy-test/very-slow
   * 用于测试超时和重试机制
   */
  @Get('very-slow')
  async testVerySlow() {
    await new Promise((resolve) => setTimeout(resolve, 40000))
    return {
      code: 0,
      message: '极慢响应（40秒延迟）',
      timestamp: Date.now()
    }
  }

  /**
   * 测试服务器错误
   * GET /api/v1/proxy-test/error
   */
  @Get('error')
  testError() {
    throw new HttpException('模拟服务器内部错误', HttpStatus.INTERNAL_SERVER_ERROR)
  }

  /**
   * 测试客户端错误
   * GET /api/v1/proxy-test/bad-request
   */
  @Get('bad-request')
  testBadRequest() {
    throw new HttpException('模拟请求参数错误', HttpStatus.BAD_REQUEST)
  }

  /**
   * 测试未授权错误
   * GET /api/v1/proxy-test/unauthorized
   */
  @Get('unauthorized')
  testUnauthorized() {
    throw new HttpException('模拟未授权错误', HttpStatus.UNAUTHORIZED)
  }

  /**
   * 测试 POST 请求和数据回显
   * POST /api/v1/proxy-test/echo
   */
  @Post('echo')
  testEcho(@Body() body: any) {
    return {
      code: 0,
      message: '回显请求数据',
      data: {
        receivedData: body,
        timestamp: Date.now(),
        headers: {
          contentType: 'application/json'
        }
      }
    }
  }

  /**
   * 测试创建资源
   * POST /api/v1/proxy-test/create
   */
  @Post('create')
  testCreate(@Body() body: any) {
    return {
      code: 0,
      message: '创建成功',
      data: {
        id: Math.floor(Math.random() * 10000),
        ...body,
        createdAt: new Date().toISOString()
      }
    }
  }

  /**
   * 测试随机响应时间
   * GET /api/v1/proxy-test/random
   * 响应时间：1-10秒
   */
  @Get('random')
  async testRandom() {
    const delay = Math.floor(Math.random() * 9000) + 1000 // 1-10秒
    await new Promise((resolve) => setTimeout(resolve, delay))
    return {
      code: 0,
      message: '随机延迟响应',
      data: {
        delayMs: delay,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 测试大数据响应
   * GET /api/v1/proxy-test/large-data
   * 用于测试大数据传输
   */
  @Get('large-data')
  testLargeData() {
    return {
      code: 0,
      message: '大数据响应',
      data: {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'.repeat(10),
          metadata: {
            field1: 'value1',
            field2: 'value2',
            field3: 'value3',
            nested: {
              data1: Array(100).fill('x'),
              data2: Array(100).fill('y')
            }
          }
        }))
      }
    }
  }

  /**
   * 测试随机失败（50% 概率）
   * GET /api/v1/proxy-test/unstable
   * 用于测试重试机制
   */
  @Get('unstable')
  testUnstable() {
    if (Math.random() < 0.5) {
      throw new HttpException('模拟服务不稳定', HttpStatus.SERVICE_UNAVAILABLE)
    }
    return {
      code: 0,
      message: '请求成功（这次很幸运）',
      timestamp: Date.now()
    }
  }

  /**
   * 测试分页数据
   * GET /api/v1/proxy-test/paginated?page=1&pageSize=10
   */
  @Get('paginated')
  testPaginated() {
    // 注意：这里简化了实现，实际应该从查询参数获取 page 和 pageSize
    return {
      code: 0,
      message: '成功',
      data: {
        total: 100,
        page: 1,
        pageSize: 10,
        totalPages: 10,
        items: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          title: `Title ${i + 1}`,
          content: `Content ${i + 1}`,
          author: `Author ${i + 1}`
        }))
      }
    }
  }
}
