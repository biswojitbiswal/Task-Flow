import { Injectable } from '@nestjs/common';
import { Prisma, OrgRole } from '../generated/prisma/client';

import { OrgMemberRepository } from './org-member.repository';

@Injectable()
export class OrgMemberService {
  constructor(
    private readonly orgMemberRepository: OrgMemberRepository,
  ) {}

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
}