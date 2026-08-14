import { Injectable } from '@nestjs/common';

import { OrganizationRepository } from './organization.repository';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly prisma: PrismaService
  ) {}

  async create(name: string, tx?: Prisma.TransactionClient) {
    return this.organizationRepository.create(name, tx);
  }
}