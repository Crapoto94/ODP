-- CreateTable ContactRoleConfig
CREATE TABLE "ContactRoleConfig" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(255) NOT NULL,
    "isSendAot" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactRoleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactRoleConfig_nom_key" ON "ContactRoleConfig"("nom");