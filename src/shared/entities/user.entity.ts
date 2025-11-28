import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm'
import { Exclude } from 'class-transformer'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  username!: string

  @Column()
  @Exclude() // 序列化时自动排除密码字段
  password!: string

  // @Column({ unique: true })
  @Column({ nullable: true })
  email!: string

  // ✅ 使用字符串引用避免循环依赖
  @ManyToMany('Role', 'users', { eager: true })
  @JoinTable({ name: 'user_roles' })
  roles!: any[]

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
