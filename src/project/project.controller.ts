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

import { ProjectService } from './project.service';

import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { type AuthenticatedUser } from 'src/common/types/authenticated-user.type';

import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

import {
    CreateProjectDto,
    FindProjectsDto,
    UpdateProjectDto,
} from './dtos/project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller({
    path: 'projects',
    version: '1'
})
export class ProjectController {
    constructor(
        private readonly projectService: ProjectService,
    ) { }


    @Post()
    @ApiOperation({
        summary: 'Create a project',
        description:
            'Creates a new project inside the authenticated user organization.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['name'],
            properties: {
                name: {
                    type: 'string',
                    example: 'TaskFlow Backend',
                    minLength: 1,
                    maxLength: 100,
                },
                description: {
                    type: 'string',
                    example: 'Backend development project',
                    maxLength: 1000,
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Project created successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Validation failed.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    async create(
        @CurrentUser() user: AuthenticatedUser,
        @Body(new ZodValidationPipe(CreateProjectDto))
        dto: CreateProjectDto,
    ) {
        return this.projectService.create(
            user.organizationId,
            dto,
        );
    }


    @Get()
    @ApiOperation({
        summary: 'Get projects',
        description:
            'Returns paginated projects belonging to the authenticated user organization.',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        example: 1,
        description: 'Page number.',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        example: 20,
        description: 'Number of projects per page. Maximum 100.',
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        example: 'backend',
        description:
            'Search projects by name or description.',
    })
    @ApiResponse({
        status: 200,
        description: 'Projects retrieved successfully.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: {
                                type: 'string',
                                format: 'uuid',
                            },
                            organizationId: {
                                type: 'string',
                                format: 'uuid',
                            },
                            name: {
                                type: 'string',
                                example: 'TaskFlow Backend',
                            },
                            description: {
                                type: 'string',
                                nullable: true,
                                example:
                                    'Backend development project',
                            },
                            deletedAt: {
                                type: 'string',
                                format: 'date-time',
                                nullable: true,
                            },
                            createdAt: {
                                type: 'string',
                                format: 'date-time',
                            },
                            updatedAt: {
                                type: 'string',
                                format: 'date-time',
                            },
                        },
                    },
                },
                total: {
                    type: 'number',
                    example: 25,
                },
                page: {
                    type: 'number',
                    example: 1,
                },
                limit: {
                    type: 'number',
                    example: 20,
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    async findMany(
        @CurrentUser() user: AuthenticatedUser,

        @Query(new ZodValidationPipe(FindProjectsDto))
        query: FindProjectsDto,
    ) {
        return this.projectService.findMany(
            user.organizationId,
            query,
        );
    }


    @Get(':id/dashboard')
    @ApiOperation({
        summary: 'Get project dashboard',
        description:
            'Returns task counts grouped by status for a project.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Project ID.',
    })
    @ApiResponse({
        status: 200,
        description:
            'Project dashboard retrieved successfully.',
        schema: {
            type: 'object',
            properties: {
                projectId: {
                    type: 'string',
                    format: 'uuid',
                    example:
                        '550e8400-e29b-41d4-a716-446655440000',
                },
                taskCounts: {
                    type: 'object',
                    properties: {
                        todo: {
                            type: 'number',
                            example: 5,
                        },
                        in_progress: {
                            type: 'number',
                            example: 3,
                        },
                        review: {
                            type: 'number',
                            example: 2,
                        },
                        done: {
                            type: 'number',
                            example: 8,
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    @ApiResponse({
        status: 404,
        description: 'Project not found.',
    })
    async getDashboard(
        @CurrentUser() user: AuthenticatedUser,
        @Param('id') id: string,
    ) {
        return this.projectService.getDashboard(
            user.organizationId,
            id,
        );
    }


    @Get(':id')
    @ApiOperation({
        summary: 'Get a project',
        description:
            'Returns a single active project belonging to the authenticated user organization.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Project ID.',
    })
    @ApiResponse({
        status: 200,
        description: 'Project retrieved successfully.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    @ApiResponse({
        status: 404,
        description: 'Project not found.',
    })
    async findOne(
        @CurrentUser() user: AuthenticatedUser,

        @Param('id') id: string,
    ) {
        return this.projectService.findOne(
            user.organizationId,
            id,
        );
    }


    @Patch(':id')
    @ApiOperation({
        summary: 'Update a project',
        description:
            'Updates a project belonging to the authenticated user organization.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Project ID.',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    example: 'Updated TaskFlow Backend',
                    minLength: 1,
                    maxLength: 100,
                },
                description: {
                    type: 'string',
                    example:
                        'Updated backend development project',
                    maxLength: 1000,
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Project updated successfully.',
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
    async update(
        @CurrentUser() user: AuthenticatedUser,

        @Param('id') id: string,

        @Body(new ZodValidationPipe(UpdateProjectDto))
        dto: UpdateProjectDto,
    ) {
        return this.projectService.update(
            user.organizationId,
            id,
            dto,
        );
    }


    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('org_admin')
    @ApiOperation({
        summary: 'Delete a project',
        description:
            'Soft deletes a project. Only organization admins can delete projects.',
    })
    @ApiParam({
        name: 'id',
        type: String,
        format: 'uuid',
        description: 'Project ID.',
    })
    @ApiResponse({
        status: 200,
        description: 'Project deleted successfully.',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required.',
    })
    @ApiResponse({
        status: 403,
        description:
            'Only organization admins can delete projects.',
    })
    @ApiResponse({
        status: 404,
        description: 'Project not found.',
    })
    async remove(
        @CurrentUser() user: AuthenticatedUser,

        @Param('id') id: string,
    ) {
        return this.projectService.remove(
            user.organizationId,
            id,
        );
    }
}