# 全局异常过滤器使用指南

## 架构设计

本项目采用 **职责分离** 的错误处理架构：

### 📊 组件职责划分

| 组件                    | 职责             | 何时触发       |
| ----------------------- | ---------------- | -------------- |
| **LoggingInterceptor**  | 日志记录         | 所有 HTTP 请求 |
| **HttpExceptionFilter** | 格式化 HTTP 异常 | HTTP 异常      |
| **AllExceptionsFilter** | 处理未知异常     | 非 HTTP 异常   |

### 🔄 执行流程

```
请求 → LoggingInterceptor (记录请求日志)
      ↓
      业务逻辑处理
      ↓
      异常发生？
      ├─ HTTP 异常 → HttpExceptionFilter (格式化响应)
      │                ↓
      │                LoggingInterceptor (记录错误日志)
      │
      └─ 其他异常 → AllExceptionsFilter (记录 + 格式化)
```

## 使用方法

### 1. 标准 HTTP 异常

```typescript
import { HttpException, HttpStatus } from "@nestjs/common";

// 抛出标准异常
throw new HttpException("用户不存在", HttpStatus.NOT_FOUND);

// 抛出详细异常信息
throw new HttpException(
  {
    message: "用户不存在",
    error: "USER_NOT_FOUND",
  },
  HttpStatus.NOT_FOUND
);
```

**响应格式：**

```json
{
  "success": false,
  "statusCode": 404,
  "timestamp": "2025-11-14T10:30:45.123Z",
  "path": "/api/users/123",
  "method": "GET",
  "error": "USER_NOT_FOUND",
  "message": "用户不存在"
}
```

### 2. 业务异常（推荐）

```typescript
import { BusinessException } from "../shared/exceptions/business.exception";
import { HttpStatus } from "@nestjs/common";

// 使用业务异常类
throw new BusinessException(
  "用户名已存在",
  HttpStatus.CONFLICT,
  "USERNAME_EXISTS"
);

throw new BusinessException(
  "权限不足",
  HttpStatus.FORBIDDEN,
  "PERMISSION_DENIED"
);
```

**响应格式：**

```json
{
  "success": false,
  "statusCode": 409,
  "timestamp": "2025-11-14T10:30:45.123Z",
  "path": "/api/auth/register",
  "method": "POST",
  "error": "USERNAME_EXISTS",
  "message": "用户名已存在"
}
```

### 3. NestJS 内置异常

```typescript
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

// 400 Bad Request
throw new BadRequestException("无效的请求参数");

// 401 Unauthorized
throw new UnauthorizedException("未授权访问");

// 403 Forbidden
throw new ForbiddenException("没有访问权限");

// 404 Not Found
throw new NotFoundException("资源不存在");

// 409 Conflict
throw new ConflictException("资源冲突");
```

## 日志策略

### LoggingInterceptor 记录

- ✅ 所有 HTTP 请求信息
- ✅ 所有 HTTP 响应信息（包括错误）
- ✅ 请求耗时统计
- ✅ 敏感信息脱敏（密码、token 等）

### AllExceptionsFilter 记录

- ✅ 仅记录 **未被拦截器捕获的异常**
- ✅ 数据库错误
- ✅ 未知的系统错误
- ✅ 启动时的配置错误

### 避免重复日志

```typescript
// ❌ 不好的做法 - 重复记录
@Catch(HttpException)
export class BadFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // 这里记录日志会导致重复，因为 LoggingInterceptor 已经记录了
    this.logger.error("Error occurred", exception);
  }
}

// ✅ 好的做法 - 只格式化响应
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // 只格式化响应，不记录日志
    const errorResponse = {
      success: false,
      statusCode: status,
      message: exception.message,
    };
    response.status(status).json(errorResponse);
  }
}
```

## 开发环境 vs 生产环境

### 开发环境

```json
{
  "success": false,
  "statusCode": 500,
  "timestamp": "2025-11-14T10:30:45.123Z",
  "path": "/api/users",
  "method": "GET",
  "error": "Internal Server Error",
  "message": "Cannot read property 'id' of null",
  "stack": "Error: Cannot read property 'id' of null\n    at UserService.findOne..."
}
```

### 生产环境

```json
{
  "success": false,
  "statusCode": 500,
  "timestamp": "2025-11-14T10:30:45.123Z",
  "path": "/api/users",
  "method": "GET",
  "error": "Internal Server Error",
  "message": "Internal server error"
}
```

## 示例：完整的错误处理

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../shared/entities/user.entity";
import { BusinessException } from "../shared/exceptions/business.exception";
import { HttpStatus } from "@nestjs/common";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      // 使用业务异常
      throw new BusinessException(
        `用户 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        "USER_NOT_FOUND"
      );
    }

    return user;
  }

  async create(username: string, email: string): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new BusinessException(
        "用户名已被使用",
        HttpStatus.CONFLICT,
        "USERNAME_EXISTS"
      );
    }

    // 创建用户
    const user = this.userRepository.create({ username, email });
    return await this.userRepository.save(user);
  }
}
```

## 错误码规范建议

```typescript
// shared/constants/error-codes.constant.ts
export const ErrorCodes = {
  // 认证相关 (AUTH_xxx)
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",

  // 用户相关 (USER_xxx)
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS",
  USERNAME_EXISTS: "USERNAME_EXISTS",

  // 权限相关 (PERMISSION_xxx)
  PERMISSION_DENIED: "PERMISSION_DENIED",
  ROLE_NOT_FOUND: "ROLE_NOT_FOUND",

  // 业务相关
  INVALID_INPUT: "INVALID_INPUT",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  OPERATION_FAILED: "OPERATION_FAILED",
} as const;

// 使用示例
throw new BusinessException(
  "用户不存在",
  HttpStatus.NOT_FOUND,
  ErrorCodes.USER_NOT_FOUND
);
```

## 测试异常过滤器

```bash
# 测试 HTTP 异常
curl http://localhost:3000/api/users/999

# 测试业务异常
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123"}'

# 查看日志
tail -f logs/error-*.log
tail -f logs/http-*.log
```

## 总结

✅ **LoggingInterceptor**：统一记录所有请求/响应日志  
✅ **HttpExceptionFilter**：格式化 HTTP 异常响应  
✅ **AllExceptionsFilter**：捕获并记录未知异常  
✅ **BusinessException**：标准化业务错误  
✅ **职责分离**：避免重复日志，提高性能
