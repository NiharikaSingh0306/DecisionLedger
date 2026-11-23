
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';
import { Prisma, DecisionStatus } from '@prisma/client';

@Injectable()
export class DecisionsService {
    constructor(private readonly prisma: PrismaService) { }
    // create a new decision along with its first version
    async create(createDecisionDto: CreateDecisionDto, userId: string) {
        const { commitMessage, ...decisionData } = createDecisionDto;

        return this.prisma.$transaction(async (tx) => {
            // 1. Create the decision
            const decision = await tx.decision.create({
                data: { ...decisionData, userId, }
            });
            // 2. Create its initial version (V1)
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
                    commitMessage: commitMessage ?? 'Initial decision created',
                },
            });

            return decision;
        });
    }
    // retrieve all decisions
    async findAll(filters: {
        search?: string;
        status?: DecisionStatus;
        owner?: string;
        page?: number;
        limit?: number;
    }, userId: string) {
        const {
            search,
            status,
            owner,
            page = 1,
            limit = 10,
        } = filters;

        const where: Prisma.DecisionWhereInput = {
            userId,
            ...(status && { status }),
            ...(owner && {
                owner: {
                    contains: owner,
                    mode: 'insensitive',
                },
            }),
            ...(search && {
                OR: [
                    {
                        title: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        context: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                ],
            }),
        };

        const [decisions, total] = await this.prisma.$transaction([
            this.prisma.decision.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.decision.count({ where }),
        ]);

        return {
            data: decisions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // retrieve one decision by ID
    async findOne(id: string, userId: string) {
        const decision = await this.prisma.decision.findFirst({
            where: { id, userId },
        });

        if (!decision) {
            throw new NotFoundException(`Decision with ID ${id} not found`);
        }

        return decision;
    }
    // update an existing decision and create a new version
    async update(id: string, updateDecisionDto: UpdateDecisionDto, userId: string) {
        const { commitMessage, ...decisionData } = updateDecisionDto;

        return this.prisma.$transaction(async (tx) => {
            // 1. Check whether the decision exists
            const existingDecision = await tx.decision.findUnique({
                where: { id, userId },
            });

            if (!existingDecision) {
                throw new NotFoundException(
                    `Decision with ID ${id} not found`,
                );
            }

            // 2. Validate status transition if status is being changed
            const requestedStatus = decisionData.status;

            if (
                requestedStatus !== undefined &&
                requestedStatus !== existingDecision.status
            ) {
                const allowed =
                    this.allowedTransitions[existingDecision.status];

                if (!allowed.includes(requestedStatus)) {
                    throw new BadRequestException(
                        `Invalid status transition: ${existingDecision.status} -> ${requestedStatus}`,
                    );
                }
            }
            // 3. Update the current decision
            const updatedDecision = await tx.decision.update({
                where: { id },
                data: decisionData,
            });

            // 4. Find the latest version number
            const latestVersion = await tx.decisionVersion.findFirst({
                where: { decisionId: id },
                orderBy: { versionNumber: 'desc' },
            });

            const nextVersionNumber =
                (latestVersion?.versionNumber ?? 0) + 1;

            // 5. Save a new snapshot
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
                    commitMessage: commitMessage ?? 'Decision updated',
                },
            });

            return updatedDecision;
        });
    }
    private readonly allowedTransitions: Record<
        DecisionStatus,
        DecisionStatus[]
    > = {
            PROPOSED: ['ACCEPTED', 'REVERSED'],
            ACCEPTED: ['SUPERSEDED', 'REVERSED'],
            SUPERSEDED: [],
            REVERSED: [],
        };
    //retrieve all versions of a decision
    async findVersions(id: string, userId: string) {
        await this.findOne(id, userId);

        return this.prisma.decisionVersion.findMany({
            where: { decisionId: id },
            orderBy: {
                versionNumber: 'desc',
            },
        });
    }
    //retrieve a specific version of a decision
    async findVersion(id: string, versionNumber: number, userId: string) {
        await this.findOne(id, userId);
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
        userId: string,
    ) {
        // 1)check whether the decision exists
        await this.findOne(id, userId);

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
    async restoreVersion(
        id: string,
        versionNumber: number,
        commitMessage: string | undefined,
        userId: string,
    ) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Check whether the decision exists
            const decision = await tx.decision.findUnique({
                where: { id, userId },
            });

            if (!decision) {
                throw new NotFoundException(
                    `Decision with ID ${id} not found`,
                );
            }

            // 2. Find the historical version
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

            // 3. Restore historical data
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

            // 4. Find the latest version number
            const latestVersion = await tx.decisionVersion.findFirst({
                where: { decisionId: id },
                orderBy: { versionNumber: 'desc' },
            });

            const nextVersionNumber =
                (latestVersion?.versionNumber ?? 0) + 1;

            // 5. Create a new snapshot
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
                    commitMessage:
                        commitMessage ??
                        `Restored to version ${versionNumber}`,
                    restoredFromVersion: versionNumber,
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
