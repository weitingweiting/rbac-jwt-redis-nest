import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from '@/shared/entities/base.entity'
import { User } from '@/shared/entities/user.entity'
import { Component } from '@/shared/entities/component.entity'

/**
 * 组件版本表
 * 存储组件的版本信息和 OSS 资源路径
 */
@Entity('component_versions')
@Index(['componentId'])
@Index(['status'])
@Index(['isLatest'])
@Index(['buildTime'])
@Index(['componentId', 'version'], { unique: true })
export class ComponentVersion extends BaseEntity {
  /**
   * 关联的组件ID（外键，引用 Component.componentId）
   * 注意：这是 string 类型，直接引用 Component 的主键 componentId
   */
  @Column({ type: 'varchar', length: 100, name: 'component_id' })
  componentId: string

  /**
   * 组件关系
   */
  @ManyToOne(() => Component, (component) => component.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'component_id', referencedColumnName: 'componentId' })
  component: Component

  /**
   * 语义化版本号
   * 如：1.0.0, 2.1.3
   */
  @Column({ type: 'varchar', length: 50 })
  version: string

  /**
   * 主入口文件名
   * 如：index.esm.js
   */
  @Column({ type: 'varchar', length: 255, name: 'entry_file' })
  entryFile: string

  /**
   * 样式文件名（可选）
   * 如：style.css
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'style_file' })
  styleFile: string | null

  /**
   * 预览图文件名
   * 如：assets/preview.png
   */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'preview_file' })
  previewFile: string | null

  /**
   * OSS 基础路径
   * 如：components/BarChart/1.0.0/
   */
  @Column({ type: 'varchar', length: 500, name: 'oss_base_path' })
  ossBasePath: string

  /**
   * 主文件完整URL
   */
  @Column({ type: 'varchar', length: 500, name: 'entry_url' })
  entryUrl: string

  /**
   * 样式文件完整URL（可选）
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'style_url' })
  styleUrl: string | null

  /**
   * 预览图完整URL（可选）
   */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'preview_url' })
  previewUrl: string | null

  /**
   * 构建时间
   */
  @Column({ type: 'timestamp', name: 'build_time' })
  buildTime: Date

  /**
   * 文件哈希值（用于缓存控制）
   */
  @Column({ type: 'varchar', length: 64, name: 'build_hash' })
  buildHash: string

  /**
   * CLI 版本号
   */
  @Column({ type: 'varchar', length: 50, name: 'cli_version' })
  cliVersion: string

  /**
   * 组件模板类型（此版本专属）
   * 如：vue-echarts, vue-component, js
   * 注意：不同版本可能使用不同的构建方式
   */
  @Column({ type: 'varchar', length: 50 })
  type: string

  /**
   * 开发框架（此版本专属）
   * 如：vue3, vue2, react
   * 注意：组件可能在不同版本中升级技术栈
   */
  @Column({ type: 'varchar', length: 50 })
  framework: string

  /**
   * 作者组织名称（此版本专属）
   * 注意：维护者可能在不同版本中变更
   */
  @Column({ type: 'varchar', length: 200, nullable: true, name: 'author_organization' })
  authorOrganization: string | null

  /**
   * 作者用户名（此版本专属）
   * 注意：维护者可能在不同版本中变更
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'author_username' })
  authorUsername: string | null

  /**
   * 许可证（此版本专属）
   * 如：MIT, Apache-2.0
   * 注意：许可证可能在不同版本中变更
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  license: string | null

  /**
   * 总文件大小（字节）
   */
  @Column({ type: 'bigint', nullable: true, name: 'file_size' })
  fileSize: number | null

  /**
   * 资源清单（所有文件列表，JSON 格式）
   */
  @Column({ type: 'json', nullable: true, name: 'assets_manifest' })
  assetsManifest: any

  /**
   * 完整的 meta.json 内容（备份）
   */
  @Column({ type: 'json', name: 'meta_json' })
  metaJson: any

  /**
   * 版本状态
   * draft = 草稿, published = 已发布, deprecated = 已弃用, archived = 已下架
   */
  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string

  /**
   * 是否最新版本（推荐版本）
   */
  @Column({ type: 'tinyint', default: 0, name: 'is_latest' })
  isLatest: boolean

  /**
   * 是否稳定版本
   */
  @Column({ type: 'tinyint', default: 0, name: 'is_stable' })
  isStable: boolean

  /**
   * 发布时间
   */
  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date | null

  /**
   * 更新日志
   */
  @Column({ type: 'text', nullable: true })
  changelog: string | null

  /**
   * 创建人ID（支持数字ID或字符串ID）
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'created_by' })
  createdBy: number | string | null

  /**
   * 创建人关系
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null

  /**
   * 更新人ID（支持数字ID或字符串ID）
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'updated_by' })
  updatedBy: number | string | null

  /**
   * 更新人关系
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User | null
}
