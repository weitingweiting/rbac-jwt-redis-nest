import { Entity, Column, ManyToMany, JoinTable } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Permission } from './permission.entity'
import { User } from './user.entity'

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name!: string

  @Column({ nullable: true })
  description!: string

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({ name: 'role_permissions' })
  permissions!: Permission[]

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[]
}
