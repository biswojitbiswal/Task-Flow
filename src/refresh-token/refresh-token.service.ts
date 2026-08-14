import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { RefreshTokenRepository } from './refresh-token.repository';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) { }

  async create(
  data: {
    userId: string;
    jti: string;
    tokenHash: string;
    expiresAt: Date;
  },
  tx?: Prisma.TransactionClient,
) {
  return this.refreshTokenRepository.create(data, tx);
}

  async findByTokenHash(tokenHash: string) {
    return this.refreshTokenRepository.findByTokenHash(tokenHash);
  }

  async revoke(id: string) {
    return this.refreshTokenRepository.revoke(id);
  }

  async findActiveByUserId(userId: string) {
    return this.refreshTokenRepository.findActiveByUserId(userId);
  }

  async findByJti(jti: string) {
    return this.refreshTokenRepository.findByJti(jti);
  }

}