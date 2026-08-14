import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationInvitationRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create(
        data: {
            organizationId: string;
            email: string;
            tokenHash: string;
            role: 'member';
            expiresAt: Date;
        },
        tx: Prisma.TransactionClient = this.prisma,
    ) {
        return tx.organizationInvitation.create({
            data,
        });
    }

    async findPendingByOrganization(
        organizationId: string,
    ) {
        return this.prisma.organizationInvitation.findMany({
            where: {
                organizationId,
                acceptedAt: null,
            },
        });
    }

    async findById(id: string) {
        return this.prisma.organizationInvitation.findUnique({
            where: { id },
        });
    }

    async accept(id: string) {
        return this.prisma.organizationInvitation.update({
            where: { id },
            data: {
                acceptedAt: new Date(),
            },
        });
    }


    async findPending() {
        return this.prisma.organizationInvitation.findMany({
            where: {
                acceptedAt: null,
            },
        });
    }
}