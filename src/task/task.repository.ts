import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class TaskRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    private buildWhere(
        organizationId: string,
        search?: string,
        status?: Prisma.TaskWhereInput['status'],
        priority?: Prisma.TaskWhereInput['priority'],
        assigneeId?: string,
        dueFrom?: Date,
        dueTo?: Date,
    ): Prisma.TaskWhereInput {
        return {
            organizationId,
            deletedAt: null,

            ...(search && {
                OR: [
                    {
                        title: {
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

            ...(status && {
                status,
            }),

            ...(priority && {
                priority,
            }),

            ...(assigneeId && {
                assignments: {
                    some: {
                        userId: assigneeId,
                    },
                },
            }),

            ...(dueFrom || dueTo
                ? {
                    dueAt: {
                        ...(dueFrom && {
                            gte: dueFrom,
                        }),
                        ...(dueTo && {
                            lte: dueTo,
                        }),
                    },
                }
                : {}),
        };
    }

    async create(
        data: Prisma.TaskCreateInput,
    ) {
        return this.prisma.task.create({
            data,
        });
    }

    async findMany(
        organizationId: string,
        skip: number,
        take: number,
        search?: string,
        status?: Prisma.TaskWhereInput['status'],
        priority?: Prisma.TaskWhereInput['priority'],
        assigneeId?: string,
        dueFrom?: Date,
        dueTo?: Date,
    ) {
        return this.prisma.task.findMany({
            where: this.buildWhere(
                organizationId,
                search,
                status,
                priority,
                assigneeId,
                dueFrom,
                dueTo,
            ),

            orderBy: {
                createdAt: 'desc',
            },

            skip,
            take,

            select: {
                id: true,
                organizationId: true,
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
        });
    }

    async count(
        organizationId: string,
        search?: string,
        status?: Prisma.TaskWhereInput['status'],
        priority?: Prisma.TaskWhereInput['priority'],
        assigneeId?: string,
        dueFrom?: Date,
        dueTo?: Date,
    ) {
        return this.prisma.task.count({
            where: this.buildWhere(
                organizationId,
                search,
                status,
                priority,
                assigneeId,
                dueFrom,
                dueTo,
            ),
        });
    }

    async findOne(
        id: string,
        organizationId: string,
    ) {
        return this.prisma.task.findFirst({
            where: {
                id,
                organizationId,
                deletedAt: null,
            },

            select: {
                id: true,
                organizationId: true,
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
        });
    }

    async update(
        id: string,
        data: Prisma.TaskUpdateInput,
    ) {
        return this.prisma.task.update({
            where: {
                id,
            },
            data,
        });
    }

    async softDelete(id: string) {
        return this.prisma.task.update({
            where: {
                id,
            },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    async findAssignment(
        taskId: string,
        userId: string,
    ) {
        return this.prisma.taskAssignment.findUnique({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });
    }


    async findProjectByOrganization(
        projectId: string,
        organizationId: string,
    ) {
        return this.prisma.project.findFirst({
            where: {
                id: projectId,
                organizationId,
                deletedAt: null,
            },
            select: {
                id: true,
            },
        });
    }

    async findUserByOrganization(
        userId: string,
        organizationId: string,
    ) {
        return this.prisma.user.findFirst({
            where: {
                id: userId,
                memberships: {
                    some: {
                        organizationId,
                    },
                },
            },
            select: {
                id: true,
                email: true,
            },
        });
    }


    async assignUser(
        taskId: string,
        userId: string,
    ) {
        return this.prisma.taskAssignment.create({
            data: {
                taskId,
                userId,
            },
        });
    }

    async unassignUser(
        taskId: string,
        userId: string,
    ) {
        return this.prisma.taskAssignment.delete({
            where: {
                taskId_userId: {
                    taskId,
                    userId,
                },
            },
        });
    }
}