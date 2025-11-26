import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用 Winston 作为全局日志器
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 全局验证管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动过滤掉 DTO 中未定义的属性
      whitelist: true,
      // 当发现非白名单属性时抛出错误
      forbidNonWhitelisted: true,
      // 自动转换类型（例如：将字符串 "1" 转换为数字 1）
      transform: true,
      // 启用隐式类型转换
      transformOptions: {
        enableImplicitConversion: true,
      },
      // 在验证失败时禁止未知值
      forbidUnknownValues: true,
      // 详细错误信息
      disableErrorMessages: false,
      // 验证组
      validationError: {
        target: false, // 不返回目标对象
        value: false,  // 不返回值
      },
    }),
  );

  // 启用 CORS
  app.enableCors();

  // 全局前缀
  app.setGlobalPrefix('api');

  await app.listen(3000);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log('Application is running on: http://localhost:3000', 'Bootstrap');
  logger.log('API endpoint: http://localhost:3000/api', 'Bootstrap');
}
bootstrap();
