import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * 树形结构深度级别
 */
export enum LeafLevel {
  /** 只返回一级分类 */
  Level1 = 'Level1',
  /** 返回一、二级分类 */
  Level2 = 'Level2',
  /** 返回一、二级分类、组件 */
  Level3 = 'Level3',
  /** 返回一、二级分类、组件、版本（完整数据） */
  Level4 = 'Level4'
}

/**
 * 组件总览查询 DTO
 * 用于管理员页面的树形表格展示
 */
export class ComponentOverviewDto {
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  keyword?: string

  @IsOptional()
  @IsString({ message: '筛选状态必须是字符串' })
  status?: 'draft' | 'published' | 'latest'

  @IsOptional()
  @IsEnum(LeafLevel, { message: '树形深度必须是 Level1, Level2, Level3 或 Level4' })
  @Transform(({ value }) => value || LeafLevel.Level4)
  leaf?: LeafLevel
}

/**
 * 画布场景组件总览查询 DTO
 *
 * 可见性策略：
 * - 默认返回所有 published 版本
 * - includeDrafts=true 时，额外返回当前用户的 draft 版本
 *
 * 过滤策略：
 * - 只返回有可见版本的组件
 * - 只返回有可见组件的分类
 */
export class CanvasOverviewDto {
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  keyword?: string

  @IsOptional()
  @IsString({ message: '一级分类必须是字符串' })
  classificationLevel1?: string

  @IsOptional()
  @IsString({ message: '二级分类必须是字符串' })
  classificationLevel2?: string

  /**
   * 是否包含当前用户的 draft 版本
   * 用于开发者调试场景
   */
  @IsOptional()
  @IsBoolean({ message: 'includeDrafts 必须是布尔值' })
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    if (typeof value === 'boolean') return value
    return value
  })
  includeDrafts?: boolean
}

/**
 * 画布场景版本节点（精简版）
 */
export interface ICanvasVersionNode {
  key: string
  type: 'version'
  id: number
  version: string
  status: string
  isLatest: boolean
  entryUrl?: string
  styleUrl?: string
  previewUrl?: string
}

/**
 * 画布场景组件节点（精简版）
 */
export interface ICanvasComponentNode {
  key: string
  type: 'component'
  componentId: string
  name: string
  displayName: string
  description?: string
  thumbnailUrl?: string
  children: ICanvasVersionNode[]
}

/**
 * 画布场景分类节点
 */
export interface ICanvasCategoryNode {
  key: string
  type: 'category'
  level: number
  id: number
  code: string
  name: string
  icon?: string
  children: (ICanvasCategoryNode | ICanvasComponentNode)[]
}

/**
 * 画布场景树节点类型
 */
export type CanvasOverviewTreeNode = ICanvasCategoryNode | ICanvasComponentNode | ICanvasVersionNode

/**
 * 树节点类型
 */
export type OverviewNodeType = 'category' | 'component' | 'version'

/**
 * 分类节点
 */
export interface ICategoryNode {
  key: string
  type: 'category'
  level: number
  id: number
  code: string
  name: string
  icon?: string
  description?: string
  sortOrder: number
  children?: (ICategoryNode | IComponentNode)[]
}

/**
 * 组件节点
 */
export interface IComponentNode {
  key: string
  type: 'component'
  componentId: string // 主键
  name: string
  displayName: string
  description?: string
  classificationLevel1: string
  classificationLevel1Name: string
  classificationLevel2: string
  classificationLevel2Name: string
  createdBy?: number | null
  createdAt: string
  updatedAt: string
  publishedVersionCount: number
  totalVersionCount: number
  children?: IVersionNode[]
}

/**
 * 版本节点
 */
export interface IVersionNode {
  key: string
  type: 'version'
  id: number
  version: string
  status: string // draft | published | deprecated | archived
  isLatest: boolean
  fileSize?: number
  entryUrl?: string
  styleUrl?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

/**
 * Overview 响应类型
 */
export type OverviewTreeNode = ICategoryNode | IComponentNode | IVersionNode
