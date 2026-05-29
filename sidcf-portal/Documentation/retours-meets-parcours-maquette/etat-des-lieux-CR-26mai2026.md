# État des lieux — CR EHOUMAN du 26 mai 2026 (Module Marché+)

> **Document de référence (fait foi).** Suivi du traitement des 37 retours du CR de séance SID-CF V2 du 26 mai 2026. La colonne **« Traité sur maquette »** est la source de vérité ; la colonne « Réf. » donne le commit/migration correspondant pour traçabilité.
>
> Légende statut métier : *A confirmer* · *À clarifier* (libellé/contenu à préciser) · *À valider* (métier/DCF).
> Traité sur maquette : **Oui** · **Partiel** · **Non**.
>
> Dernière mise à jour : 2026-05-29.

---

## 1. En-tête — zone de filtre

| N° | Observation | Détail | Statut métier | Traité | Réf. |
|---|---|---|---|---|---|
| 1.a | Types de marché | Mettre en évidence tous les types dans le filtre | A confirmer | **Oui** | #76 |
| 1.b | Liste des états | Ajouter l'état « Infructueux » | A confirmer | **Oui** | #76 |
| 1.c | Libellé filtre « État » | → « Statut du marché » | A confirmer | **Oui** | #76 |
| 1.d | Libellé filtre « Bailleur » | → « Source de financement » | A confirmer | **Oui** | #76 (+ dépendance Type financement #83) |
| 1.e | Nature économique | Ajouter comme critère de filtre | A confirmer | **Oui** | #76 |

## 2. Tableau PPM (liste)

