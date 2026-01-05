# ComponentVersions API 测试

组件版本管理接口测试套件。

## 测试文件说明

### 版本列表查询

- `01-list-versions-basic.bru` - 基础版本列表查询
- `02-list-versions-by-status.bru` - 按状态筛选（draft/published）
- `03-list-versions-latest-only.bru` - 仅查询推荐版本

### 版本详情

- `10-get-version-success.bru` - 查询版本详情（成功）
- `11-get-version-not-found.bru` - 查询不存在的版本

### 版本发布

- `20-publish-version-success.bru` - 发布版本（成功）
- `21-publish-version-already-published.bru` - 发布已发布的版本（失败）
- `22-publish-version-not-found.bru` - 发布不存在的版本（失败）

### 设置推荐版本

- `30-set-latest-success.bru` - 设置推荐版本（成功）
- `31-set-latest-draft-version.bru` - 设置草稿版本为推荐（失败）

### 删除版本

- `40-delete-version-success.bru` - 删除版本（成功）
- `41-delete-version-not-found.bru` - 删除不存在的版本

### 完整流程测试

- `100-complete-flow-test.bru` - 完整流程测试（上传→发布→推荐→删除）

## 测试前提条件

1. 数据库中需要有测试组件和版本数据
2. 用户需要有以下权限：
   - `component.read` - 查询权限
   - `component.publish` - 发布权限
   - `component.delete` - 删除权限

## 环境变量

```
baseUrl=http://localhost:3000/api
token=your_jwt_token
testComponentId=BarChart
testVersionId=1
```

## 执行顺序

建议按照文件编号顺序执行测试：

1. 先执行查询类测试（01-11）
2. 再执行操作类测试（20-41）
3. 最后执行完整流程测试（100）

## 注意事项

1. **权限检查**：确保测试用户拥有必要的权限
2. **数据隔离**：建议使用测试数据库或专用测试组件
3. **状态依赖**：某些测试依赖特定的版本状态（如发布测试需要 draft 版本）
4. **清理数据**：完整流程测试会创建和删除数据，注意清理
