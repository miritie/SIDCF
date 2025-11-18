# Ajustements Contextualité Module Marchés - SIDCF Portal v2.0

**Date:** 2025-11-18
**Statut:** Configuration de base terminée - Intégration écrans en cours

---

## Résumé Exécutif

Suite à votre demande d'ajustements pour rendre le module marchés **vraiment contextuel** selon les spécifications détaillées du Code des Marchés Publics CI, voici les travaux réalisés et les prochaines étapes.

---

## ✅ Travaux Terminés

### 1. Enrichissement `rules-config.json` ✓

**Fichier:** `/sidcf-portal/js/config/rules-config.json`

#### Ajouts réalisés:

**a) Nouveaux modes de passation**
- ✅ **PSL** (Procédure Simplifiée à Compétition Limitée: 30M - 50M XOF)
- ✅ **PI** (Prestations Intellectuelles: pas de seuil fixe)
- Mise à jour des seuils corrects pour **PSD** (< 10M) et **PSC** (10M - 30M)

**b) Seuils réglementaires précis par type d'institution**

```json
ADMIN_CENTRALE: {
  PSD:  0 - 10M XOF
  PSC:  10M - 30M XOF
  PSL:  30M - 50M XOF
  PSO:  50M - 100M XOF
  AOO:  ≥ 100M XOF
  PI:   Pas de seuil fixe (Services intellectuels)
}
```

**c) Section `contextualite_procedures` complète**

Configuration détaillée pour **chaque mode** (PSD, PSC, PSL, PSO, AOO, PI) avec:

- ✅ **Phases**: planification, contractualisation, attribution, execution, cloture
- ✅ **Champs requis** par phase
- ✅ **Champs optionnels** par phase
- ✅ **Champs cachés** par phase
- ✅ **Documents requis/optionnels**
- ✅ **Flags de gestion**:
  - `info_soumissionnaires` (PSD: false, PSC+: true)
  - `info_lots` (PSD: false, PSC+: true)
  - `info_recours` (PSD: false, PSC+: true)
  - `validation_dgmp` (PSL+: true)
  - `publication_obligatoire` (PSO+: true)
  - `cojo_obligatoire` (AOO, PI: true)

**d) Nomenclature des étapes paramétrable**

```json
{
  "nomenclature_etapes": {
    "defaut": {
      "PLANIFICATION": "Planification",
      "PROCEDURE": "Procédure & PV",
      "ATTRIBUTION": "Attribution",
      "VISA_CF": "Visa CF",
      "EXECUTION": "Exécution",
      "AVENANTS": "Avenants",
      "GARANTIES": "Garanties",
      "CLOTURE": "Clôture"
    },
    "personnalisable": true,
    "config_utilisateur": {}
  }
}
```

### 2. Refonte complète `procedure-context.js` ✓

**Fichier:** `/sidcf-portal/js/lib/procedure-context.js`

#### Nouvelles fonctionnalités:

**a) Fonctions de contextualisation avancées**

```javascript
// Configuration contextuelle par mode et phase
getContextualConfig(modePassation, phase)

// Vérifications champs
isFieldRequired(fieldName, modePassation, phase)
isFieldOptional(fieldName, modePassation, phase)
isFieldHidden(fieldName, modePassation, phase)

// Gestion soumissionnaires
hasSoumissionnairesManagement(modePassation)  // → true si PSC, PSL, PSO, AOO, PI
getSoumissionnairesFields(modePassation)      // → ['ncc', 'raisonSociale', ...]

// Gestion lots
hasLotsManagement(modePassation)              // → true si PSC+
getLotsFields(modePassation)                  // → ['entreprisesSoumissionnaires', 'objet', ...]

// Gestion recours
hasRecoursManagement(modePassation)           // → true si PSC+

// Obligations réglementaires
requiresDGMPValidation(modePassation)         // → true si PSL, PSO, AOO, PI
requiresPublication(modePassation)            // → true si PSO, AOO, PI
requiresCOJO(modePassation)                   // → true si AOO, PI

// Documents
getRequiredDocuments(modePassation, phase)
getOptionalDocuments(modePassation, phase)
```

