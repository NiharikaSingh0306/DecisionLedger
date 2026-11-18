
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
    const decisionId = 'cmwlnymd20000tragzagz51g5';

    const result = await prisma.$transaction(async (tx) => {
        // 1)find the existing decision
        const decision = await tx.decision.findUnique({
            where: { id: decisionId },
        });

        if (!decision) {
            throw new Error(`Decision ${decisionId} not found`);
        }

        // 2)create Version 1 only if it does not exist
        const version = await tx.decisionVersion.upsert({
            where: {
                decisionId_versionNumber: {
                    decisionId,
                    versionNumber: 1,
                },
            },
            //  nothing if Version 1 already exists
            update: {},
            // store a complete snapshot
            create: {
                decisionId,
                versionNumber: 1,
                title: decision.title,
                context: decision.context,
                ...(decision.options === null
                    ? {}
                    : {
                        options: decision.options as Prisma.InputJsonValue,
                    }),
                decisionSummary: decision.decisionSummary,
                rationale: decision.rationale,
                status: decision.status,
                owner: decision.owner,
            },
        });

        return version;
    });

    console.log('Backfill completed successfully!');
    console.log({
        decisionId: result.decisionId,
        versionId: result.id,
        versionNumber: result.versionNumber,
        title: result.title,
    });
}
main()
    .catch((error) => {
        console.error('Backfill failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
