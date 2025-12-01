import { Entity, Column, ManyToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Role } from './role.entity'

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  code: string // e.g. 'project.create'

  @Column({ unique: true })
  name!: string

  @Column({ nullable: true })
  description!: string

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[]
}
