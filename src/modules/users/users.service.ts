import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../shared/entities/user.entity';
import { BusinessException } from '../../shared/exceptions/business.exception';
import { ERROR_CODES } from '../../shared/constants/error-codes.constant';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * 获取用户列表（带分页和查询）
   */
  async findAll(
    pagination: PaginationDto,
    query: QueryUserDto,
  ): Promise<PaginatedResponseDto<User>> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission');

    // 应用查询条件
    if (query.username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${query.username}%`,
      });
    }

    if (query.email) {
      queryBuilder.andWhere('user.email LIKE :email', {
        email: `%${query.email}%`,
      });
    }

    if (query.role) {
      queryBuilder.andWhere('role.name = :roleName', {
        roleName: query.role,
      });
    }

    // 应用分页
    queryBuilder.skip(pagination.skip).take(pagination.take);

    // 执行查询
    const [users, total] = await queryBuilder.getManyAndCount();

    return new PaginatedResponseDto(
      users,
      total,
      pagination.page ?? 1,
      pagination.limit ?? 10,
    );
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new BusinessException(
        `用户 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    return user;
  }

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new BusinessException(
        '用户名已存在',
        HttpStatus.CONFLICT,
        ERROR_CODES.USERNAME_EXISTS,
      );
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new BusinessException(
        '邮箱已被使用',
        HttpStatus.CONFLICT,
        ERROR_CODES.EMAIL_IN_USE,
      );
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  /**
   * 更新用户
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // 这里会抛出 BusinessException 如果用户不存在

    // 检查用户名是否被其他用户使用
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });

      if (existingUser) {
        throw new BusinessException(
          '用户名已被其他用户使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.USERNAME_EXISTS,
        );
      }
    }

    // 检查邮箱是否被其他用户使用
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingEmail) {
        throw new BusinessException(
          '邮箱已被其他用户使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.EMAIL_IN_USE,
        );
      }
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  /**
   * 删除用户
   */
  async delete(id: number): Promise<void> {
    const user = await this.findOne(id); // 这里会抛出 BusinessException 如果用户不存在

    // 检查是否是最后一个管理员
    const userRoles = user.roles || [];
    const isAdmin = userRoles.some(role => role.name === 'admin');

    if (isAdmin) {
      const adminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :roleName', { roleName: 'admin' })
        .getCount();

      if (adminCount <= 1) {
        throw new BusinessException(
          '无法删除最后一个管理员账户',
          HttpStatus.FORBIDDEN,
          ERROR_CODES.CANNOT_DELETE_LAST_ADMIN
        );
      }
    }

    await this.userRepository.delete(id);
  }
}