import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    name: string,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.organization.create({
      data: {
        name,
      },
    });
  }
}