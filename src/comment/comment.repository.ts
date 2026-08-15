import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCommentDtoType } from './dtos/comment.dto';

@Injectable()
export class CommentRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        taskId: string,
        userId: string,
        dto: CreateCommentDtoType,
    ) {
        return this.prisma.comment.create({
            data: {
                taskId,
                userId,
                content: dto.content,
            },
            select: {
                id: true,
                taskId: true,
                userId: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async findByTask(taskId: string) {
        return this.prisma.comment.findMany({
            where: {
                taskId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                taskId: true,
                userId: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }


    async findTaskById(taskId: string) {
        return this.prisma.task.findUnique({
            where: {
                id: taskId,
            },
            select: {
                id: true,
                organizationId: true,
            },
        });
    }

    async findById(commentId: string) {
        return this.prisma.comment.findUnique({
            where: {
                id: commentId,
            },
            select: {
                id: true,
                taskId: true,
                userId: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                task: {
                    select: {
                        id: true,
                        organizationId: true,
                    },
                },
            },
        });
    }

    async update(
        commentId: string,
        content: string,
    ) {
        return this.prisma.comment.update({
            where: {
                id: commentId,
            },
            data: {
                content,
            },
            select: {
                id: true,
                taskId: true,
                userId: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async delete(commentId: string) {
        return this.prisma.comment.delete({
            where: {
                id: commentId,
            },
        });
    }
}