# ODP Manager - Occupation du Domaine Public

Application de gestion des redevances (RODP) et taxes locales (TLPE) pour la ville.

## Structure du Projet
- `/app` : Pages Next.js (Dashboard, Dossiers, Tiers).
- `/api` : Points d'entrée pour les calculs et exports.
- `/lib` : Logique métier (Calcul des frais, clients Prisma/APM).
- `/components` : UI premium, cartes interactives et graphiques.

## Installation Rapide
1. Installer les dépendances : `npm install`
2. Configurer le `.env` (DATABASE_URL et APM_API_KEY)
3. Initialiser la DB : `npx prisma db push`
4. Lancer en dev : `npm run dev`

## Fonctionnalités Clés
- **Calcul Auto** : Barèmes RODP (Centre/Périphérie) et TLPE avec abattements PME.
- **SIG** : Visualisation géographique des occupations via Leaflet.
- **APM Integration** : Demandes de création de tiers envoyées via le proxy mail sécurisé.
