import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm'
import { User } from '@/shared/entities/user.entity'
import { ComponentVersion } from '@/shared/entities/component-version.entity'

/**
 * 组件主表
 * 存储组件的基本信息，信息完全由 component.meta.json 决定
 *
 * 注意：
 * 1. 使用 componentId 作为主键（string），不继承 BaseEntity
 * 2. componentId 作为主键保证全局唯一，不可重复
 * 3. 组件本身不再有状态字段，状态管理通过版本表（component_versions）实现
 * - publishedVersionCount > 0：表示组件有可用版本（相当于已发布状态）
 * - publishedVersionCount = 0：表示组件无可用版本（相当于草稿状态）
 */
@Entity('components')
@Index(['componentId'], { unique: true }) // 明确标注唯一索引（主键已保证唯一）
@Index(['classificationLevel1', 'classificationLevel2'])
@Index(['publishedVersionCount']) // 用于查询可用组件
export class Component {
  /**
   * 组件唯一标识（对应 meta.json 的 id 字段）- 主键
   * 如：BarChart, LineChart
   * 注意：此字段为主键，保证全局唯一，不可重复
   */
  @PrimaryColumn({ type: 'varchar', length: 100, name: 'component_id', unique: true })
  componentId: string

  /**
   * 组件中文名称（对应 meta.json 的 name 字段）
   * 如：柱状图、折线图
   */
  @Column({ type: 'varchar', length: 100 })
  name: string

  /**
   * 组件描述
   */
  @Column({ type: 'text', nullable: true })
  description: string | null

  /**
   * 一级分类标识
   * 如：chart, table, form
   */
  @Column({ type: 'varchar', length: 50, name: 'classification_level1' })
  classificationLevel1: string

  /**
   * 二级分类标识
   * 如：bar, line, pie
   */
  @Column({ type: 'varchar', length: 50, name: 'classification_level2' })
  classificationLevel2: string

  /**
   * 一级分类显示名称
   * 如：图表、表单
   */
  @Column({ type: 'varchar', length: 100, name: 'classification_level1_name' })
  classificationLevel1Name: string

  /**
   * 二级分类显示名称
   * 如：柱状图、折线图
   */
  @Column({ type: 'varchar', length: 100, name: 'classification_level2_name' })
  classificationLevel2Name: string

  /**
   * 组件缩略图URL（从最新版本的 preview 提取）
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_url' })
  thumbnailUrl: string | null

  /**
   * 是否官方组件
   */
  @Column({ type: 'tinyint', default: 0, name: 'is_official' })
  isOfficial: boolean

  /**
   * 总使用次数
   */
  @Column({ type: 'int', default: 0, name: 'used_count' })
  usedCount: number

  /**
   * 版本数量
   */
  @Column({ type: 'int', default: 0, name: 'version_count' })
  versionCount: number

  /**
   * 已发布版本数量（缓存字段，用于查询优化）
   * - 当 publishedVersionCount > 0 时，表示组件有可用版本
   * - 当 publishedVersionCount = 0 时，表示组件无可用版本（类似草稿状态）
   */
  @Column({ type: 'int', default: 0, name: 'published_version_count' })
  publishedVersionCount: number

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

  /**
   * 组件版本列表
   */
  @OneToMany(() => ComponentVersion, (version) => version.component)
  versions: ComponentVersion[]

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  /**
   * 更新时间
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  /**
   * 软删除时间
   */
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date
}
