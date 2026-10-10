CREATE TABLE IF NOT EXISTS "RegleMetier" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "modifiePar" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegleMetier_pkey" PRIMARY KEY ("cle")
);
