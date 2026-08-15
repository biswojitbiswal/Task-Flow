import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CommentService } from './comment.service';

import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { type AuthenticatedUser } from 'src/common/types/authenticated-user.type';

import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

import {
  CreateCommentDto,
  UpdateCommentDto,
  type CreateCommentDtoType,
  type UpdateCommentDtoType,
} from './dtos/comment.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({
  path: '',
  version: '1',
})
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
  ) {}

  @Post('tasks/:taskId/comments')
  @ApiOperation({
    summary: 'Create a comment',
    description:
      'Creates a comment on a task belonging to the authenticated user organization.',
  })
  @ApiParam({
    name: 'taskId',
    type: String,
    format: 'uuid',
    description: 'Task ID.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          example:
            'Authentication implementation looks good.',
          minLength: 1,
          maxLength: 2000,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(CreateCommentDto))
    dto: CreateCommentDtoType,
  ) {
    return this.commentService.create(
      taskId,
      user,
      dto,
    );
  }

  @Get('tasks/:taskId/comments')
  @ApiOperation({
    summary: 'Get task comments',
    description:
      'Returns comments for a task belonging to the authenticated user organization.',
  })
  @ApiParam({
    name: 'taskId',
    type: String,
    format: 'uuid',
    description: 'Task ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found.',
  })
  async findByTask(
    @CurrentUser() user: AuthenticatedUser,

    @Param('taskId') taskId: string,
  ) {
    return this.commentService.findByTask(
      taskId,
      user,
    );
  }


  @Patch('comments/:commentId')
  @ApiOperation({
    summary: 'Update a comment',
    description:
      'Members can update their own comments. Organization admins can update comments in their organization.',
  })
  @ApiParam({
    name: 'commentId',
    type: String,
    format: 'uuid',
    description: 'Comment ID.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          example: 'Updated comment content.',
          minLength: 1,
          maxLength: 2000,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Member can only update their own comment.',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('commentId') commentId: string,
    @Body(new ZodValidationPipe(UpdateCommentDto))
    dto: UpdateCommentDtoType,
  ) {
    return this.commentService.update(
      commentId,
      user,
      dto,
    );
  }

  @Delete('comments/:commentId')
  @ApiOperation({
    summary: 'Delete a comment',
    description:
      'Members can delete their own comments. Organization admins can delete comments in their organization.',
  })
  @ApiParam({
    name: 'commentId',
    type: String,
    format: 'uuid',
    description: 'Comment ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comment deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Member can only delete their own comment.',
  })
  @ApiResponse({
    status: 404,
    description: 'Comment not found.',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,

    @Param('commentId') commentId: string,
  ) {
    return this.commentService.delete(
      commentId,
      user,
    );
  }
}