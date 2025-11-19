# Architecture Complète du Projet SIDCF Portal - Guide de Conception de Dashboard

## 1. STRUCTURE GLOBALE DU PROJET

### Arborescence Principal
```
sidcf-portal/
├── js/                          # Code JavaScript modulaire
│   ├── main.js                 # Point d'entrée principal (boot sequence)
│   ├── router.js               # Système de routage hash-based
│   ├── config/                 # Fichiers de configuration
│   ├── datastore/              # Couche données
│   ├── lib/                    # Utilitaires
│   ├── ui/                     # Composants UI réutilisables
│   ├── portal/                 # Portail d'accueil
│   ├── admin/                  # Écrans d'administration
│   ├── modules/                # Modules métier
│   └── diagnostics/            # Outils de diagnostic
├── css/                        # Styles CSS modulaires
├── config/                     # Configuration statique
├── assets/                     # Images et ressources
└── *.html                      # Fichiers HTML principaux
```

---

## 2. ÉCRANS EXISTANTS (SCREENS)

### 2.1 Écrans du Module Marché
Localisation: `/js/modules/marche/screens/`

| Code | Fichier | Description |
|------|---------|-------------|
| ECR01A | `ecr01a-import-ppm.js` | Import PPM depuis fichiers |
| ECR01B | `ecr01b-ppm-unitaire.js` | Liste des PPM/Opérations avec filtres |
| ECR01C | `ecr01c-fiche-marche.js` | Détail d'une opération |
| ECR01D | `ecr01d-ppm-create-line.js` | Création manuelle de ligne PPM |
| ECR02A | `ecr02a-procedure-pv.js` | Gestion procédures de passation |
| ECR02B | `ecr02b-recours.js` | Gestion des recours |
| ECR03A | `ecr03a-attribution.js` | Résultats d'attribution |
| ECR03B | `ecr03b-echeancier-cle.js` | Échéancier et clés de répartition |
| ECR03C | `ecr03c-visa-cf.js` | Visa du Contrôle Financier |
| ECR04A | `ecr04a-execution-os.js` | Exécution des Ordres de Service |
| ECR04B | `ecr04b-avenants.js` | Gestion des avenants |
| ECR04C | `ecr04c-garanties.js` | Gestion des garanties |
| ECR05 | `ecr05-cloture.js` | Clôture des marchés |
| **ECR06** | **`ecr06-dashboard-cf.js`** | **Dashboard Contrôle Financier (existant)** |

### 2.2 Exemple de Dashboard Existant (ECR06)

**Localisation:** `/Volumes/DATA/DEVS/SIDCF/sidcf-portal/js/modules/marche/screens/ecr06-dashboard-cf.js`

**Structure:**
```javascript
- KPI Cards Grid (6 indicateurs)
  - Total Marchés
  - En cours
  - Dérogations
  - ANO en attente
  - Avenants >25%
  - Délais OS
- Répartition par État (badges colorés)
- Alertes Critiques (bloc d'alertes)
- Dernières Opérations (tableau)
```

**Fonctionnalités:**
- Calcul dynamique de KPIs basés sur règles
- Filtrages et alertes intelligentes
- Navigation intégrée
- Affichage formaté (dates, montants)

---

## 3. WIDGETS DISPONIBLES

Localisation: `/js/ui/widgets/`

### 3.1 Liste des Widgets

| Widget | Fichier | Utilité |
|--------|---------|---------|
| **KPI Card** | `kpis.js` | Affichage de métriques clés avec couleurs |
| **Table** | `table.js` | Tableau données avec colonnes personnalisables |
| **Form** | `form.js` | Champs formulaire (text, select, textarea) |
| **Steps** | `steps.js` | Timeline/étapes du processus |
| **Drawer** | `drawer.js` | Panneau coulissant pour détails |
| **Budget Line Viewer** | `budget-line-viewer.js` | Affichage lignes budgétaires |
| **Document Checklist** | `document-checklist.js` | Liste documents requis |
| **Livrable Manager** | `livrable-manager.js` | Gestion des livrables |
| **Echeancier Manager** | `echeancier-manager.js` | Gestion calendrier exécution |
| **Cle Repartition Manager** | `cle-repartition-manager.js` | Gestion clés de répartition |

### 3.2 Exemple de Widget: KPI Cards

