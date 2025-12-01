# 📖 API 接口文档

完整的 REST API 接口说明。

## 📋 基础信息

- **Base URL**: `http://localhost:3000/api`
- **版本**: v1
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

## 🔐 认证相关

### 注册

**POST** `/auth/register`

创建新用户账户。

**请求体：**

```json
{
  "username": "testuser",
  "password": "Test123"
}
```

**响应：**

```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "testuser",
      "avatarUrl": null
    }
  }
}
```

### 登录

**POST** `/auth/login`

用户登录获取 Token。

**请求体：**

```json
{
  "username": "admin",
  "password": "Admin123"
}
```

**响应：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
    }
  }
}
```

### 获取个人信息

**GET** `/auth/profile`

🔒 需要认证

**请求头：**

```
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    "roles": [
      {
        "id": 1,
        "name": "admin",
        "description": "系统管理员，拥有所有权限"
      }
    ]
  }
}
```

### 刷新 Token

**POST** `/auth/refresh`

🔒 需要认证

使用 refresh token 获取新的 access token。

**请求体：**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 登出

**POST** `/auth/logout`

🔒 需要认证

将当前 Token 加入黑名单。

**请求头：**

```
Authorization: Bearer <token>
```

**响应：**

```json
{
  "code": 200,
  "message": "登出成功"
}
```

## 👤 用户管理

### 获取用户列表

**GET** `/users`

🔒 需要权限：`user.read`

**查询参数：**

- `page` - 页码（默认：1）
- `limit` - 每页数量（默认：10）
- `username` - 用户名搜索（模糊匹配）
- `role` - 角色筛选

**示例：**

```
GET /users?page=1&limit=10&username=admin
```

**响应：**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "avatarUrl": "https://...",
        "createdAt": "2025-11-30T00:00:00.000Z",
        "roles": [
          {
            "id": 1,
            "name": "admin"
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 获取单个用户

**GET** `/users/:id`

🔒 需要权限：`user.read`

**响应：**

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "admin",
    "avatarUrl": "https://...",
    "createdAt": "2025-11-30T00:00:00.000Z",
    "updatedAt": "2025-11-30T00:00:00.000Z",
    "roles": [...]
  }
}
```

### 创建用户

**POST** `/users`

🔒 需要权限：`user.create`

**请求体：**

```json
{
  "username": "newuser",
  "password": "Pass123",
  "avatarUrl": "https://...",
  "roleIds": [2, 3]
}
```

**响应：**

```json
{
  "code": 201,
  "message": "用户创建成功",
  "data": {
    "id": 4,
    "username": "newuser",
    "avatarUrl": "https://...",
    "roles": [...]
  }
}
```

### 更新用户

**PUT** `/users/:id`

🔒 需要权限：`user.read`, `user.update`

**请求体：**

```json
{
  "avatarUrl": "https://new-avatar.com/...",
  "roleIds": [2]
}
```

**响应：**

```json
{
  "code": 200,
  "message": "用户更新成功",
  "data": {
    "id": 4,
    "username": "newuser",
    "avatarUrl": "https://new-avatar.com/...",
    "roles": [...]
  }
}
```

### 删除用户

**DELETE** `/users/:id`

🔒 需要权限：`user.delete`

软删除用户（可恢复）。

**响应：**

```json
{
  "code": 200,
  "message": "用户删除成功"
}
```

## 🎭 角色管理

### 获取角色列表

**GET** `/roles`

🔒 需要权限：`role.read`

**响应：**

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "description": "系统管理员，拥有所有权限",
      "permissions": [
        {
          "id": 1,
          "code": "user.read",
          "name": "查看用户"
        },
        ...
      ]
    }
  ]
}
```

### 获取单个角色

**GET** `/roles/:id`

🔒 需要权限：`role.read`

### 创建角色

**POST** `/roles`

🔒 需要权限：`role.create`

**请求体：**

```json
{
  "name": "moderator",
  "description": "内容审核员",
  "permissionIds": [1, 2, 3, 17, 18]
}
```

### 更新角色

**PUT** `/roles/:id`

🔒 需要权限：`role.update`

**请求体：**

```json
{
  "description": "更新后的描述",
  "permissionIds": [1, 2, 3, 4]
}
```

### 更新角色权限

**PUT** `/roles/:id/permissions`

🔒 需要权限：`role.update`

**请求体：**

```json
{
  "permissionIds": [1, 2, 3, 17, 18, 19, 20]
}
```

### 删除角色

**DELETE** `/roles/:id`

🔒 需要权限：`role.delete`

## 🔑 权限管理

### 获取权限列表

**GET** `/permissions`

🔒 需要权限：`permission.read`

**响应：**

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "code": "user.read",
      "name": "查看用户",
      "description": "查看用户列表和详情"
    },
    {
      "id": 2,
      "code": "user.create",
      "name": "创建用户",
      "description": "创建新用户"
    },
    ...
  ]
}
```

### 获取单个权限

**GET** `/permissions/:id`

🔒 需要权限：`permission.read`

### 创建权限

**POST** `/permissions`

🔒 需要权限：`permission.create`

**请求体：**

```json
{
  "code": "document.export",
  "name": "导出文档",
  "description": "导出文档为 PDF 或 Word 格式"
}
```

### 更新权限

**PUT** `/permissions/:id`

🔒 需要权限：`permission.update`

### 删除权限

**DELETE** `/permissions/:id`

🔒 需要权限：`permission.delete`

## 🏢 项目空间管理

### 获取项目空间列表

**GET** `/project-spaces`

🔒 需要权限：`project-space.read`

**查询参数：**

- `page` - 页码
- `limit` - 每页数量
- `isOpen` - 是否开放（true/false）

