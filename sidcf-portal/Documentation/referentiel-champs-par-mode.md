# Référentiel — Champs de collecte (informations & fichiers) par mode de passation

> **Objet.** Document de référence recensant, pour chaque mode de passation, les **informations** (champs de saisie) et les **fichiers/documents** collectés à l'étape **Contractualisation** du module Marché+, ainsi que les fonctions activées (soumissionnaires, lots, COJO, validation DGMP).
>
> **À quoi il sert.** Base de travail pour la validation DCF des points **4.b** (variables/documents par mode) et **5.b** (champs de lot par mode) du CR EHOUMAN du 26 mai 2026.
>
> **Source.** Extrait de `sidcf-portal/js/config/rules-config.json` (clé `contextualite_procedures`), complété par le comportement réel de l'écran `ecr02a-procedure-pv.js`.
>
> **Date.** 2026-05-29 · **Statut.** Reflet du code à la Modif #84. Les libellés métier restent à arrêter avec la DCF.

---

## Légende

- **Requis** : champ/document obligatoire à l'enregistrement de la procédure.
- **Optionnel** : champ/document facultatif.
- **Masqué** : champ explicitement non affiché pour ce mode.
- ✅ activé · ❌ désactivé.

---

## 1. Informations collectées (champs de saisie)

| Mode | Informations **requises** | Informations **optionnelles** | Champs **masqués** |
|---|---|---|---|
| **PSD** — Entente Directe | Bon de commande, Facture proforma | Devis de concurrence, Formulaire de sélection | Publication DAO, PV ouverture/analyse/jugement, Commission, Catégorie procédure, Type dossier d'appel, Nb offres reçues/classées |
| **PSC** — Demande de Cotation | Dossier de concurrence, Formulaire de sélection, PV d'ouverture, Date d'ouverture, Date de sélection | Rapport d'analyse, Dossier de recours | Publication DAO, PV jugement, Commission, Nb offres reçues/classées |
| **PSL** — Compétition Limitée | Courrier d'invitation, DAO validé, PV d'ouverture, Rapport d'analyse, PV de jugement, Date d'ouverture, Date de jugement, Commission | Mandat de représentation, Dossier de recours | *(aucun)* |
| **PSO** — Compétition Ouverte | *(idem PSL)* | Mandat de représentation, Dossier de recours | *(aucun)* |
| **AOO** — Appel d'Offres Ouvert | *(idem PSL)* | Mandat de représentation, Dossier de recours | *(aucun)* |
| **PI** — Prestations Intellectuelles | Courrier d'invitation, **AMI / Demande de propositions**, PV d'ouverture, Rapport d'analyse, PV de jugement, Date d'ouverture, Date de jugement, Commission | Mandat de représentation, Dossier de recours | *(aucun)* |

## 2. Fichiers / documents à uploader

| Mode | Documents **requis** | Documents **optionnels** |
|---|---|---|
| **PSD** | BON_COMMANDE, FACTURE_PROFORMA | DEVIS_CONCURRENCE |
| **PSC** | DOSSIER_CONCURRENCE, FORMULAIRE_SELECTION, PV_OUVERTURE | RAPPORT_ANALYSE, DOSSIER_RECOURS |
| **PSL** | COURRIER_INVITATION, DAO, PV_OUVERTURE, RAPPORT_ANALYSE, PV_JUGEMENT | MANDAT_REPRESENTATION, DOSSIER_RECOURS, COURRIERS_ANO, ECLAIRCISSEMENTS |
| **PSO** | *(idem PSL)* | *(idem PSL)* |
| **AOO** | *(idem PSL)* | *(idem PSL)* |
| **PI** | COURRIER_INVITATION, **AMI_DP**, PV_OUVERTURE, RAPPORT_ANALYSE, PV_JUGEMENT | MANDAT_REPRESENTATION, DOSSIER_RECOURS, COURRIERS_ANO, ECLAIRCISSEMENTS |

## 3. Fonctions activées + données soumissionnaires / lots

| Mode | Soumissionnaires | Lots | Champs soumissionnaire | Champs par lot | COJO obligatoire | Validation DGMP | Recours |
|---|:--:|:--:|---|---|:--:|:--:|:--:|
| **PSD** | ❌ | ❌ | — | — | ❌ | ❌ | ❌ |
| **PSC** | ✅ | ✅ | NCC, Raison sociale, Nature/groupement, Statut sanction | Entreprises soumissionnaires, Objet, Montant prév. HT, Montant prév. TTC, Livrables attendus | ❌ | ❌ | ✅ |
| **PSL** | ✅ | ✅ | + Statut juridique | *(idem PSC)* | ✅ | ✅ | ✅ |
| **PSO** | ✅ | ✅ | *(idem PSC)* | *(idem PSC)* | ✅ | ✅ | ✅ |
| **AOO** | ✅ | ✅ | + Statut juridique | *(idem PSC)* | ✅ | ✅ | ✅ |
| **PI** | ✅ | ✅ | + Statut juridique | *(idem PSC)* + méthode de sélection **QBS / QCBS / FBS / LCS** | ✅ | ✅ | ✅ |

---

## 4. Glossaire des codes (champ technique → libellé proposé)

