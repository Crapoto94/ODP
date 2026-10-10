ALTER TABLE "TournageConfig" ADD COLUMN IF NOT EXISTS "frontendsAutorises" JSONB NOT NULL DEFAULT '[]';
