import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用 Winston 作为全局日志器
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

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
