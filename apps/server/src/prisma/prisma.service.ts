import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL,
        });

        super({ adapter });
    }

    async onModuleInit() {
        try {
            await this.$connect();
        } catch (error) {
            console.error('Prisma connection warning during startup:', error);
            // Allow app to start even if DB is temporarily unreachable
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}