import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm'
import { Role } from './role.entity'
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

  @Column({ unique: true })
  email!: string

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({ name: 'user_roles' })
  roles!: Role[]

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
