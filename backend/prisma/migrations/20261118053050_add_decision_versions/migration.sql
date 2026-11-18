-- CreateTable
CREATE TABLE "DecisionVersion" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "options" JSONB,
    "decisionSummary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "DecisionStatus" NOT NULL,
    "owner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DecisionVersion_decisionId_idx" ON "DecisionVersion"("decisionId");

-- CreateIndex
CREATE INDEX "DecisionVersion_createdAt_idx" ON "DecisionVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionVersion_decisionId_versionNumber_key" ON "DecisionVersion"("decisionId", "versionNumber");

-- AddForeignKey
ALTER TABLE "DecisionVersion" ADD CONSTRAINT "DecisionVersion_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
