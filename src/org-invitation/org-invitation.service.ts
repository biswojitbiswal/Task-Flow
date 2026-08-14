import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserService } from 'src/users/users.service';
import { OrgMemberService } from 'src/org-member/org-member.service';
import { OrgRole } from '../generated/prisma/client';
import { OrganizationInvitationRepository } from './org-invitation.repository';

@Injectable()
export class OrganizationInvitationService {
    constructor(
        private readonly invitationRepository: OrganizationInvitationRepository,
        private readonly userService: UserService,
        private readonly orgMemberService: OrgMemberService,
    ) { }

    async createInvitation(
        organizationId: string,
        email: string,
    ) {
        const user = await this.userService.findByEmail(email);

        if (user) {
            const membership =
                await this.orgMemberService.findByUserAndOrganization(
                    user.id,
                    organizationId,
                );

            if (membership) {
                throw new ConflictException(
                    'User already belongs to this organization',
                );
            }
        }

        const token = randomUUID();
        const tokenHash = await bcrypt.hash(token, 12);

        const invitation =
            await this.invitationRepository.create({
                organizationId,
                email,
                tokenHash,
                role: 'member',
                expiresAt: new Date(
                    Date.now() + 24 * 60 * 60 * 1000,
                ),
            });

        return {
            invitationId: invitation.id,
            token,
            expiresAt: invitation.expiresAt,
        };
    }

    async acceptInvitation(
        userId: string,
        token: string,
    ) {
        const invitations =
            await this.invitationRepository.findPending();

        for (const invitation of invitations) {
            const matches = await bcrypt.compare(
                token,
                invitation.tokenHash,
            );

            if (!matches) {
                continue;
            }

            if (invitation.expiresAt < new Date()) {
                throw new BadRequestException(
                    'Invitation expired',
                );
            }

            const user = await this.userService.findById(userId);

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            if (
                user.email.toLowerCase() !==
                invitation.email.toLowerCase()
            ) {
                throw new ForbiddenException(
                    'Invitation email does not match user',
                );
            }

            const existingMembership =
                await this.orgMemberService.findByUserAndOrganization(
                    userId,
                    invitation.organizationId,
                );

            if (existingMembership) {
                throw new ConflictException(
                    'User already belongs to this organization',
                );
            }

            const membership =
                await this.orgMemberService.create({
                    userId,
                    organizationId: invitation.organizationId,
                    role: OrgRole.member,
                });

            await this.invitationRepository.accept(
                invitation.id,
            );

            return {
                organizationId: membership.organizationId,
                role: membership.role,
            };
        }

        throw new UnauthorizedException(
            'Invalid invitation',
        );
    }
}