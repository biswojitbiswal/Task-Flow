import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class ProjectRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({
      data,
    });
  }

  async findMany(
    organizationId: string,
    skip: number,
    take: number,
    search?: string,
  ) {
    return this.prisma.project.findMany({
      where: {
        organizationId,
        deletedAt: null,

        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      },

      orderBy: {
        createdAt: 'desc',
      },

      skip,
      take,
    });
  }

  async count(
    organizationId: string,
    search?: string,
  ) {
    return this.prisma.project.count({
      where: {
        organizationId,
        deletedAt: null,

        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      },
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ) {
    return this.prisma.project.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: Prisma.ProjectUpdateInput,
  ) {
    return this.prisma.project.update({
      where: {
        id,
        organizationId,
      },
      data,
    });
  }

  async softDelete(
    id: string,
    organizationId: string,
  ) {
    return this.prisma.project.update({
      where: {
        id,
        organizationId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getTaskCountsByStatus(
    projectId: string,
    organizationId: string,
  ) {
    const [counts, tasks] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: {
          projectId,
          organizationId,
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.task.findMany({
        where: {
          projectId,
          organizationId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          projectId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueAt: true,
          createdAt: true,
          updatedAt: true,

          assignments: {
            select: {
              id: true,
              userId: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      counts,
      tasks,
    };
  }
}