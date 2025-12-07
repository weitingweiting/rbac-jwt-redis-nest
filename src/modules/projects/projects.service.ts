import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from '@/shared/entities/project.entity'
import { ProjectSpace } from '@/shared/entities/project-space.entity'
import { BaseService } from '@/common/services/base.service'
import { BusinessException } from '@/shared/exceptions/business.exception'
import { ERROR_CODES } from '@/shared/constants/error-codes.constant'
import { CreateProjectDto, UpdateProjectDto, QueryProjectDto } from './dto/project.dto'
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto'

@Injectable()
export class ProjectsService extends BaseService<Project> {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectSpace)
    private projectSpaceRepository: Repository<ProjectSpace>
  ) {
    super(projectRepository)
  }

  /**
   * 获取项目列表（带分页和查询）
   */
  async findAllWithPagination(
    query: QueryProjectDto,
    userId?: number
  ): Promise<PaginatedResponseDto<Project>> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.projectSpace', 'space')
      .leftJoinAndSelect('project.assets', 'assets')
      .where('project.deletedAt IS NULL')

    if (query.name) {
      queryBuilder.andWhere('project.name LIKE :name', {
        name: `%${query.name}%`
      })
    }

    if (query.status) {
      queryBuilder.andWhere('project.status = :status', { status: query.status })
    }

    if (query.projectSpaceId) {
      // 如果提供了 projectSpaceId，只返回该空间下的项目
      queryBuilder.andWhere('space.id = :spaceId', { spaceId: query.projectSpaceId })
    } else if (userId) {
      // 如果提供了 userId，只返回该用户拥有或参与的项目（告诉前端不要传递projectSpaceId）
      queryBuilder
        .leftJoin('space.users', 'spaceUser')
        .andWhere('(owner.id = :userId OR spaceUser.id = :userId)', { userId })
    }

    queryBuilder.skip(query.skip).take(query.take)

    const [projects, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(projects, total, query.page ?? 1, query.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个项目
   */
  async findOneProject(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['projectSpace', 'assets'],
      withDeleted: false
    })

    if (!project) {
      throw new BusinessException(
        `项目 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    return project
  }

  /**
   * 创建项目
   */
  async createProject(createDto: CreateProjectDto, userId: number): Promise<Project> {
    const { projectSpaceId, ...projectData } = createDto

    // 检查项目空间是否存在
    const projectSpace = await this.projectSpaceRepository.findOne({
      where: { id: projectSpaceId },
      withDeleted: false
    })

    if (!projectSpace) {
      throw new BusinessException(
        '项目空间不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    const projectNameExists = await this.projectRepository.findOne({
      where: { name: createDto.name, projectSpace: { id: projectSpaceId } },
      withDeleted: false
    })

    if (projectNameExists) {
      throw new BusinessException(
        '同一项目空间下已存在相同名称的项目',
        HttpStatus.CONFLICT,
        ERROR_CODES.RESOURCE_ALREADY_EXISTS
      )
    }

    const project = this.projectRepository.create({
      ...projectData,
      projectSpace,
      owner: { id: userId }
    })

    return this.projectRepository.save(project)
  }

  /**
   * 更新项目
   */
  async updateProject(id: number, updateDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOneProject(id)
    const { projectSpaceId, ...projectData } = updateDto

    // 如果要更新项目空间
    if (projectSpaceId && projectSpaceId !== project.projectSpace.id) {
      const projectSpace = await this.projectSpaceRepository.findOne({
        where: { id: projectSpaceId },
        withDeleted: false
      })

      if (!projectSpace) {
        throw new BusinessException(
          '项目空间不存在',
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESOURCE_NOT_FOUND
        )
      }

      project.projectSpace = projectSpace
    }

    Object.assign(project, projectData)
    return this.projectRepository.save(project)
  }

  /**
   * 发布项目
   */
  async publishProject(id: number, publishUrl?: string): Promise<Project> {
    const project = await this.findOneProject(id)

    project.status = 'published'
    project.lastPublishedAt = new Date()

    if (publishUrl) {
      project.publishUrl = publishUrl
    }

    return this.projectRepository.save(project)
  }

  /**
   * 归档项目
   */
  async archiveProject(id: number): Promise<Project> {
    const project = await this.findOneProject(id)

    project.status = 'archived'

    return this.projectRepository.save(project)
  }

  /**
   * 软删除项目
   */
  async deleteProject(id: number): Promise<void> {
    await this.findOneProject(id)
    await this.projectRepository.softDelete(id)
  }
}
