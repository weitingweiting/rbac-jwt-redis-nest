import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm'
import { Exclude } from 'class-transformer'
import { BaseEntity } from './base.entity'
import { Role } from './role.entity'
import { ProjectSpace } from './project-space.entity'
import { Project } from './project.entity'

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username!: string

  @Column()
  @Exclude() // 序列化时自动排除密码字段
  password!: string

  @Column({ nullable: true })
  avatarUrl?: string

  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: 'user_roles' })
  roles?: Role[]

  @ManyToMany(() => ProjectSpace, (space) => space.users)
  @JoinTable({ name: 'user_project_spaces' })
  projectSpaces?: ProjectSpace[]

  @OneToMany(() => Project, (project) => project.owner)
  projects?: Project[]
}
