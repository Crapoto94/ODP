# Journal des versions — ODP (Occupation du Domaine Public)

Le détail fonctionnel visible des utilisateurs est aussi dans l'application (menu « Version » → journal des versions) ;
les éléments rattachés à chaque version viennent du backlog.

## 1.2.0 — 10 octobre 2026

Version du produit **VibeODP** : nouveau module de **gestion des tournages** (de la demande en ligne jusqu'au dossier et à la facturation),
**instruction par les services**, **tarification et simulation financière** des tournages, et page des **règles métier de facturation**
(débrayables et paramétrables) pour la TLPE, les commerces, les chantiers et les tournages.

### Gestion des tournages — demande en ligne
- **Site public de dépôt** (`frontend-web/`) : application autonome à héberger en **DMZ**, en **page blanche** pour être intégrée en iframe dans le site de la ville. Docker Compose dédié (port **5001**), variables `BACK_URL`, `TOURNAGE_API_KEY`, `FRAME_ANCESTORS`. La clé d'accès ne quitte jamais le serveur du site.
- **Formulaire complet** : demandeur ; projet (titre, type de film, synopsis, scènes en extérieur, scènes de violence, armes factices, durée du film, aide financière) ; **jours** (copiables) avec horaires d'arrivée et de départ de l'équipe et des véhicules techniques (facultatifs), **par pas de 15 minutes** ; lieu (voie publique, espace vert, bâtiment municipal, équipement sportif), emplacements, surface et câbles ; plan de tournage par date ; personnes mobilisées (équipe, comédiens, figurants, autres) ; véhicules et places de stationnement (détail affiché si « places de stationnement » est coché) ; cas étudiants (attestation de l'école et contact).
- **Pièces jointes** par zones de dépôt (glisser-déposer, liste, suppression) : plan de localisation au 1/100e ou 1/200e, attestation d'assurance, attestation de l'école, autres pièces.
- **Règles bloquantes** rejouées côté serveur : dates antérieures au délai d'instruction refusées (**15 jours ouvrés lundi-vendredi**, hors jours fériés, paramétrable), **périodes d'absence du service** (demandes non traitées, tournages acceptés à compter d'une date de reprise), attestation d'assurance obligatoire.
- **Informations au demandeur** : rendez-vous sur site, accord de principe, avis aux riverains ; marche à suivre pour les **drones** (Cerfa 15476*02), la **passerelle aux câbles** (Ville de Paris) et le **Parc des Cormailles** (Département).
- **Sécurité de l'API publique** : clé d'accès et **liste des IP de frontends autorisés** (IP ou plages CIDR, plusieurs frontends possibles), limitation de débit, champ anti-robot.

### Gestion des tournages — traitement des demandes
- **Menu Gestion métier › Demandes de tournages** : liste avec recherche, filtres par statut et par avis, **pagination** (15, 25, 50 ou 100 par page), alerte de dépassement du délai de réponse, indication du dossier ODP lié.
- **Fiche d'une demande** : tout le contenu du formulaire, pièces jointes, statuts (nouvelle, en instruction, complément demandé, accord de principe, refusée, annulée), notes internes, **mail au demandeur** à l'accord, au complément ou au refus (message libre).
- **Pièces jointes protégées** : stockées hors du dossier public (`data/tournages`, volume Docker) et servies seulement aux utilisateurs ayant accès aux demandes.
- **Rôle « Agent tournages »** : ne voit que les demandes de tournage, les tournages (liste et fiches), la carte et le paramétrage des tournages (droits `VIEW_TOURNAGES`, `VIEW_CARTE`, `MANAGE_TOURNAGES`, modifiables dans Paramètres › Rôles).
- **Carte SIG des tournages** : tournages **en cours, à venir et passés** et **demandes**, avec infobulles détaillées au survol ; vue exclusive pour l'agent tournages, bascule « Tournages & demandes » pour les autres profils.
- **Création du dossier de tournage ODP depuis une demande** : tiers existant ou nouveau tiers provisoire, contact, dates, lieu, résumé complet et avis des services repris dans le dossier.

### Instruction par les services
- **Demandes d'avis** aux services consultés par la DAC (point d'entrée unique) : direction de l'espace public, direction des sports (stades), éducation (écoles), CMS, salles municipales, autres gestionnaires de locaux.
- **Services paramétrables** (Paramètres › Gestion des tournages) : un ou plusieurs e-mails par service, questions propres (présence d'un médecin ou d'un infirmier au CMS, usage par les associations sportives…), indicateur « circuit propre » (signature et tarifs distincts), activation.
- **Avis « libres »** : demande à des adresses saisies à la volée, relance, annulation, copie du lien.
- **Réponse sans authentification** par un lien personnel reçu par e-mail : avis favorable ou défavorable (motif obligatoire), commentaire, réponses aux questions du service ; notification interne à l'adresse paramétrée.
- Suivi visible dans la liste (pastilles ✔ favorable, ✖ défavorable, ⏳ pas de retour) et dans la fiche de chaque demande.

### E-mails des tournages
- **Expéditeur, pied de page (3 lignes et couleur), adresse de notification interne** propres aux tournages, avec repli sur les réglages généraux ; **mail de test**.
- **8 modèles éditables avec variables** : accusé de réception, notification interne, complément, accord de principe, refus, demande d'avis, relance, avis reçu.

### Tarification des tournages
- **Barèmes importés dans Tarifs & Articles** (2025 et 2026) : bâtiments publics (délibération du 13/02/2025) et équipements sportifs (tournages et prises de vues 2025/2026). Le barème voirie 2026 y figurait déjà.
- **Simulation financière dans chaque demande** : calcul selon le type de lieu, l'équipe, les jours, les tournages de nuit, le stationnement, la surface et les câbles ; abattement de 50 % des courts-métrages (hors publicité) et des projets aidés, exonération des projets d'écoles. Lieu, équipement, surface, câbles, abattement et exonération ajustables par demande.
- **Lignes de facturation générées** à la création du dossier ODP (option), avec abattement et exonération appliqués ; plus de double minoration court-métrage.
- **Options réglables** pour les points non précisés par les barèmes : périmètre de l'abattement, unité des tarifs sportifs, règles d'abattement des équipements sportifs, heures d'instruction, seuil du supplément de nuit, demi-journée, aide de la Ville, gratuité des écoles, signalisation.

### Règles métier de facturation (Paramètres › Règles de facturation)
- **Page des règles** pour la **T.L.P.E.**, les **commerces**, les **chantiers**, les **tournages** et les règles transversales : description métier, source, effet ; chaque règle est **débrayable** (interrupteur) ou **paramétrable** (valeur, choix), avec retour à la valeur par défaut.
- **TLPE** : prorata (mois pleins, mois entamés, au jour, année pleine), exonération des enseignes et son seuil, enseignes scellées au sol, cumul des enseignes (et seulement celles présentes en même temps), seuil de palier, re-tarification automatique.
- **Chantiers et tournages** : jour de début et de fin inclus, durée d'un mois, tranche de 10 jours, dates constatées prioritaires, recalcul automatique de la durée.
- **Commerces** : reconduction au tarif de l'année cible, dégrèvements autorisés.
- **Tous dossiers** : majoration des occupations non autorisées (et son taux), minoration court-métrage (et son taux), statuts Clos / Titré depuis SEDIT, alerte quotidienne aux instructeurs.
- Calculs, factures, trains de facturation et affichage utilisent les **mêmes règles** ; le prorata TLPE n'existe plus qu'en un seul endroit. Valeurs par défaut identiques au comportement précédent.

### Divers
- Produit renommé **VibeODP**.
- **Logo de la ville** téléversable dans Paramètres › Général, affiché en haut à gauche.
- **Page Facturation plus rapide** : lecture groupée des factures, cache de l'état de paiement SEDIT (5 min côté serveur, affichage immédiat des derniers résultats côté navigateur ; le bouton d'actualisation force la relecture).

### Mise en service
- Côté VibeODP : `pulldocker`. Les tables des tournages, des services, des avis et des règles se créent d'elles-mêmes si la migration n'a pas été appliquée. Le `docker-compose.yml` monte un nouveau volume `./data:/app/data` (pièces jointes des demandes).
- Frontend de la DMZ : `cp .env.example .env`, renseigner `BACK_URL`, `TOURNAGE_API_KEY` (Paramètres › Gestion des tournages › Accès du site public) et `FRAME_ANCESTORS`, puis `docker compose up -d --build` ; déclarer l'IP du serveur dans « Frontends autorisés ».
- Données d'exemple : 30 demandes `TOU-DEMO-*` (`scripts/seed-demandes-tournage.js`, option `--purge` pour les supprimer). Import des barèmes : `scripts/import-tarifs-tournage.js` (déjà exécuté, sans effet s'il est relancé).

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
