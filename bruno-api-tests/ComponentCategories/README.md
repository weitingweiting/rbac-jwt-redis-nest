# ComponentCategories API 测试

组件分类管理接口测试套件。

## 测试文件说明

### 分类树查询

- `01-get-category-tree.bru` - 获取完整分类树

### 分类列表

- `02-list-categories-basic.bru` - 基础分类列表
- `03-list-categories-by-level.bru` - 按层级筛选

### 分类详情

- `10-get-category-success.bru` - 查询分类详情

### 创建分类

- `20-create-category-level1.bru` - 创建一级分类
- `21-create-category-level2.bru` - 创建二级分类
- `22-create-category-duplicate-code.bru` - 创建重复编码（失败）

### 更新分类

- `30-update-category-success.bru` - 更新分类

### 删除分类

- `40-delete-category-success.bru` - 删除分类

## 测试前提条件

1. 数据库中需要有分类数据
2. 用户需要有以下权限：
   - `component.read` - 查询权限
   - `component.create` - 创建/更新权限
   - `component.delete` - 删除权限

## 环境变量

```
baseUrl=http://localhost:3000/api
token=your_jwt_token
testCategoryId=1
testParentCategoryId=1
```

## 分类结构说明

### 层级关系

- **一级分类**（level=1）: 如 "图表"、"表单"、"容器"
  - 无 parentId
  - 可以有多个子分类
- **二级分类**（level=2）: 如 "柱状图"、"折线图"
  - 必须有 parentId
  - 指向一个一级分类

### 分类编码规范

建议使用点号分隔：

- 一级分类: `chart`, `form`, `container`
- 二级分类: `chart.bar`, `chart.line`, `form.input`

## 执行顺序

建议按照文件编号顺序执行测试：

1. 先执行查询类测试（01-10）
2. 再执行创建测试（20-22）
3. 最后执行更新和删除测试（30-40）

## 注意事项

1. **权限检查**：确保测试用户拥有管理员权限
2. **数据依赖**：创建二级分类前需要先有一级分类
3. **删除限制**：一级分类下有子分类时不能删除
4. **编码唯一性**：分类编码不能重复
