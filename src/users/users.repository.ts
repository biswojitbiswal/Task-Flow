import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(
    data: {
      name: string;
      email: string;
      passwordHash: string;
    },
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.user.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }


  async findByEmailWithMemberships(email: string) {
  return this.prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });
}
}