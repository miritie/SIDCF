# Flux Budget-Marché SIDCF Portal

**Date**: 2025-01-12
**Version**: v1.0 - MVP Foundation
**Auteur**: Équipe Dev SIDCF

---

## 📋 RÉSUMÉ EXÉCUTIF

Ce document trace l'implémentation du flux complet de gestion des marchés publics dans le portail SIDCF, de la planification (PPM) à la clôture, en passant par la procédure, l'attribution, le visa CF et l'exécution.

### État Global d'Avancement

| Phase | Écrans | Implémentés | En Stub | Taux |
|-------|--------|-------------|---------|------|
| **PLANIF** | 2 | 1 | 1 | 50% |
| **PROC** | 2 | 1 | 1 | 50% |
| **ATTR** | 2 | 0 | 2 | 0% |
| **VISE** | 1 | 0 | 1 | 0% |
| **EXEC** | 4 | 1 | 3 | 25% |
| **CLOT** | 1 | 0 | 1 | 0% |
| **Transverses** | 4 | 2 | 2 | 50% |
| **TOTAL** | **16** | **5** | **11** | **31%** |

**Fonctionnel** : Flux critique (PPM → Fiche → Procédure → Avenants) opérationnel avec widgets réutilisables.

---

## 🎯 OBJECTIFS & PÉRIMÈTRE

### Objectifs Atteints

✅ **Infrastructure technique complète**
- Modèle de données BUDGET_LINE (18 champs) liant nomenclature budgétaire officielle
- Widgets UI professionnels (Timeline, Drawer, Budget Viewer)
- Configuration 100% paramétrable (26 référentiels, barèmes procédures, seuils)
- Styles CSS cohérents (+400 lignes)

✅ **Flux métier critique**
- **P1/T2** : Liste PPM avec filtres basiques ✅
- **T1** : Fiche marché (hub opération) avec timeline, BUDGET_LINE, badges ✅
- **PR1** : Procédure avec détection automatique de dérogation ✅
- **E2** : Avenants avec alertes seuils (25% warn, 30% block) ✅

✅ **Règles & Contrôles**
- Moteur de règles JSON-driven (`rules-engine.js`)
- Barèmes de procédure par type d'institution (ADMIN_CENTRALE, SOCIETE_ETAT, PROJET)
- Calcul automatique des procédures admissibles (montant + nature éco + type institution)
- Détection dérogation avec blocage upload justificatif

✅ **Seed Data Réaliste**
- 5 BUDGET_LINE avec codes officiels CI
- 3 opérations liées aux lignes budgétaires
- 1 opération avec avenant à 25.5% (alerte visible)
- Données conformes à la nomenclature budgétaire ivoirienne

### Objectifs Partiels / En Cours

⏳ **Écrans à finaliser** (11 écrans en stub)
- P2 (Résumé opération), PR2 (PV ouverture/analyse/jugement)
- A1 (Attribution), V1 (Visa CF), C1/C2 (Contrat/Échéancier)
- E1/E3/E4 (OS, Garanties, Suivi), CL1 (Clôture)
- T3/T4 (Dashboard CF, Admin référentiels)

⏳ **Filtres avancés PPM**
- Recherche full-text multi-colonnes
- Filtres cascade (région → département → sous-préfecture → localité)
- Export CSV avec colonnes sélectionnables

⏳ **Import PPM Excel**
- Mapping colonnes → BUDGET_LINE + OPERATION
- Création automatique lignes budgétaires (ou réutilisation si existantes)
- Rapport d'import avec erreurs/warnings

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Modèle de Données

#### Entités Principales

```
PPM_PLAN
├─ OPERATION (lié à BUDGET_LINE via budgetLineId)
│  ├─ PROCEDURE (+ flag dérogation)
│  ├─ ATTRIBUTION
│  │  └─ ENTREPRISE (simple ou groupement)
│  ├─ CONTRAT
│  │  ├─ CLE_REPARTITION (année, bailleur, base HT/TTC, %)
│  │  └─ ECHEANCIER (périodique ou libre)
│  ├─ ORDRE_SERVICE
│  ├─ AVENANT (cumul % avec alertes)
│  ├─ GARANTIE (avance, bonne exec, retenue)
│  └─ CLOTURE (PV prov/def, mainlevées)
└─ BUDGET_LINE (section, programme, UA, activité, ligne, AE/CP)
```

#### Schéma BUDGET_LINE (Clé de voûte)