> Les libellés sont **provisoires** ; ils restent à valider avec la DCF (cf. CR 3.c « libellé et contenu à arrêter »).

### Informations

| Code | Libellé proposé |
|---|---|
| `bonCommande` | Référence du bon de commande |
| `factureProforma` | Référence de la facture proforma |
| `devisConcurrence` | Devis de mise en concurrence |
| `formulaireSelection` | Formulaire de sélection |
| `dossierConcurrence` | Dossier de mise en concurrence |
| `courrierInvitation` | Courrier d'invitation |
| `daoValide` | Dossier d'Appel d'Offres (DAO) validé |
| `daoPublication` | Publication du DAO |
| `amiOuDP` | Avis à Manifestation d'Intérêt / Demande de Propositions |
| `pvOuverture` | PV d'ouverture des plis |
| `pvAnalyse` | PV d'analyse |
| `pvJugement` | PV de jugement / d'attribution |
| `rapportAnalyse` | Rapport d'analyse des offres |
| `commission` | Commission (COJO / COPE) |
| `dateOuverture` | Date d'ouverture |
| `dateSelection` | Date de sélection |
| `dateJugement` | Date de jugement |
| `categorieProcedure` | Catégorie de procédure |
| `typeDossierAppel` | Type de dossier d'appel |
| `nbOffresRecues` | Nombre d'offres reçues |
| `nbOffresClassees` | Nombre d'offres classées |
| `mandatRepresentation` | Mandat de représentation |
| `dossierRecours` | Dossier de recours |
| `motifRecours` | Motif du recours |

### Documents (fichiers)

| Code | Libellé proposé |
|---|---|
| `BON_COMMANDE` | Bon de commande |
| `FACTURE_PROFORMA` | Facture proforma |
| `DEVIS_CONCURRENCE` | Devis de concurrence |
| `DOSSIER_CONCURRENCE` | Dossier de mise en concurrence |
| `FORMULAIRE_SELECTION` | Formulaire de sélection |
| `COURRIER_INVITATION` | Courrier d'invitation |
| `DAO` | Dossier d'Appel d'Offres |
| `AMI_DP` | AMI / Demande de propositions |
| `PV_OUVERTURE` | PV d'ouverture |
| `RAPPORT_ANALYSE` | Rapport d'analyse |
| `PV_JUGEMENT` | PV de jugement |
| `MANDAT_REPRESENTATION` | Mandat de représentation |
| `DOSSIER_RECOURS` | Dossier de recours |
| `COURRIERS_ANO` | Courriers ANO (avis de non-objection) |
| `ECLAIRCISSEMENTS` | Demandes d'éclaircissements |

---

## 5. Modes NON configurés (à compléter — point 4.b)

Seuls **6 modes** disposent aujourd'hui d'un référentiel de champs : **PSD, PSC, PSL, PSO, AOO, PI**.

Les modes suivants n'ont **pas de configuration dédiée** dans `rules-config.json` :

| Mode | Comportement actuel | À définir |
|---|---|---|
| **ENTENTE_DIRECTE** (gré à gré) | Réutilise le formulaire **PSD** (devis/proforma + bon de commande), codé en dur | Confirmer si identique à PSD ou variables propres |
| **AOO_PREQUALIF** (AOO avec préqualification) | Formulaire générique, pas de collecte spécifique | Étape/documents de préqualification |
| **AOO_2ETAPES** (AOO en deux étapes) | Formulaire générique | Documents par étape |
| **AOR** (Appel d'Offres Restreint) | Formulaire générique | Liste restreinte, invitations |
| **CFN** (Consultation Fournisseurs Nationaux) | Formulaire générique *(mode ajouté #79)* | Variables conformes à une demande de cotation |
| **CONVENTION** | Formulaire générique *(mode ajouté #79)* | Variables/documents de la convention |
| **LETTRE_COMMANDE_MARCHE** (lettre de commande valant marché) | Formulaire générique *(mode ajouté #79)* | Variables/documents associés |

---

## 6. Écart sur les lots (point 5.b)

Le widget de saisie des lots (`lots-procedure-mp.js`) affiche aujourd'hui un **jeu de champs fixe**, identique pour tous les modes :

- Objet / Libellé du lot
- Nombre d'offres reçues / classées
- 4 dates : ouverture, analyse technique, analyse financière, jugement
- 5 PV : ouverture, analyse technique, analyse financière, combiné, jugement

Ce jeu **ne tient pas compte** des `champs_lots` configurés par mode (cf. §3). Le point **5.b** vise à aligner les champs de chaque lot sur le mode de passation retenu — il dépend du référentiel à valider en **4.b**.

> **Décision actée (Modif #84) :** on **conserve** les champs de lot actuels en l'état tant que le référentiel par mode n'est pas validé.

---

## 7. Points à valider avec la DCF

1. **Libellés définitifs** de tous les champs et documents (cf. glossaire §4, et CR 3.c).
2. **Référentiel des champs/documents** pour les 7 modes non configurés (§5) — point **4.b**.
3. **Champs de lot par mode** (§6) — point **5.b**.
4. Confirmer le **caractère requis/optionnel** de chaque champ par mode (notamment recours, mandat de représentation, dossier de recours).