**b) Application de la contextualisation**

```javascript
// Sur un formulaire complet
applyProcedureContext(form, modePassation, phase)

// Sur des sections spécifiques
applyProcedureContextToSections(container, modePassation, phase)
```

**c) Helpers UI**

```javascript
getProcedureLabel(modePassation)              // Labels complets
getProcedureHelpText(modePassation)           // Aide contextuelle
createProcedureInfoAlert(modePassation)       // Élément DOM d'info
```

**d) Validation**

```javascript
validateProcedureRequirements(formData, modePassation, phase)
// Retourne: { valid, errors[], warnings[] }
```

**e) Nomenclature personnalisable**

```javascript
getStepsNomenclature()                        // Récupère la nomenclature active
setCustomStepsNomenclature(customNomenclature) // Personnalise les noms d'étapes
```

---

## 🚧 Travaux en Cours

### 3. Modification ECR02a - Procédure & PV

**Fichier cible:** `/sidcf-portal/js/modules/marche/screens/ecr02a-procedure-pv.js`

#### Changements à apporter:

**A. Remplacement de l'affichage statique par contextualisation dynamique**

**AVANT (actuel):**
```javascript
// Affiche TOUS les champs pour TOUS les modes
- Type commission (COJO/COPE)
- Catégorie procédure
- Type dossier (DAO/AMI/DPI)
- Dates: ouverture, analyse, jugement
- PV: Ouverture, Analyse, Jugement
- Nombre offres reçues/classées
```

**APRÈS (à implémenter):**
```javascript
import {
  requiresCOJO,
  hasSoumissionnairesManagement,
  hasLotsManagement,
  createProcedureInfoAlert,
  applyProcedureContextToSections
} from '../../../lib/procedure-context.js';

// Affichage conditionnel selon le mode sélectionné

if (requiresCOJO(modePassation)) {
  // Afficher section COJO complète (PSL, PSO, AOO, PI)
  // - Type commission
  // - PV Ouverture
  // - PV Analyse
  // - PV Jugement
  // - Dates chronologiques
} else if (modePassation === 'PSC') {
  // Afficher section simplifiée
  // - Dossier concurrence
  // - Formulaire sélection
  // - PV Ouverture
  // - Date sélection
} else if (modePassation === 'PSD') {
  // Afficher section ultra-simplifiée
  // - Bon de commande
  // - Facture proforma
  // - (Optionnel) Devis concurrence
}

if (hasSoumissionnairesManagement(modePassation)) {
  // Afficher widget gestion soumissionnaires
  renderSoumissionnairesManager(...)
}

if (hasLotsManagement(modePassation)) {
  // Afficher widget gestion lots
  renderLotsManager(...)
}
```

**B. Widgets à créer:**

1. **Widget Soumissionnaires** (PSC, PSL, PSO, AOO, PI)
   - Tableau avec: NCC, Raison sociale, Nature (si groupement), Statut (Sanctionné/Non)
   - Ajout/Suppression dynamique
   - Validation NCC (format CI)

2. **Widget Lots** (PSC, PSL, PSO, AOO, PI)
   - Tableau avec: Objet, Entreprises soumissionnaires, Montants HT/TTC, Livrables attendus
   - Gestion multi-lots
   - Liaison avec soumissionnaires

### 4. Modification ECR03a - Attribution

**Changements principaux:**

**Selon mode de passation:**

**PSD:**
- Numéro bon de commande (requis)
- Pas de numéro de marché
- Garanties optionnelles

**PSC, PSL, PSO:**
- Numéro marché/lettre de marché
- Garanties optionnelles mais recommandées

