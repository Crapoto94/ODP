# Consignes de génération Filien (ODP Chantiers & Tournages)

Ce document récapitule les règles de mapping technique pour la génération des fichiers de mouvements Filien à destination de Sedit.

## Format et Encodage
- **Extension** : Le fichier doit impérativement se terminer par `.filien.txt`.
- **Encodage** : **ISO-8859-1 (Latin1)**. L'utilisation de l'UTF-8 provoque des erreurs de caractères accentués dans Sedit.
- **Fin de ligne** : CRLF (`\r\n`) ou LF (`\n`).

## En-tête du fichier
- Le fichier commence par la ligne combinée : `/##//PARAM/{Orga}/{Budget}/{Exercice}/{Avancement}/N/N/N`

## Mapping des Balises (Mouvement)
- **/01/** : **ID Mouvement**. Incrémentation automatique (ex: `ODP00001`).
- **/02/** : **Type**. Valeur par défaut `R` (Recette).
- **/03/** : **Code Tiers Sedit**.
- **/04/** : **Objet**. Format : `ODP - {Type} - {Année}` (ex: `ODP - Chantier - 2024`). Priorité à la surcharge par type de dossier.
- **/11/** : **N° de pré-bordereau**. Valeur par défaut `800`. Ne pas ajouter de zéros de complétion (ex: `800` et non `00800`).
- **/20/** : **Libellé Tiers**. Format : `ODP - {Type} - {Année}`.
- **/21/** : **Libellé complémentaire**. Pour les chantiers : `Chantier : {Libellé du dossier}`.

## Balises de Lignes (Consolidées)
*Note : Toutes les lignes d'un dossier sont fusionnées en une seule ligne Filien.*

- **/500/P** : Type de ligne (Périodique).
- **/502/** : `Droits de voirie {Type} {Année} - Voir détail joint`.
- **/503/** : `0101{Année}` (Début d'année du chantier).
- **/504/** : `3112{Année}` (Fin d'année du chantier).
- **/541/** : Ventilation analytique (42 car. : Chapitre, Nature, Fonction, Code Interne, Type, Sens).
- **/542/** : Ventilation analytique (30 car. : Structure, Gestionnaire, Destinataire).
- **/57/** : `Voir détail de facture`.
- **/66/** : Montant total de la ligne (Euro).

## Pièces Jointes (Balises /26/ à /29/)
- **PJ1 (/26/)** : Délibération.
- **PJ2 (/27/)** : Tarifs.
- **/293/** : Type de pièce (toujours suivi de `/294/011`).
- **/294/011** : Qualification de la pièce justificative (011 = Facture/Justificatif).
- **PJ3 (/28/)** : AOT (Fichier PDF du chantier).
- **PJ4 (/29/)** : Détails de facture (Fichier PDF de la facture).

---
*Note technique : Les processus de génération individuelle et de facturation globale utilisent désormais le même moteur centralisé dans `lib/billing-service.ts`.*