```javascript
{
  section, sectionLib,          // ex: "120", "Ministère de la Santé"
  programme, programmeLib,      // ex: "15001", "Admin Générale Santé"
  grandeNature,                 // "1|2|3|4" (Personnel|B&S|Transferts|Invest)
  uaCode, uaLib,                // "12011001", "Direction Générale Santé"
  zoneCode, zoneLib,            // Zone géographique (optionnel)
  actionCode, actionLib,        // ex: "1500102", "Infrastructure sanitaire"
  activiteCode, activiteLib,    // ex: "78010200145", "Construire centres santé"
  typeFinancement,              // "1 Trésor", "2 Emprunt", "3 Don"
  sourceFinancement,            // "101 ETAT CI" ou "BAD", "UE", etc.
  ligneCode, ligneLib,          // ex: "231100", "Bâtiments admin et sociaux"
  AE, CP                        // Montants (Autorisations / Crédits)
}
```

**Unicité** : Composite key `(uaCode, activiteCode, ligneCode, sourceFinancement)`

#### Schéma OPERATION (Enrichi)

```javascript
{
  budgetLineId,                 // FK vers BUDGET_LINE
  revue,                        // "Oui" (a priori) / "Non" (a posteriori)
  infrastructure,               // Description infrastructure
  beneficiaire,                 // Qui bénéficie du marché
  procDerogation: {             // Si dérogation procédure
    isDerogation: true,
    docId: "DOC_DEROG_xxx.pdf",
    comment: "Urgence...",
    validatedAt: "ISO date"
  },
  timeline: ["PLANIF", "PROC", ...],  // Étapes complétées
  etat: "EXECUTION",            // État courant
  // ... autres champs existants
}
```

### Widgets Réutilisables

#### 1. Timeline Steps (`js/ui/widgets/steps.js`)

**Usage** :
```javascript
import { renderSteps } from '../ui/widgets/steps.js';

const fullData = await dataService.getOperationFull(idOperation);
const timeline = renderSteps(fullData, idOperation);
// Ajouter timeline au DOM
```

**Fonctionnalités** :
- 6 étapes : PLANIF → PROC → ATTR → VISE → EXEC → CLOT
- États visuels : ✅ done (vert), 🟠 current (orange pulsant), ⚪ todo (gris)
- Cliquable : navigation vers l'écran de l'étape si autorisée
- Calcul automatique des statuts via `calculateStepStatuses(fullData)`

#### 2. Drawer (`js/ui/widgets/drawer.js`)

**Usage** :
```javascript
import { openDrawer } from '../ui/widgets/drawer.js';

openDrawer('Titre', contentElement, {
  width: '600px',
  position: 'right',
  onClose: () => console.log('Fermé')
});
```

**Fonctionnalités** :
- Slide-in depuis droite/gauche
- Overlay semi-transparent
- Fermeture : ESC, clic outside, bouton ×
- Animation smooth (300ms)

#### 3. Budget Line Viewer (`js/ui/widgets/budget-line-viewer.js`)

**Usage** :
```javascript
import { showBudgetLineDetails, renderBudgetLineSummary } from '../ui/widgets/budget-line-viewer.js';

// Drawer complet
const budgetLine = await dataService.getBudgetLineForOperation(opId);
showBudgetLineDetails(budgetLine);

// Ou panneau résumé
const summary = renderBudgetLineSummary(budgetLine);
```

**Fonctionnalités** :
- Drawer : 8 sections (Section, Programme, UA, Action, Activité, Ligne, Financement, Crédits)
- Résumé : Panneau compact avec bouton "Voir détails"
- Highlight AE/CP (montants en couleur)

---

## 📐 RÈGLES MÉTIER IMPLÉMENTÉES

### 1. Barèmes de Procédure (JSON-driven)

**Source** : `js/config/rules-config.json` → `matrices_procedures`

| Type Institution | PSC | PSD | AOO |
|------------------|-----|-----|-----|
| ADMIN_CENTRALE | ≤5M | 5M-50M | >50M |
| SOCIETE_ETAT | ≤10M | 10M-75M | >75M |
| PROJET | - | ≤100M | >100M |

**Logique** :
```javascript
// rules-engine.js
getSuggestedProcedures(operation) {
  const typeInst = operation.typeInstitution || 'ADMIN_CENTRALE';
  const montant = operation.montantPrevisionnel;
  const nature = operation.natureEco;

  // Filtre barème par montant + nature
  return procedures.filter(p =>
    montant >= p.min &&
    (p.max === null || montant <= p.max) &&
    (p.natureEco.includes('all') || p.natureEco.includes(nature))
  );
}
```