```javascript
import { kpiCard, kpiGrid } from '../../ui/widgets/kpis.js';

// Utilisation
const kpiGrid = kpiGrid([
  { label: 'Total', value: 100, options: { format: 'money', color: 'primary' } },
  { label: 'Alerte', value: -5, options: { change: -15, color: 'warning' } }
]);
```

### 3.3 Exemple de Widget: Table

```javascript
import { dataTable } from '../../ui/widgets/table.js';

const table = dataTable(
  [
    { key: 'objet', label: 'Objet' },
    { key: 'montant', label: 'Montant', render: (val) => money(val) }
  ],
  operations,
  {
    onRowClick: (row) => router.navigate('/fiche-marche', { idOperation: row.id }),
    actions: [
      { label: 'Voir', onClick: (row) => handleView(row) }
    ]
  }
);
```

---

## 4. ENTITÉS ET MODÈLES DE DONNÉES

Localisation: `/js/datastore/schema.js`

### 4.1 Entités Disponibles

```javascript
export const ENTITIES = {
  PPM_PLAN: 'PPM_PLAN',
  OPERATION: 'OPERATION',           // Cœur du domaine
  BUDGET_LINE: 'BUDGET_LINE',
  LIVRABLE: 'LIVRABLE',
  PROCEDURE: 'PROCEDURE',
  RECOURS: 'RECOURS',
  ATTRIBUTION: 'ATTRIBUTION',
  ECHEANCIER: 'ECHEANCIER',
  CLE_REPARTITION: 'CLE_REPARTITION',
  VISA_CF: 'VISA_CF',
  ORDRE_SERVICE: 'ORDRE_SERVICE',
  AVENANT: 'AVENANT',
  RESILIATION: 'RESILIATION',
  GARANTIE: 'GARANTIE',
  CLOTURE: 'CLOTURE',
  ENTREPRISE: 'ENTREPRISE',
  GROUPEMENT: 'GROUPEMENT',
  ANO: 'ANO',
  DOCUMENT: 'DOCUMENT'
};
```

### 4.2 Schéma OPERATION (Principal)

```javascript
{
  id: string,
  planId: string,
  budgetLineId: string,
  
  // Identification
  unite: string,
  exercice: number,
  objet: string,
  
  // Classification
  typeMarche: string,        // FOURNITURES, SERVICES, TRAVAUX
  modePassation: string,     // PSC, PSD, AOO, PSO
  categorieProcedure: string,
  naturePrix: string,
  revue: string,
  
  // Financier
  montantPrevisionnel: number,
  montantActuel: number,
  devise: string,            // XOF
  typeFinancement: string,   // Trésor, Emprunt, Don
  sourceFinancement: string, // BADEA, BM, AFD
  
  // Technique
  dureePrevisionnelle: number,
  delaiExecution: number,
  categoriePrestation: string, // INFRASTRUCTURE, SERVICE, EQUIPEMENT...
  beneficiaire: string,
  livrables: array,
  
  // Chaîne budgétaire
  chaineBudgetaire: {
    section: string,
    programme: string,
    activite: string,
    activiteCode: string,
    nature: string,
    ligneBudgetaire: string,
    bailleur: string
  },
  
  // Localisation
  localisation: {
    region: string,
    regionCode: string,
    departement: string,
    departementCode: string,
    sousPrefecture: string,
    sousPrefectureCode: string,
    localite: string,
    longitude: number,
    latitude: number,
    coordsOK: boolean
  },
  
  // État et chronologie
  etat: string,              // PLANIFIE, EN_PROC, EN_ATTR, VISE, EN_EXEC, CLOS, REFUSE
  timeline: array,
  dateCF: date,
  
  // Conformité règlementaire
  procDerogation: {
    isDerogation: boolean,
    justification: string
  }
}
```

---

## 5. FICHIERS DE CONFIGURATION JSON

Localisation: `/js/config/` et `/config/`

### 5.1 app-config.json
```json
{
  "version": "1.0.0",
  "appName": "SIDCF Portal",
  "defaultLanguage": "fr",
  "dataProvider": "localStorage",  // ou "airtable"
  "features": {
    "moduleMarche": true,
    "moduleInvestissement": false,
    "moduleMatiere": false,
    "adminAccess": true,
    "diagnostics": true
  },
  "institution": {
    "name": "Direction du Contrôle Financier",
    "type": "ADMIN_CENTRALE",
    "logo": "assets/logo.svg",
    "country": "CI"
  },
  "theme": {
    "mode": "light",
    "primaryColor": "#0f5132",
    "accentColor": "#f59e0b"
  }
}
```

