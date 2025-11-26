# Bruno API 测试集合

这个目录包含了完整的 API 测试集合，用于测试 RBAC + JWT + Redis Demo 项目的所有 API 接口。

## 目录结构

```
bruno-api-tests/
├── bruno.json              # Bruno 集合配置
├── environments/           # 环境变量配置
│   └── Local.bru          # 本地开发环境变量
├── Auth/                  # 认证相关测试
│   ├── 01-register-success.bru
│   ├── 02-register-username-short.bru
│   ├── 03-register-username-invalid.bru
│   ├── 04-register-email-invalid.bru
│   ├── 05-register-password-short.bru
│   ├── 06-register-password-weak.bru
│   ├── 10-login-success.bru
│   ├── 11-login-wrong-username.bru
│   ├── 12-login-wrong-password.bru
│   ├── 20-profile-success.bru
│   ├── 21-profile-no-token.bru
│   ├── 30-refresh-success.bru
│   ├── 40-logout-success.bru
│   └── 100-complete-flow-test.bru
├── Users/                 # 用户管理测试
│   ├── 01-list-users-basic.bru
│   ├── 02-list-users-by-username.bru
│   ├── 03-list-users-invalid-page.bru
│   ├── 10-get-user-success.bru
│   ├── 11-get-user-not-found.bru
│   ├── 20-create-user-success.bru
│   ├── 21-create-user-validation-error.bru
│   ├── 30-update-user-success.bru
│   └── 40-delete-user-success.bru
└── RBAC/                  # 权限控制测试
    ├── 01-admin-route-success.bru
    ├── 02-profile-permission.bru
    ├── 03-editor-route.bru
    ├── 04-advanced-permissions.bru
    ├── 10-clear-cache.bru
    ├── 11-force-logout.bru
    └── 20-no-token-access.bru
```

## 使用说明

### 1. 安装 Bruno

从 [Bruno 官网](https://usebruno.com/) 下载并安装 Bruno 客户端。

### 2. 导入集合

1. 打开 Bruno 应用
2. 点击 "Open Collection"
3. 选择 `bruno-api-tests` 文件夹
4. Bruno 会自动识别并加载测试集合

### 3. 配置环境

1. 在 Bruno 中选择 "Local" 环境
2. 确保环境变量配置正确：
   - `baseUrl`: http://localhost:3000/api
   - `authBaseUrl`: http://localhost:3000/api/auth
   - `usersBaseUrl`: http://localhost:3000/api/users

### 4. 运行测试

#### 推荐的测试顺序

1. **首先运行登录测试** (`Auth/10-login-success.bru`)

   - 这会获取并保存 JWT Token 到环境变量中
   - 后续需要认证的测试会使用这个 Token

2. **运行认证测试** (`Auth/` 文件夹)

   - 测试用户注册、登录、获取信息等功能
   - 验证各种输入验证错误

3. **运行用户管理测试** (`Users/` 文件夹)

   - 测试用户 CRUD 操作
   - 验证分页、查询等功能

4. **运行权限测试** (`RBAC/` 文件夹)
   - 测试角色和权限控制
   - 验证访问控制逻辑

### 5. 测试特性

#### 自动化 Token 管理

- 登录成功后自动保存 Token 到环境变量
- 刷新 Token 后自动更新环境变量
- 需要认证的请求自动使用保存的 Token

#### 断言验证

- HTTP 状态码验证
- 响应体结构验证
- 错误信息验证
- 业务逻辑验证

#### 测试脚本

- Pre-request 脚本：请求前的数据准备
- Post-response 脚本：响应后的数据处理和环境变量更新

## 环境变量

| 变量名         | 说明          | 示例值                          |
| -------------- | ------------- | ------------------------------- |
| `baseUrl`      | API 基础地址  | http://localhost:3000/api       |
| `authBaseUrl`  | 认证 API 地址 | http://localhost:3000/api/auth  |
| `usersBaseUrl` | 用户 API 地址 | http://localhost:3000/api/users |
| `token`        | JWT 访问令牌  | 自动设置                        |
| `adminToken`   | 管理员令牌    | 自动设置                        |

## 测试覆盖范围

### 认证模块 (Auth)

- ✅ 用户注册（成功和各种验证错误）
- ✅ 用户登录（成功和失败场景）
- ✅ 获取用户信息（需要认证）
- ✅ 刷新 Token
- ✅ 用户登出

### 用户管理模块 (Users)

- ✅ 获取用户列表（分页、查询、验证）
- ✅ 获取单个用户信息
- ✅ 创建用户（验证和权限）
- ✅ 更新用户信息
- ✅ 删除用户

### 权限控制模块 (RBAC)

- ✅ 管理员专用路由
- ✅ 需要特定权限的路由
- ✅ 角色权限验证
- ✅ 缓存和登出管理
- ✅ 未授权访问拒绝

## 注意事项

1. **确保后端服务运行**

   ```bash
   cd ..
   npm run start:dev
   ```

2. **确保数据库正常**

   - MySQL 服务正在运行
   - Redis 服务正在运行
   - 数据已正确初始化

3. **测试数据**

   - 某些测试会创建测试数据
   - 某些测试可能会修改或删除数据
   - 建议在测试环境中运行

4. **并发测试**
   - Bruno 支持并发运行测试
   - 注意测试之间的依赖关系
   - 登录测试应该首先运行

## 迁移说明

这些测试是从以下 HTTP 文件迁移而来：

- `api-test-auth-validation.http`
- `api-test-users-validation.http`
- `api-test-validation.http`
- `api-test.http`

迁移的改进：

- 更好的组织结构和命名
- 自动化的 Token 管理
- 详细的断言验证
- 支持测试脚本
- 环境变量管理
- 测试报告和结果验证
