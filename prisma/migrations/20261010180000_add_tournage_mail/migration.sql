ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailExpediteurNom" TEXT;
ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailExpediteurEmail" TEXT;
ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooter1" TEXT;
ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooter2" TEXT;
ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooter3" TEXT;
ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "mailFooterColor" TEXT;
