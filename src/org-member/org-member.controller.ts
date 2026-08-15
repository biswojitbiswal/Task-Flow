import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    HttpCode,
    HttpStatus,
    UseGuards,
    Query,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrgMemberService } from './org-member.service';
import { OrgRole } from '../generated/prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type AuthenticatedUser } from 'src/common/types/authenticated-user.type';
import { type MemberParamsDto, type UpdateMemberRoleDto, type OrganizationMemberParamsDto, type MemberQueryDto } from './dtos/org-member.dto';


@ApiTags('Organization Members')
@ApiBearerAuth()
@Controller({
    path: "organizations/:organizationId/members",
    version: "1"
})
@UseGuards(AuthGuard, RolesGuard)
@Roles(OrgRole.org_admin)
export class OrgMemberController {
    constructor(
        private readonly orgMemberService: OrgMemberService,
    ) { }



    @Get()
    @ApiOperation({
        summary: 'Get organization members',
        description:
            'Returns all members belonging to the authenticated organization.',
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
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        example: 'gopal',
    })
    @ApiParam({
        name: 'organizationId',
        type: String,
        format: 'uuid',
        description: 'Organization ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Organization members retrieved successfully.',
    })
    @ApiResponse({
        status: 403,
        description:
            'User does not have access to this organization.',
    })
    async getMembers(
        @Param() params: OrganizationMemberParamsDto,
        @Query() query: MemberQueryDto,
        @CurrentUser() currentUser: AuthenticatedUser,
    ) {
        const members =
            await this.orgMemberService.getMembers(
                currentUser.organizationId,
                params.organizationId,
                query,
            );

        return {
            data: members,
        };
    }




    @Patch(':userId/role')
    @ApiOperation({
        summary: 'Update organization member role',
        description:
            'Changes an existing organization member between member and org_admin.',
    })
    @ApiParam({
        name: 'organizationId',
        type: String,
        format: 'uuid',
        description: 'Organization ID',
    })
    @ApiParam({
        name: 'userId',
        type: String,
        format: 'uuid',
        description: 'User ID of the member',
    })
    @ApiResponse({
        status: 200,
        description: 'Member role updated successfully.',
    })
    @ApiResponse({
        status: 404,
        description: 'Member not found.',
    })
    @ApiResponse({
        status: 409,
        description:
            'The operation would remove the last organization admin.',
    })
    async updateRole(
        @Param() params: MemberParamsDto,
        @Body() dto: UpdateMemberRoleDto,
        @CurrentUser() currentUser: {
            userId: string;
            organizationId: string;
        },
    ) {
        return this.orgMemberService.updateMemberRole(
            currentUser.organizationId,
            params.organizationId,
            params.userId,
            dto,
        );
    }




    @Delete(':userId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Remove organization member',
        description:
            'Removes a user from the authenticated organization.',
    })
    @ApiParam({
        name: 'organizationId',
        type: String,
        format: 'uuid',
        description: 'Organization ID',
    })
    @ApiParam({
        name: 'userId',
        type: String,
        format: 'uuid',
        description: 'User ID of the member',
    })
    @ApiResponse({
        status: 200,
        description: 'Member removed successfully.',
    })
    @ApiResponse({
        status: 404,
        description: 'Member not found.',
    })
    @ApiResponse({
        status: 409,
        description:
            'The last organization admin cannot be removed.',
    })
    async removeMember(
        @Param() params: MemberParamsDto,
        @CurrentUser() currentUser: {
            userId: string;
            organizationId: string;
        },
    ) {
        return this.orgMemberService.removeMember(
            currentUser.organizationId,
            params.organizationId,
            params.userId,
        );
    }
}