import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm'

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  name!: string

  @Column({ nullable: true })
  description!: string

  // ✅ 使用字符串引用避免循环依赖
  @ManyToMany('User', 'roles')
  users!: any[]

  // ✅ 使用字符串引用避免循环依赖
  @ManyToMany('Permission', 'roles', { eager: true })
  @JoinTable({ name: 'role_permissions' })
  permissions!: any[]
}