**AOO:**
- Numéro marché (requis)
- Avance démarrage (forfaitaire 15% - Art 129/130)
- Garantie bonne exécution obligatoire (3-5% - Art 97.3)
- Durée de garantie obligatoire (Art 98)

**PI:**
- Numéro marché (requis)
- **PAS de garanties d'avance** (spécificité PI)
- **PAS de garantie de bonne exécution**

### 5. Modification ECR04b - Avenants

**Séparation claire:**
- Informations **marché de base** (montant initial, durée initiale)
- Informations **avenant** (montant variation, durée variation, type)

**Validation contextuelle:**
- Cumul avenants < 30% (BLOCK)
- Alerte à 25% (WARN)

### 6. Modification ECR05 - Clôture

**Contextualisation:**
- Tous modes: Date réception provisoire, PV RP
- Optionnel: Satisfaction bénéficiaires (pour PSC selon spécifications)
- Validation: Toutes garanties doivent être levées avant clôture définitive

---

## 📋 Informations Complètes à Collecter (Selon Spécifications)

### PHASE 1: PLANIFICATION (Tous modes)

✅ **Chaîne budgétaire:**
- Section, Programme, Action
- Activité, Nature de dépense (Nature économique)

✅ **Localisation:**
- Région, Département, Sous-Préfecture
- Unité Opérationnelle
- Localité, Coordonnées géographiques

✅ **Identification marché:**
- Type de Marché/contrat
- Dotation
- Objet (libellé)
- Mode de passation
- Type de livrable, Livrable
- Type d'opération (≥100M / <100M)

✅ **Prévisions:**
- Montant prévisionnel HT et TTC
- Date début/fin prévisionnelle
- Durée prévisionnelle

✅ **Autres:**
- Bénéficiaire

---

### PHASE 2: CONTRACTUALISATION (Selon mode)

#### PSD - Procédure Simplifiée d'Entente Directe

**Documents:**
- ✅ Bon de commande (requis)
- ✅ Facture proforma (requis)
- ⚠️ Dossier concurrence (optionnel - si sélection effectuée)
- ⚠️ Formulaire sélection (optionnel)

**Informations:**
- Statut fournisseur (Sanctionné ou non)

**Notes:**
- ❌ Pas de gestion soumissionnaires
- ❌ Pas de gestion lots
- ❌ Pas de recours
- ❌ Pas de COJO
- ⚠️ DCF peut émettre réserves (après procédure)

---

#### PSC - Procédure Simplifiée de Demande de Cotation

**Documents:**
- ✅ Dossier concurrence (demande cotation + factures proforma/devis) (requis)
- ✅ Formulaire sélection (requis)
- ✅ PV ouverture (requis)
- ⚠️ Rapport analyse (optionnel)
- ⚠️ Dossier recours (optionnel)

**Soumissionnaires:** (Minimum 3)
- NCC (Numéro Compte Contribuable)
- Raison sociale
- Nature (Solidaire/Conjoint si groupement)
- Statut (Sanctionné ou non)

**Lots:**
- Entreprises soumissionnaires sur le lot
- Objet
- Montant prévisionnel HT et TTC
- Livrables attendus

**Recours:**
- Motif de recours

**Dates:**
- Date ouverture plis
- Date sélection

**Notes:**
- ❌ Pas de COJO (sélection simplifiée)
- ✅ Validation soumissionnaires
- ⚠️ DCF peut émettre réserves

---

#### PSL - Procédure Simplifiée à Compétition Limitée

**Documents:**
- ✅ Courrier invitation (numérique/physique) (requis)
- ✅ DAO validé DGMP (requis)
- ✅ PV ouverture (requis)
- ✅ Rapport analyse (requis)
- ✅ PV jugement (requis)
- ⚠️ Mandat représentation (optionnel)
- ⚠️ Dossier recours (optionnel)
- ⚠️ Courriers ANO, éclaircissements (optionnel)

**Soumissionnaires:**
- NCC
- Raison sociale
- Nature (Solidaire/Conjoint)
- Statut (Sanctionné ou non)
- Statut juridique

