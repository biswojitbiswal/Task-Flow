import { Injectable } from '@nestjs/common';
import { Prisma, OrgRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MemberQueryDto } from './dtos/org-member.dto';

@Injectable()
export class OrgMemberRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    data: {
      userId: string;
      organizationId: string;
      role: OrgRole;
    },
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.orgMember.create({
      data,
    });
  }


  async findByUserAndOrganization(
    userId: string,
    organizationId: string,
  ) {
    return this.prisma.orgMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }


  async findMembersByOrganization(organizationId: string, query: MemberQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.OrgMemberWhereInput = {
      organizationId,

      ...(search && {
        user: {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      }),
    };

    const [members, total] =
      await this.prisma.$transaction([
        this.prisma.orgMember.findMany({
          where,
          skip,
          take: limit,

          select: {
            id: true,
            userId: true,
            organizationId: true,
            role: true,
            createdAt: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: 'asc',
          },
        }),

        this.prisma.orgMember.count({
          where,
        }),
      ]);

    return {
      data: members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async countAdmins(organizationId: string) {
    return this.prisma.orgMember.count({
      where: {
        organizationId,
        role: OrgRole.org_admin,
      },
    });
  }

  async updateRole(
    organizationId: string,
    userId: string,
    role: OrgRole,
  ) {
    return this.prisma.orgMember.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: {
        role,
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        role: true,
        createdAt: true,

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

  async deleteMember(
    organizationId: string,
    userId: string,
  ) {
    console.log(organizationId, userId);

    return this.prisma.orgMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }
}