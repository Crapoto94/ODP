-- Add separate Filien "fonction" fields for COMMERCE enseignes vs autres
ALTER TABLE "TypeDossierConfig" ADD COLUMN IF NOT EXISTS "filienFonctionEnseignes" TEXT DEFAULT '';
ALTER TABLE "TypeDossierConfig" ADD COLUMN IF NOT EXISTS "filienFonctionAutres" TEXT DEFAULT '';