**Lots:**
- Entreprises soumissionnaires sur le lot
- Objet
- Montant prévisionnel HT et TTC
- Livrables attendus

**Recours:**
- Motif de recours

**Dates:**
- Date ouverture plis
- Date jugement

**Obligations:**
- ✅ **Validation DGMP obligatoire**
- ✅ Commission de jugement
- ❌ Pas de COJO complète

---

#### PSO - Procédure Simplifiée à Compétition Ouverte

**Documents:**
- ✅ Courrier invitation (requis)
- ✅ DAO validé DGMP (requis)
- ✅ PV ouverture (requis)
- ✅ Rapport analyse (requis)
- ✅ PV jugement (requis)
- ⚠️ Mandat représentation (optionnel)
- ⚠️ Dossier recours (optionnel)
- ⚠️ Courriers ANO, éclaircissements (optionnel)

**Soumissionnaires:**
- NCC
- Raison sociale
- Nature (Solidaire/Conjoint)
- Statut (Sanctionné ou non)

**Lots, Recours, Dates:** (Idem PSL)

**Obligations:**
- ✅ **Validation DGMP obligatoire**
- ✅ **Publication obligatoire**
- ✅ Commission de jugement (COJO)

---

#### AOO - Appel d'Offres Ouvert

**Documents:**
- ✅ Courrier invitation (requis)
- ✅ DAO validé DGMP (requis)
- ✅ PV ouverture (requis)
- ✅ Rapport analyse (requis)
- ✅ PV jugement (requis)
- ⚠️ Mandat représentation (optionnel)
- ⚠️ Dossier recours (optionnel)
- ⚠️ Courriers ANO, éclaircissements (optionnel)

**Soumissionnaires:**
- NCC
- Raison sociale
- Nature (Solidaire/Conjoint)
- Statut (Sanctionné ou non)
- Statut juridique

**Lots, Recours, Dates:** (Idem PSL)

**Obligations:**
- ✅ **Validation DGMP obligatoire**
- ✅ **Publication large (journal + site web)**
- ✅ **COJO obligatoire**

---

#### PI - Prestations Intellectuelles

**Documents:**
- ✅ Courrier invitation (requis)
- ✅ AMI (Avis Manifestation Intérêt) ou DP (Demande Propositions) (requis)
- ✅ PV ouverture (requis)
- ✅ Rapport analyse (requis)
- ✅ PV jugement (requis)
- ⚠️ Mandat représentation (optionnel)
- ⚠️ Dossier recours (optionnel)
- ⚠️ Courriers ANO, éclaircissements (optionnel)

**Soumissionnaires:** (Idem AOO)

**Lots, Recours, Dates:** (Idem AOO)

**Méthodes de sélection:**
- QBS (Quality Based Selection)
- QCBS (Quality and Cost Based Selection)
- FBS (Fixed Budget Selection)
- LCS (Least Cost Selection)

**Obligations:**
- ✅ **Validation DGMP obligatoire**
- ✅ **Publication obligatoire**
- ✅ **COJO obligatoire**
- ✅ Sélection basée qualifications

---

### PHASE 3: ATTRIBUTION (Selon mode)

#### PSD

**Informations requises:**
- ✅ Numéro bon de commande / Facture proforma / Facture définitive
- ✅ Montant attribution
- ✅ Durée exécution
- ⚠️ Date visa CF (si applicable)
- ✅ NCC attributaire
- ✅ Raison sociale
- ✅ Banque + Numéro compte
- ⚠️ Avance démarrage (optionnel) + Taux
- ⚠️ Montant avance
- ⚠️ Garantie avance
- ⚠️ Montant garantie
- ⚠️ Durée garantie
- ✅ Type livrables
- ✅ Livrable
- ⚠️ Coordonnées géographiques
- ✅ Échéancier
- ✅ Clé répartition
- ✅ Programmation

#### PSC

