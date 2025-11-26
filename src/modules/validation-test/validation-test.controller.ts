import { Controller, Post, Body } from '@nestjs/common'
import { RegisterDto } from '../auth/dto'
import { Public } from '../auth/decorators/public.decorator'

@Controller('validation-test')
export class ValidationTestController {
  /**
   * 测试验证异常的处理流程
   * POST /api/validation-test/register
   */
  @Public()
  @Post('register')
  async testValidation(@Body() registerDto: RegisterDto) {
    // 如果到达这里，说明验证已经通过
    return {
      message: '验证通过',
      data: registerDto
    }
  }
}
