-- CreateTable
CREATE TABLE "Tiers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "natureJuridique" TEXT,
    "siret" TEXT,
    "email" TEXT,
    "adresse" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "code_sedit" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'PROVISOIRE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Occupation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT,
    "tiersId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "anneeTaxation" INTEGER,
    "adresse" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "description" TEXT,
    "photos" TEXT,
    "montantCalcule" REAL NOT NULL DEFAULT 0,
    "facturePath" TEXT,
    "numeroFacture" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Occupation_tiersId_fkey" FOREIGN KEY ("tiersId") REFERENCES "Tiers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "titre" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CONTACT_DIRECT',
    "occupationId" INTEGER NOT NULL,
    "pjPath" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Contact_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "pjPath" TEXT,
    "pjName" TEXT,
    "pjThumb" TEXT,
    "isEmail" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "fromEmail" TEXT,
    "toEmail" TEXT,
    "origin" TEXT DEFAULT 'desktop',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "O365Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "bodyPreview" TEXT,
    "receivedAt" DATETIME NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "couleur" TEXT,
    "niveau" INTEGER NOT NULL,
    "parentId" INTEGER,
    CONSTRAINT "Categorie_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Categorie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModeTaxation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Article" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT,
    "designation" TEXT NOT NULL,
    "categorieId" INTEGER,
    "modeTaxationId" INTEGER,
    "annee" INTEGER NOT NULL,
    "montant" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "chapitre" TEXT DEFAULT '',
    "nature" TEXT DEFAULT '',
    "fonction" TEXT DEFAULT '',
    "codeInterne" TEXT DEFAULT '',
    "typeMouvement" TEXT DEFAULT '',
    "sens" TEXT DEFAULT '',
    "structure" TEXT DEFAULT '',
    "gestionnaire" TEXT DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Article_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "Categorie" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Article_modeTaxationId_fkey" FOREIGN KEY ("modeTaxationId") REFERENCES "ModeTaxation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MobileLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "ip" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MobileLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "financeEmail" TEXT,
    "appUrl" TEXT,
    "apmUrl" TEXT,
    "apmToken" TEXT,
    "senderName" TEXT DEFAULT 'ODP Console',
    "senderEmail" TEXT DEFAULT 'dsihub@fbc.fr',
    "filienOrga" TEXT DEFAULT '01',
    "filienBudget" TEXT DEFAULT 'BA',
    "filienExercice" INTEGER,
    "filienAvancement" TEXT DEFAULT '5',
    "filienRejetDispo" BOOLEAN DEFAULT true,
    "filienRejetCA" BOOLEAN DEFAULT false,
    "filienRejetMarche" BOOLEAN DEFAULT false,
    "filienMouvement" TEXT DEFAULT '1',
    "filienType" TEXT DEFAULT 'R',
    "filienLibelle" TEXT,
    "filienCalendrier" TEXT DEFAULT '01',
    "filienMonnaie" TEXT DEFAULT 'E',
    "filienMouvementEx" TEXT DEFAULT 'N',
    "filienPreBordereau" TEXT DEFAULT '1235',
    "filienPoste" TEXT DEFAULT '0001',
    "filienBordereau" TEXT DEFAULT '0001',
    "filienObjet" TEXT,
    "filienChapitre" TEXT DEFAULT '',
    "filienNature" TEXT DEFAULT '',
    "filienFonction" TEXT DEFAULT '',
    "filienCodeInterne" TEXT DEFAULT '',
    "filienTypeMouvement" TEXT DEFAULT '',
    "filienSens" TEXT DEFAULT '',
    "filienStructure" TEXT DEFAULT '',
    "filienGestionnaire" TEXT DEFAULT '',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LigneOccupation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "occupationId" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,
    "quantite1" REAL NOT NULL DEFAULT 0,
    "quantite2" REAL NOT NULL DEFAULT 0,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "dateDebutConstatee" DATETIME,
    "dateFinConstatee" DATETIME,
    "montant" REAL NOT NULL DEFAULT 0,
    "photos" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "LigneOccupation_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneOccupation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Gabarit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tiers_siret_key" ON "Tiers"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "ModeTaxation_nom_key" ON "ModeTaxation"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
