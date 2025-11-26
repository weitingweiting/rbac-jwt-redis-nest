import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm'
import { User } from './user.entity'
import { Permission } from './permission.entity'

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  name!: string

  @Column({ nullable: true })
  description!: string

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[]

  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: true })
  @JoinTable({ name: 'role_permissions' })
  permissions!: Permission[]
}