### 5.2 rules-config.json
Définit les seuils réglementaires:
- SEUIL_CUMUL_AVENANTS: 30%
- SEUIL_ALERTE_AVENANTS: 25%
- TAUX_MAX_AVANCE: 15%
- DELAI_MAX_OS_APRES_VISA: 30 jours
- DELAI_MAINLEVEE_GARANTIE: 365 jours

Contient aussi les **matrices de procédures** par type d'institution (ADMIN_CENTRALE, SOCIETE_ETAT, etc.)

### 5.3 pieces-matrice.json
Matrice des pièces justificatives requises par type de marché et montant

### 5.4 registries.json
Énumérations/listes de référence:
- ETAT_MARCHE
- TYPE_MARCHE
- MODE_PASSATION
- CATEGORIE_PROCEDURE
- TYPE_FINANCEMENT
- REGIONS (liste complète Côte d'Ivoire)
- etc.

---

## 6. STRUCTURE DU ROUTER ET NAVIGATION

Localisation: `/js/router.js`

### 6.1 Architecture du Router

```javascript
class Router {
  constructor() {
    this.routes = new Map();        // Stockage des routes
    this.aliases = new Map();       // Rétro-compatibilité
    this.currentRoute = null;
    this.defaultRoute = '/portal';  // Page d'accueil
  }

  register(path, handler)          // Enregistrer une route
  alias(oldPath, newPath)          // Créer un alias
  navigate(path, params = {})      // Naviguer
  handleRoute()                    // Traiter changement hash
  updateActiveNav(path)            // Mettre à jour menu actif
}
```

### 6.2 Format des Routes

Les routes utilisent le **hash-based routing** (`#path?param=value`):

```
#/ppm-list                              // Liste PPM
#/fiche-marche?idOperation=123          // Détail opération
#/dashboard-cf                          // Dashboard
#/admin/institution                     // Paramétrages
```

### 6.3 Routes Enregistrées

Voir `registerMarcheRoutes()` dans `/js/modules/marche/index.js`:

```javascript
// PPM & Planning
/ppm-list
/ppm-import
/ppm-create-line

// Fiche marché
/fiche-marche

// Procedure
/procedure
/recours

// Attribution
/attribution
/visa-cf
/echeancier

// Execution
/execution
/avenants
/garanties

// Cloture
/cloture

// Dashboard
/dashboard-cf

// Admin
/admin/institution
/admin/referentiels
/admin/regles
/admin/pieces

// Diagnostics
/diagnostics/health
```

---

## 7. SERVICES ET ADAPTERS DE DONNÉES

### 7.1 DataService (Couche Métier)

Localisation: `/js/datastore/data-service.js`

**Responsabilités:**
- Initialisation et gestion des configurations
- Opérations CRUD sur les entités
- Validation des données
- Exécution des règles métier
- Gestion du cache et des seeds

**Méthodes Principales:**
```javascript
async init()                              // Initialisation
getConfig()                               // Récupérer config
getRegistry(name)                         // Récupérer énumération
getAllRegistries()                        // Tous les référentiels
async query(entityType, filter?)          // Requête
async get(entityType, id)                 // Récupérer 1 entité
async add(entityType, data)               // Créer
async update(entityType, id, patch)       // Modifier
async getAll(entityType)                  // Récupérer toutes
checkRules(operation, state, context)     // Vérifier conformité
getRulesConfig()                          // Config des règles
```

### 7.2 Adapters (Stockage)

Localisation: `/js/datastore/adapters/`

#### LocalStorageAdapter
- Stockage navigateur (localStorage)
- Adapter par défaut
- Auto-sauvegarde
- Pas de synchronisation serveur

#### AirtableAdapter
- Synchronisation avec base Airtable
- Fallback sur localStorage en cas d'erreur
- Configuré dans `app-config.json`

### 7.3 RulesEngine

Localisation: `/js/datastore/rules-engine.js`

**Fonctionnalités:**
- Validation règles réglementaires
- Détermination procédure optimale
- Génération alertes/warnings
- Calcul seuils conformité

---

## 8. UTILITAIRES (LIB)

Localisation: `/js/lib/`

### 8.1 dom.js - Manipulation DOM

```javascript
el(tag, attrs, children)      // Créer élément DOM
mount(container, content)     // Monter contenu
html(htmlString)              // Parser HTML
qs(selector)                  // querySelector
qsa(selector)                 // querySelectorAll
addClass/removeClass/toggleClass(el, class)
setAttrs(el, attrs)           // Set multiple attributes
remove(el)                    // Supprimer élément
clear(el)                     // Vider enfants
```

### 8.2 format.js - Formatage

```javascript
money(value)        // Formatage montants (XOF)
percent(value)      // Formatage pourcentages
date(value)         // Formatage dates
```

### 8.3 logger.js - Logging

```javascript
logger.info(msg)
logger.warn(msg)
logger.error(msg)
logger.debug(msg)
```

### 8.4 uid.js - ID Unique

```javascript
generateUID()       // Génération UUID/ID
```

---

## 9. STRUCTURE CSS

Localisation: `/css/`

### 9.1 base.css
- Reset CSS
- Typographie
- Couleurs globales
- Espacements

### 9.2 variables.css
```css
--color-primary: #0f5132
--color-success: #198754
--color-warning: #ffc107
--color-error: #dc3545
--color-info: #0dcaf0
--color-gray-500: #6c757d

--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

### 9.3 layout.css
- Layout principal (topbar, sidebar, main)
- Responsive design
- Grid et flexbox

### 9.4 components.css
- `.card` - Conteneur
- `.page` - Page wrapper
- `.page-header` - En-tête page
- `.page-title` - Titre
- `.page-subtitle` - Sous-titre
- `.btn`, `.btn-primary`, `.btn-secondary` - Boutons
- `.alert`, `.alert-info`, `.alert-warning`, `.alert-error` - Alertes
- `.badge`, `.badge-success` - Badges
- `.form-field`, `.form-input`, `.form-label` - Formulaires
- `.kpi-card`, `.kpi-grid` - KPIs
- `.table`, `.table-container` - Tableaux
- `.nav-item`, `.nav-item-icon` - Navigation
- `.module-card` - Cartes modules

---

## 10. FLUX DE DÉMARRAGE (BOOT SEQUENCE)

### 10.1 main.js - Séquence

1. **DOMContentLoaded** - Attendre chargement DOM
2. **DataService.init()** - Initialiser données
3. **mountTopbar()** - Afficher entête
4. **mountSidebar()** - Afficher navigation
5. **registerMarcheRoutes()** - Enregistrer routes
6. **router.start()** - Démarrer routeur
7. **handleRoute()** - Afficher écran initial

### 10.2 Navigation

```javascript
// Depuis un écran
router.navigate('/fiche-marche', { idOperation: '123' })

// Depuis un lien HTML
<a href="#/ppm-list">PPM</a>

// Dans un composant
import router from '../../router.js';
```

---

## 11. PATTERNS DE DÉVELOPPEMENT

### 11.1 Créer un Écran (Screen)

```javascript
// /js/modules/marche/screens/ecr-xxx.js

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService from '../../../datastore/data-service.js';

export async function renderEcranXXX(params) {
  const { param1 } = params;
  
  // Charger les données
  const data = await dataService.query(ENTITIES.OPERATION);
  
  // Construire l'interface
  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Mon Titre'),
      el('p', { className: 'page-subtitle' }, 'Description')
    ]),
    
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('p', {}, 'Contenu')
      ])
    ])
  ]);
  
  // Afficher
  mount('#app', page);
}

