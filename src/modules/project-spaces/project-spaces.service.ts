import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { BaseService } from '@/common/services/base.service'
import { PaginationDto } from '@/shared/dto/pagination.dto'
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { User } from '@/shared/entities/user.entity'
import { ProjectSpace } from '@/shared/entities/project-space.entity'
import {
  CreateProjectSpaceDto,
  UpdateProjectSpaceDto,
  QueryProjectSpaceDto
} from './dto/project-space.dto'

@Injectable()
export class ProjectSpacesService extends BaseService<ProjectSpace> {
  constructor(
    @InjectRepository(ProjectSpace)
    private projectSpaceRepository: Repository<ProjectSpace>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {
    super(projectSpaceRepository)
  }

  /**
   * 获取项目空间列表（带分页和查询）
   */
  async findAllWithPagination(
    pagination: PaginationDto,
    query: QueryProjectSpaceDto,
    userId?: number
  ): Promise<PaginatedResponseDto<ProjectSpace>> {
    const queryBuilder = this.projectSpaceRepository
      .createQueryBuilder('space')
      .leftJoinAndSelect('space.owner', 'owner')
      .leftJoinAndSelect('space.users', 'users')
      .leftJoinAndSelect('space.projects', 'projects')
      // .leftJoinAndSelect('projects.assets', 'assets')
      .where('space.deletedAt IS NULL')

    if (query.name) {
      queryBuilder.andWhere('space.name LIKE :name', {
        name: `%${query.name}%`
      })
    }

    if (query.isOpen !== undefined) {
      queryBuilder.andWhere('space.isOpen = :isOpen', { isOpen: query.isOpen })
    }

    // 如果提供了 userId，只返回该用户拥有或参与的空间
    if (userId) {
      queryBuilder.andWhere('(space.owner.id = :userId OR users.id = :userId)', { userId })
    }

    queryBuilder.skip(pagination.skip).take(pagination.take)

    const [spaces, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(spaces, total, pagination.page ?? 1, pagination.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个项目空间
   */
  async findOneSpace(id: number): Promise<ProjectSpace> {
    const space = await this.projectSpaceRepository.findOne({
      where: { id },
      relations: ['owner', 'users', 'projects'],
      withDeleted: false
    })

    if (!space) {
      throw new BusinessException(
        `项目空间 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    return space
  }

  /**
   * 创建项目空间
   */
  async createSpace(createDto: CreateProjectSpaceDto, ownerId: number): Promise<ProjectSpace> {
    // 检查空间名是否已存在
    const existingSpace = await this.projectSpaceRepository.findOne({
      where: { name: createDto.name },
      withDeleted: false
    })

    if (existingSpace) {
      throw new BusinessException(
        '项目空间名称已存在',
        HttpStatus.CONFLICT,
        ERROR_CODES.RESOURCE_CONFLICT
      )
    }

    // 查找所有者
    const owner = await this.userRepository.findOne({
      where: { id: ownerId },
      withDeleted: false
    })

    if (!owner) {
      throw new BusinessException('所有者不存在', HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND)
    }

    const space = this.projectSpaceRepository.create({
      ...createDto,
      owner
    })

    return this.projectSpaceRepository.save(space)
  }

  /**
   * 更新项目空间
   */
  async updateSpace(id: number, updateDto: UpdateProjectSpaceDto): Promise<ProjectSpace> {
    const space = await this.findOneSpace(id)

    // 检查空间名是否被其他空间使用
    if (updateDto.name && updateDto.name !== space.name) {
      const existingSpace = await this.projectSpaceRepository.findOne({
        where: { name: updateDto.name },
        withDeleted: false
      })

      if (existingSpace) {
        throw new BusinessException(
          '项目空间名称已被使用',
          HttpStatus.CONFLICT,
          ERROR_CODES.RESOURCE_CONFLICT
        )
      }
    }

    Object.assign(space, updateDto)
    return this.projectSpaceRepository.save(space)
  }

  /**
   * 添加用户到项目空间
   */
  async addUsersToSpace(id: number, userIds: number[]): Promise<ProjectSpace> {
    const space = await this.findOneSpace(id)

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      withDeleted: false
    })

    if (users.length !== userIds.length) {
      throw new BusinessException(
        '部分用户ID不存在',
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.USER_NOT_FOUND
      )
    }

    // 合并现有用户和新用户，去重
    const existingUserIds = (space.users || []).map((u) => u.id)
    const newUsers = users.filter((u) => !existingUserIds.includes(u.id))
    space.users = [...(space.users || []), ...newUsers]

    return this.projectSpaceRepository.save(space)
  }

  /**
   * 从项目空间移除用户
   */
  async removeUserFromSpace(id: number, userId: number): Promise<ProjectSpace> {
    const space = await this.findOneSpace(id)

    space.users = (space.users || []).filter((u) => u.id !== userId)

    return this.projectSpaceRepository.save(space)
  }

  /**
   * 软删除项目空间
   */
  async deleteSpace(id: number): Promise<void> {
    await this.findOneSpace(id)
    await this.projectSpaceRepository.softDelete(id)
  }

  /**
   * 验证用户是否有权访问该空间（是所有者或成员）
   */
  async validateUserAccess(spaceId: number, userId: number): Promise<boolean> {
    const space = await this.findOneSpace(spaceId)

    const isOwner = space.owner.id === userId
    const isMember = (space.users || []).some((u) => u.id === userId)

    return isOwner || isMember
  }
}
