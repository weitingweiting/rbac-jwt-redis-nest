import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '@/shared/entities/base.entity'
import { User } from '@/shared/entities/user.entity'

/**
 * 组件分类枚举配置表
 * 用于管理后台分类配置和校验分类有效性
 */
@Entity('component_categories')
@Index(['code'])
@Index(['level'])
@Index(['parentId'])
export class ComponentCategory extends BaseEntity {
  /**
   * 分类编码（唯一）
   * 如：chart, form, chart.bar, form.input
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string

  /**
   * 分类名称
   * 如：图表、表单、柱状图、输入框
   */
  @Column({ type: 'varchar', length: 100 })
  name: string

  /**
   * 分类层级
   * 1 = 一级分类, 2 = 二级分类
   */
  @Column({ type: 'tinyint' })
  level: number

  /**
   * 父分类ID（用于二级分类）
   */
  @Column({ type: 'int', nullable: true, name: 'parent_id' })
  parentId: number | null

  /**
   * 父分类关系
   */
  @ManyToOne(() => ComponentCategory, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: ComponentCategory | null

  /**
   * 分类描述
   */
  @Column({ type: 'text', nullable: true })
  description: string | null

  /**
   * 分类图标URL
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string | null

  /**
   * 排序序号
   */
  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number

  /**
   * 是否启用
   */
  @Column({ type: 'tinyint', default: 1, name: 'is_active' })
  isActive: boolean

  /**
   * 创建人ID
   */
  @Column({ type: 'int', nullable: true, name: 'created_by' })
  createdBy: number | null

  /**
   * 创建人关系
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null

  /**
   * 更新人ID
   */
  @Column({ type: 'int', nullable: true, name: 'updated_by' })
  updatedBy: number | null

  /**
   * 更新人关系
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null
}
