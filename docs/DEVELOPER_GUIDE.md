# Guide Développeur - SIDCF Portal

**Pour** : Développeurs qui vont compléter les écrans manquants
**Contexte** : Le flux critique est opérationnel, il reste 11 écrans à implémenter

---

## 🚀 Démarrage Rapide

```bash
# 1. Cloner/Récupérer le projet
cd /Volumes/DATA/DEVS/SIDCF/sidcf-portal

# 2. Lancer serveur HTTP
python3 -m http.server 7001

# 3. Ouvrir dans navigateur
open http://localhost:7001

# 4. Console F12 pour debug
# Vérifier: "[DataService] Initialization complete"
```

**Aucune installation npm/node requise** ✅ (100% vanilla JS)

---

## 📂 Structure Projet

```
sidcf-portal/
├── index.html                    # Point d'entrée
├── js/
│   ├── main.js                   # Boot sequence
│   ├── router.js                 # Hash router
│   ├── lib/                      # Utilitaires (dom, format, logger, uid)
│   ├── ui/
│   │   ├── widgets/              # ⭐ Components réutilisables
│   │   │   ├── steps.js          # Timeline 6 étapes
│   │   │   ├── drawer.js         # Panneau latéral
│   │   │   ├── budget-line-viewer.js
│   │   │   ├── table.js          # DataTable
│   │   │   ├── kpis.js           # KPI grid
│   │   │   └── form.js           # Form fields
│   │   ├── topbar.js
│   │   └── sidebar.js
│   ├── datastore/
│   │   ├── schema.js             # Modèles de données
│   │   ├── data-service.js       # API unifiée
│   │   ├── rules-engine.js       # Moteur de règles
│   │   ├── seed.json             # Données de test
│   │   └── adapters/
│   │       ├── local-storage.js
│   │       └── airtable.js
│   ├── config/
│   │   ├── app-config.json       # Config app
│   │   ├── registries.json       # 26 référentiels
│   │   ├── rules-config.json     # Barèmes & seuils
│   │   └── pieces-matrice.json
│   └── modules/
│       └── marche/
│           ├── index.js          # Registration routes
│           └── screens/          # ⭐ Écrans à compléter
│               ├── ecr01a-import-ppm.js
│               ├── ecr01b-ppm-unitaire.js      ✅ Fait
│               ├── ecr01c-fiche-marche.js      ✅ Fait
│               ├── ecr02a-procedure-pv.js      ✅ Fait
│               ├── ecr04b-avenants.js          ✅ Fait
│               └── [11 autres à créer]         ⏳ TODO
├── css/
│   ├── variables.css             # Variables design
│   ├── base.css                  # Reset + typo
│   ├── layout.css                # Grilles
│   └── components.css            # Components + widgets
├── assets/                       # SVG, images
└── docs/
    ├── INTEGRATION_REPORT.md     # Rapport technique complet
    ├── flux-budget-marche.md     # Documentation flux métier
    └── DEVELOPER_GUIDE.md        # Ce fichier
```

---

## 🎯 Votre Mission : Implémenter les 11 Écrans Manquants

### Liste Priorisée

| Priorité | Écran | Route | Effort | Description |
|----------|-------|-------|--------|-------------|
| **P1** | Attribution | `/attribution` | 3h | Désigner attributaire, montants |
| **P1** | Visa CF | `/visa-cf` | 2h | Décision CF (VISA/RESERVE/REFUS) |
| **P1** | Ordre Service | `/execution` | 2h | OS démarrage + alertes délais |
| **P2** | Contrat & Clé | `/contrat` | 3h | Clé de répartition (Σ%=100) |
| **P2** | Échéancier | `/echeancier` | 3h | Échéancier paiements |
| **P2** | PV Procédure | `/procedure-pv` | 2h | PV ouverture/analyse/jugement |
| **P3** | Résumé Opération | `/ppm-resume` | 2h | Vue synthétique avant procédure |
| **P3** | Garanties | `/garanties` | 2h | Gérer garanties |
| **P3** | Suivi Exécution | `/suivi-execution` | 2h | OS complémentaires, jalons |
| **P3** | Clôture | `/cloture` | 2h | PV prov/def, mainlevées |
| **P4** | Recours | `/recours` | 2h | Timeline recours |
| **P4** | Dashboard CF | `/dashboard-cf` | 3h | KPIs & filtres |
| **P4** | Admin Params | `/admin/parametres` | 3h | CRUD référentiels |

