
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Injectable()
export class DecisionsService {
    constructor(private readonly prisma: PrismaService) { }
    // create a new decision along with its first version
    async create(createDecisionDto: CreateDecisionDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1)create the decision
            const decision = await tx.decision.create({
                data: createDecisionDto,
            });

            // 2)create its initial version v1
            await tx.decisionVersion.create({
                data: {
                    decisionId: decision.id,
                    versionNumber: 1,
                    title: decision.title,
                    context: decision.context,
                    options: decision.options ?? undefined,
                    decisionSummary: decision.decisionSummary,
                    rationale: decision.rationale,
                    status: decision.status,
                    owner: decision.owner,
                },
            });

            return decision;
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
    // update an existing decision and create a new version
    async update(id: string, updateDecisionDto: UpdateDecisionDto) {
        return this.prisma.$transaction(async (tx) => {
            // 1)check whether the decision exists
            const existingDecision = await tx.decision.findUnique({
                where: { id },
            });

            if (!existingDecision) {
                throw new NotFoundException(`Decision with ID ${id} not found`);
            }

            // 2)update the current decision
            const updatedDecision = await tx.decision.update({
                where: { id },
                data: updateDecisionDto,
            });

            // 3)find the latest version number
            const latestVersion = await tx.decisionVersion.findFirst({
                where: { decisionId: id },
                orderBy: { versionNumber: 'desc' },
            });

            const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

            // 4)save a new snapshot
            await tx.decisionVersion.create({
                data: {
                    decisionId: updatedDecision.id,
                    versionNumber: nextVersionNumber,
                    title: updatedDecision.title,
                    context: updatedDecision.context,
                    options: updatedDecision.options ?? undefined,
                    decisionSummary: updatedDecision.decisionSummary,
                    rationale: updatedDecision.rationale,
                    status: updatedDecision.status,
                    owner: updatedDecision.owner,
                },
            });

            return updatedDecision;
        });
    }
}
