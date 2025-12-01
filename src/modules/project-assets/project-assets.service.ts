import { Injectable, HttpStatus } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProjectAsset } from '../../shared/entities/project-asset.entity'
import { Project } from '../../shared/entities/project.entity'
import { BaseService } from '../../common/services/base.service'
import { BusinessException } from '../../shared/exceptions/business.exception'
import { ERROR_CODES } from '../../shared/constants/error-codes.constant'
import {
  CreateProjectAssetDto,
  UpdateProjectAssetDto,
  QueryProjectAssetDto
} from './dto/project-asset.dto'
import { PaginationDto } from '../../shared/dto/pagination.dto'
import { PaginatedResponseDto } from '../../shared/dto/paginated-response.dto'

@Injectable()
export class ProjectAssetsService extends BaseService<ProjectAsset> {
  constructor(
    @InjectRepository(ProjectAsset)
    private projectAssetRepository: Repository<ProjectAsset>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>
  ) {
    super(projectAssetRepository)
  }

  /**
   * 获取项目资源列表（带分页和查询）
   */
  async findAllWithPagination(
    pagination: PaginationDto,
    query: QueryProjectAssetDto
  ): Promise<PaginatedResponseDto<ProjectAsset>> {
    const queryBuilder = this.projectAssetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.project', 'project')
      .where('asset.deletedAt IS NULL')

    if (query.projectId) {
      queryBuilder.andWhere('project.id = :projectId', { projectId: query.projectId })
    }

    if (query.type) {
      queryBuilder.andWhere('asset.type = :type', { type: query.type })
    }

    queryBuilder.skip(pagination.skip).take(pagination.take)

    const [assets, total] = await queryBuilder.getManyAndCount()

    return new PaginatedResponseDto(assets, total, pagination.page ?? 1, pagination.limit ?? 10)
  }

  /**
   * 根据 ID 查找单个项目资源
   */
  async findOneAsset(id: number): Promise<ProjectAsset> {
    const asset = await this.projectAssetRepository.findOne({
      where: { id },
      relations: ['project'],
      withDeleted: false
    })

    if (!asset) {
      throw new BusinessException(
        `项目资源 ID ${id} 不存在`,
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    return asset
  }

  /**
   * 根据项目ID查找所有资源
   */
  async findByProjectId(projectId: number): Promise<ProjectAsset[]> {
    return this.projectAssetRepository.find({
      where: { project: { id: projectId } },
      withDeleted: false
    })
  }

  /**
   * 创建项目资源
   */
  async createAsset(createDto: CreateProjectAssetDto): Promise<ProjectAsset> {
    const { projectId, ...assetData } = createDto

    // 检查项目是否存在
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      withDeleted: false
    })

    if (!project) {
      throw new BusinessException(
        '项目不存在',
        HttpStatus.NOT_FOUND,
        ERROR_CODES.RESOURCE_NOT_FOUND
      )
    }

    const asset = this.projectAssetRepository.create({
      ...assetData,
      project
    })

    return this.projectAssetRepository.save(asset)
  }

  /**
   * 更新项目资源
   */
  async updateAsset(id: number, updateDto: UpdateProjectAssetDto): Promise<ProjectAsset> {
    const asset = await this.findOneAsset(id)
    const { projectId, ...assetData } = updateDto

    // 如果要更新项目关联
    if (projectId && projectId !== asset.project.id) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
        withDeleted: false
      })

      if (!project) {
        throw new BusinessException(
          '项目不存在',
          HttpStatus.NOT_FOUND,
          ERROR_CODES.RESOURCE_NOT_FOUND
        )
      }

      asset.project = project
    }

    Object.assign(asset, assetData)
    return this.projectAssetRepository.save(asset)
  }

  /**
   * 软删除项目资源
   */
  async deleteAsset(id: number): Promise<void> {
    await this.findOneAsset(id)
    await this.projectAssetRepository.softDelete(id)
  }

  /**
   * 批量删除项目的所有资源
   */
  async deleteByProjectId(projectId: number): Promise<void> {
    const assets = await this.findByProjectId(projectId)
    const assetIds = assets.map((asset) => asset.id)

    if (assetIds.length > 0) {
      await this.projectAssetRepository.softDelete(assetIds)
    }
  }
}
