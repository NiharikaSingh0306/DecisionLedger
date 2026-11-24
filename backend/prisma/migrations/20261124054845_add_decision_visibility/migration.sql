-- CreateEnum
CREATE TYPE "DecisionVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "DecisionVersion" ADD COLUMN     "visibility" "DecisionVisibility" NOT NULL DEFAULT 'PRIVATE';
