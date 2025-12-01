import { Entity, Column, ManyToMany, OneToMany, ManyToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from './base.entity'
import { User } from './user.entity'
import { Project } from './project.entity'

@Entity('project_spaces')
export class ProjectSpace extends BaseEntity {
  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ default: true, name: 'is_open' })
  isOpen: boolean

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'id' }) // project_spaces.owner_id -> users.id
  owner: User

  @ManyToMany(() => User, (user) => user.projectSpaces)
  users: User[]

  @OneToMany(() => Project, (p) => p.projectSpace, { cascade: true })
  projects: Project[]
}
