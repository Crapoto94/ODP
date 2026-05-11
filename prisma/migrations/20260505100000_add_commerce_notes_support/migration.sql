-- AlterTable: Make occupationId nullable and add tiersId to Note
ALTER TABLE "Note" RENAME COLUMN "occupationId" TO "occupationId_old";

CREATE TABLE "Note_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" INTEGER,
    "tiersId" INTEGER,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "pjPath" TEXT,
    "pjName" TEXT,
    "pjThumb" TEXT,
    "isEmail" BOOLEAN NOT NULL DEFAULT 0,
    "externalId" TEXT,
    "fromEmail" TEXT,
    "toEmail" TEXT,
    "origin" TEXT DEFAULT 'desktop',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation" ("id") ON DELETE CASCADE,
    CONSTRAINT "Note_tiersId_fkey" FOREIGN KEY ("tiersId") REFERENCES "Tiers" ("id") ON DELETE CASCADE
);

INSERT INTO "Note_new" ("id", "occupationId", "tiersId", "content", "author", "pjPath", "pjName", "pjThumb", "isEmail", "externalId", "fromEmail", "toEmail", "origin", "created_at")
SELECT "id", "occupationId_old", NULL, "content", "author", "pjPath", "pjName", "pjThumb", "isEmail", "externalId", "fromEmail", "toEmail", "origin", "created_at"
FROM "Note";

DROP TABLE "Note";

ALTER TABLE "Note_new" RENAME TO "Note";

CREATE INDEX "Note_occupationId_idx" ON "Note"("occupationId");
CREATE INDEX "Note_tiersId_idx" ON "Note"("tiersId");
