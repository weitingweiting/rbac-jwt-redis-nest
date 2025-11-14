import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: 'RBAC JWT Redis Demo',
      version: '1.0.0',
      description: 'NestJS 后端管理系统脚手架',
    };
  }
}