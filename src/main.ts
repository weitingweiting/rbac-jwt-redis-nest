import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS
  app.enableCors();
  
  // 全局前缀
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('API endpoint: http://localhost:3000/api');
}
bootstrap();
