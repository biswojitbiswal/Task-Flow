import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ProjectRepository } from './project.repository';
import { CreateProjectDto, FindProjectsDto, UpdateProjectDto } from './dtos/project.dto';
import { getPagination } from 'src/common/utils/pagination';


@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
  ) { }

  async create(
    organizationId: string,
    dto: CreateProjectDto,
  ) {
    return this.projectRepository.create({
      name: dto.name,
      description: dto.description,
      organization: {
        connect: {
          id: organizationId,
        },
      },
    });
  }

  async findMany(
    organizationId: string,
    dto: FindProjectsDto,
  ) {
    const { page, limit, search } = dto;

    const { skip, take } = getPagination(
      page,
      limit,
    );

    const [data, total] = await Promise.all([
      this.projectRepository.findMany(
        organizationId,
        skip,
        limit,
        search,
      ),

      this.projectRepository.count(
        organizationId,
        search,
      ),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(
    organizationId: string,
    projectId: string,
  ) {
    const project =
      await this.projectRepository.findOne(
        projectId,
        organizationId,
      );

    if (!project) {
      throw new NotFoundException({
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND',
        details: {},
      });
    }

    return project;
  }

  async update(
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {

    await this.findOne(
      organizationId,
      projectId,
    );

    return this.projectRepository.update(
      projectId,
      organizationId,
      {
        name: dto.name,
        description: dto.description,
      },
    );
  }

  async remove(
    organizationId: string,
    projectId: string,
  ) {
    // Verify tenant ownership before deleting.
    await this.findOne(
      organizationId,
      projectId,
    );

    return this.projectRepository.softDelete(
      projectId,
      organizationId
    );
  }


  async getDashboard(
    organizationId: string,
    projectId: string,
  ) {
    const project = await this.projectRepository.findOne(
      projectId,
      organizationId,
    );

    if (!project) {
      throw new NotFoundException({
        error: 'Project not found',
        code: 'PROJECT_NOT_FOUND',
        details: {},
      });
    }

    const result =
      await this.projectRepository.getTaskCountsByStatus(
        projectId,
        organizationId,
      );

    const taskCounts = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    for (const item of result.counts) {
      taskCounts[item.status] = item._count._all;
    }

    return {
      projectId,
      taskCounts,
      tasks: result.tasks
    };
  }
}