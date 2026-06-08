-- Migration des rôles utilisateurs vers la nouvelle nomenclature
-- ADMIN → ADMINISTRATEUR
-- AGENT_TERRAIN → SAISIE
-- BO → INSTRUCTEUR
-- CONTROLEUR est un nouveau rôle (pas de migration source)

UPDATE "User" SET role = 'ADMINISTRATEUR' WHERE role = 'ADMIN';
UPDATE "User" SET role = 'SAISIE' WHERE role = 'AGENT_TERRAIN';
UPDATE "User" SET role = 'INSTRUCTEUR' WHERE role = 'BO';
