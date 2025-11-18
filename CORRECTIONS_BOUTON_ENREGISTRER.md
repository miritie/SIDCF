# Corrections - Bouton "Enregistrer" non fonctionnel

## Date : 2025-01-18

## Problème rapporté

L'utilisateur a rempli le formulaire de création de ligne PPM (ECR01d) jusqu'au bout, mais en cliquant sur le bouton **"Enregistrer"**, rien ne se passait.

## Diagnostic

### Cause du problème

**Problème de portée (scope) JavaScript** : La fonction `handleSave()` était définie **en dehors** de la fonction `renderPPMCreateLine()`, alors que les boutons qui l'appellent étaient créés **à l'intérieur**.

```javascript
// ❌ AVANT (ne fonctionnait pas)
export async function renderPPMCreateLine(params) {
  // ... code ...

  const page = el('div', {}, [
    // ... formulaire ...
    createButton('btn btn-primary', '✓ Enregistrer', () => handleSave(false))
    // ⚠️ handleSave n'est pas encore défini ici !
  ]);

  mount('#app', page);
}

// handleSave défini ICI (trop tard !)
async function handleSave(createAnother) {
  // ... code de sauvegarde ...
}
```

### Pourquoi cela ne fonctionnait pas ?

1. Lorsque le bouton était créé (ligne 372), JavaScript cherchait la fonction `handleSave`
2. La fonction n'existait pas encore dans la portée locale
3. Le bouton était créé avec un gestionnaire d'événement `undefined`
4. Clic sur le bouton → Aucune action

## Solution appliquée

### Déplacement de la fonction `handleSave`

La fonction `handleSave` a été **déplacée à l'intérieur** de `renderPPMCreateLine`, **avant** la création des boutons :

```javascript
// ✅ APRÈS (fonctionne correctement)
export async function renderPPMCreateLine(params) {
  const registries = dataService.getAllRegistries();
  let livrablesList = [];

  // ✅ Définir handleSave ICI, avant de créer les boutons
  async function handleSave(createAnother) {
    // Collect form data
    const formData = {
      exercice: Number(document.getElementById('exercice')?.value),
      unite: getSelectLabel('unite') || '',
      objet: document.getElementById('objet')?.value?.trim(),
      typeMarche: document.getElementById('typeMarche')?.value,
      modePassation: document.getElementById('modePassation')?.value,
      revue: document.getElementById('revue')?.value || null,
      // ... tous les autres champs ...
    };

    // Validation
    if (!formData.objet || !formData.unite || !formData.typeMarche || !formData.modePassation) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.montantPrevisionnel <= 0) {
      alert('⚠️ Le montant prévisionnel doit être supérieur à 0');
      return;
    }

    // Create operation
    const newOperationId = operationId();
    const operation = {
      id: newOperationId,
      planId: null,
      budgetLineId: null,
      ...formData,
      devise: 'XOF',
      timeline: ['PLANIF'],
      etat: 'PLANIFIE',
      procDerogation: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await dataService.create(ENTITIES.OPERATION, operation);

    if (!result.success) {
      alert('❌ Erreur lors de la création de l\'opération');
      logger.error('[PPM Create Line] Failed to create operation', result.error);
      return;
    }

    if (createAnother) {
      alert('✅ Opération créée avec succès');
      document.getElementById('form-ppm-line')?.reset();
      document.getElementById('exercice').value = new Date().getFullYear();
    } else {
      alert('✅ Opération créée avec succès');
      router.navigate('/fiche-marche', { idOperation: newOperationId });
    }
  }

  // ✅ MAINTENANT on peut créer les boutons
  const page = el('div', {}, [
    // ... formulaire ...
    createButton('btn btn-primary', '✓ Enregistrer', () => handleSave(false))
    // ✅ handleSave est défini et accessible !
  ]);

  mount('#app', page);
}
```

## Corrections complémentaires

### Ajout du registre TYPE_REVUE

En analysant le code, j'ai également remarqué que le champ "Revue" utilisait `registries.TYPE_REVUE` qui n'existait pas. J'ai ajouté ce registre dans `registries.json` :

```json
"TYPE_REVUE": [
  {
    "code": "A_PRIORI",
    "label": "A priori (Visa CF obligatoire avant signature)",
    "description": "Le marché nécessite un visa du Contrôle Financier AVANT la signature du contrat"
  },
  {
    "code": "A_POSTERIORI",
    "label": "A posteriori (Contrôle après signature)",
    "description": "Le marché est signé puis transmis au Contrôle Financier pour vérification"
  },
  {
    "code": "AUCUNE",
    "label": "Aucune (Pas de contrôle CF)",
    "description": "Le marché n'est pas soumis au contrôle du Contrôle Financier"
  }
]
```

### Signification du champ "Revue"

Le champ **"Revue"** désigne le **type de contrôle du Contrôle Financier** :

- **A_PRIORI** : Le visa CF est **obligatoire AVANT** la signature du contrat (marchés importants)
- **A_POSTERIORI** : Le marché est signé puis contrôlé après (marchés de faible montant)
- **AUCUNE** : Pas de contrôle CF requis (sous certains seuils)

Ce champ est crucial car il détermine :
- Si l'étape "VISA_CF" est obligatoire dans le workflow
- Le moment où le CF intervient (avant ou après la signature)
- Les documents requis selon le type de revue

## Tests à effectuer

### 1. Recharger l'application
```bash
# Le serveur est déjà en cours d'exécution
# Simplement recharger la page dans le navigateur
```

### 2. Accéder à l'écran de création
1. Ouvrir : `http://localhost:7001/#/ppm-list`
2. Cliquer sur **"➕ Créer une nouvelle ligne PPM"**

