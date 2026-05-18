-- AlterTable
ALTER TABLE "Occupation" ADD COLUMN "isExempt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Occupation" ADD COLUMN "isNotAuthorized" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Occupation_isExempt_idx" ON "Occupation"("isExempt");
CREATE INDEX "Occupation_isNotAuthorized_idx" ON "Occupation"("isNotAuthorized");
