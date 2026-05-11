-- AlterTable
ALTER TABLE "Occupation" ADD COLUMN "isAgissantPourBillable" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Occupation" ADD COLUMN "aotGabaritId" INTEGER;
