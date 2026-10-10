CREATE TABLE IF NOT EXISTS "ServiceInstructeur" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "emails" JSONB NOT NULL DEFAULT '[]',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "circuitPropre" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceInstructeur_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceInstructeur_code_key" ON "ServiceInstructeur"("code");

CREATE TABLE IF NOT EXISTS "AvisTournage" (
    "id" SERIAL NOT NULL,
    "demandeId" INTEGER NOT NULL,
    "serviceId" INTEGER,
    "serviceNom" TEXT NOT NULL,
    "libre" BOOLEAN NOT NULL DEFAULT false,
    "destinataires" JSONB NOT NULL DEFAULT '[]',
    "token" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    "message" TEXT,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "reponseCommentaire" TEXT,
    "reponseDonnees" JSONB,
    "reponduPar" TEXT,
    "demandePar" TEXT,
    "dateDemande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReponse" TIMESTAMP(3),
    "derniereRelance" TIMESTAMP(3),
    "nbRelances" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvisTournage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AvisTournage_token_key" ON "AvisTournage"("token");
CREATE INDEX IF NOT EXISTS "AvisTournage_demandeId_idx" ON "AvisTournage"("demandeId");
CREATE INDEX IF NOT EXISTS "AvisTournage_statut_idx" ON "AvisTournage"("statut");
