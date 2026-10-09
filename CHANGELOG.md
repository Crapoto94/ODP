# Journal des versions — ODP (Occupation du Domaine Public)

Le détail fonctionnel visible des utilisateurs est aussi dans l'application (menu « Version » → journal des versions) ;
les éléments rattachés à chaque version viennent du backlog.

## 1.1.0 — 9 octobre 2026

Version issue de la mise en production TLPE (1.0.0) : suivi du paiement des titres SEDIT, règles TLPE corrigées,
nouvelle interface optionnelle et plusieurs évolutions demandées par les instructeurs.

### Facturation et titres SEDIT
- **Onglet « Factures »** : liste de toutes les factures avec date, **type de dossier** (filtrable : chantier, tournage, commerce, TLPE) et **état de paiement**.
- **État de paiement des titres de recette SEDIT** (payé, à payer, non pris en charge, rejeté, suspendu), retrouvé automatiquement par tiers et montant, avec **lien vers la fiche du titre dans SEDIT**. (Backlog #26)
- **Réductions et annulations de titres** : montant réduit ou titre annulé, **motif saisi par la comptabilité** et **certificat administratif (CA) consultable en PDF** depuis ODP.
- **Statut du dossier synchronisé avec SEDIT** : titre payé → dossier **Clos** (date de paiement, note automatique) ; titre émis non payé → **Titré**. Jamais de retour en arrière.
- Export Excel des dossiers éligibles à la facturation (adresse, total, détail des articles).
- Le prorata TLPE est calculé **en mois pleins** partout (écran, facture PDF, train de facturation) : le total d'un train correspond désormais au PDF remis au redevable.

### TLPE
- **Cumul des enseignes par période** : une enseigne supprimée en cours d'année (date de fin) ne s'ajoute plus à la surface cumulée des enseignes installées après sa suppression. (Backlog #48)
- **Catégorie « Enseigne scellée au sol »** : jamais exonérée, exclue du seuil d'exonération des 12 m², mais comptée avec les enseignes pour le palier tarifaire (≤ 50 / > 50 m²). Se choisit dans le paramétrage des tarifs TLPE (type de l'article du catalogue). (Backlog #47)
- **Adresse du dossier** modifiable lorsqu'elle diffère de celle du tiers (adresse du tiers par défaut, rétablissement en un clic), reprise dans la liste TLPE. (Backlog #46)
- **Exonération des 12 m²** calculée sur la surface cumulée complète des enseignes (articles de référence inclus) : une enseigne ajoutée en cours d'année s'ajoute à l'existant.
- **Photographie de la façade / du local** du redevable (comme un dossier commerce), partagée avec la fiche Commerce du même tiers. (Backlog #43)
- **Description et capture d'écran collée (Ctrl+V)** dès la création d'un article. (Backlog #45)
- **Liste TLPE** : recherche (nom, code tiers, adresse), filtre par année avec verrou, filtre par statut et **pastille d'état** (prêt à facturer, facturé, titré, clos…).

### Tiers et dossiers
- **Contrôle d'activité avant création d'un tiers** : « En activité » / « FERMÉ » (état de l'établissement visé par le SIRET, date de fermeture) et confirmation avant de créer un tiers fermé. (Backlog #38)
- **Recherche de tiers par code tiers**, insensible à la casse, sur les écrans Tiers, Dossiers, Commerces, Facturation et Filien. (Backlog #27, #28)
- Type d'occupation simplifié : « Chantier » et « Tournage ». (Backlog #36, #37)
- Bouton « Nouveau Commerce » renommé « **Nouveau Dossier** ». (Backlog #41)

### Alertes
- **Mail quotidien aux instructeurs** le jour de la date d'alerte d'un dossier chantier ou tournage (dès 7 h, une seule fois par dossier, trace dans les notes du dossier). Actif en production uniquement. (Backlog #33)

### Nouvelle interface (optionnelle)
- Interrupteur **« Nouvelle interface »** ouvert à tous les profils (préférence conservée dans le navigateur), inspiré de la maquette Stitch « Ivry ODP Civic System » : nouveau cadre (menu latéral, fil d'Ariane), tableau de bord refait, charte (couleurs, typographie, tableaux).
- **Liste des chantiers et tournages en cartes** avec sous-détail des articles tarifaires, alertes et pagination.
- Sans l'interrupteur, l'interface historique reste strictement inchangée.

### Technique et exploitation
- Lecture des pièces SEDIT (PDF) depuis le conteneur par SMB applicatif, sans montage du partage.
- Appels Oracle SEDIT via l'API centrale APM (certificat auto-signé accepté ; clé dédiée possible : `APM_ORACLE_KEY`).
- Outils de déploiement Docker distant (`pulldocker.ps1` / `.bat`).

### Reste au backlog (non traité dans cette version)
#8 version mobile terrain · #9 portail usager · #10 AOT déjà signé dans le circuit de signature · #29 infobulles d'alerte ·
#30 libellé « Adresse de l'intervention » · #34 visite terrain : cas de non-conformité · #39 adresse du tiers qui disparaît à l'import ·
#40 retour page Chantier après création d'un commerce · #42 documents par dossier TLPE · #44 chronologie financière TLPE.

## 1.0.0 — 29 septembre 2026
Mise en production officielle, incluant le module T.L.P.E. (Taxe Locale sur la Publicité Extérieure).
