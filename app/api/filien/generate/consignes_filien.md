# Consignes de génération Filien (ODP Chantiers)

Ce document récapitule les règles de mapping technique pour la génération des fichiers de mouvements Filien à destination de Sedit.

## En-tête du fichier
- Le fichier commence par la ligne combinée : `/##//PARAM/{Orga}/{Budget}/{Exercice}/{Avancement}/N/N/N`

## Paramètres Généraux
- **Organisation** : Code collectivité (ex: `01`).
- **Budget** : Code budget (ex: `00`).
- **Exercice** : Année en cours.

## Mapping des Balises (Mouvement)
- **/01/** : **ID Mouvement**. Incrémentation automatique (ex: `ODP00001`).
- **/02/** : **Type**. Valeur par défaut `R` (Recette).
- **/03/** : **Code Tiers Sedit**. Identifiant unique du tiers dans Sedit.
- **/04/** : **Objet du mouvement**. Utilise la surcharge par type de dossier si présente.
- **/11/** : **N° de pré-bordereau**. Récupéré depuis la configuration par type de dossier.
- **/20/** : **Libellé Tiers**. Format : `Chantier {Libellé du dossier}`.
- **/44/** : **Titre collectif**. Valeur `N` (Individuel).

## Balises de Lignes (Consolidées)
*Note : Toutes les lignes d'un dossier sont fusionnées en une seule ligne Filien.*

- **/500/P** : Type de ligne (Périodique).
- **/501/001** : Numéro de ligne.
- **/502/** : `Montant total`.
- **/503/** : `0101{Année}` (Début d'année).
- **/504/** : `3112{Année}` (Fin d'année).
- **/505/1,00** : Quantité.
- **/506/** : Montant total du chantier.
- **/509/** : Montant total du chantier.
- **/541/** : Ventilation analytique (format fixe 42 caractères : Chapitre, Nature, Fonction, Code Interne, Type, Sens).
- **/542/** : Ventilation analytique (format fixe 30 caractères : Structure, Gestionnaire, Destinataire).
- **/57/** : `Voir détail de facture`.
- **/66/** : Montant total de la ligne (Euro).

## Pièces Jointes (Balises /26/ à /29/)
- **PJ1 (/26/)** : Délibération.
- **PJ2 (/27/)** : Tarifs.
- **PJ3 (/28/)** : AOT (Fichier PDF du chantier).
- **PJ4 (/29/)** : Détails de facture (Fichier PDF de la facture).

---
*Note technique : Les balises étendues (/264/, /266/, /56/, /58/, /59/, etc.) ont été supprimées pour assurer la compatibilité avec l'import Sedit.*