### 3. Remplir le formulaire
- **Exercice** : 2025
- **Section (Ministère)** : Direction de zone 780 102
- **Programme** : Sous-préfecture 1300101
- **Unité Administrative (UA)** : Assemblée N 1 Investissements
- **Objet du marché** : Une formation importante
- **Type de marché** : Fournitures
- **Mode de passation** : Procédure Simplifiée sur Consultation
- **Revue** : A priori (Visa CF obligatoire avant signature) ← **NOUVEAU**
- **Nature des prix** : Prix Mixte
- **Montant prévisionnel** : 4500000
- **Type de financement** : Budget de l'État
- **Bailleur** : Trésor Public (CI)
- **Activité** : Formation du personnel administratif (FORMATION)
- **Ligne budgétaire** : Ex: 62200000
- **Délai d'exécution** : 30 jours
- **Catégorie de prestation** : Infrastructure
- **Bénéficiaire** : un bénéficiaire anonyme
- **Livrables** : Ajouter 2 livrables
- **Localisation** : Sélectionner Région → Département → Sous-préfecture → Localité

### 4. Cliquer sur "Enregistrer"

**Résultats attendus :**
1. ✅ Un message d'alerte apparaît : **"✅ Opération créée avec succès"**
2. ✅ L'application navigue vers la fiche du marché (ECR01c)
3. ✅ La nouvelle opération apparaît dans la liste PPM

**Si ça ne fonctionne pas :**
1. Ouvrir la console du navigateur (F12)
2. Vérifier s'il y a des erreurs JavaScript
3. Partager une capture d'écran de la console

### 5. Tester "Enregistrer et créer nouveau"

**Résultats attendus :**
1. ✅ Message : **"✅ Opération créée avec succès"**
2. ✅ Le formulaire est réinitialisé
3. ✅ L'exercice reste à 2025
4. ✅ On peut saisir une nouvelle ligne immédiatement

## Validations implémentées

La fonction `handleSave` effectue les validations suivantes **avant** de sauvegarder :

### 1. Champs obligatoires
```javascript
if (!formData.objet || !formData.unite || !formData.typeMarche || !formData.modePassation) {
  alert('⚠️ Veuillez remplir tous les champs obligatoires');
  return;
}
```

**Champs vérifiés :**
- Objet du marché
- Unité Administrative (UA)
- Type de marché
- Mode de passation

### 2. Montant valide
```javascript
if (formData.montantPrevisionnel <= 0) {
  alert('⚠️ Le montant prévisionnel doit être supérieur à 0');
  return;
}
```

### 3. Génération de l'opération
```javascript
const newOperationId = operationId(); // Génère un ID unique

const operation = {
  id: newOperationId,
  planId: null,              // Ligne unitaire (non importée CSV)
  budgetLineId: null,
  ...formData,               // Tous les champs du formulaire
  devise: 'XOF',
  timeline: ['PLANIF'],      // Étape initiale
  etat: 'PLANIFIE',          // État initial
  procDerogation: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
```

### 4. Sauvegarde dans le dataService
```javascript
const result = await dataService.create(ENTITIES.OPERATION, operation);

if (!result.success) {
  alert('❌ Erreur lors de la création de l\'opération');
  logger.error('[PPM Create Line] Failed to create operation', result.error);
  return;
}
```

## Workflow après sauvegarde

### Option 1 : Enregistrer (bouton principal)
```javascript
alert('✅ Opération créée avec succès');
router.navigate('/fiche-marche', { idOperation: newOperationId });
```
→ Redirige vers la **fiche détaillée du marché** (ECR01c)

### Option 2 : Enregistrer et créer nouveau
```javascript
alert('✅ Opération créée avec succès');
document.getElementById('form-ppm-line')?.reset();
document.getElementById('exercice').value = new Date().getFullYear();
```
→ Réinitialise le formulaire pour créer une nouvelle ligne

## Fichiers modifiés

### 1. [ecr01d-ppm-create-line.js](sidcf-portal/js/modules/marche/screens/ecr01d-ppm-create-line.js)
- Déplacement de `handleSave()` à l'intérieur de `renderPPMCreateLine()`
- Suppression de la définition dupliquée à la fin du fichier

### 2. [registries.json](sidcf-portal/js/config/registries.json)
- Ajout du registre `TYPE_REVUE` avec 3 options (A_PRIORI, A_POSTERIORI, AUCUNE)

## Notes techniques

### Portée (Scope) en JavaScript

```javascript
// ❌ PROBLÈME : Fonction définie en dehors
function outer() {
  inner(); // ❌ Erreur : inner n'est pas défini
}

function inner() {
  console.log('Hello');
}

// ✅ SOLUTION : Fonction définie à l'intérieur
function outer() {
  function inner() {
    console.log('Hello');
  }

  inner(); // ✅ Fonctionne !
}
```

### Closures (Fermetures)

La fonction `handleSave` est une **closure** : elle a accès aux variables de `renderPPMCreateLine` :
- `livrablesList` (liste des livrables)
- `registries` (registres de référence)
- `dataService` (service de données)

Cela permet à `handleSave` de récupérer les données du formulaire et les livrables au moment de l'enregistrement.

## Conformité réglementaire

### Champ "Revue" selon le Code des Marchés Publics

Le contrôle financier a priori s'applique généralement :
- **Marchés > 100M XOF** : Visa CF obligatoire avant signature
- **Marchés 50M - 100M XOF** : Selon le type de procédure
- **Marchés < 50M XOF** : Contrôle a posteriori ou aucun contrôle

Cette règle peut être configurée via les règles métier dans `rules-config.json`.

---

**Date de correction :** 2025-01-18
**Auteur :** Claude Code
**Statut :** ✅ Corrigé et prêt à tester

**Prochaine action :** Recharger la page et tester la création d'une ligne PPM
