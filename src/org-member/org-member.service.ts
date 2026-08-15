import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, OrgRole } from '../generated/prisma/client';

import { OrgMemberRepository } from './org-member.repository';
import { MemberQueryDto, UpdateMemberRoleDto } from './dtos/org-member.dto';

@Injectable()
export class OrgMemberService {
  constructor(
    private readonly orgMemberRepository: OrgMemberRepository,
  ) { }

  async create(
    data: {
      userId: string;
      organizationId: string;
      role: OrgRole;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.orgMemberRepository.create(data, tx);
  }


  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ) {
    return this.orgMemberRepository.findByUserAndOrganization(
      userId,
      organizationId,
    );
  }


  async getMembers(
    authOrganizationId: string,
    organizationId: string,
    query: MemberQueryDto,
  ) {
    this.validateOrganizationAccess(
      authOrganizationId,
      organizationId,
    );

    return this.orgMemberRepository.findMembersByOrganization(
      organizationId,
      query,
    );
  }


  private validateOrganizationAccess(
    authOrganizationId: string,
    requestedOrganizationId: string,
  ) {
    if (authOrganizationId !== requestedOrganizationId) {
      throw new ForbiddenException({
        error: 'Organization access denied',
        code: 'ORGANIZATION_ACCESS_DENIED',
        details: {},
      });
    }
  }


  async updateMemberRole(
    authOrganizationId: string,
    organizationId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ) {
    this.validateOrganizationAccess(
      authOrganizationId,
      organizationId,
    );

    const member =
      await this.orgMemberRepository.findByUserAndOrganization(
        userId,
        organizationId,
      );

    if (!member) {
      throw new NotFoundException({
        error: 'Member not found',
        code: 'MEMBER_NOT_FOUND',
        details: {},
      });
    }

    // No need to update if the role is already the same.
    if (member.role === dto.role) {
      return member;
    }

    /**
     * Prevent the organization from having zero admins.
     *
     * Example:
     *
     * Gopal -> org_admin
     * Rahul -> member
     *
     * Gopal cannot be changed to member because
     * there would be no org_admin left.
     */
    if (
      member.role === OrgRole.org_admin &&
      dto.role === OrgRole.member
    ) {
      const adminCount =
        await this.orgMemberRepository.countAdmins(
          organizationId,
        );

      if (adminCount <= 1) {
        throw new ConflictException({
          error: 'Organization must have at least one admin',
          code: 'LAST_ADMIN_CANNOT_BE_DEMOTED',
          details: {},
        });
      }
    }

    return this.orgMemberRepository.updateRole(
      organizationId,
      userId,
      dto.role as OrgRole,
    );
  }

  async removeMember(
    authOrganizationId: string,
    organizationId: string,
    userId: string,
  ) {
    this.validateOrganizationAccess(
      authOrganizationId,
      organizationId,
    );
    

    const member =
      await this.orgMemberRepository.findByUserAndOrganization(
        userId,
        organizationId,
      );

    if (!member) {
      throw new NotFoundException({
        error: 'Member not found',
        code: 'MEMBER_NOT_FOUND',
        details: {},
      });
    }

    /**
     * Prevent deleting the last organization admin.
     */
    if (member.role === OrgRole.org_admin) {
      const adminCount =
        await this.orgMemberRepository.countAdmins(
          organizationId,
        );

      if (adminCount <= 1) {
        throw new ConflictException({
          error: 'Organization must have at least one admin',
          code: 'LAST_ADMIN_CANNOT_BE_REMOVED',
          details: {},
        });
      }
    }

    const deleted = await this.orgMemberRepository.deleteMember(
      organizationId,
      userId,
    );
    

    return {
      message: 'Member removed successfully',
    };
  }
}