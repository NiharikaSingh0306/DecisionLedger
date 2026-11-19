
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { Prisma } from '@prisma/client';

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
    //retrieve all versions of a decision
    async findVersions(id: string) {
        await this.findOne(id);

        return this.prisma.decisionVersion.findMany({
            where: { decisionId: id },
            orderBy: {
                versionNumber: 'desc',
            },
        });
    }
    //retrieve a specific version of a decision
    async findVersion(id: string, versionNumber: number) {
        await this.findOne(id);
        const version = await this.prisma.decisionVersion.findUnique({
            where: {
                decisionId_versionNumber: {
                    decisionId: id,
                    versionNumber,
                },
            },
        });
        if (!version) {
            throw new NotFoundException(
                `Version ${versionNumber} not found for decision ${id}`,
            );
        }
        return version;
    }
    //compare the two versions of a decision
    async compareVersions(
        id: string,
        fromVersionNumber: number,
        toVersionNumber: number,
    ) {
        // 1)check whether the decision exists
        await this.findOne(id);

        // 2)fetch both versions
        const [fromVersion, toVersion] = await Promise.all([
            this.prisma.decisionVersion.findUnique({
                where: {
                    decisionId_versionNumber: {
                        decisionId: id,
                        versionNumber: fromVersionNumber,
                    },
                },
            }),
            this.prisma.decisionVersion.findUnique({
                where: {
                    decisionId_versionNumber: {
                        decisionId: id,
                        versionNumber: toVersionNumber,
                    },
                },
            }),
        ]);
        // 3)check whether both versions exist
        if (!fromVersion || !toVersion) {
            throw new NotFoundException(
                'One or both requested versions were not found.',
            );
        }
        //comparing fields
        const fields = [
            'title',
            'context',
            'options',
            'decisionSummary',
            'rationale',
            'status',
            'owner',
        ] as const;
        //store the changed fields
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const field of fields) {
            const oldValue = fromVersion[field];
            const newValue = toVersion[field];

            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes[field] = {
                    old: oldValue,
                    new: newValue,
                };
            }
        }
        return {
            decisionId: id,
            fromVersion: fromVersionNumber,
            toVersion: toVersionNumber,
            changes,
        };
    }

    //restore an older version without deleting the previoius ones
    async restoreVersion(id: string, versionNumber: number) {
        return this.prisma.$transaction(async (tx) => {
            // 1)check whether the decision exists
            await this.findOne(id);
            //historical version to restore
            const version = await tx.decisionVersion.findUnique({
                where: {
                    decisionId_versionNumber: {
                        decisionId: id,
                        versionNumber,
                    },
                },
            });
            if (!version) {
                throw new NotFoundException(
                    `Version ${versionNumber} not found for decision ${id}`,
                );
            }
            // 3)restore the historical data into the current decision
            const restoredDecision = await tx.decision.update({
                where: { id },
                data: {
                    title: version.title,
                    context: version.context,
                    options:
                        version.options === null
                            ? Prisma.DbNull
                            : version.options as Prisma.InputJsonValue,
                    decisionSummary: version.decisionSummary,
                    rationale: version.rationale,
                    status: version.status,
                    owner: version.owner,
                },
            });
            // 4)find the latest version number
            const latestVersion = await tx.decisionVersion.findFirst({
                where: { decisionId: id },
                orderBy: { versionNumber: 'desc' },
            });
            const nextVersionNumber =
                (latestVersion?.versionNumber ?? 0) + 1;
            // 5)create a new snapshot of the restored decision
            await tx.decisionVersion.create({
                data: {
                    decisionId: id,
                    versionNumber: nextVersionNumber,
                    title: restoredDecision.title,
                    context: restoredDecision.context,
                    options:
                        restoredDecision.options === null
                            ? Prisma.DbNull
                            : restoredDecision.options as Prisma.InputJsonValue,
                    decisionSummary: restoredDecision.decisionSummary,
                    rationale: restoredDecision.rationale,
                    status: restoredDecision.status,
                    owner: restoredDecision.owner,
                },
            });
            return {
                message: `Successfully restored version ${versionNumber}`,
                restoredFromVersion: versionNumber,
                newVersionNumber: nextVersionNumber,
                decision: restoredDecision,
            };
        });
    }

}
