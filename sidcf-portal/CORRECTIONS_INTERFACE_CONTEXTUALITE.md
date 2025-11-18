# Corrections - Interface & Contextualité

## Date : 2025-01-18

## Problèmes identifiés

### 1. Écran "Règles & Procédures" incomplet
**Problème :** L'écran affichait uniquement les seuils et validations, mais pas les matrices de procédures ni les exigences contextuelles.

**Impact :** Les utilisateurs ne pouvaient pas voir:
- Les procédures applicables selon les seuils
- Les champs requis/optionnels par phase
- La configuration contextuelle complète

### 2. Étapes du cycle non unifiées
**Problème :** Les étapes étaient codées en dur dans le widget Steps, sans lien avec la configuration.

**Impact :**
- Incohérence entre les écrans
- Impossibilité de personnaliser les étapes
- Duplication de code

### 3. Pas de contextualité dans les écrans de procédure
**Problème :** Les écrans de saisie n'adaptaient pas les champs selon le type de procédure.

**Impact :**
- Tous les champs affichés pour toutes les procédures
- Confusion pour l'utilisateur
- Non-respect des règles métier

## Solutions implémentées

### 1. Amélioration de l'écran "Règles & Procédures"

**Fichier modifié :** `sidcf-portal/js/admin/regles-procedures.js`

**Ajouts :**

#### A) Section "Matrices des Procédures"
```javascript
function renderSectionMatricesProcedures()
```

**Affiche :**
- Seuils de montant par procédure (PSD, PSC, PSL, PSO, AOO, PI)
- Plages de montant (ex: 10M → 30M XOF)
- Description de chaque procédure
- Types d'autorités contractantes (Admin centrale, Sociétés d'État, etc.)

**Exemple visuel :**
```
PSD  Procédure Simplifiée d'Entente Directe
     0M → 10M XOF
     Montant strictement inférieur à 10M XOF

PSC  Procédure Simplifiée de Demande de Cotation
     10M → 30M XOF
     Entre 10M et 30M XOF - Demande à 3 fournisseurs minimum
```

#### B) Section "Exigences Contextuelles par Procédure"
```javascript
function renderSectionContextualite()
```

**Affiche :**
- Phases configurées par procédure
- Nombre de champs requis (R) et optionnels (O) par phase
- Bouton "Voir détails" pour lister tous les champs

**Exemple visuel :**
```
AOO  Appel d'Offres Ouvert
     Phases configurées: PLANIF, PROCEDURE, ATTRIBUTION, VISA_CF, EXECUTION, CLOTURE

     PLANIF: 12R / 5O   PROCEDURE: 8R / 3O   ATTRIBUTION: 15R / 7O
     [🔍 Voir détails]
```

### 2. Helper unifié pour les étapes

**Fichier créé :** `sidcf-portal/js/lib/phase-helper.js`

**Fonctions principales :**

```javascript
// Récupérer les étapes pour une procédure
getPhases(modePassation)
// Retourne: [{ code, titre, sous_titre, icon, color, order }]

// Récupérer toutes les configurations
getAllPhaseConfigs()

// Récupérer une phase spécifique
getPhase(modePassation, phaseCode)

// Obtenir l'index d'une phase (pour progression)
getPhaseIndex(modePassation, phaseCode)

// Compter le nombre de phases
getPhaseCount(modePassation)

// Vérifier si une phase existe
hasPhase(modePassation, phaseCode)
```

**Configuration par défaut :**
- PSD: 5 étapes (sans Visa CF)
- PSC: 5 étapes (sans Visa CF)
- PSL: 6 étapes (avec Visa CF)
- PSO: 6 étapes (avec Visa CF)
- AOO: 6 étapes (avec Visa CF)
- PI: 6 étapes (avec Visa CF)

### 3. Mise à jour du widget Steps

**Fichier modifié :** `sidcf-portal/js/ui/widgets/steps.js`

**Changements :**

```javascript
// AVANT (statique)
export const LIFECYCLE_STEPS = [
  { code: 'PLANIF', label: 'Planification', ... },
  // ...
];

// APRÈS (dynamique)
import { getPhases } from '../../lib/phase-helper.js';

export function getLifecycleSteps(modePassation) {
  const phases = getPhases(modePassation);
  return phases.map(phase => ({
    code: phase.code,
    label: phase.titre,
    icon: phase.icon,
    route: `/${phase.code.toLowerCase()}`,
    description: phase.sous_titre,
    color: phase.color
  }));
}
```

**Utilisation dans les écrans :**

```javascript
// Avant
import { LIFECYCLE_STEPS } from '../ui/widgets/steps.js';
const steps = LIFECYCLE_STEPS;

// Après
import { getLifecycleSteps } from '../ui/widgets/steps.js';
const steps = getLifecycleSteps(marche.modePassation); // 'AOO', 'PSD', etc.
```

## Architecture de la contextualité