### 2. Dérogation de Procédure

**Déclenchement** : Si `modePassation` ∉ `suggestedProcedures`

**Contrôles** :
- ⚠️ Alerte rouge affichée automatiquement
- 🚫 Blocage : Upload document justificatif OBLIGATOIRE
- 📝 Champ commentaire pour motif
- ✅ Sauvegarde avec flag `procDerogation.isDerogation = true`

**Badge** : Affiché sur tous les écrans suivants (`badge-derogation`)

### 3. Seuils Avenants

**Source** : `rules-config.json` → `seuils`

```json
{
  "SEUIL_ALERTE_AVENANTS": { "value": 25, "unit": "%", "severity": "WARN" },
  "SEUIL_CUMUL_AVENANTS": { "value": 30, "unit": "%", "severity": "BLOCK" }
}
```

**Calcul** :
```javascript
const totalAvenants = avenants.reduce((sum, av) => sum + av.variationMontant, 0);
const pourcentage = (totalAvenants / montantInitial) * 100;

if (pourcentage >= 25 && pourcentage < 30) {
  // Alerte orange
} else if (pourcentage >= 30) {
  // Alerte rouge + blocage sans autorisation
}
```

**Implémentation** : Écran `ecr04b-avenants.js` (déjà fait ✅)

### 4. Délais OS après Visa

**Règle** : `DELAI_MAX_OS_APRES_VISA = 30 jours`

**Contrôle** :
```javascript
if (dateOS - dateVisaCF > 30 jours) {
  // Alerte warning (pas blocage)
}
```

**Implémentation** : À faire dans `ecr04a-execution-os.js`

### 5. Clé de Répartition

**Contrôles** :
- Σ montants par année ≤ budget prévu
- Σ % = 100 (selon base HT ou TTC)
- Bailleurs éligibles (doivent figurer dans sourceFinancement de BUDGET_LINE)

**Implémentation** : À faire dans `ecr03b-echeancier-cle.js`

### 6. Échéancier

**Contrôles** :
- Σ montants = montant marché (TTC ou HT selon base)
- Si en %, Σ % = 100

**Modes** :
- Périodique (mensuel/trimestriel → génération auto)
- Libre (saisie manuelle ligne par ligne)

**Implémentation** : À faire dans `ecr03b-echeancier-cle.js`

---

## 📂 FICHIERS CRÉÉS / MODIFIÉS

### Nouveaux Fichiers (8)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `js/ui/widgets/steps.js` | 150 | Timeline 6 étapes |
| `js/ui/widgets/drawer.js` | 100 | Panneau latéral |
| `js/ui/widgets/budget-line-viewer.js` | 180 | Affichage BUDGET_LINE |
| `js/modules/marche/screens/ecr02a-procedure-pv.js` | 280 | Procédure avec dérogation |
| `css/components.css` (ajout) | +400 | Styles widgets |
| `INTEGRATION_REPORT.md` | 600 | Rapport technique |
| `README_INTEGRATION.md` | 400 | Guide utilisateur |
| `docs/flux-budget-marche.md` | Ce fichier | Documentation flux |

### Fichiers Modifiés (5)

| Fichier | Modifications |
|---------|---------------|
| `js/datastore/schema.js` | + BUDGET_LINE, ORDRE_SERVICE, champs OPERATION |
| `js/datastore/data-service.js` | + 3 méthodes BUDGET_LINE, + helpers |
| `js/datastore/seed.json` | + 5 BUDGET_LINE, liaisons operations |
| `js/modules/marche/screens/ecr01c-fiche-marche.js` | + Timeline, BUDGET_LINE, badge dérogation |
| `js/modules/marche/index.js` | + import renderProcedurePV, route /procedure |

---

## 🎬 SCÉNARIO DE DÉMO (2 minutes)

### Préparation
```bash
# Terminal 1
cd /Volumes/DATA/DEVS/SIDCF/sidcf-portal
python3 -m http.server 7001

# Navigateur
open http://localhost:7001

# Console F12
localStorage.clear()  // Recharger seed data
location.reload()
```

### Étape 1 : Liste PPM (15s)

```
URL: http://localhost:7001#/ppm-list

Actions:
1. Observer 3 opérations dans le tableau
2. Colonnes : ID, Objet, Type, Montant, État
3. Cliquer sur "Construction centre de santé Korhogo"
```

