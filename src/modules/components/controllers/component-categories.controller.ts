import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common'
import { ComponentCategoriesService } from '../services/component-categories.service'
import {
  CreateComponentCategoryDto,
  UpdateComponentCategoryDto,
  QueryComponentCategoryDto
} from '../dto/component-category.dto'
import { RequirePermissions } from '@/shared/decorators/permissions.decorator'
import { PermissionsGuard } from '@/shared/guards/permissions.guard'

/**
 * 组件分类管理控制器
 *
 * 提供分类的查询、创建、更新、删除等功能
 * 注意：分类主要用于组件的组织和筛选，前端上传时不需要选择分类（由 meta.json 决定）
 */
@Controller('component-categories')
@UseGuards(PermissionsGuard)
export class ComponentCategoriesController {
  constructor(private readonly categoriesService: ComponentCategoriesService) {}

  /**
   * 获取分类树结构
   * GET /api/component-categories/tree
   *
   * 返回完整的分类树（一级分类 + 二级分类）
   * 主要用于：
   * 1. 前端组件列表的分类筛选下拉框
   * 2. 分类管理页面的树形展示
   *
   * 权限：所有登录用户可访问
   */
  @Get('tree')
  @RequirePermissions('component.read')
  async getCategoryTree() {
    const tree = await this.categoriesService.getCategoryTree()

    return {
      message: '获取分类树成功',
      data: tree
    }
  }

  /**
   * 获取分类列表（分页）
   * GET /api/component-categories
   *
   * 支持查询参数：
   * - code: 分类编码（模糊搜索）
   * - name: 分类名称（模糊搜索）
   * - level: 分类层级（1或2）
   * - parentId: 父分类ID
   * - isActive: 是否启用
   * - page, limit: 分页参数
   *
   * 主要用于分类管理页面
   */
  @Get()
  @RequirePermissions('component.read')
  async findAll(@Query() query: QueryComponentCategoryDto) {
    const result = await this.categoriesService.findAllWithPagination(query)

    return {
      message: '获取分类列表成功',
      ...result
    }
  }

  /**
   * 获取分类详情
   * GET /api/component-categories/:id
   *
   * @param id - 分类ID（数据库主键，number）
   */
  @Get(':id')
  @RequirePermissions('component.read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOneCategory(id)

    return {
      message: '获取分类详情成功',
      data: category
    }
  }

  /**
   * 创建分类
   * POST /api/component-categories
   *
   * 请求体示例：
   * {
   *   "code": "chart.bar",
   *   "name": "柱状图",
   *   "level": 2,
   *   "parentId": 1,
   *   "description": "各类柱状图组件",
   *   "sortOrder": 1,
   *   "isActive": true
   * }
   *
   * 验证规则：
   * - 一级分类（level=1）不能有 parentId
   * - 二级分类（level=2）必须有 parentId，且父分类必须是一级分类
   * - 分类编码不能重复
   *
   * 权限：需要管理员权限
   */
  @Post()
  @RequirePermissions('component.create')
  async create(@Body() createDto: CreateComponentCategoryDto) {
    const category = await this.categoriesService.createCategory(createDto)

    return {
      message: '创建分类成功',
      data: category
    }
  }

  /**
   * 更新分类
   * PUT /api/component-categories/:id
   *
   * @param id - 分类ID（数据库主键，number）
   * @param updateDto - 更新数据（部分字段）
   *
   * 可更新字段：
   * - name: 分类名称
   * - description: 描述
   * - icon: 图标
   * - sortOrder: 排序
   * - isActive: 是否启用
   *
   * 注意：不建议修改 code、level、parentId（会影响已有组件）
   */
  @Put(':id')
  @RequirePermissions('component.create')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateComponentCategoryDto
  ) {
    const category = await this.categoriesService.updateCategory(id, updateDto)

    return {
      message: '更新分类成功',
      data: category
    }
  }

  /**
   * 删除分类（软删除）
   * DELETE /api/component-categories/:id
   *
   * 删除前检查：
   * 1. 如果是一级分类，不能有子分类
   * 2. 不能有组件使用该分类（待实现）
   *
   * 注意：这是软删除，数据不会真正删除
   *
   * @param id - 分类ID（数据库主键，number）
   */
  @Delete(':id')
  @RequirePermissions('component.delete')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.deleteCategory(id)

    return {
      message: '删除分类成功'
    }
  }
}
