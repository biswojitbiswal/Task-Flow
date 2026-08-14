import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    data: {
      userId: string;
      jti: string;
      tokenHash: string;
      expiresAt: Date;
    },
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.refreshToken.create({
      data,
    });
  }

  async findByTokenHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
    });
  }

  async revoke(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
      },
    });
  }


  async findByJti(jti: string) {
    return this.prisma.refreshToken.findUnique({
      where: {
        jti,
      },
    });
  }
}