**Attendu** : Navigation vers fiche marché OP-2024-001

---

### Étape 2 : Fiche Marché avec Timeline (30s)

```
URL: http://localhost:7001#/fiche-marche?idOperation=OP-2024-001

Observations:
1. ✅ Timeline en haut : PLANIF → EXEC (5 étapes vertes), CLOT (grise)
2. 📋 Badge État : "En exécution" (bleu)
3. 💳 Panneau "Ligne budgétaire" présent
4. 📊 Sections : Identité, Chaîne budg (OU Ligne budg), Livrables

Actions:
1. Cliquer sur "👁️ Voir détails" (panneau Ligne budgétaire)
```

**Attendu** : Drawer s'ouvre à droite avec 8 sections détaillées
- Section 120 (Santé)
- Programme 15001
- UA 12011001 - Direction Générale Santé
- Activité : Construire centres de santé
- Ligne 231100 - Bâtiments administratifs
- **AE: 5.500.000.000 XOF / CP: 4.200.000.000 XOF** (highlight)

---

### Étape 3 : Navigation Timeline → Procédure (20s)

```
Contexte: Toujours sur fiche marché OP-2024-001

Actions:
1. Cliquer sur "⚖️ Procédure" dans la timeline
```

**Attendu** : Navigation vers `/procedure?idOperation=OP-2024-001`

**Observations** :
1. Timeline toujours visible en haut
2. Encadré bleu "💡 Procédures admissibles" :
   - Type institution: ADMIN_CENTRALE
   - Montant: 250M XOF
   - **Procédures : AOO (>50M)**
3. Dropdown "Mode de passation" : AOO déjà sélectionné
4. ✅ Pas d'alerte dérogation (AOO = conforme)

---

### Étape 4 : Test Dérogation (30s)

```
Contexte: Écran Procédure OP-2024-001

Actions:
1. Changer dropdown "Mode de passation" → Sélectionner "PSC"
```

**Attendu** : Alerte rouge apparaît immédiatement

```
⚠️ DÉROGATION DÉTECTÉE
🚫 Procédure non conforme au barème

Le mode PSC n'est pas admissible pour ce montant (250M XOF).
PSC est limité aux marchés ≤ 5M XOF pour les administrations centrales.

Un document justificatif est OBLIGATOIRE pour continuer.

[Upload fichier] (requis)
[Commentaire] (optionnel)
```

**Actions** :
1. Essayer de cliquer "Enregistrer & Continuer" sans upload
2. Observer alert JavaScript : "⚠️ Un document justificatif est obligatoire"

---

### Étape 5 : Avenants avec Alerte Seuil (25s)

```
URL: http://localhost:7001#/avenants?idOperation=OP-2024-001

Observations:
1. Timeline : EXEC = orange (current)
2. ⚠️ Alerte orange (card en haut) :
   "Alerte seuil : Le cumul des avenants (25.5%) approche le seuil autorisé (30%)"
3. KPIs :
   - Montant initial: 250.000.000 XOF
   - Total avenants: 62.500.000 XOF
   - Montant actuel: 312.500.000 XOF
   - **Cumul (%): 25.5%** (orange)
4. Tableau : 1 avenant
   - N°1, Type FINAN, +62.5M, 25%, Motif "Travaux supplémentaires"
```

**Note** : Si cumul dépassait 30%, alerte serait rouge avec texte "Seuil dépassé 🚫" et blocage sans autorisation.

---

## ✅ DÉCISIONS TECHNIQUES & UX

### 1. **Liaison BUDGET_LINE obligatoire pour opérations PPM**

**Décision** : Toute opération issue d'un PPM DOIT avoir un `budgetLineId` renseigné.

**Raison** :
- Traçabilité budgétaire complète
- Contrôle cohérence (montants ≤ AE/CP disponibles)
- Conformité avec nomenclature officielle

**Exception** : Opérations hors PPM (achats simples <5M) peuvent ne pas avoir de liaison (chaineBudgetaire suffit).

### 2. **Dérogation = Blocage Upload Document**

**Décision** : Si procédure hors barème → champ upload + commentaire deviennent OBLIGATOIRES.

**Raison** :
- Conformité réglementaire (Code des Marchés CI)
- Audit trail (tout écart doit être justifié et tracé)
- Responsabilisation des utilisateurs

