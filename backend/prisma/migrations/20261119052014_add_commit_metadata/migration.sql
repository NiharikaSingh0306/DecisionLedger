-- AlterTable
ALTER TABLE "DecisionVersion" ADD COLUMN     "commitMessage" TEXT,
ADD COLUMN     "restoredFromVersion" INTEGER;
