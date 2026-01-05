# Components API Tests

组件管理模块的 API 测试套件。

## 测试覆盖

### 1. 查询测试 (01-04)

- ✅ 基础列表查询（分页）
- ✅ 关键词搜索
- ✅ 分类筛选
- ✅ 已发布版本筛选

### 2. 详情测试 (10-11)

- ✅ 获取组件详情（成功）
- ✅ 组件不存在（404）

### 3. 上传测试 (20-24)

- ✅ 上传新组件（成功）
- ✅ 文件过大（413）
- ✅ 文件类型错误（400）
- ✅ 缺少 meta.json（400）
- ✅ 上传新版本（更新现有组件）

### 4. 删除测试 (40-42)

- ✅ 删除组件（成功）
- ✅ 组件不存在（404）
- ✅ 有已发布版本（400）

### 5. 完整流程测试 (100)

- ✅ 端到端测试

## 权限要求

测试执行需要以下权限：

- `component.read` - 查询和详情接口
- `component.create` - 上传接口
- `component.delete` - 删除接口

建议使用 admin 角色用户执行测试。

## 测试准备

### 1. 准备测试文件

创建符合规范的组件 ZIP 包，包含以下结构：

```
test-component.zip
├── component.meta.json    # 必需：组件元数据
├── dist/
│   ├── index.esm.js      # 必需：入口文件
│   └── style.css         # 可选：样式文件
└── assets/
    └── preview.png       # 可选：预览图
```

### 2. component.meta.json 示例

```json
{
  "id": "TestBarChart",
  "name": "测试柱状图",
  "version": "1.0.0",
  "description": "用于测试的柱状图组件",
  "classification": {
    "level1": "chart",
    "level2": "bar",
    "level1Name": "图表",
    "level2Name": "柱状图"
  },
  "files": {
    "entry": "dist/index.esm.js",
    "style": "dist/style.css",
    "preview": "assets/preview.png"
  },
  "build": {
    "buildTool": "vite",
    "buildTime": "2026-01-04T10:00:00.000Z"
  },
  "type": "react",
  "framework": "React 18",
  "author": {
    "organization": "测试团队",
    "username": "tester"
  },
  "license": "MIT"
}
```

### 3. 环境变量配置

确保在 Bruno 环境中配置了以下变量：

```
baseUrl: http://localhost:3000
token: <your-auth-token>
```

## 执行测试

### 方式一：单独执行

在 Bruno 中逐个运行测试文件。

### 方式二：批量执行

1. 先执行登录测试获取 token
2. 按文件编号顺序执行
3. 注意某些测试依赖前置测试的结果

### 方式三：完整流程

直接运行 `100-complete-flow-test.bru`，它会保存必要的变量供后续测试使用。

## 常见问题

### 1. 401 Unauthorized

检查 token 是否有效：

- 重新登录获取新 token
- 检查 token 是否正确设置在环境变量中

### 2. 403 Forbidden

检查权限配置：

- 确认用户角色有对应权限
- 查看数据库 role_permissions 表

### 3. 上传失败 400

检查 ZIP 文件：

- 确保包含 component.meta.json
- 确保 meta.json 格式正确
- 检查必填字段是否完整

### 4. 删除失败 400

如果提示"有已发布版本无法删除"：

- 这是预期行为
- 先取消发布所有版本
- 或使用草稿状态的组件测试删除

## 注意事项

1. **测试数据清理**：测试后记得清理测试数据
2. **文件路径**：修改测试中的文件路径为实际路径
3. **组件ID冲突**：确保测试组件ID不与生产数据冲突
4. **权限检查**：某些测试需要特定权限才能执行
5. **版本控制**：上传新版本时注意版本号递增

## 扩展测试

如需添加更多测试场景，参考现有测试文件格式：

```
meta {
  name: 测试名称
  type: http
  seq: 编号
}

get/post/put/delete {
  url: {{baseUrl}}/api/components/...
  body: none/json/multipartForm
  auth: bearer
}

tests {
  test("测试描述", function() {
    // 断言逻辑
  });
}
```
