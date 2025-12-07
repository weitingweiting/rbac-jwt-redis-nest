import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { ProjectSpace } from './project-space.entity'
import { ProjectAsset } from './project-asset.entity'
import { User } from './user.entity'

// 草稿状态、已发布状态、已下架状态
export type ProjectStatus = 'draft' | 'published' | 'archived'

@Entity('projects')
export class Project extends BaseEntity {
  @Column()
  name!: string

  @Column({ nullable: true })
  description?: string

  @Column({ type: 'json', nullable: true })
  sceneJson?: Record<string, any>

  @Column({ nullable: true })
  coverUrl?: string

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status!: ProjectStatus

  @Column({ type: 'timestamp', nullable: true })
  lastPublishedAt: Date

  @Column({ length: 500, nullable: true })
  publishUrl?: string

  // ✅ 项目 ↔ 用户：多个项目可以属于同一个用户
  @ManyToOne(() => User, (user) => user.projects, {
    onDelete: 'SET NULL', // 用户被删除时，项目的 owner_id 设为 NULL
    onUpdate: 'CASCADE', // 用户 ID 更新时，级联更新项目的 owner_id
    nullable: true
  })
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' }) // project.owner_id -> users.id
  owner?: User

  // ✅ 项目 ↔ 项目空间：多个项目属于同一个空间
  @ManyToOne(() => ProjectSpace, (space) => space.projects, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'space_id', referencedColumnName: 'id' }) // project.space_id -> project_spaces.id
  projectSpace!: ProjectSpace

  @OneToMany(() => ProjectAsset, (asset) => asset.project)
  assets?: ProjectAsset[]
}
