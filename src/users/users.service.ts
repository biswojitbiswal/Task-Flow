import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { UserRepository } from './users.repository';


@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
  ) { }

  async findById(id: string) {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async create(
    data: {
      name: string;
      email: string;
      passwordHash: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    return this.userRepository.create(data, tx);
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      passwordHash?: string;
    },
  ) {
    return this.userRepository.update(id, data);
  }

  async delete(id: string) {
    return this.userRepository.delete(id);
  }

  async findByEmailWithMemberships(email: string) {
    return this.userRepository.findByEmailWithMemberships(email);
  }
}