import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type AcceptInvitationDto,
  acceptInvitationSchema,
  type CreateInvitationDto,
  createInvitationSchema,
} from './dtos/org-invitation.dto';

import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { OrgRole } from '../generated/prisma/client';
import { AuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrganizationInvitationService } from './org-invitation.service';

@ApiTags('Organization Invitations')
@ApiBearerAuth()
@Controller({
  path: 'organization-invitations',
  version: '1',
})
export class OrganizationInvitationController {
  constructor(
    private readonly invitationService: OrganizationInvitationService,
  ) {}

  @Post(':organizationId/invitations')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(OrgRole.org_admin)
  @ApiOperation({
    summary: 'Invite a user to an organization',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'john@taskflow.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation created',
  })
  @ApiResponse({
    status: 403,
    description: 'Only organization admins can invite users',
  })
  createInvitation(
    @Request() req,
    @Body(
      new ZodValidationPipe(createInvitationSchema),
    )
    dto: CreateInvitationDto,
  ) {
    // IMPORTANT:
    // Do not trust organizationId from the URL.
    // Use the organizationId from the JWT.
    if (
      req.user.organizationId !==
      req.params.organizationId
    ) {
      throw new ForbiddenException(
        'Organization access denied',
      );
    }

    return this.invitationService.createInvitation(
      req.user.organizationId,
      dto.email,
    );
  }

  @Post('invitations/accept')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Accept an organization invitation',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation accepted',
  })
  acceptInvitation(
    @Request() req,
    @Body(
      new ZodValidationPipe(acceptInvitationSchema),
    )
    dto: AcceptInvitationDto,
  ) {
    return this.invitationService.acceptInvitation(
      req.user.id,
      dto.token,
    );
  }
}