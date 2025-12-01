import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Project } from './project.entity'

@Entity('project_assets')
export class ProjectAsset extends BaseEntity {
  @ManyToOne(() => Project, (p) => p.assets)
  @JoinColumn({ name: 'project_id' })
  project: Project

  @Column({ length: 500 })
  url: string

  @Column({ type: 'enum', enum: ['image', 'json', 'js', 'other'], default: 'other' })
  type: 'image' | 'json' | 'js' | 'other'

  @Column({ type: 'int', nullable: true })
  size: number

  @Column({ type: 'json', nullable: true })
  meta: Record<string, any>
}
