# Modes de passation des marchés publics CI — Sources officielles

> **Référentiel applicatif** : `sidcf-portal/js/config/registries.json` → `MODE_PASSATION`
> **Doc maintenue par** : DSI · DCF · à valider par la DGMP avant figeage définitif.
> **Dernière mise à jour** : Modif #66 — élagage aux modes officiels documentés.

## Sources juridiques de référence

| Référence | Intitulé | Statut |
|---|---|---|
| **Décret n° 2009-259 du 6 août 2009** | Code des Marchés Publics CI (texte fondateur) | En vigueur (modifié) |
| **Décret n° 2021-909 du 22 décembre 2021** | Modifie le Code MP CI — articles 1 à 20 (seuils et procédures simplifiées) | En vigueur |
| **Décret n° 2013-406 du 06 juin 2013** | Procédure spécifique aux Prestations Intellectuelles (DTAO-PI) | En vigueur |
| **Arrêté n° 692/MPMBPE/DGBF du 16 sept. 2015** | Modalités d'application des procédures simplifiées | En vigueur |

PDFs disponibles dans : `sidcf-portal/Documentation/`

---

## Tableau des modes retenus (10 modes officiels)

| # | Code | Libellé | Famille | Référence article | Tranche montant indicative (XOF) | Notes |
|---|---|---|---|---|---|---|
| 1 | `PSD` | Procédure Simplifiée d'Entente Directe | SIMPLIFIEE | Décret 2021-909 **Art. 5 §1** | < 10 M | Bon de commande + facture pro forma. Pas d'appel à concurrence. |
| 2 | `PSC` | Procédure Simplifiée de demande de Cotation | SIMPLIFIEE | Décret 2021-909 **Art. 5 §2** | 10 M – 30 M | Demande de cotation à **3 fournisseurs minimum**. |
| 3 | `PSL` | Procédure Simplifiée à compétition Limitée | SIMPLIFIEE | Décret 2021-909 **Art. 5 §3** | 30 M – 50 M | Consultation de **5 candidats** présélectionnés. Validation DGMP. |
| 4 | `PSO` | Procédure Simplifiée à compétition Ouverte | SIMPLIFIEE | Décret 2021-909 **Art. 5 §4** | 50 M – 100 M | Publication + Validation DGMP. COJO non obligatoire mais recommandé. |
| 5 | `AOO` | Appel d'Offres Ouvert (standard) | CLASSIQUE | Décret 2009-259 **Art. 53** | ≥ 100 M | Publication BNUMP + COJO obligatoire. Mode par défaut au-dessus du seuil. |
| 6 | `AOO_PREQUALIF` | AOO avec préqualification | CLASSIQUE | Décret 2009-259 **Art. 54** | ≥ 100 M (cas complexes) | Phase de présélection des candidats avant remise des offres. |
| 7 | `AOO_2ETAPES` | AOO en deux (2) étapes | CLASSIQUE | Décret 2009-259 **Art. 55** | ≥ 100 M (technique complexe) | Offres techniques d'abord, puis offres financières des candidats retenus. |
| 8 | `AOR` | Appel d'Offres Restreint | DEROGATOIRE | Décret 2009-259 **Art. 58** | Variable | Dérogatoire — réservé aux marchés de défense, sécurité ou spécificités techniques. |
| 9 | `PI` | Prestations Intellectuelles | PI | Décret 2009-259 **Art. 62 et suivants** + Décret 2013-406 | Variable | DTAO-PI obligatoire. Sélection sur qualité technique. |
| 10 | `ENTENTE_DIRECTE` | Gré à gré / Entente directe | DEROGATOIRE | Décret 2009-259 **Art. 67** | Exceptionnel | Cas d'urgence, monopole technique ou continuité de service. Justificatif obligatoire. |

---

## Modes RETIRÉS (Modif #66) — justification

| Mode retiré | Raison du retrait | Recommandation |
|---|---|---|
| `AOO_CONCOURS` | Le « concours » n'est pas un sous-mode AOO mais une procédure indépendante du Code (architecture / ingénierie). À traiter dans un module Concours dédié si besoin. | Hors scope MP. |
| `AON` (Appel d'Offres National) | Pas un mode distinct — c'est une CATÉGORIE de marché (national vs international), déjà gérée par le champ `categorieProcedure`. | Géré ailleurs. |
| `AOI` (Appel d'Offres International) | Idem AON — catégorie, pas mode. | Géré ailleurs. |
| `RECONDUCTION (Art. 79)` | Mécanisme contractuel d'extension d'un marché existant, pas un mode initial de passation. À traiter dans un module Avenants/Reconductions. | Avenants. |
| `PI_CABINET` | Modalité interne de PI (sélection de cabinet vs individuel) — précision dans le DTAO-PI, pas un mode séparé. | Sous-cas de PI. |
| `PI_INDIVIDUEL (Art. 62)` | Idem — modalité PI consultant individuel. | Sous-cas de PI. |
| `CI` (Concours d'Ingénierie) | Procédure rare et controversée juridiquement. Si besoin métier confirmé, ajouter avec article précis. | À justifier par DGMP. |
| `DEM` (Demande d'Expression de Manifestation) | C'est une **phase** d'un AMI (Avis à Manifestation d'Intérêt), pas un mode de passation. L'AMI précède une PI. | Phase d'AMI/PI. |

---

## Procédure de mise à jour

Toute modification de cette liste doit :
1. **Référencer l'article de loi** pertinent (Décret + Art. + paragraphe).
2. Être **validée par la DGMP** (ou la DCF en attente de validation DGMP).
3. Synchroniser **`sidcf-portal/js/config/registries.json`** et le présent fichier.
4. Mettre à jour aussi `sidcf-portal/js/config/rules-config.json` si la **matrice des seuils** est impactée (ADMIN_CENTRALE).

---

## Validation prévue

| Date | Validateur | Décision | Document support |
|---|---|---|---|
| TODO | DCF (M. EHOUMAN) | À valider | — |
| TODO | DGMP | À valider | — |

Ce tableau est destiné à être complété au fil des validations métier.