export default renderEcranXXX;
```

### 11.2 Créer un Widget

```javascript
// /js/ui/widgets/mon-widget.js

import { el } from '../../lib/dom.js';

export function monWidget(config) {
  const { label, value, options = {} } = config;
  
  return el('div', { className: 'mon-widget' }, [
    el('div', { className: 'label' }, label),
    el('div', { className: 'value' }, value)
  ]);
}

export default { monWidget };
```

### 11.3 Accéder aux Données

```javascript
import dataService, { ENTITIES } from '../../datastore/data-service.js';

// Récupérer toutes les opérations
const operations = await dataService.query(ENTITIES.OPERATION);

// Récupérer une seule opération
const op = await dataService.get(ENTITIES.OPERATION, 'id-123');

// Ajouter une opération
const result = await dataService.add(ENTITIES.OPERATION, {
  unite: 'MinFinances',
  objet: 'Construction route',
  montantPrevisionnel: 1000000000
});

// Mettre à jour
await dataService.update(ENTITIES.OPERATION, 'id-123', {
  etat: 'EN_EXEC'
});

// Vérifier les règles
const rules = dataService.checkRules(operation, 'EN_ATTR', {
  avenants: [...],
  garanties: [...]
});
```

---

## 12. ARCHITECTURE POUR UN NOUVEAU DASHBOARD

### 12.1 Structure Recommandée

```javascript
// File: /js/modules/marche/screens/ecr-dashboard-nouveau.js

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { kpiGrid } from '../../../ui/widgets/kpis.js';
import { dataTable } from '../../../ui/widgets/table.js';

