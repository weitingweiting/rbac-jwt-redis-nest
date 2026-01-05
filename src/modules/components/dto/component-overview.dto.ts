import { IsOptional, IsString } from 'class-validator'

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
}

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