**Alternatives évaluées** :
- ❌ Simple warning sans blocage → rejeté (trop laxiste)
- ❌ Validation manuelle par admin → rejeté (ralentit le flux)
- ✅ Blocage auto avec upload → **retenu**

### 3. **Timeline Cliquable avec Contrôle d'Accès**

**Décision** : Les étapes `done` et `current` sont cliquables, `todo` sont désactivées.

**Raison** :
- UX intuitive (on ne peut pas sauter des étapes)
- Cohérence métier (pas de visa CF avant attribution)
- Guidage utilisateur (la timeline montre le chemin)

**Implémentation** :
```javascript
stepEl.classList.add('step-clickable');
stepEl.addEventListener('click', () => {
  if (status === 'done' || status === 'current') {
    router.navigate(step.route, { idOperation });
  }
});
```

### 4. **Seuils Avenants : 25% WARN, 30% BLOCK**

**Décision** : Afficher alerte orange à 25%, rouge + blocage à 30%.

**Source** : Code des Marchés Publics CI, Article 107 (avenants limités à 30% sauf autorisation ARMP).

**Implémentation** :
```javascript
if (pourcentage >= 25 && pourcentage < 30) {
  alertClass = 'alert-warning';
  message = 'approche le seuil';
} else if (pourcentage >= 30) {
  alertClass = 'alert-error';
  message = 'dépasse le seuil';
  // Bloquer si pas d'autorisation ARMP
}
```

### 5. **Drawer pour Détails vs Panneau Résumé**

**Décision** : BUDGET_LINE a 2 modes d'affichage :
- **Résumé** : Panneau compact dans fiche marché (5 lignes clés)
- **Détails** : Drawer complet (8 sections, 18 champs)

**Raison** :
- Éviter surcharge visuelle dans fiche marché
- Donner accès rapide aux détails si besoin
- Pattern drawer = standard UX moderne

### 6. **Seed Data avec Codes Réels CI**

**Décision** : Utiliser codes de nomenclature budgétaire réels de Côte d'Ivoire.

**Sources** :
- Budget 2024 État de Côte d'Ivoire
- Nomenclature UEMOA (TOFE)
- Exemples : Section 120 (Santé), 135 (Équipement Routier), 145 (Éducation)

**Avantage** : Démos réalistes, crédibilité auprès des utilisateurs métier.

---

## 🔄 FLUX MÉTIER DÉTAILLÉS

### Flux 1 : Planification PPM → Procédure → Avenants (Flux Critique ✅)

```
[PLANIF] Liste PPM
    ↓ Clic sur opération
[T1] Fiche Marché
    ├─ Affichage Timeline (PLANIF done)
    ├─ Affichage BUDGET_LINE (drawer)
    └─ Bouton "Démarrer Procédure" (si timeline vide après PLANIF)
    ↓ Clic timeline "Procédure"
[PROC] Choix Procédure (ecr02a)
    ├─ Calcul procédures admissibles (barème)
    ├─ Sélection mode
    ├─ Détection dérogation (si hors barème)
    │   └─ Upload document justificatif (blocage)
    └─ Enregistrer → timeline += PROC, état = EN_PROC
    ↓ Clic timeline "Attribution"
[ATTR] Attribution (stub)
    └─ TODO: Formulaire entreprise, montants, décision
    ↓
[VISE] Visa CF (stub)
    └─ TODO: VISA/RESERVE/REFUS
    ↓
[EXEC] Avenants (ecr04b)
    ├─ KPIs : montant initial, total avenants, cumul %
    ├─ Alerte 25% (orange)
    ├─ Blocage 30% (rouge)
    └─ Tableau avenants
```

**Statut** : ✅ 80% fonctionnel (manque ATTR et VISE en stub)

---

### Flux 2 : Import PPM Excel → Création BUDGET_LINE (Partiellement Implémenté)

```
[P1] Import PPM
    ↓ Upload fichier Excel
[Backend] Parser Excel
    ├─ Mapping colonnes → BUDGET_LINE
    │   ├─ Recherche existante (composite key)
    │   └─ Création si nouvelle
    └─ Mapping colonnes → OPERATION
        └─ Liaison budgetLineId
    ↓
[Résultat] N lignes PPM créées
    └─ Navigate /ppm-list
```

**Statut** : ⏳ Méthode `findOrCreateBudgetLine()` implémentée, mais écran import à finaliser

**TODO** :
- Parser Excel (librairie xlsx.js)
- Mapping colonnes configurable (JSON ou UI)
- Rapport d'import (succès, erreurs, warnings)

