import {
    Injectable,
    OnModuleInit,/*connects postgres when the application starts*/
    OnModuleDestroy,/*disconnects*/
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

@Injectable() /* makes service available through Nestjs dependency infejection*/
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        console.log('Connected to PostgreSQL through Prisma!');
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
}