| N° | Observation | Détail | Statut métier | Traité | Réf. |
|---|---|---|---|---|---|
| 2.a | Colonne « Activité » | Code activité + Libellé | A confirmer | **Oui** | #77 |
| 2.b | Nature économique | Ajouter la colonne | A confirmer | **Oui** | #77 (alimentée #91 + migration 030) |
| 2.c | Colonne « Objet » | → « Objet / Libellé » | A confirmer | **Oui** | #77 |
| 2.d | Colonne « Type » | → « Type de marché » | A confirmer | **Oui** | #77 |
| 2.e | Colonne « Montant » | → « Montant prévisionnel » | A confirmer | **Oui** | #77 |
| 2.f | Colonne « Étape » | → « Statut du marché » | A confirmer | **Oui** | #77 |
| 2.g | Projet de marché non abouti | Positionner le statut « Infructueux » | A confirmer | **Partiel** | Statut défini/affiché/filtrable (#76) ; **action de positionnement à implémenter** (cf. 6.a) |

## 3. Création du marché

| N° | Observation | Détail | Statut métier | Traité | Réf. |
|---|---|---|---|---|---|
| 3.a | Mode de passation | Aucune alerte d'inadéquation à ce stade | A confirmer | **Oui** | #78 (+ #80/#81) |
| 3.b | Zones de saisie des montants | Séparateur de milliers | A confirmer | **Oui** | #78 |
| 3.c | Catégorie de prestation | Mention « (à préciser : libellé et contenu) » | À clarifier | **Oui** | #78 — *contenu du référentiel à arrêter avec la DCF* |
| 3.d | Informations techniques | → « Information technique prévisionnelle » | A confirmer (voir géographes) | **Oui** | #78 — *volet coordonnées géo à cadrer avec les géographes* |
| 3.e | Action « Voir » | Navigation contextuelle selon l'étape | A confirmer | **Oui** | #78 |

## 4. Contractualisation

| N° | Observation | Détail | Statut métier | Traité | Réf. |
|---|---|---|---|---|---|
| 4.a | Modes de passation | Ajouter CFN, Convention, Lettre de commande valant marché | A confirmer | **Oui** | #79 |
| 4.b | **Variables associées aux modes** | Faire valider les variables (info + documents à uploader) par mode | **À valider** | **Non** | Différé — brouillon de référentiel : `referentiel-champs-par-mode.md` (à valider DCF) |
| 4.c | Types de marché | Prendre en compte parents/enfants (annexe typologie) | A confirmer | **Oui** | #79 (moteur de règles en cascade) |
| 4.d | Dérogation | Indiquer demandeur + source (État/Bailleur + nom) | A confirmer | **Oui** | #79 |
| 4.e | Mode de passation planifié | Mettre en évidence « MODE DE PASSATION PLANIFIÉE » | A confirmer | **Oui** | #79 |
| 4.f | Sélection du mode | Si pas de dérogation rien ; sinon exiger justification | A confirmer | **Oui** | #79 + #80 (mode figé, dérogation systématique si hors barème) |
| 4.g | Absence de pièce dérogative | Avertissement non bloquant + notif fiche de vie | A confirmer | **Oui** | #79 |
| 4.h | Pièce justificative — fiche de vie | Indiquer l'absence dans la zone contractualisation | A confirmer | **Oui** | #79 |
| 4.i | Fournisseurs sanctionnés | Sanction = cas de REJET | A confirmer | **Oui** | #79 |
| 4.j | Libellé « Référence devis » | → « devis / facture proforma » (tous les libellés) | A confirmer | **Oui** | #79 |
| 4.k | Nombre de devis reçus | Retirer le champ | A confirmer | **Oui** | #79 |
| 4.l | Tableau comparatif | Retirer | A confirmer | **Oui** | #79 |

## 5. Gestion des lots

| N° | Observation | Détail | Statut métier | Traité | Réf. |
|---|---|---|---|---|---|
| 5.a | Périmètre des lots | Lots pour tous les modes **sauf PSD** | A confirmer | **Oui** | Vérifié (en code depuis 06/05) |
| 5.b | **Champs des lots** | Champs affichés = ceux du mode de passation retenu | A confirmer | **Non** | Widget lots à jeu fixe ; lié à 4.b. Décision : conserver les champs actuels en attendant le référentiel |
| 5.c | Marché à plusieurs lots | Libellé de lot (Objet/Libellé) ; maintenir les variables des lots uniques | A confirmer | **Oui** | #84 (+ retrait « offres classées » #85) |

## 6. Attribution / Enregistrement du marché

| N° | Observation | Détail | Statut métier | Traité | Réf. |
|---|---|---|---|---|---|
| 6.a | Marché infructueux | Définir et mettre en évidence le statut « Infructueux » | A confirmer | **Partiel** | Statut défini/affiché/routé ; **action « Déclarer infructueux » à implémenter** |
| 6.b | Uniformisation des collectes | NON → reconnaître infos/documents **par mode** | À clarifier | **Non** | = référentiel par mode (lié à 4.b) |
| 6.c | Titre de l'étape « Attribution » | → « Enregistrement de marché » | A confirmer | **Oui** | #90 + #92 (les 2 timelines de la fiche) |
| 6.d | Participation COJO / COPE | Capter participation + rapports / PV d'ouverture | A confirmer | **Oui** | Traité à l'étape Procédure |

---

## Travaux complémentaires (hors numérotation CR, déjà livrés)

Ces ajustements ont été demandés en séances de travail (29 mai 2026) et livrés, mais ne portent pas un numéro du CR du 26 mai :

- **#80** — Mode de passation figé à la contractualisation (plus de sélection ; dérogation déterminée par l'écart barème ↔ planification).
- **#81** — Encart de recommandation du mode réservé au Mode Spécification (`?spec=1`).
- **#82** — Dropdown des filtres (liste PPM) non rogné.
- **#83** — Filtre « Source de financement » dépendant du « Type financement » (ÉTAT→TRÉSOR ; DON/EMPRUNT→bailleurs externes).
- **#85** — Retrait du champ « Nombre d'offres classées » dans la saisie de lot.
- **#86–#89** — Enrichissement de l'écran d'enregistrement (N° marché approuvé, exonération→TVA, durée contractuelle, contrôle d'écart de montant, rappel/ajustement des livrables, avance de démarrage). *NB : ces enrichissements ne « ferment » pas le 6.b du CR (collectes par mode), qui reste **Non**.*
- **#91 + migration 030** — Nature économique alimentée et cohérente ; recadrage de 4 opérations clones ; ajout d'un cas de dérogation à la contractualisation.
- **#93** — Toutes les colonnes du tableau PPM visibles (sans défilement horizontal).

---

## Synthèse (selon le CR)

- **Nombre total de retours : 37**
- Retenus, à confirmer : 34
- À clarifier (libellé / contenu) : 2 — catégorie de prestation
- À valider par le métier : 1 — variables associées aux modes de passation

### Décompte « Traité sur maquette »
- **Oui : 31** (1.a–1.e, 2.a–2.f, 3.a–3.e, 4.a, 4.c–4.l, 5.a, 5.c, 6.c, 6.d)
- **Partiel : 2** (2.g, 6.a)
- **Non : 3** (4.b, 5.b, 6.b — *même chantier : le référentiel des variables/documents par mode, en attente de validation DCF*)

### Reste à faire (synthèse)
1. **Référentiel par mode (4.b = 5.b = 6.b)** — bloquant transversal, à valider avec la DCF (brouillon : `referentiel-champs-par-mode.md`).
2. **Action « Déclarer infructueux »** (2.g / 6.a) — sur l'écran d'enregistrement.
3. **Compléments d'enregistrement** : compte attributaire en lecture seule, comptes bancaires des sous-traitants, échéancier (activation + auto-génération + par taux), ordonnancement (dotation/an + part des sources).

---

## Annexe — Typologie des marchés (réf. 4.c)

Familles (types parents) et sous-types (enfants) transmis par la DCF, soumis à validation :

- **A. Marchés classiques** : Travaux · Fournitures et équipements · Services (y c. prestations intellectuelles, détaillées en C) · Mixtes.
- **B. Marchés de type particulier** : Dépenses contrôlées · Contrats GENIS · Clés en main · Conception–réalisation · Conception/réalisation/exploitation ou maintenance *(annotation client : **ne pas dire « CREM »**)* · Innovation · Accords-cadres.
- **C. Prestations intellectuelles** (sous-types des services) : Études · Services d'assistance · MOD (maîtrise d'ouvrage déléguée) · AMO (assistance à maîtrise d'ouvrage) · Maîtrise d'œuvre.