export async function renderDashboardNouveau(params) {
  // 1. CHARGER LES DONNÉES
  const operations = await dataService.getAll(ENTITIES.OPERATION);
  const avenants = await dataService.getAll(ENTITIES.AVENANT);
  const garanties = await dataService.getAll(ENTITIES.GARANTIE);
  const registries = dataService.getAllRegistries();
  
  // 2. CALCULER LES KPIs
  const kpis = calculateDashboardKPIs(operations, avenants, garanties);
  
  // 3. PRÉPARER LES SECTIONS
  const headerSection = renderHeader(kpis);
  const kpiSection = renderKPISection(kpis);
  const alertsSection = renderAlertsSection(operations);
  const tableSection = renderTableSection(operations);
  
  // 4. ASSEMBLER LA PAGE
  const page = el('div', { className: 'page' }, [
    headerSection,
    kpiSection,
    alertsSection,
    tableSection
  ]);
  
  // 5. AFFICHER
  mount('#app', page);
  
  // 6. AJOUTER LES EVENT LISTENERS
  attachEventListeners();
}

// Fonctions utilitaires
function calculateDashboardKPIs(operations, avenants, garanties) {
  return {
    totalOperations: operations.length,
    enCours: operations.filter(o => o.etat === 'EN_EXEC').length,
    // ... autres KPIs
  };
}

function renderHeader(kpis) {
  // Retourner élément header
}

function renderKPISection(kpis) {
  // Retourner section KPIs
}

function renderAlertsSection(operations) {
  // Retourner section alertes
}

function renderTableSection(operations) {
  // Retourner section tableau
}

function attachEventListeners() {
  // Ajouter événements interactifs
}

export default renderDashboardNouveau;
```

### 12.2 Enregistrement de la Route

```javascript
// Dans /js/modules/marche/index.js, fonction registerMarcheRoutes()

import renderDashboardNouveau from './screens/ecr-dashboard-nouveau.js';

router.register('/dashboard-nouveau', renderDashboardNouveau);
router.alias('/ecr-dashboard-nouveau', '/dashboard-nouveau');

// Ajouter dans sidebar.js
el('a', { href: '#/dashboard-nouveau', className: 'nav-item' }, [
  el('span', { className: 'nav-item-icon' }, '📊'),
  el('span', {}, 'Nouveau Dashboard')
])
```

---

## 13. EXEMPLE COMPLET: CRÉER UN DASHBOARD "SYNTHÈSE FINANCIÈRE"

### 13.1 Fichier: ecr-dashboard-synthese.js

```javascript
import { el, mount } from '../../../lib/dom.js';
import { money } from '../../../lib/format.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';

export async function renderDashboardSynthese(params) {
  const operations = await dataService.getAll(ENTITIES.OPERATION);
  const rulesConfig = dataService.getRulesConfig();
  
  // KPIs Financiers
  const kpis = {
    totalPrevu: operations.reduce((s, o) => s + o.montantPrevisionnel, 0),
    totalActuel: operations.reduce((s, o) => s + o.montantActuel, 0),
    totalEngages: operations.filter(o => o.etat === 'EN_EXEC').length,
    totalClotured: operations.filter(o => o.etat === 'CLOS').length
  };
  
  const page = el('div', { className: 'page' }, [
    // En-tête
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, '💰 Synthèse Financière'),
      el('p', { className: 'page-subtitle' }, 'Vue d\'ensemble des engagements')
    ]),
    
    // KPIs Grid
    el('div', { style: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '16px', 
      marginBottom: '24px' 
    }}, [
      createKPICard('Montant Prévu', money(kpis.totalPrevu), 'primary'),
      createKPICard('Montant Actuel', money(kpis.totalActuel), 'success'),
      createKPICard('Marchés en Exécution', kpis.totalEngages, 'info'),
      createKPICard('Marchés Clôturés', kpis.totalClotured, 'gray')
    ]),
    
    // Répartition par source de financement
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Répartition par Source')
      ]),
      el('div', { className: 'card-body' }, [
        renderFinancingBreakdown(operations)
      ])
    ]),
    
    // Contrôle budgétaire
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Contrôle Budgétaire')
      ]),
      el('div', { className: 'card-body' }, [
        renderBudgetControl(operations)
      ])
    ])
  ]);
  
  mount('#app', page);
}

