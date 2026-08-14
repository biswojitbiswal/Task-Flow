import { Injectable } from '@nestjs/common';
import { Prisma, OrgRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrgMemberRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
}