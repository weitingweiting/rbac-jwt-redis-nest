import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm'

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  name!: string

  @Column({ nullable: true })
  description!: string

  // ✅ 使用字符串引用避免循环依赖
  @ManyToMany('Role', 'permissions')
  roles!: any[]
}
