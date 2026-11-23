/*
  Warnings:

  - Made the column `userId` on table `Decision` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Decision" ALTER COLUMN "userId" SET NOT NULL;