---

### Flux 3 : Contrôle Cohérence Clé de Répartition (À Implémenter)

```
[C1] Contrat & Clé
    ↓ Saisie lignes clé
[Validation]
    ├─ Σ montants par année ≤ budget prévu
    ├─ Σ % = 100 (par base HT ou TTC)
    ├─ Bailleurs ∈ sourceFinancement BUDGET_LINE
    └─ Années ∈ [exercice, exercice + dureePrevisionnelle/365]
    ↓
[Résultat] Clé validée ou erreurs affichées
```

**Règles Détaillées** :
```javascript
// Contrôle 1 : Somme montants
const totalParAnnee = cle.lignes
  .filter(l => l.annee === annee)
  .reduce((sum, l) => sum + l.montant, 0);

if (totalParAnnee > budgetAnnee) {
  errors.push(`Année ${annee}: dépassement budget`);
}

// Contrôle 2 : Somme %
const totalPourcent = cle.lignes.reduce((sum, l) => sum + l.pourcentage, 0);
if (Math.abs(totalPourcent - 100) > 0.01) {
  errors.push(`Somme % = ${totalPourcent}, attendu 100`);
}

// Contrôle 3 : Bailleurs éligibles
const bailleursEligibles = budgetLine.sourceFinancement.split(',');
cle.lignes.forEach(l => {
  if (!bailleursEligibles.includes(l.bailleur)) {
    errors.push(`Bailleur ${l.bailleur} non éligible`);
  }
});
```

---

## 📊 DONNÉES DE TEST

### BUDGET_LINE Créées (5)

| ID | Section | Programme | UA | Activité | Ligne | AE | CP |
|----|---------|-----------|----|-----------| ------|----|----|
| BL-2024-001 | 101 Représentation | E-Parlement | 31990001 | 78011100361 | 643220 Transferts | 850M | 850M |
| BL-2024-002 | 120 Santé | Centres santé ruraux | 12011001 | 78010200145 | 231100 Bâtiments | 5.5Mds | 4.2Mds |
| BL-2024-003 | 135 Équipement Routier | Études routières | 13512003 | 78020100987 | 233200 Études | 12Mds | 8.5Mds |
| BL-2024-004 | 110 Admin Territoire | Véhicules admin | 11002001 | 78010500234 | 232300 Transport | 3.2Mds | 3.2Mds |
| BL-2024-005 | 145 Éducation | Écoles primaires | 14523001 | 78030100456 | 231200 Bâtiments scolaires | 7.8Mds | 6.5Mds |

### OPERATION Créées (3)

| ID | Objet | Type | Montant | État | BUDGET_LINE | Avenant |
|----|-------|------|---------|------|-------------|---------|
| OP-2024-001 | Centre santé Korhogo | TRAVAUX | 250M → 312.5M | EXECUTION | BL-2024-002 | **25.5%** ⚠️ |
| OP-2024-002 | Véhicules administratifs | FOURNITURES | 75M | ATTRIBUE | BL-2024-004 | - |
| OP-2024-003 | Étude routière ABJ-YAM | SERVICES_INTELL | 180M | PLANIFIE | BL-2024-003 | - |

**Cas d'usage** :
- **OP-001** : Marché en exécution avec avenant proche du seuil → teste alerte 25%
- **OP-002** : Marché attribué sans avenant → teste flux normal
- **OP-003** : Marché planifié avec bailleur (BAD) → teste financement externe

---

## 🚧 ÉCRANS EN STUB (À Implémenter)

### Template Stub Standard

Tous les stubs suivent ce pattern :
```html
<div class="page">
  <div class="page-header">
    <h1 class="page-title">${title}</h1>
    <p class="page-subtitle">Écran en cours de développement</p>
  </div>
  <div class="card">
    <div class="card-body">
      <div class="alert alert-info">
        <div class="alert-icon">🚧</div>
        <div class="alert-content">
          <div class="alert-title">Fonctionnalité en construction</div>
          <div class="alert-message">Cet écran sera disponible prochainement.</div>
        </div>
      </div>
      <button class="btn btn-primary">← Retour</button>
    </div>
  </div>
</div>
```

### Liste des Stubs + Spécifications

#### P2 - Résumé Opération (`/ppm-resume`)
**But** : Vue synthétique pour validation avant lancement procédure
**Données** : Budget, Administratif, Géo, Livrables
**Actions** : Modifier, Démarrer Procédure
**Effort** : 2h

