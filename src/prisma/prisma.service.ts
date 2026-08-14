import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor(configService: ConfigService) {
        const connectionString = configService.get<string>('DATABASE_URL');

        if (!connectionString) {
            throw new Error('DATABASE_URL is not configured');
        }

        const adapter = new PrismaPg({
            connectionString,
        });

        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();

        console.log('✅ PostgreSQL connected through Prisma');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}