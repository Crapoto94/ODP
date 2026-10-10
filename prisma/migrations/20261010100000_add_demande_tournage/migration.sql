-- CreateTable
CREATE TABLE IF NOT EXISTS "DemandeTournage" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'NOUVELLE',
    "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateLimiteReponse" TIMESTAMP(3),
    "premiereDate" TIMESTAMP(3),
    "derniereDate" TIMESTAMP(3),
    "societe" TEXT NOT NULL,
    "demandeurNom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "titre" TEXT NOT NULL,
    "typeFilm" TEXT NOT NULL,
    "donnees" JSONB NOT NULL,
    "pieces" JSONB NOT NULL DEFAULT '[]',
    "notesInternes" TEXT,
    "occupationId" INTEGER,
    "traiteePar" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemandeTournage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TournageConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "delaiInstruction" INTEGER NOT NULL DEFAULT 15,
    "typeJours" TEXT NOT NULL DEFAULT 'OUVRES',
    "exclureFeries" BOOLEAN NOT NULL DEFAULT true,
    "delaiMinimalDepot" INTEGER NOT NULL DEFAULT 0,
    "periodesAbsence" JSONB NOT NULL DEFAULT '[]',
    "messageAccueil" TEXT,
    "emailNotification" TEXT,
    "apiKey" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TournageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DemandeTournage_reference_key" ON "DemandeTournage"("reference");
CREATE INDEX IF NOT EXISTS "DemandeTournage_statut_idx" ON "DemandeTournage"("statut");
CREATE INDEX IF NOT EXISTS "DemandeTournage_dateDepot_idx" ON "DemandeTournage"("dateDepot");