function createKPICard(label, value, color) {
  return el('div', {
    className: 'card',
    style: {
      borderLeftColor: `var(--color-${color})`,
      borderLeftWidth: '4px',
      padding: '20px'
    }
  }, [
    el('div', { style: { color: 'var(--color-gray-600)', marginBottom: '8px' } }, label),
    el('div', { style: { fontSize: '28px', fontWeight: 'bold' } }, value)
  ]);
}

function renderFinancingBreakdown(operations) {
  const bySource = {};
  operations.forEach(op => {
    const source = op.sourceFinancement || 'Non spécifiée';
    bySource[source] = (bySource[source] || 0) + op.montantPrevisionnel;
  });
  
  return el('div', { style: { display: 'grid', gap: '8px' } }, 
    Object.entries(bySource).map(([source, amount]) => 
      el('div', { style: { 
        display: 'flex', 
        justifyContent: 'space-between',
        padding: '12px',
        backgroundColor: 'var(--color-gray-100)',
        borderRadius: '4px'
      }}, [
        el('span', {}, source),
        el('span', { style: { fontWeight: 'bold' } }, money(amount))
      ])
    )
  );
}

function renderBudgetControl(operations) {
  const sections = {};
  operations.forEach(op => {
    const section = op.chaineBudgetaire?.section || 'N/A';
    if (!sections[section]) sections[section] = { previsionnel: 0, actuel: 0, count: 0 };
    sections[section].previsionnel += op.montantPrevisionnel;
    sections[section].actuel += op.montantActuel;
    sections[section].count++;
  });
  
  return el('table', { className: 'table' }, [
    el('thead', {}, [
      el('tr', {}, [
        el('th', {}, 'Section'),
        el('th', {}, 'Montant Prévu'),
        el('th', {}, 'Montant Actuel'),
        el('th', {}, 'Variance')
      ])
    ]),
    el('tbody', {}, 
      Object.entries(sections).map(([section, data]) => {
        const variance = ((data.actuel - data.previsionnel) / data.previsionnel * 100).toFixed(1);
        return el('tr', {}, [
          el('td', {}, section),
          el('td', {}, money(data.previsionnel)),
          el('td', {}, money(data.actuel)),
          el('td', { style: { color: variance > 0 ? 'var(--color-error)' : 'var(--color-success)' } }, 
            `${variance}%`)
        ]);
      })
    )
  ]);
}

export default renderDashboardSynthese;
```

---

## 14. CHECKLIST POUR CRÉER UN NOUVEAU DASHBOARD

- [ ] Créer fichier screen dans `/js/modules/marche/screens/ecr-xxx.js`
- [ ] Importer utilitaires: `el`, `mount`, `router`, `dataService`
- [ ] Charger données via `dataService.getAll()` ou `query()`
- [ ] Calculer KPIs/métriques
- [ ] Construire interface avec `el()` (jamais innerHTML direct)
- [ ] Assembler page et appeler `mount('#app', page)`
- [ ] Enregistrer route dans `registerMarcheRoutes()` dans `/js/modules/marche/index.js`
- [ ] Ajouter lien navigation dans `/js/ui/sidebar.js`
- [ ] Tester navigation et affichage
- [ ] Vérifier responsive design
- [ ] Ajouter formatages (money, percent, date)
- [ ] Implémenter filtres/interactions si nécessaire

---

## 15. RESSOURCES CLÉS

**Fichiers critiques à comprendre:**
1. `/js/main.js` - Boot sequence
2. `/js/router.js` - Système navigation
3. `/js/datastore/data-service.js` - Accès données
4. `/js/datastore/schema.js` - Structure entités
5. `/js/ui/widgets/*.js` - Composants réutilisables
6. `/js/lib/dom.js` - Utilitaires DOM

**Configuration:**
1. `/js/config/app-config.json` - Config app
2. `/js/config/rules-config.json` - Règles métier
3. `/js/config/registries.json` - Énumérations
4. `/css/variables.css` - Thème couleurs

**Modules existants:**
- `/js/modules/marche/screens/` - Exemples écrans
- `/js/ui/widgets/` - Widgets réutilisables

