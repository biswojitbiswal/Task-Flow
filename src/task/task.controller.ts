import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { TaskService } from './task.service';

import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { type AuthenticatedUser } from 'src/common/types/authenticated-user.type';

import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

import {
    AssignTaskDto,
    CreateTaskDto,
    FindTasksDto,
    UpdateTaskDto,
} from './dtos/task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({
    path: "task",
    version: "1"
})
export class TaskController {
    constructor(
        private readonly taskService: TaskService,
    ) {}


    @Post()
    @ApiOperation({
        summary: 'Create a task',
        description:
            'Creates a task inside a project belonging to the authenticated user organization.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['projectId', 'title'],
            properties: {
                projectId: {
                    type: 'string',
                    format: 'uuid',
                    example:
                        '550e8400-e29b-41d4-a716-446655440000',
                },
                title: {
                    type: 'string',
                    example: 'Implement authentication',
                    minLength: 1,
                    maxLength: 200,
                },
                description: {
                    type: 'string',
                    example:
                        'Implement JWT authentication flow',
                    maxLength: 2000,
                },
                status: {
                    type: 'string',
                    enum: [
                        'todo',
                        'in_progress',
                        'review',
                        'done',
                    ],
                    example: 'todo',
                    default: 'todo',
                },
                priority: {
                    type: 'string',
                    enum: [
                        'low',
                        'medium',
                        'high',
                        'urgent',
                    ],
                    example: 'high',
                    default: 'medium',
                },
                dueAt: {
                    type: 'string',
                    format: 'date-time',
                    example:
                        '2026-08-30T18:00:00.000Z',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Task created successfully.',
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
        description: 'Project not found.',
    })
    async create(
        @CurrentUser() user: AuthenticatedUser,

        @Body(new ZodValidationPipe(CreateTaskDto))
        dto: CreateTaskDto,
    ) {
        return this.taskService.create(
            user.organizationId,
            dto,
        );
    }



    @Get()
    @ApiOperation({
        summary: 'Get tasks',
        description:
            'Returns paginated tasks belonging to the authenticated user organization.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 20,
        description:
            'Number of tasks per page. Maximum 100.',
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        example: 'authentication',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: [
            'todo',
            'in_progress',
            'review',
            'done',
        ],
        example: 'in_progress',
    })
    @ApiQuery({
        name: 'priority',
        required: false,
        enum: [
            'low',
            'medium',
            'high',
            'urgent',
        ],
        example: 'high',
    })
    @ApiQuery({
        name: 'assigneeId',
        required: false,
        type: String,
        format: 'uuid',
    })
    @ApiQuery({
        name: 'dueFrom',
        required: false,
        type: String,
        format: 'date-time',
        example: '2026-08-01T00:00:00.000Z',
    })
    @ApiQuery({
        name: 'dueTo',
        required: false,
        type: String,
        format: 'date-time',
        example: '2026-08-31T23:59:59.999Z',
    })
    @ApiResponse({
        status: 200,
        description: 'Tasks retrieved successfully.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    async findMany(
        @CurrentUser() user: AuthenticatedUser,

        @Query(new ZodValidationPipe(FindTasksDto))
        query: FindTasksDto,
    ) {
        return this.taskService.findMany(
            user.organizationId,
            query,
        );
    }



    @Get(':id')
    @ApiOperation({
        summary: 'Get a task',
        description:
            'Returns a single active task belonging to the authenticated user organization.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Task ID.',
    })
    @ApiResponse({
        status: 200,
        description: 'Task retrieved successfully.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    @ApiResponse({
        status: 404,
        description: 'Task not found.',
    })
    async findOne(
        @CurrentUser() user: AuthenticatedUser,

        @Param('id') id: string,
    ) {
        return this.taskService.findOne(
            user.organizationId,
            id,
        );
    }



    @Patch(':id')
    @ApiOperation({
        summary: 'Update a task',
        description:
            'Updates a task belonging to the authenticated user organization.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Task ID.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    example: 'Implement JWT authentication',
                    minLength: 1,
                    maxLength: 200,
                },
                description: {
                    type: 'string',
                    example:
                        'Implement access and refresh token flow',
                    maxLength: 2000,
                },
                status: {
                    type: 'string',
                    enum: [
                        'todo',
                        'in_progress',
                        'review',
                        'done',
                    ],
                    example: 'in_progress',
                },
                priority: {
                    type: 'string',
                    enum: [
                        'low',
                        'medium',
                        'high',
                        'urgent',
                    ],
                    example: 'high',
                },
                dueAt: {
                    type: 'string',
                    format: 'date-time',
                    example:
                        '2026-08-30T18:00:00.000Z',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Task updated successfully.',
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
    async update(
        @CurrentUser() user: AuthenticatedUser,

        @Param('id') id: string,

        @Body(new ZodValidationPipe(UpdateTaskDto))
        dto: UpdateTaskDto,
    ) {
        return this.taskService.update(
            user.organizationId,
            id,
            dto,
        );
    }



    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('org_admin')
    @ApiOperation({
        summary: 'Delete a task',
        description:
            'Soft deletes a task. Only organization admins can delete tasks.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Task ID.',
    })
    @ApiResponse({
        status: 200,
        description: 'Task deleted successfully.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    @ApiResponse({
        status: 403,
        description:
            'Only organization admins can delete tasks.',
    })
    @ApiResponse({
        status: 404,
        description: 'Task not found.',
    })
    async remove(
        @CurrentUser() user: AuthenticatedUser,

        @Param('id') id: string,
    ) {
        return this.taskService.remove(
            user.organizationId,
            id,
        );
    }



    @Post(':id/assign')
    @UseGuards(RolesGuard)
    @Roles('org_admin')
    @ApiOperation({
        summary: 'Assign a user to a task',
        description:
            'Assigns an organization member to a task. Only organization admins can assign users.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Task ID.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['userId'],
            properties: {
                userId: {
                    type: 'string',
                    format: 'uuid',
                    example:
                        '550e8400-e29b-41d4-a716-446655440000',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'User assigned successfully.',
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
            'Only organization admins can assign users.',
    })
    @ApiResponse({
        status: 404,
        description:
            'Task or organization member not found.',
    })
    @ApiResponse({
        status: 409,
        description:
            'User is already assigned to this task.',
    })
    async assign(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Body(new ZodValidationPipe(AssignTaskDto))
        dto: AssignTaskDto,
    ) {
        return this.taskService.assign(
            user.organizationId,
            id,
            dto,
        );
    }


    @Delete(':id/assign/:userId')
    @UseGuards(RolesGuard)
    @Roles('org_admin')
    @ApiOperation({
        summary: 'Unassign a user from a task',
        description:
            'Removes a user assignment from a task. Only organization admins can unassign users.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Task ID.',
    })
    @ApiParam({
        name: 'userId',
        type: String,
        format: 'uuid',
        description: 'User ID.',
    })
    @ApiResponse({
        status: 200,
        description: 'User unassigned successfully.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    @ApiResponse({
        status: 403,
        description:
            'Only organization admins can unassign users.',
    })
    @ApiResponse({
        status: 404,
        description:
            'Task or task assignment not found.',
    })
    async unassign(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
        @Param('userId') userId: string,
    ) {
        return this.taskService.unassign(
            user.organizationId,
            id,
            userId,
        );
    }
}