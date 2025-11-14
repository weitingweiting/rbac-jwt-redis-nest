import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';
import { BaseResponseDto } from './shared/dto/base-response.dto';

@Controller()
export class AppController {
  @Get()
  @Public()
  getHello(): BaseResponseDto<any> {
    return BaseResponseDto.success(
      {
        name: 'RBAC JWT Redis Demo',
        version: '1.0.0',
        description: 'NestJS RBAC + JWT + Redis 后端管理系统',
      },
      'API 运行正常'
    );
  }

  @Get('health')
  @Public()
  healthCheck(): BaseResponseDto<any> {
    return BaseResponseDto.success(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      '系统健康检查'
    );
  }
}