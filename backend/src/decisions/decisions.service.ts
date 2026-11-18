
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Injectable()
export class DecisionsService {
    constructor(private readonly prisma: PrismaService) { }
    // create a new decision
    async create(createDecisionDto: CreateDecisionDto) {
        return this.prisma.decision.create({
            data: createDecisionDto,
        });
    }
    // retrieve all decisions
    async findAll() {
        return this.prisma.decision.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    // retrieve one decision by ID
    async findOne(id: string) {
        const decision = await this.prisma.decision.findUnique({
            where: { id },
        });

        if (!decision) {
            throw new NotFoundException(`Decision with ID ${id} not found`);
        }

        return decision;
    }
    // update an existing decision
    async update(id: string, updateDecisionDto: UpdateDecisionDto) {
        await this.findOne(id);

        return this.prisma.decision.update({
            where: { id },
            data: updateDecisionDto,
        });
    }
}
