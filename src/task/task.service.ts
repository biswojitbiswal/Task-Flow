import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { Prisma, TaskPriority, TaskStatus } from 'src/generated/prisma/client';

import { TaskRepository } from './task.repository';

import {
    AssignTaskDto,
    BulkTaskStatusUpdateDto,
    CreateTaskDto,
    FindTasksDto,
    UpdateTaskDto,
} from './dtos/task.dto';
import { JobsService } from 'src/jobs/jobs.service';
import { getPagination } from 'src/common/utils/pagination';

@Injectable()
export class TaskService {
    constructor(
        private readonly taskRepository: TaskRepository,
        private readonly jobService: JobsService
    ) { }


    async create(
        organizationId: string,
        dto: CreateTaskDto,
    ) {
        const project =
            await this.taskRepository.findProjectByOrganization(
                dto.projectId,
                organizationId,
            );

        if (!project) {
            throw new NotFoundException({
                error: 'Project not found',
                code: 'PROJECT_NOT_FOUND',
                details: {},
            });
        }

        return this.taskRepository.create({
            organization: {
                connect: {
                    id: organizationId,
                },
            },

            project: {
                connect: {
                    id: dto.projectId,
                },
            },

            title: dto.title,
            description: dto.description,

            status: dto.status as TaskStatus,
            priority: dto.priority as TaskPriority,

            ...(dto.dueAt && {
                dueAt: new Date(dto.dueAt),
            }),
        });
    }


    async findMany(
        organizationId: string,
        dto: FindTasksDto,
    ) {
        const {
            page,
            limit,
            search,
            status,
            priority,
            assigneeId,
            dueFrom,
            dueTo,
        } = dto;

        const { skip, take } = getPagination(
            page,
            limit,
        );

        const [data, total] = await Promise.all([
            this.taskRepository.findMany(
                organizationId,
                skip,
                limit,
                search,
                status as TaskStatus | undefined,
                priority as TaskPriority | undefined,
                assigneeId,
                dueFrom
                    ? new Date(dueFrom)
                    : undefined,
                dueTo
                    ? new Date(dueTo)
                    : undefined,
            ),

            this.taskRepository.count(
                organizationId,
                search,
                status as TaskStatus | undefined,
                priority as TaskPriority | undefined,
                assigneeId,
                dueFrom
                    ? new Date(dueFrom)
                    : undefined,
                dueTo
                    ? new Date(dueTo)
                    : undefined,
            ),
        ]);

        return {
            data,
            total,
            page,
            limit,
        };
    }


    // async findOne(
    //     organizationId: string,
    //     taskId: string,
    // ) {
    //     const task =
    //         await this.taskRepository.findOne(
    //             taskId,
    //             organizationId,
    //         );

    //     if (!task) {
    //         throw new NotFoundException({
    //             error: 'Task not found',
    //             code: 'TASK_NOT_FOUND',
    //             details: {},
    //         });
    //     }

    //     return task;
    // }
    async findOne(
        organizationId: string,
        taskId: string,
    ) {
        const task =
            await this.taskRepository.findOne(
                taskId,
                organizationId,
            );

        if (task) {
            return task;
        }

        const existingTask =
            await this.taskRepository.findById(taskId);

        if (!existingTask) {
            throw new NotFoundException({
                error: 'Task not found',
                code: 'TASK_NOT_FOUND',
                details: {},
            });
        }

        if (
            existingTask.organizationId !==
            organizationId
        ) {
            throw new ForbiddenException({
                error: 'You do not have access to this task',
                code: 'TASK_ACCESS_FORBIDDEN',
                details: {},
            });
        }

        throw new NotFoundException({
            error: 'Task not found',
            code: 'TASK_NOT_FOUND',
            details: {},
        });
    }


    async update(
        organizationId: string,
        taskId: string,
        dto: UpdateTaskDto,
    ) {
        await this.findOne(
            organizationId,
            taskId,
        );

        return this.taskRepository.update(
            taskId,
            {
                ...(dto.title !== undefined && {
                    title: dto.title,
                }),

                ...(dto.description !== undefined && {
                    description: dto.description,
                }),

                ...(dto.status !== undefined && {
                    status: dto.status as TaskStatus,
                }),

                ...(dto.priority !== undefined && {
                    priority:
                        dto.priority as TaskPriority,
                }),

                ...(dto.dueAt !== undefined && {
                    dueAt: new Date(dto.dueAt),
                }),
            },
        );
    }


    async remove(
        organizationId: string,
        taskId: string,
    ) {
        await this.findOne(
            organizationId,
            taskId,
        );

        return this.taskRepository.softDelete(
            taskId,
        );
    }


    async assign(
        organizationId: string,
        taskId: string,
        dto: AssignTaskDto,
    ) {
        const task = await this.findOne(
            organizationId,
            taskId,
        );


        const user = await this.taskRepository.findUserByOrganization(
            dto.userId,
            organizationId,
        );

        if (!user) {
            throw new NotFoundException({
                error:
                    'User does not belong to the organization',
                code: 'USER_NOT_IN_ORGANIZATION',
                details: {},
            });
        }

        const existingAssignment =
            await this.taskRepository.findAssignment(
                taskId,
                dto.userId,
            );

        if (existingAssignment) {
            throw new ConflictException({
                error: 'User is already assigned to this task',
                code: 'TASK_ALREADY_ASSIGNED',
                details: {},
            });
        }

        const assignment =
            await this.taskRepository.assignUser(
                taskId,
                dto.userId,
            );

        const job =
            await this.jobService.addTaskAssignmentEmailJob({
                taskId: task.id,
                assignedUserId: user.id,
                email: user.email,
                taskTitle: task.title,
            });

        return {
            assignment,
            jobId: job.jobId,
        };
    }


    async unassign(
        organizationId: string,
        taskId: string,
        userId: string,
    ) {
        await this.findOne(
            organizationId,
            taskId,
        );

        const assignment =
            await this.taskRepository.findAssignment(
                taskId,
                userId,
            );

        if (!assignment) {
            throw new NotFoundException({
                error: 'Task assignment not found',
                code: 'TASK_ASSIGNMENT_NOT_FOUND',
                details: {},
            });
        }

        return this.taskRepository.unassignUser(
            taskId,
            userId,
        );
    }


    async bulkUpdateStatus(
        organizationId: string,
        dto: BulkTaskStatusUpdateDto,
    ) {
        const tasks =
            await this.taskRepository.findManyByIds(
                dto.taskIds,
                organizationId,
            );

        if (tasks.length !== dto.taskIds.length) {
            throw new NotFoundException({
                error: 'One or more tasks not found',
                code: 'TASK_NOT_FOUND',
                details: {},
            });
        }

        const result =
            await this.taskRepository.bulkUpdateStatus(
                dto.taskIds,
                organizationId,
                dto.status as TaskStatus,
            );

        return {
            updatedCount: result.count,
        };
    }
}