import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { ProjectSpace } from './project-space.entity'
import { ProjectAsset } from './project-asset.entity'
// import { ProjectPublish } from './project-publish.entity'

// 草稿状态、已发布状态、已下架状态
export type ProjectStatus = 'draft' | 'published' | 'archived'

@Entity('projects')
export class Project extends BaseEntity {
  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ type: 'json', nullable: true })
  sceneJson: Record<string, any>

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: ProjectStatus

  @Column({ nullable: true })
  coverUrl: string

  @ManyToOne(() => ProjectSpace, (space) => space.projects)
  @JoinColumn({ name: 'project_space_id' })
  projectSpace: ProjectSpace

  @OneToMany(() => ProjectAsset, (asset) => asset.project)
  assets: ProjectAsset[]

  @Column({ type: 'timestamp', nullable: true })
  lastPublishedAt: Date

  @Column({ length: 500, nullable: true })
  publishUrl: string
}
