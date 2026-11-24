/*
  Warnings:

  - You are about to drop the column `visibility` on the `DecisionVersion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Decision" ADD COLUMN     "visibility" "DecisionVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "DecisionVersion" DROP COLUMN "visibility";