**Total** : 31h

### Comment Choisir par Où Commencer ?

**Option A** : Flux complet (recommandé)
→ Implémenter dans l'ordre du flux métier : A1 (Attribution) → V1 (Visa CF) → E1 (OS) → C1/C2 (Contrat/Échéancier) → Garanties → Clôture

**Option B** : Quick wins
→ Commencer par les plus simples : PR2 (PV Procédure), E1 (OS), Garanties, Recours

**Option C** : Valeur métier
→ Priorité aux écrans bloquants : A1, V1, C1 (sans eux, pas de visa ni d'exécution)

---

## 📋 Template Code pour Nouvel Écran

Copiez-collez ce template et adaptez :

```javascript
/* ============================================
   ECR-XXX - [Titre de l'écran]
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { renderSteps } from '../../../ui/widgets/steps.js';
import logger from '../../../lib/logger.js';

// Helper pour créer boutons sans onclick inline
function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Render l'écran XXX
 * @param {Object} params - { idOperation }
 */
export async function renderMyScreen(params) {
  const { idOperation } = params;

  // Validation params
  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'ID opération manquant')
    ]));
    return;
  }

  // === ÉTAPE 1: Charger les données ===
  const fullData = await dataService.getOperationFull(idOperation);

  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, 'Opération non trouvée')
    ]));
    return;
  }

  const { operation, procedure, attribution, /* ... */ } = fullData;
  const registries = dataService.getAllRegistries();

  // === ÉTAPE 2: Vérifier les règles ===
  const rulesResult = dataService.checkRules(operation, operation.etat, {
    // Context selon besoin
  });

  // === ÉTAPE 3: État local du formulaire ===
  let formData = {
    // Vos champs
  };

  // === ÉTAPE 4: Construire la page ===
  const page = el('div', { className: 'page' }, [
    // 4.1 Timeline (OBLIGATOIRE)
    renderSteps(fullData, idOperation),

    // 4.2 Header
    el('div', { className: 'page-header' }, [
      createButton('btn btn-secondary btn-sm', '← Retour fiche', () => {
        router.navigate('/fiche-marche', { idOperation });
      }),
      el('h1', { className: 'page-title', style: { marginTop: '12px' } }, '[Titre Écran]'),
      el('p', { className: 'page-subtitle' }, operation.objet)
    ]),

    // 4.3 Alertes règles (si warnings/blocages)
    ...rulesResult.messages.map(msg => renderAlert(msg)),

    // 4.4 Formulaire principal
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Titre Section')
      ]),
      el('div', { className: 'card-body' }, [
        // Vos champs de formulaire
        renderFormField('Label', 'text', formData, 'fieldName'),
        // ...
      ])
    ]),

    // 4.5 Actions (toujours en bas)
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
          createButton('btn btn-secondary', 'Annuler', () => {
            router.navigate('/fiche-marche', { idOperation });
          }),
          createButton('btn btn-primary', 'Enregistrer & Continuer', async () => {
            await handleSave(idOperation, formData);
          })
        ])
      ])
    ])
  ]);

  // === ÉTAPE 5: Monter dans le DOM ===
  mount('#app', page);
}

/**
 * Render une alerte selon severity
 */
function renderAlert(msg) {
  const alertClass = msg.severity === 'BLOCK' ? 'alert-error' :
                     msg.severity === 'WARN' ? 'alert-warning' : 'alert-info';
  const icon = msg.severity === 'BLOCK' ? '🚫' : msg.severity === 'WARN' ? '⚠️' : 'ℹ️';

  return el('div', { className: `alert ${alertClass}`, style: { marginBottom: '16px' } }, [
    el('div', { className: 'alert-icon' }, icon),
    el('div', { className: 'alert-content' }, [
      el('div', { className: 'alert-title' }, msg.code),
      el('div', { className: 'alert-message' }, msg.message)
    ])
  ]);
}

/**
 * Render un champ de formulaire
 */
function renderFormField(label, type, dataObj, fieldName, required = false) {
  return el('div', { className: 'form-field' }, [
    el('label', { className: 'form-label' }, [
      label,
      required ? el('span', { className: 'required' }, '*') : null
    ]),
    el('input', {
      type,
      className: 'form-input',
      value: dataObj[fieldName] || '',
      id: `field-${fieldName}`
    })
  ]);
}

/**
 * Handler de sauvegarde
 */
async function handleSave(idOperation, formData) {
  // Validation
  if (!formData.requiredField) {
    alert('⚠️ Champ requis manquant');
    return;
  }

  // Récupérer valeurs depuis DOM (si formulaire non contrôlé)
  const fieldValue = document.getElementById('field-xxx')?.value;

  // Update operation
  const updateData = {
    // Vos données
  };

  const result = await dataService.update(ENTITIES.OPERATION, idOperation, updateData);

  if (result.success) {
    logger.info('[MyScreen] Opération mise à jour avec succès');
    alert('✅ Données enregistrées');
    router.navigate('/fiche-marche', { idOperation });
  } else {
    logger.error('[MyScreen] Erreur sauvegarde');
    alert('❌ Erreur lors de la sauvegarde');
  }
}

// Export par défaut
export default renderMyScreen;
```

---

## 🔧 Helpers Utiles

### 1. Créer un Dropdown (Select)

```javascript
function createSelect(options, selectedValue, onChange) {
  const select = el('select', { className: 'form-input' });

  // Option vide
  select.appendChild(el('option', { value: '' }, '-- Sélectionnez --'));

  // Options
  options.forEach(opt => {
    const option = el('option', { value: opt.code }, opt.label);
    if (opt.code === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', (e) => onChange(e.target.value));

  return select;
}

// Usage
const modeSelect = createSelect(
  registries.MODE_PASSATION,
  operation.modePassation,
  (value) => { selectedMode = value; }
);
```

### 2. Créer un Tableau Dynamique

```javascript
import { dataTable } from '../../../ui/widgets/table.js';

const table = dataTable(
  [
    { key: 'id', label: 'ID' },
    { key: 'objet', label: 'Objet' },
    { key: 'montant', label: 'Montant', render: (val) => money(val) }
  ],
  data,
  {
    onRowClick: (row) => console.log(row),
    actions: [
      {
        label: '👁️',
        className: 'btn-secondary btn-sm',
        onClick: (row) => router.navigate('/fiche-marche', { idOperation: row.id })
      }
    ]
  }
);
```

### 3. Afficher des KPIs

```javascript
import { kpiGrid } from '../../../ui/widgets/kpis.js';

const kpis = kpiGrid([
  { label: 'Montant initial', value: 250000000, options: { format: 'money' } },
  { label: 'Total avenants', value: 62500000, options: { format: 'money' } },
  { label: 'Cumul (%)', value: '25.5%' }
]);
```

### 4. Upload de Fichier

```javascript
// Dans le formulaire
el('input', {
  type: 'file',
  className: 'form-input',
  id: 'my-file-upload',
  accept: '.pdf,.doc,.docx'
})

// Dans handleSave
const fileInput = document.getElementById('my-file-upload');
if (fileInput?.files?.[0]) {
  const file = fileInput.files[0];
  // Simuler upload (en vrai, POST vers serveur)
  const docId = 'DOC_' + Date.now() + '_' + file.name;
  logger.info('[MyScreen] Fichier uploadé:', docId);

  updateData.documentRef = docId;
}
```

### 5. Formater des Montants/Dates

```javascript
import { money, date, percent } from '../../../lib/format.js';

money(250000000)           // "250 000 000 XOF"
date('2024-05-15')         // "15/05/2024"
percent(25.5, 1)           // "25,5%"
```

---

## 🎨 Styles CSS Disponibles

### Classes Utilitaires

```css
/* Layout */
.page                  /* Container principal */
.page-header           /* Header avec titre */
.page-title            /* H1 titre */
.page-subtitle         /* Sous-titre */
.page-actions          /* Boutons d'action */

/* Cards */
.card                  /* Carte blanche */
.card-header           /* En-tête card */
.card-title            /* Titre card */
.card-body             /* Contenu card */
.card-footer           /* Pied de card */

/* Alerts */
.alert                 /* Alerte générique */
.alert-info            /* Bleue (info) */
.alert-warning         /* Orange (warning) */
.alert-error           /* Rouge (erreur) */
.alert-success         /* Verte (succès) */

/* Buttons */
.btn                   /* Bouton par défaut */
.btn-primary           /* Vert primaire */
.btn-secondary         /* Gris secondaire */
.btn-sm                /* Petit */

/* Forms */
.form-field            /* Conteneur champ */
.form-label            /* Label */
.form-input            /* Input/Select/Textarea */
.required              /* Astérisque rouge */

/* Badges */
.badge                 /* Badge générique */
.badge-primary         /* Bleu */
.badge-success         /* Vert */
.badge-warning         /* Orange */
.badge-error           /* Rouge */
.badge-derogation      /* Rouge spécial dérogation */

/* Tables */
.table                 /* Tableau */
.table-responsive      /* Responsive wrapper */

/* Utils */
.text-muted            /* Texte gris */
.text-small            /* Petit texte */
```

### Variables CSS

```css
/* Couleurs (variables.css) */
var(--color-primary)        /* #0f5132 (vert DCF) */
var(--color-warning)        /* #f59e0b (orange) */
var(--color-error)          /* #dc2626 (rouge) */
var(--color-success)        /* #10b981 (vert) */
var(--color-info)           /* #3b82f6 (bleu) */

/* Espacements */
var(--spacing-2)            /* 8px */
var(--spacing-4)            /* 16px */
var(--spacing-6)            /* 24px */

/* Typographie */
var(--font-size-sm)         /* 14px */
var(--font-size-base)       /* 16px */
var(--font-size-lg)         /* 18px */
var(--font-size-xl)         /* 20px */
```

---

## 🧪 Tests Manuels

### Checklist Avant Commit

- [ ] L'écran s'affiche sans erreur console
- [ ] La timeline est visible et cliquable
- [ ] Les alertes rules s'affichent si règles violées
- [ ] Les boutons fonctionnent (pas d'erreur au clic)
- [ ] La sauvegarde met à jour dataService
- [ ] La navigation (Retour, Continuer) fonctionne
- [ ] Le responsive est OK (tester fenêtre étroite)
- [ ] Pas de inline `onclick` (ESLint passerait)
- [ ] Les champs requis sont validés

### Test de Non-Régression

```javascript
// Console navigateur
// 1. Vider localStorage
localStorage.clear()
location.reload()

// 2. Vérifier seed data chargé
// Observer logs: "[DataService] Seed data loaded"

// 3. Naviguer vers votre écran
window.location.hash = '#/votre-route?idOperation=OP-2024-001'

// 4. Vérifier données affichées
// Pas d'erreur console, timeline visible, formulaire pré-rempli

// 5. Sauvegarder
// Cliquer bouton "Enregistrer"
// Vérifier alert "✅ Données enregistrées"
// Vérifier navigation retour vers fiche marché
```

---

## 📖 Ressources & Références

### Documentation Interne

| Document | Contenu |
|----------|---------|
| **`INTEGRATION_REPORT.md`** | Rapport technique complet (architecture, fichiers modifiés, widgets) |
| **`flux-budget-marche.md`** | Documentation flux métier, règles, décisions UX |
| **`README_INTEGRATION.md`** | Guide utilisateur, exemples code, démo |

### Exemples Code (à copier/adapter)

| Écran | Fichier | Ce qu'il montre |
|-------|---------|-----------------|
| Fiche marché | `ecr01c-fiche-marche.js` | Timeline, BUDGET_LINE, badges, navigation |
| Procédure | `ecr02a-procedure-pv.js` | Règles, dérogation, upload fichier, validation |
| Avenants | `ecr04b-avenants.js` | KPIs, alertes seuils, tableau |
| Liste PPM | `ecr01b-ppm-unitaire.js` | DataTable, filtres basiques, boutons actions |

### APIs Clés

#### DataService

```javascript
import dataService, { ENTITIES } from '../../../datastore/data-service.js';

// Query
const operations = await dataService.query(ENTITIES.OPERATION);
const operationsFiltered = await dataService.query(ENTITIES.OPERATION, { etat: 'EXECUTION' });

// Get
const operation = await dataService.get(ENTITIES.OPERATION, 'OP-2024-001');

// Add
const result = await dataService.add(ENTITIES.PROCEDURE, {
  operationId: 'OP-2024-001',
  commission: 'COJO',
  // ...
});

// Update
await dataService.update(ENTITIES.OPERATION, 'OP-2024-001', {
  modePassation: 'AOO',
  timeline: ['PLANIF', 'PROC']
});

// Remove
await dataService.remove(ENTITIES.AVENANT, 'AVE-001');

// Helpers
const fullData = await dataService.getOperationFull('OP-2024-001');
const budgetLine = await dataService.getBudgetLineForOperation('OP-2024-001');
const rulesResult = dataService.checkRules(operation, 'PROC', {});
const suggestedProcs = dataService.getSuggestedProcedures(operation);
```

#### Router

```javascript
import router from '../../../router.js';

// Navigate
router.navigate('/fiche-marche', { idOperation: 'OP-2024-001' });

// Register (dans modules/marche/index.js)
router.register('/my-route', renderMyScreen);

// Alias
router.alias('/old-route', '/new-route');
```

#### Logger

```javascript
import logger from '../../../lib/logger.js';

logger.info('[MyScreen] Action effectuée');
logger.warn('[MyScreen] Attention:', data);
logger.error('[MyScreen] Erreur:', error);
```

---

## 🐛 Débogage Courant

### Problème : "Module not found"

**Cause** : Mauvais chemin relatif dans import

**Solution** :
```javascript
// ❌ Mauvais
import { el } from './lib/dom.js'  // Trop court

// ✅ Bon
import { el } from '../../../lib/dom.js'  // Depuis screens/
```

### Problème : "Cannot read property 'addEventListener' of null"

**Cause** : Element pas encore dans le DOM

**Solution** :
```javascript
// ❌ Mauvais
const btn = el('button', {});
btn.addEventListener('click', handler);  // btn n'est pas monté

// ✅ Bon
function createButton(text, onClick) {
  const btn = el('button', {}, text);
  btn.addEventListener('click', onClick);  // Attaché avant mount
  return btn;
}
```

### Problème : Formulaire ne sauvegarde pas

**Cause** : Valeurs non récupérées depuis le DOM

**Solution** :
```javascript
// Dans handleSave()
const inputValue = document.getElementById('my-field')?.value;

if (!inputValue) {
  alert('Champ requis');
  return;
}

updateData.myField = inputValue;
```

### Problème : Timeline ne s'affiche pas

**Cause** : `renderSteps()` non appelé ou mal placé

**Solution** :
```javascript
// ✅ Toujours en premier élément du page array
const page = el('div', { className: 'page' }, [
  renderSteps(fullData, idOperation),  // ICI
  // ... reste
]);
```

---

## 💡 Astuces Pro

### 1. Réutiliser les Patterns Existants

Avant de coder un nouvel écran, ouvrir `ecr02a-procedure-pv.js` et copier la structure.

### 2. Tester au Fur et à Mesure

Ne pas coder tout l'écran d'un coup. Procéder par étapes :
1. Header + Timeline → tester
2. + Formulaire simple → tester
3. + Validation → tester
4. + Sauvegarde → tester

### 3. Utiliser les Logs

```javascript
logger.info('[MyScreen] État actuel:', { formData, operation });
```

Puis ouvrir Console F12 et chercher `[MyScreen]`.

### 4. Seed Data Temporaires

Pour tester un écran, ajouter des données dans `seed.json` :

```json
{
  "PROCEDURE": [
    {
      "id": "PROC-2024-002",
      "operationId": "OP-2024-002",
      "commission": "COJO",
      // ...
    }
  ]
}
```

Puis `localStorage.clear()` + reload.

### 5. Shortcuts Développement

```javascript
// Dans console F12 (pour debug rapide)

// Accéder au dataService
import('/js/datastore/data-service.js').then(m => window.ds = m.default)

// Lister opérations
ds.query('OPERATION').then(ops => console.table(ops))

// Voir une opération
ds.get('OPERATION', 'OP-2024-001').then(console.log)

// Modifier une opération
ds.update('OPERATION', 'OP-2024-001', { etat: 'CLOS' })

// Vider localStorage
localStorage.clear()
location.reload()
```

---

## ✅ Checklist Écran Terminé

Avant de soumettre votre écran :

### Fonctionnel
- [ ] L'écran s'affiche sans erreur console
- [ ] La timeline est présente et cliquable
- [ ] Les données s'affichent correctement (pré-remplissage si modification)
- [ ] La validation fonctionne (champs requis, formats)
- [ ] La sauvegarde met à jour dataService et timeline
- [ ] La navigation (Retour, Continuer) fonctionne
- [ ] Les règles métier sont appliquées (alertes, blocages)

### Technique
- [ ] Pas de `onclick` inline (utiliser `createButton()`)
- [ ] Imports corrects (chemins relatifs depuis `screens/`)
- [ ] Export `export async function renderMyScreen(params)`
- [ ] Route enregistrée dans `modules/marche/index.js`
- [ ] Logs avec `logger.info('[MonEcran] ...')`

### UX
- [ ] Responsive (tester fenêtre étroite)
- [ ] Messages d'erreur clairs
- [ ] Confirmations après actions (alert ou redirect)
- [ ] Pas de jargon technique dans les messages utilisateur

### Documentation
- [ ] Commentaires JSDoc au dessus de la fonction
- [ ] Code commenté si logique complexe
- [ ] Ajout de votre écran dans `docs/flux-budget-marche.md` (section "Écrans Implémentés")

---

## 🚀 Prêt à Coder !

**Votre objectif** : Choisir 1 écran dans la liste, le coder, le tester, le committer.

**Template à copier** : Voir section "Template Code" plus haut.

**Aide** : Consulter `ecr02a-procedure-pv.js` (le plus complet) ou `ecr04b-avenants.js` (pour KPIs et alertes).

**Questions** : Consulter `INTEGRATION_REPORT.md` ou `flux-budget-marche.md`.

---

**Bon courage ! 🎉**

L'infrastructure est solide, les widgets sont prêts, il ne reste qu'à assembler les briques.

---

**Version** : v1.0
**Date** : 2025-01-12
**Pour** : Développeurs SIDCF Portal
