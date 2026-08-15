import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrgRole } from 'src/generated/prisma/client';

import { AuthenticatedUser } from 'src/common/types/authenticated-user.type';

import {
  type CreateCommentDtoType,
  type UpdateCommentDtoType,
} from './dtos/comment.dto';

import { CommentRepository } from './comment.repository';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: CommentRepository,
  ) {}

  async create(
    taskId: string,
    user: AuthenticatedUser,
    dto: CreateCommentDtoType,
  ) {
    const task =
      await this.commentRepository.findTaskById(taskId);

    if (
      !task ||
      task.organizationId !== user.organizationId
    ) {
      throw new NotFoundException({
        error: 'Task not found',
        code: 'TASK_NOT_FOUND',
        details: {},
      });
    }

    return this.commentRepository.create(
      taskId,
      user.userId,
      dto,
    );
  }

  async findByTask(
    taskId: string,
    user: AuthenticatedUser,
  ) {
    const task =
      await this.commentRepository.findTaskById(taskId);

    if (
      !task ||
      task.organizationId !== user.organizationId
    ) {
      throw new NotFoundException({
        error: 'Task not found',
        code: 'TASK_NOT_FOUND',
        details: {},
      });
    }

    return this.commentRepository.findByTask(taskId);
  }

  async update(
    commentId: string,
    user: AuthenticatedUser,
    dto: UpdateCommentDtoType,
  ) {
    const comment =
      await this.commentRepository.findById(commentId);

    if (
      !comment ||
      comment.task.organizationId !==
        user.organizationId
    ) {
      throw new NotFoundException({
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND',
        details: {},
      });
    }

    const isOwner = comment.userId === user.userId;

    const isOrgAdmin = user.role === OrgRole.org_admin;

    if (!isOwner && !isOrgAdmin) {
      throw new ForbiddenException({
        error: 'You can only update your own comment',
        code: 'COMMENT_UPDATE_FORBIDDEN',
        details: {},
      });
    }

    return this.commentRepository.update(
      commentId,
      dto.content,
    );
  }

  async delete(
    commentId: string,
    user: AuthenticatedUser,
  ) {
    const comment =
      await this.commentRepository.findById(commentId);

    if (
      !comment ||
      comment.task.organizationId !==
        user.organizationId
    ) {
      throw new NotFoundException({
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND',
        details: {},
      });
    }

    const isOwner = comment.userId === user.userId;

    const isOrgAdmin = user.role === OrgRole.org_admin;

    if (!isOwner && !isOrgAdmin) {
      throw new ForbiddenException({
        error: 'You can only delete your own comment',
        code: 'COMMENT_DELETE_FORBIDDEN',
        details: {},
      });
    }

    return this.commentRepository.delete(commentId);
  }
}