**响应：**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "示例项目空间",
        "description": "这是一个示例项目空间",
        "isOpen": true,
        "owner": {
          "id": 1,
          "username": "admin"
        },
        "projects": [...]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 获取单个项目空间

**GET** `/project-spaces/:id`

🔒 需要权限：`project-space.read`

### 创建项目空间

**POST** `/project-spaces`

🔒 需要权限：`project-space.create`

**请求体：**

```json
{
  "name": "我的项目空间",
  "description": "项目空间描述",
  "isOpen": true
}
```

### 更新项目空间

**PUT** `/project-spaces/:id`

🔒 需要权限：`project-space.update`

### 添加用户到项目空间

**PUT** `/project-spaces/:id/users`

🔒 需要权限：`project-space.update`

**请求体：**

```json
{
  "userIds": [2, 3, 4]
}
```

### 从项目空间移除用户

**DELETE** `/project-spaces/:id/users/:userId`

🔒 需要权限：`project-space.update`

### 删除项目空间

**DELETE** `/project-spaces/:id`

🔒 需要权限：`project-space.delete`

## 📁 项目管理

### 获取项目列表

**GET** `/projects`

🔒 需要权限：`project.read`

**查询参数：**

- `page` - 页码
- `limit` - 每页数量
- `status` - 状态筛选（draft, published, archived）
- `projectSpaceId` - 项目空间ID

**响应：**

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "示例项目",
        "description": "项目描述",
        "status": "draft",
        "coverUrl": "https://picsum.photos/800/600",
        "sceneJson": {
          "version": "1.0",
          "elements": []
        },
        "projectSpace": {
          "id": 1,
          "name": "示例项目空间"
        }
      }
    ],
    "total": 1
  }
}
```

### 获取单个项目

**GET** `/projects/:id`

🔒 需要权限：`project.read`

### 创建项目

**POST** `/projects`

🔒 需要权限：`project.create`

**请求体：**

```json
{
  "name": "新项目",
  "description": "项目描述",
  "status": "draft",
  "coverUrl": "https://...",
  "sceneJson": {
    "version": "1.0",
    "elements": []
  },
  "projectSpaceId": 1
}
```

### 更新项目

**PUT** `/projects/:id`

🔒 需要权限：`project.update`

### 发布项目

**PUT** `/projects/:id/publish`

🔒 需要权限：`project.publish`

将项目状态设置为 `published`。

### 归档项目

**PUT** `/projects/:id/archive`

🔒 需要权限：`project.update`

将项目状态设置为 `archived`。

### 删除项目

**DELETE** `/projects/:id`

🔒 需要权限：`project.delete`

## 📎 项目资源管理

### 获取项目资源列表

**GET** `/project-assets`

🔒 需要权限：`project-asset.read`

**查询参数：**

- `projectId` - 项目ID（必需）
- `type` - 资源类型（image, video, audio, document）

### 获取单个项目资源

**GET** `/project-assets/:id`

🔒 需要权限：`project-asset.read`

### 创建项目资源

**POST** `/project-assets`

🔒 需要权限：`project-asset.create`

**请求体：**

```json
{
  "url": "https://...",
  "type": "image",
  "size": 102400,
  "meta": {
    "width": 1920,
    "height": 1080
  },
  "projectId": 1
}
```

### 更新项目资源

**PUT** `/project-assets/:id`

🔒 需要权限：`project-asset.update`

### 删除项目资源

**DELETE** `/project-assets/:id`

🔒 需要权限：`project-asset.delete`

## 🚨 错误响应格式

### 400 Bad Request（参数验证失败）

```json
{
  "code": 400,
  "message": "username 字段不能为空",
  "error": "VALIDATION_ERROR",
  "timestamp": "2025-11-30T00:00:00.000Z"
}
```

### 401 Unauthorized（未认证）

```json
{
  "code": 401,
  "message": "未授权访问",
  "error": "UNAUTHORIZED",
  "timestamp": "2025-11-30T00:00:00.000Z"
}
```

### 403 Forbidden（无权限）

```json
{
  "code": 403,
  "message": "权限不足",
  "error": "FORBIDDEN",
  "timestamp": "2025-11-30T00:00:00.000Z"
}
```

### 404 Not Found（资源不存在）

```json
{
  "code": 404,
  "message": "用户不存在",
  "error": "NOT_FOUND",
  "timestamp": "2025-11-30T00:00:00.000Z"
}
```

### 500 Internal Server Error（服务器错误）

```json
{
  "code": 500,
  "message": "服务器内部错误",
  "error": "INTERNAL_ERROR",
  "timestamp": "2025-11-30T00:00:00.000Z"
}
```

## 📝 注意事项

1. **认证**：除了公开接口（register, login），其他接口都需要在请求头中携带 Token：

   ```
   Authorization: Bearer <your-access-token>
   ```

2. **权限**：每个接口都有对应的权限要求，请确保当前用户拥有相应权限。

3. **分页**：列表接口默认分页，`page` 从 1 开始，默认 `limit` 为 10。

4. **软删除**：删除操作默认为软删除，数据不会真正从数据库移除，可通过管理接口恢复。

5. **ID 类型**：所有 ID 参数都是数字类型。

## 🧪 测试

推荐使用 Bruno 进行 API 测试，项目中已包含完整的测试集合：

```bash
# 打开 Bruno
cd bruno-api-tests

# 按顺序执行测试
Auth/ → Users/ → RBAC/
```

## 📚 相关文档

- [快速开始](./快速开始.md)
- [开发指南](./开发指南.md)
- [项目结构](./项目结构.md)
- [部署指南](./部署指南.md)