#### PR2 - PV Ouverture/Analyse/Jugement (`/procedure-pv`)
**But** : Consigner dates, PV, nb offres
**Données** : dates (ouverture ≤ analyse ≤ jugement), PV signés, rapports, nb offres
**Contrôles** : Cohérence dates, pièces obligatoires
**Effort** : 2h

#### A1 - Attribution (`/attribution`)
**But** : Désigner attributaire (simple ou groupement)
**Données** : Entreprise (RCCM, IFU, banque), montants HT/TTC, décision
**Contrôles** : Sommes cohérentes, pièces attribution
**Effort** : 3h

#### V1 - Visa CF (`/visa-cf`)
**But** : Décision CF (VISA/RESERVE/REFUS)
**Données** : Dates signatures, décision, motif
**Contrôles** : Sans VISA → OS bloqué
**Effort** : 2h

#### C1 - Contrat & Clauses (`/contrat`)
**But** : Finaliser contrat et clé de répartition
**Données** : Clauses prix, pénalités, clé (année, bailleur, base, %)
**Contrôles** : Σ% = 100, bailleurs éligibles
**Effort** : 3h

#### C2 - Échéancier (`/echeancier`)
**But** : Échéancier de paiement (périodique ou libre)
**Données** : Mode, lignes (date, montant, type, %)
**Contrôles** : Σ montants = montant marché
**Effort** : 3h

#### E1 - Ordre de Service (`/execution`)
**But** : Enregistrer OS démarrage + alertes délais
**Données** : N° OS, date, doc
**Règle** : Alerte si dateOS - dateVisaCF > 30j
**Effort** : 2h

#### E3 - Garanties (`/garanties`)
**But** : Gérer garanties (avance, bonne exec, retenue)
**Données** : Type, montant/taux, dates, état, mainlevée
**Contrôles** : Cohérence taux avec clauses
**Effort** : 2h

#### E4 - Suivi Exécution (`/suivi-execution`)
**But** : OS complémentaires, jalons, livrables
**Données** : Liste OS, avancement %, livrables reçus
**Effort** : 2h

#### CL1 - Clôture & Réceptions (`/cloture`)
**But** : Clôturer marché
**Données** : PV prov/def, réserves, mainlevées, synthèse
**Contrôles** : Pas de clôture si garanties actives
**Effort** : 2h

#### T3 - Dashboard CF (`/dashboard-cf`)
**But** : KPIs & listes (par état, dépassement, retard, dérogation)
**Données** : Filtres (période, UA, région, mode)
**Effort** : 3h

#### T4 - Admin Paramétrages (`/admin/parametres`)
**But** : CRUD référentiels & règles, import/export JSON
**Effort** : 3h

**Total effort estimé** : **28h**

---

## 📖 RÉFÉRENCES INTERNES

### Configuration JSON

- **`js/config/registries.json`** : 26 référentiels (TYPE_MARCHE, MODE_PASSATION, LOCALITE_CI, BAILLEUR, etc.)
- **`js/config/rules-config.json`** : Barèmes procédures, seuils avenants, délais
- **`js/config/pieces-matrice.json`** : Matrice pièces par phase (à exploiter)
- **`js/config/app-config.json`** : Provider (localStorage/Airtable), clés API

### Modèles de Données

- **`js/datastore/schema.js`** : Schémas ENTITIES (PPM_PLAN, OPERATION, BUDGET_LINE, PROCEDURE, etc.)
- **`js/datastore/seed.json`** : Données de test (5 BUDGET_LINE, 3 OPERATION)

### Services

- **`js/datastore/data-service.js`** : API unifiée (query, get, add, update, remove)
- **`js/datastore/rules-engine.js`** : Moteur de règles (checkRules, getSuggestedProcedures)
- **`js/datastore/adapters/local-storage.js`** : Provider localStorage
- **`js/datastore/adapters/airtable.js`** : Provider Airtable (plug-and-play)

### Widgets

- **`js/ui/widgets/steps.js`** : Timeline 6 étapes
- **`js/ui/widgets/drawer.js`** : Panneau latéral
- **`js/ui/widgets/budget-line-viewer.js`** : Affichage BUDGET_LINE
- **`js/ui/widgets/table.js`** : DataTable réutilisable
- **`js/ui/widgets/kpis.js`** : KPI grid
- **`js/ui/widgets/form.js`** : Form fields

### Styles