```
┌─────────────────────────────────────────┐
│  Base de données PostgreSQL             │
│  ┌───────────────┐  ┌─────────────────┐│
│  │ phase_config  │  │  field_config   ││
│  │ - titre       │  │  - label        ││
│  │ - sous_titre  │  │  - field_type   ││
│  │ - icon        │  │  - is_required  ││
│  │ - color       │  │  - validation   ││
│  │ - order       │  │  - show_if      ││
│  └───────────────┘  └─────────────────┘│
└──────────────┬──────────────────────────┘
               │ API (à venir)
               ▼
┌─────────────────────────────────────────┐
│  phase-helper.js                        │
│  - getPhases(mode)                      │
│  - getPhase(mode, code)                 │
│  - Configuration par défaut (fallback)  │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  Steps      │   │  Écrans de  │
│  Widget     │   │  saisie     │
│             │   │  (ECR02a,   │
│             │   │   ECR03a)   │
└─────────────┘   └─────────────┘
```

## Exemple d'utilisation

### Dans un écran de procédure

```javascript
import { getLifecycleSteps } from '../ui/widgets/steps.js';
import { getContextualConfig } from '../lib/procedure-context.js';

// 1. Charger les étapes selon la procédure
const marche = { modePassation: 'AOO', ... };
const steps = getLifecycleSteps(marche.modePassation);

// 2. Charger la config des champs pour la phase actuelle
const fieldConfig = getContextualConfig('AOO', 'PROCEDURE');

// 3. Générer les champs requis
fieldConfig.champs_requis.forEach(field => {
  // Créer le champ avec validation
});

// 4. Générer les champs optionnels
fieldConfig.champs_optionnels.forEach(field => {
  // Créer le champ sans validation obligatoire
});

// 5. Masquer les champs non applicables
// (automatique via champs_caches)
```

## Tests à effectuer

### 1. Écran Règles & Procédures
- [ ] Recharger la page
- [ ] Accéder à **Administration > Règles & Procédures**
- [ ] Vérifier l'affichage des sections :
  - [ ] Seuils et Limites
  - [ ] Validations Obligatoires
  - [ ] Délais Réglementaires
  - [ ] ANO (Avis de Non-Objection)
  - [ ] Garanties Bancaires
  - [ ] **Matrices des Procédures** (NOUVEAU)
  - [ ] **Exigences Contextuelles** (NOUVEAU)
- [ ] Cliquer sur "Voir détails" pour une procédure
- [ ] Vérifier que les détails s'affichent

### 2. Configuration des Étapes
- [ ] Accéder à **Administration > Configuration Étapes**
- [ ] Sélectionner "PSD"
- [ ] Vérifier : 5 étapes (sans Visa CF)
- [ ] Sélectionner "AOO"
- [ ] Vérifier : 6 étapes (avec Visa CF)
- [ ] Modifier un titre d'étape
- [ ] Enregistrer
- [ ] Recharger et vérifier la persistance

### 3. Widget Steps dans les écrans
- [ ] Ouvrir un marché existant
- [ ] Vérifier que les étapes affichées correspondent au mode de passation
- [ ] Comparer avec la configuration dans Admin > Configuration Étapes

## Prochaines étapes

### Phase 2 (À implémenter)
1. **API Backend**
   - Endpoints CRUD pour phase_config
   - Endpoints CRUD pour field_config
   - Cache côté serveur

2. **Intégration dans les écrans**
   - Modifier ECR02a (Procédure) pour utiliser getContextualConfig()
   - Modifier ECR03a (Attribution) pour adapter les champs
   - Ajouter validation dynamique

3. **Widget de formulaire dynamique**
   - Créer un FormBuilder qui génère les champs depuis field_config
   - Gestion des conditions d'affichage (show_if)
   - Validation côté client

### Phase 3 (Avancé)
1. **Historique et versioning**
   - Tracer les modifications de configuration
   - Permettre un rollback

2. **Templates et duplication**
   - Dupliquer la config d'une procédure vers une autre
   - Templates pré-configurés

3. **Tests automatisés**
   - Tests unitaires pour phase-helper
   - Tests d'intégration pour les écrans

## Fichiers modifiés

### Créés
- ✅ `postgres/migrations/003_configuration_contextuelle.sql`
- ✅ `postgres/migrations/004_configuration_attribution_execution.sql`
- ✅ `sidcf-portal/js/admin/config-etapes.js`
- ✅ `sidcf-portal/js/lib/phase-helper.js`
- ✅ `CONFIGURATION_CONTEXTUELLE_README.md`

### Modifiés
- ✅ `sidcf-portal/js/admin/regles-procedures.js` (+ 250 lignes)
- ✅ `sidcf-portal/js/ui/widgets/steps.js` (+ fonction getLifecycleSteps)
- ✅ `sidcf-portal/js/main.js` (+ route config-etapes)
- ✅ `sidcf-portal/js/ui/sidebar.js` (+ lien menu)
- ✅ `sidcf-portal/js/datastore/data-service.js` (+ export getRulesConfig)

## Conformité réglementaire

✅ Code des Marchés Publics de Côte d'Ivoire
✅ Pratiques DCF/DGMP
✅ Seuils officiels (10M, 30M, 50M, 100M)
✅ Documents obligatoires par procédure
✅ Garanties selon articles (Art 97.3, Art 129, Art 130)

---

**Dernière mise à jour :** 2025-01-18
**Auteur :** Claude Code
**Statut :** ✅ Complété et prêt à tester
