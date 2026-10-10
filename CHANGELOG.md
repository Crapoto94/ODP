# Journal des versions — ODP (Occupation du Domaine Public)

Le détail fonctionnel visible des utilisateurs est aussi dans l'application (menu « Version » → journal des versions) ;
les éléments rattachés à chaque version viennent du backlog.

## À venir — non publié

### Gestion des tournages (nouveau module)
- **Site public de dépôt** (`frontend-web/`, à héberger en DMZ, intégré en iframe, page blanche) : formulaire complet de demande d'autorisation (jours et horaires équipe / véhicules techniques, lieu, type de film, synopsis, scènes, violence / armes factices, plan de tournage par date, personnes mobilisées, véhicules et stationnement, pièces jointes, cas étudiants).
- **Règles bloquantes** : dates de tournage antérieures au délai d'instruction refusées, attestation d'assurance et plan de localisation obligatoires ; règles rejouées côté serveur. Informations sur le rendez-vous sur site, l'accord de principe, l'avis aux riverains, et marche à suivre pour les drones (Cerfa 15476*02), la passerelle aux câbles et le Parc des Cormailles.
- **Paramétrage** (Paramètres › Gestion des tournages) : délai d'instruction (15 jours ouvrés lundi-vendredi par défaut, hors jours fériés ; ou jours calendaires), périodes d'absence du service (demandes non traitées, tournages acceptés à compter d'une date de reprise), message d'accueil, e-mail de notification, clé d'accès du site public.
- **Menu Gestion métier › Demandes de tournages** : liste filtrable, fiche détaillée, pièces jointes, statuts (nouvelle, en instruction, complément, accord de principe, refusée, annulée), notes internes, alerte de dépassement du délai de réponse.
- **Nouveau rôle « Agent tournages »** : ne voit que les demandes de tournage, les tournages en cours et la carte (droits `VIEW_TOURNAGES` / `VIEW_CARTE`, modifiables dans Paramètres › Rôles).

### Instruction par les services et dossier ODP
- **Demandes d'avis aux services** (direction de l'espace public, sports, éducation, CMS, salles municipales, autres gestionnaires) : services et adresses e-mail paramétrables, questions propres à chaque service (ex. présence d'un médecin / infirmier au CMS, usage par les associations sportives), avis « libres » avec adresses à la volée, relance, annulation. Réponse favorable / défavorable **sans authentification** par un lien reçu par e-mail ; suivi dans la liste et la fiche des demandes.
- **Droit « Paramétrage des tournages »** : l'agent tournages accède à l'onglet Gestion des tournages des paramètres.
- **Création du dossier de tournage ODP depuis une demande** : tiers existant ou nouveau tiers provisoire, contact, dates, lieu, résumé complet et avis des services repris dans le dossier.
- **Pièces jointes protégées** : stockées hors du dossier public (`data/tournages`, volume Docker) et servies uniquement aux utilisateurs ayant accès aux demandes.

### Tarification des tournages
- **Barèmes importés dans Tarifs & Articles** (2025 et 2026) : bâtiments publics (délibération du 13/02/2025) et équipements sportifs (tournages et prises de vues 2025/2026). Le barème voirie 2026 y figurait déjà.
- **Simulation financière dans chaque demande** : calcul automatique selon le type de lieu (voie publique, espace vert, bâtiment municipal, équipement sportif), l'équipe, les jours, les tournages de nuit, le stationnement, la surface et les câbles ; abattement de 50 % des courts-métrages (hors publicité) et projets aidés, exonération des projets d'écoles. Paramètres ajustables par demande.
- **Options réglables** (Paramètres › Gestion des tournages › Tarification) pour les points non précisés par les barèmes : périmètre de l'abattement, unité des tarifs sportifs, règles d'abattement des équipements sportifs, heures d'instruction, seuil du supplément de nuit…
- **Lignes de facturation générées** à la création du dossier ODP depuis la demande (option), avec abattement et exonération appliqués.
- Formulaire public : type de lieu, équipement sportif, surface occupée, câbles, durée du film et aide financière.

### Divers
- Produit renommé **VibeODP**.
- **Logo de la ville** téléversable dans Paramètres › Général, affiché en haut à gauche.
- **Page Facturation plus rapide** : lecture groupée des factures, cache de l'état de paiement SEDIT (5 min côté serveur, affichage immédiat des derniers résultats côté navigateur ; le bouton d'actualisation force la relecture).

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
- **Liste des chantiers et tournages en cartes** avec sous-détail des articles tarifaires, alertes et pagination ; la carte s'adapte à sa propre largeur (requêtes de conteneur), sans chevauchement quand le menu latéral est déplié.
- **Listes TLPE et Commerces en cartes dépliables** : pastille d'état et chiffres clés, et dépliage des dossiers année par année (type, statut, dispositifs, montant, accès au dossier).
- **Paramètres refondus** : sous-menu (Configuration / Référentiels / Technique) dans le menu latéral gauche, un seul en-tête par page, et **contenu de chaque onglet recomposé** avec les mêmes composants (cartes de section, champs, interrupteurs, tableaux, fenêtres modales, barre d'enregistrement fixe) : Général, Filien / Dépôt, Signatures, Modèles d'e-mails, Utilisateurs, Rôles, Types de contacts, Base PostgreSQL, Console SQL, Backlog et Logs mobiles.
- **Harmonisation graphique de toutes les pages** (design uniquement) : échelle typographique unique, titres et sous-titres de page, boutons, cartes, ombres neutres, tuiles aplaties, champs et tableaux, pages alignées sur la même largeur, en-têtes de page adaptatifs (les actions passent sous le titre si la place manque) et barres de défilement fines et discrètes (sombres dans le menu latéral).
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