- **`css/variables.css`** : Variables design (couleurs, espacements, polices)
- **`css/base.css`** : Reset + typographie
- **`css/layout.css`** : Grilles, sidebar, topbar
- **`css/components.css`** : Cards, buttons, alerts, **+ Timeline, Drawer, Budget sections**

---

## 🎓 GUIDES D'IMPLÉMENTATION

### Pattern Standard Écran Marché

```javascript
import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

export async function renderMyScreen(params) {
  const { idOperation } = params;

  // 1. Load data
  const fullData = await dataService.getOperationFull(idOperation);
  const { operation, ... } = fullData;
  const registries = dataService.getAllRegistries();

  // 2. Check rules
  const rulesResult = dataService.checkRules(operation, operation.etat, {});

  // 3. Build page
  const page = el('div', { className: 'page' }, [
    // Timeline (obligatoire)
    renderSteps(fullData, idOperation),

    // Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour', () => router.navigate('/fiche-marche', { idOperation })),
      el('h1', { className: 'page-title' }, 'Titre Écran')
    ]),

    // Rules alerts
    ...rulesResult.messages.map(msg => renderAlert(msg)),

    // Content cards
    // ...

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => router.navigate('/fiche-marche', { idOperation })),
          createButton('btn btn-primary', 'Enregistrer', async () => await handleSave())
        ])
      ])
    ])
  ]);

  mount('#app', page);
}
```

### Checklist Nouvel Écran

- [ ] Import `renderSteps` et l'afficher en haut
- [ ] Charger `fullData` via `getOperationFull()`
- [ ] Appeler `checkRules()` et afficher alertes
- [ ] Créer boutons avec `createButton()` (pas de onclick inline)
- [ ] Gérer état local avec `let` variables (pas de this.state)
- [ ] Event listeners après mount du DOM
- [ ] Navigation avec `router.navigate('/route', { params })`
- [ ] Update timeline si changement de phase (`timeline += 'PROC'`)
- [ ] Logger les actions (`logger.info('[MonEcran] Action...')`)
- [ ] Exporter fonction `export async function renderMyScreen(params)`
- [ ] Enregistrer route dans `modules/marche/index.js`

---

## ✅ CONCLUSION

### Ce qui fonctionne MAINTENANT

✅ **Flux critique opérationnel** :
- Liste PPM → Fiche marché → Procédure (avec dérogation) → Avenants (avec alertes)

✅ **Infrastructure complète** :
- Modèle BUDGET_LINE + liaison OPERATION
- 3 widgets UI professionnels (Timeline, Drawer, Budget Viewer)
- Configuration JSON paramétrable (26 référentiels, barèmes, seuils)
- Styles CSS cohérents et responsive

✅ **Règles métier implémentées** :
- Barèmes procédures par type d'institution
- Détection automatique dérogation + blocage upload
- Alertes avenants (25% warn, 30% block)
- Timeline interactive 6 étapes

✅ **Données de test** :
- 5 BUDGET_LINE avec codes officiels CI
- 3 OPERATION dont 1 avec avenant à 25.5%
- Scénario de démo fonctionnel (2 min)

### Ce qui reste à faire

⏳ **11 écrans en stub** (28h estimées) :
- P2, PR2, A1, V1, C1, C2, E1, E3, E4, CL1, T3, T4

⏳ **Améliorations** :
- Filtres avancés PPM (cascade localité, export CSV)
- Import Excel avec parsing et mapping
- Dashboard CF avec KPIs temps réel
- Admin CRUD référentiels

### Recommandations Prochaines Étapes

1. **Court terme** (1 semaine) :
   - Implémenter A1 (Attribution) et V1 (Visa CF) pour compléter le flux jusqu'à VISE
   - Ajouter E1 (OS) pour déverrouiller l'exécution
   - Finaliser P2 (Résumé opération) pour valider la planification

2. **Moyen terme** (2 semaines) :
   - Implémenter C1/C2 (Contrat/Échéancier) pour contrôles financiers
   - Compléter E3/E4 (Garanties/Suivi)
   - Ajouter CL1 (Clôture)

3. **Long terme** (1 mois) :
   - Dashboard CF (T3) avec analytics
   - Admin paramétrages (T4)
   - Import PPM Excel automatisé
   - Tests automatisés (smoke, E2E)

---

**Version** : v1.0 - MVP Foundation
**Date** : 2025-01-12
**Statut** : ✅ Flux critique opérationnel, ⏳ Écrans complémentaires en développement