**Informations requises:** (Idem PSD +)
- ✅ Numéro bon de commande
- ✅ Numéro lettre de marché / marché (si applicable)
- ✅ Numéro facture définitive

#### PSL, PSO

**Informations requises:**
- ✅ Numéro marché
- ✅ Montant attribution
- ⚠️ Date visa CF
- ✅ NCC, Raison sociale, Banque/Compte
- ⚠️ Avance démarrage (facultative 15% - forfaitaire 15%)
- ⚠️ Garantie avance
- ⚠️ Garantie bonne exécution (3-5%)
- ⚠️ Montant et durée garantie
- ✅ Type livrables, Livrable
- ✅ Coordonnées géographiques (jusqu'au village)
- ✅ Échéancier (HT + TTC + Taux %)
- ✅ Clé répartition
- ✅ Programmation

#### AOO

**Informations requises:**
- ✅ Numéro marché
- ✅ Montant attribution
- ✅ NCC, Raison sociale, Banque/Compte
- ✅ **Avance démarrage (Forfaitaire 15% / Facultative 15%) - Art 129 et 130**
- ✅ **Montant avance**
- ✅ **Garantie avance (obligatoire)**
- ✅ **Garantie bonne exécution (3-5% obligatoire) - Art 97.3**
- ✅ **Montant garantie bonne exécution**
- ✅ **Durée garantie (Délai de garantie) - Art 98**
- ✅ Type livrables, Livrable (lien avec fichier livrables attendus)
- ✅ Coordonnées géographiques (jusqu'au village)
- ✅ Échéancier (HT + TTC + Taux %)
- ✅ Clé répartition
- ✅ Programmation

#### PI

**Informations requises:**
- ✅ Numéro marché
- ✅ Montant attribution
- ⚠️ Date visa CF
- ✅ NCC, Raison sociale, Banque/Compte
- ❌ **PAS d'avance démarrage** (spécificité PI)
- ❌ **PAS de garantie avance**
- ❌ **PAS de garantie bonne exécution**
- ✅ Type livrables, Livrable
- ✅ Coordonnées géographiques
- ✅ Échéancier (HT + TTC + Taux %)
- ✅ Clé répartition
- ✅ Programmation
- ⚠️ Documents divers (Courriers ANO, éclaircissements, etc.)

---

### PHASE 4: EXÉCUTION (Tous modes - similaires)

**Ordre de Service (OS):**
- ✅ Numéro OS démarrage
- ✅ Date OS
- ✅ Durée exécution
- ✅ Date fin prévisionnelle
- ⚠️ Bureau de contrôle (optionnel)
- ⚠️ Bureau d'études (optionnel)

**Résiliation (si applicable):**
- Date résiliation
- Motif résiliation

**Avenants (si applicable):**
- Type avenant (Financier / Durée / Mixte / Technique)
- Type financement
- Source financement
- Nature économique
- Numéro avenant
- Objet
- Exonération
- Montant HT / Taux / Montant TTC
- TVA
- Date avenant
- Durée avenant
- Fichier avenant

**⚠️ IMPORTANT:** Séparer clairement marché de base et avenants

---

### PHASE 5: CLÔTURE (Tous modes)

**Réception Provisoire:**
- ✅ Date réception provisoire
- ⚠️ Période garantie (en jours)
- ⚠️ Date réception définitive prévisionnelle (Prov + Garantie)
- ⚠️ Date fin marché (Date dernier décompte)
- ✅ PV réception provisoire

**Réception Définitive:**
- ⚠️ Date réception définitive réelle (CF)
- ⚠️ PV réception définitive

**Spécificités PSC:**
- ⚠️ Satisfaction bénéficiaires / Livrables

**⚠️ IMPORTANT:** Charger toute documentation liée à cette étape

---

## 🎯 Prochaines Étapes Recommandées

### Priorité 1: Compléter ECR02a (Procédure)

1. Créer widget **Soumissionnaires Manager**
2. Créer widget **Lots Manager**
3. Implémenter affichage conditionnel des sections COJO
4. Tester avec tous les modes (PSD, PSC, PSL, PSO, AOO, PI)

### Priorité 2: Ajuster ECR03a (Attribution)

1. Implémenter contextualisation garanties selon mode
2. Validation taux avance/garanties selon règles
3. Masquer garanties pour PI

### Priorité 3: Ajuster ECR04b (Avenants)

1. Séparer visuellement marché base / avenants
2. Validation cumul 30%

### Priorité 4: Ajuster ECR05 (Clôture)

1. Contextualisation satisfaction bénéficiaires (PSC)
2. Validation garanties levées

### Priorité 5: Tests d'intégration

1. Tester cycle complet pour chaque mode
2. Valider règles métier
3. Tester dérogations

---

## 📊 Matrices de Compatibilité

### Gestion Soumissionnaires

| Mode | Actif | Champs                                                 |
|------|-------|--------------------------------------------------------|
| PSD  | ❌    | -                                                      |
| PSC  | ✅    | NCC, Raison sociale, Nature groupement, Statut sanction |
| PSL  | ✅    | + Statut juridique                                     |
| PSO  | ✅    | NCC, Raison sociale, Nature groupement, Statut sanction |
| AOO  | ✅    | + Statut juridique                                     |
| PI   | ✅    | + Statut juridique                                     |

### Gestion Lots

| Mode | Actif | Champs                                                       |
|------|-------|--------------------------------------------------------------|
| PSD  | ❌    | -                                                            |
| PSC  | ✅    | Entreprises, Objet, Montants HT/TTC, Livrables attendus     |
| PSL  | ✅    | Idem PSC                                                     |
| PSO  | ✅    | Idem PSC                                                     |
| AOO  | ✅    | Idem PSC                                                     |
| PI   | ✅    | Idem PSC                                                     |

### Obligations DGMP / Publication / COJO

| Mode | DGMP | Publication | COJO |
|------|------|-------------|------|
| PSD  | ❌   | ❌          | ❌   |
| PSC  | ❌   | ❌          | ❌   |
| PSL  | ✅   | ⚠️          | ⚠️   |
| PSO  | ✅   | ✅          | ✅   |
| AOO  | ✅   | ✅          | ✅   |
| PI   | ✅   | ✅          | ✅   |

### Garanties Obligatoires

| Mode | Avance | Bonne Exécution |
|------|--------|-----------------|
| PSD  | ⚠️     | ⚠️              |
| PSC  | ⚠️     | ⚠️              |
| PSL  | ⚠️     | ⚠️              |
| PSO  | ⚠️     | ⚠️              |
| AOO  | ✅     | ✅              |
| PI   | ❌     | ❌              |

**Légende:**
- ✅ Obligatoire
- ⚠️ Optionnel/Recommandé
- ❌ Non applicable

---

## 🔧 Utilisation des Fonctions de Contextualisation

### Exemple 1: Affichage conditionnel section COJO

```javascript
import { requiresCOJO } from '../../../lib/procedure-context.js';

const modePassation = operation.modePassation; // 'AOO', 'PSL', etc.

if (requiresCOJO(modePassation)) {
  // Afficher section COJO complète
  container.appendChild(renderSectionCOJO(procedure));
} else if (modePassation === 'PSC') {
  // Afficher formulaire sélection simplifié
  container.appendChild(renderFormulaireSelection(procedure));
} else if (modePassation === 'PSD') {
  // Afficher bon de commande uniquement
  container.appendChild(renderBonCommande(procedure));
}
```

### Exemple 2: Gestion soumissionnaires

```javascript
import {
  hasSoumissionnairesManagement,
  getSoumissionnairesFields
} from '../../../lib/procedure-context.js';

if (hasSoumissionnairesManagement(modePassation)) {
  const fieldsToDisplay = getSoumissionnairesFields(modePassation);
  // fieldsToDisplay = ['ncc', 'raisonSociale', 'natureSiGroupement', 'statutSanction']

  container.appendChild(
    renderSoumissionnairesManager(fieldsToDisplay, procedure.soumissionnaires)
  );
}
```

### Exemple 3: Validation contextuelle

```javascript
import { validateProcedureRequirements } from '../../../lib/procedure-context.js';

async function handleSubmit() {
  const formData = new FormData(form);

  const validation = validateProcedureRequirements(
    formData,
    modePassation,
    'contractualisation'
  );

  if (!validation.valid) {
    // Afficher erreurs
    validation.errors.forEach(err => {
      console.error(err.message);
      // Highlight field err.field
    });
    return;
  }

  if (validation.warnings.length > 0) {
    // Afficher warnings
    const confirm = await confirmDialog(
      `Avertissements:\n${validation.warnings.map(w => w.message).join('\n')}\n\nContinuer?`
    );
    if (!confirm) return;
  }

  // Sauvegarder
  await dataService.update(ENTITIES.PROCEDURE, procedureId, formData);
}
```

### Exemple 4: Alerte d'information contextuelle

```javascript
import { createProcedureInfoAlert } from '../../../lib/procedure-context.js';

function renderProcedureForm(modePassation) {
  const container = el('div', {}, [
    // Alerte d'information en haut
    createProcedureInfoAlert(modePassation),

    // Reste du formulaire
    renderFormContent(modePassation)
  ]);

  return container;
}
```

---

## 📝 Notes Importantes

### Concernant les Soumissionnaires (Commentaires annotés)

**Question initiale:** Faut-il capter tous les soumissionnaires ou seulement l'attributaire?

**Réponse après analyse:**
- **PSD**: Un seul fournisseur (entente directe) → Pas de gestion soumissionnaires
- **PSC**: 3 fournisseurs minimum consultés → **Capturer tous** ou **prioriser chargement documentation** (devis concurrence)
- **PSL, PSO, AOO, PI**: Tous les soumissionnaires → **Capturer tous** pour traçabilité et vérification sanctions

**Utilité de capturer tous les soumissionnaires:**
1. Traçabilité complète de la procédure
2. Détection soumissionnaires sanctionnés (invalidation commission)
3. Rapports qualité et conformité
4. Audits et contrôles

**Solution recommandée:**
- Permettre saisie manuelle OU
- Chargement fichier CSV/Excel soumissionnaires OU
- Les deux (flexibilité)

### Concernant les Fichiers de Marchés de Base vs Avenants

**Observation:** Les fichiers d'avenants sont mentionnés, mais pas les fichiers des marchés de base.

**Solution:**
- **Marché de base**: Capturer lors de l'attribution (ECR03a)
  - Contrat signé (PDF)
  - Lettre de marché (PDF)
  - Documents techniques

- **Avenant**: Capturer lors de l'exécution (ECR04b)
  - Avenant signé (PDF)
  - Justificatifs

### Date Dernier Décompte / Dernier OP

**Note M. NIAMIEN:** Capter le dernier OP sur le marché pour mieux indiquer que le marché est terminé.

**Solution:**
- Ajouter champ `dateD dernierDecompte` dans CLOTURE
- OU Récupérer automatiquement depuis module Dépenses (si intégration)
- Utiliser comme indicateur marché physiquement terminé

---

## 🎨 Mockups Conceptuels

### ECR02a - Affichage selon Mode

```
╔══════════════════════════════════════════════════════════════╗
║                    MODE SÉLECTIONNÉ: PSC                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ℹ️  Procédure Simplifiée de Demande de Cotation (PSC)      ║
║     (10M - 30M XOF) : Demande de cotations/devis à 3        ║
║     fournisseurs minimum. DCF peut émettre réserves.        ║
║                                                              ║
║     ✓ Gestion soumissionnaires  |  ✓ Gestion lots          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  📄 Documents de Procédure                                   ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ • Dossier de concurrence (demande + devis) *          │ ║
║  │   [Choisir fichier] dossier_concurrence.pdf           │ ║
║  │                                                        │ ║
║  │ • Formulaire de sélection *                           │ ║
║  │   [Choisir fichier] formulaire_selection.pdf          │ ║
║  │                                                        │ ║
║  │ • PV d'ouverture *                                    │ ║
║  │   [Choisir fichier] pv_ouverture.pdf                  │ ║
║  │                                                        │ ║
║  │ • Rapport d'analyse (optionnel)                       │ ║
║  │   [Choisir fichier]                                   │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  📅 Dates Clés                                               ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ Date ouverture plis *    │ Date sélection *           │ ║
║  │ [20/03/2024]              │ [25/03/2024]               │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  👥 Soumissionnaires (3 minimum)                             ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ NCC        │ Raison Sociale │ Groupement │ Sanctionné │ ║
║  ├────────────┼────────────────┼────────────┼────────────┤ ║
║  │ CI0123456  │ Entreprise A   │ Non        │ Non        │ ║
║  │ CI0789012  │ Entreprise B   │ Non        │ Non        │ ║
║  │ CI0345678  │ Entreprise C   │ Non        │ Non        │ ║
║  │            │                │            │ [+ Ajouter]│ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  📦 Lots                                                     ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ Objet          │ Montant HT │ Livrables              │ ║
║  ├────────────────┼────────────┼────────────────────────┤ ║
║  │ Lot 1: Fourni. │ 15 000 000 │ Matériel informatique  │ ║
║  │                │            │                [+ Ajou]│ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║                   [Annuler]  [Enregistrer & Continuer]     ║
╚══════════════════════════════════════════════════════════════╝
```

---

## ✅ Checklist de Validation

### Configuration
- [x] PSL ajouté dans modes_passation
- [x] PI ajouté dans modes_passation
- [x] Seuils corrects PSD (< 10M)
- [x] Seuils corrects PSC (10M - 30M)
- [x] Seuils PSL (30M - 50M)
- [x] Seuils PSO (50M - 100M)
- [x] Seuils AOO (≥ 100M)
- [x] Section contextualite_procedures complète
- [x] Nomenclature étapes paramétrable

### Bibliothèque procedure-context.js
- [x] getContextualConfig()
- [x] hasSoumissionnairesManagement()
- [x] hasLotsManagement()
- [x] requiresDGMPValidation()
- [x] requiresPublication()
- [x] requiresCOJO()
- [x] applyProcedureContext()
- [x] applyProcedureContextToSections()
- [x] validateProcedureRequirements()
- [x] createProcedureInfoAlert()
- [x] getStepsNomenclature()
- [x] setCustomStepsNomenclature()

### Écrans (À compléter)
- [ ] ECR02a: Affichage conditionnel selon mode
- [ ] ECR02a: Widget Soumissionnaires
- [ ] ECR02a: Widget Lots
- [ ] ECR03a: Contextualisation garanties
- [ ] ECR04b: Séparation marché base / avenants
- [ ] ECR05: Satisfaction bénéficiaires (PSC)

### Tests
- [ ] Test PSD complet
- [ ] Test PSC complet
- [ ] Test PSL complet
- [ ] Test PSO complet
- [ ] Test AOO complet
- [ ] Test PI complet
- [ ] Test dérogations
- [ ] Test validations

---

## 🚀 Pour Continuer

Voulez-vous que je procède maintenant à:

1. **Modification complète ECR02a** avec widgets Soumissionnaires et Lots?
2. **Modification ECR03a** avec contextualisation garanties?
3. **Création d'un prototype de test** pour valider un mode spécifique?
4. **Documentation utilisateur** pour les nouveaux modes?

**Prochaine étape recommandée:** Compléter ECR02a avec les widgets de gestion, car c'est le point d'entrée critique pour la contextualisation.
