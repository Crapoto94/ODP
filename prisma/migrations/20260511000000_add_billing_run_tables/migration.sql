-- CreateTable BillingRun
CREATE TABLE "BillingRun" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "agent" TEXT,
    "recapPath" TEXT,
    "filienPath" TEXT,

    CONSTRAINT "BillingRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable BillingRunInvoice
CREATE TABLE "BillingRunInvoice" (
    "id" SERIAL NOT NULL,
    "billingRunId" TEXT NOT NULL,
    "dossierId" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "tiers" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "pdfPath" TEXT NOT NULL,

    CONSTRAINT "BillingRunInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingRunInvoice_billingRunId_idx" ON "BillingRunInvoice"("billingRunId");

-- CreateIndex
CREATE INDEX "BillingRunInvoice_dossierId_idx" ON "BillingRunInvoice"("dossierId");

-- AddForeignKey
ALTER TABLE "BillingRunInvoice" ADD CONSTRAINT "BillingRunInvoice_billingRunId_fkey" FOREIGN KEY ("billingRunId") REFERENCES "BillingRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
