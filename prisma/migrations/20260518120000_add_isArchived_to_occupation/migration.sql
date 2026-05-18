-- AlterTable
ALTER TABLE "Occupation" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Occupation_isArchived_idx" ON "Occupation"("isArchived");
