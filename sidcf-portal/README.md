# SIDCF Portal - Système Intégré de la Dépense et du Contrôle Financier

> 📘 **Architecture des modules** (Marché, Marché+, Investissement, Matière) : voir [`../MODULES.md`](../MODULES.md) — comment masquer / renommer / ajouter un module, où vivent les données, recettes pratiques.

## 📋 Vue d'ensemble

SIDCF Portal est une application web vanilla (HTML + JavaScript ES modules + CSS) conçue pour la gestion des marchés publics, investissements et matières dans le cadre du contrôle financier en Côte d'Ivoire.

**Version :** 2.5.0
**Stack :** 100% Vanilla JS (ES modules) - Pas de framework
**Architecture :** Modulaire, extensible, paramétrée par JSON

## ✨ Fonctionnalités principales

### Module Marché (100% Complet)
- ✅ Gestion PPM (Plan de Passation des Marchés)
- ✅ Import Excel PPM
- ✅ Fiche marché complète avec timeline
- ✅ Gestion des procédures et PV
- ✅ Gestion des recours
- ✅ Attribution avec ANO (Avis de Non-Objection)
- ✅ Échéancier et clé de répartition multi-bailleurs
- ✅ Visa CF (Contrôle Financier)
- ✅ Exécution avec Ordres de Service
- ✅ Suivi des avenants avec alertes automatiques (seuils 25% / 30%)
- ✅ Gestion des garanties avec workflow mainlevée
- ✅ Clôture (PV provisoire/définitif)
- ✅ Dashboard CF avec KPIs et alertes

### Modules Investissement & Matière
- 🚧 Coquilles vides prêtes pour développement futur

### Administration
- ⚙️ Paramètres institution (nom, logo, type)
- 📚 Référentiels éditables
- ⚖️ Règles et procédures paramétrables
- 📄 Matrice des pièces obligatoires

### Diagnostics
- 🔍 Health check système
- 📊 Statistiques base de données
- 📝 Logs détaillés

## 🚀 Démarrage rapide

### Prérequis
- Un serveur HTTP statique (Python, Node.js, ou autre)
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

### Lancer l'application

```bash
# Option 1 : Python
cd sidcf-portal
python3 -m http.server 7001

# Option 2 : Node.js (http-server)
npx http-server sidcf-portal -p 7001

# Option 3 : PHP
cd sidcf-portal
php -S localhost:7001
```

Puis ouvrir : **http://localhost:7001**

L'application charge automatiquement `#/portal` par défaut.

## 📁 Structure du projet

```
sidcf-portal/
├── index.html                 # Point d'entrée
├── assets/
│   ├── logo.svg              # Logo DCF (remplaçable)
│   └── favicon.svg
├── css/
│   ├── variables.css         # Palette DCF, variables design
│   ├── base.css              # Reset, typographie
│   ├── layout.css            # Grid, sidebar, topbar
│   └── components.css        # Cards, buttons, tables, forms
├── js/
│   ├── main.js               # 🔥 Boot sequence
│   ├── router.js             # Hash router + aliases rétro-compat
│   ├── lib/
│   │   ├── dom.js            # el(), mount(), qs(), qsa()
│   │   ├── format.js         # money(), date(), percent()
│   │   ├── uid.js            # Générateurs d'ID lisibles
│   │   └── logger.js         # Console + debug panel
│   ├── config/
│   │   ├── app-config.json   # Toggles, thème, provider
│   │   ├── registries.json   # Référentiels CI (types, modes, etc.)
│   │   ├── rules-config.json # Seuils, règles réglementaires
│   │   └── pieces-matrice.json # Pièces obligatoires par phase
│   ├── datastore/
│   │   ├── data-service.js   # 🔥 Façade unifiée
│   │   ├── schema.js         # Entités (16 entités complètes)
│   │   ├── rules-engine.js   # Moteur de validation
│   │   ├── seed.json         # Données de démo réalistes
│   │   └── adapters/
│   │       ├── local-storage.js  # Provider localStorage (défaut)
│   │       └── airtable.js       # Provider Airtable (optionnel)
│   ├── ui/
│   │   ├── topbar.js
│   │   ├── sidebar.js        # ⚠️ Retourne contenu (pas <aside>)
│   │   └── widgets/
│   │       ├── kpis.js
│   │       ├── table.js
│   │       ├── form.js
│   │       ├── steps.js
│   │       ├── document-checklist.js
│   │       └── budget-line-viewer.js
│   ├── portal/
│   │   └── portal-home.js    # Sélection de module
│   ├── modules/
│   │   ├── marche/
│   │   │   ├── index.js      # Enregistrement routes + aliases
│   │   │   └── screens/      # 14 écrans (cycle complet)
│   │   ├── investissement/   # Placeholder
│   │   └── matiere/          # Placeholder
│   ├── admin/
│   │   ├── param-institution.js
│   │   ├── referentiels.js
│   │   ├── regles-procedures.js
│   │   └── matrice-pieces.js
│   └── diagnostics/
│       └── health.js
└── docs/
    ├── RAPPORT_FINAL_COMPLETION.md  # Rapport 100% completion
    ├── CHANGELOG.md
    ├── DEVELOPER_GUIDE.md
    ├── LIVRAISON_FINALE.md
    └── flux-budget-marche.md
```

## 🔄 Routage et Rétro-compatibilité

### Routes principales

| Route | Description |
|-------|-------------|
| `#/portal` | Portail d'accueil |
| `#/ppm-list` | Liste PPM & opérations |
| `#/ppm-import` | Import Excel PPM |
| `#/fiche-marche?idOperation=...` | Détail marché |
| `#/procedure?idOperation=...` | Procédure & PV |
| `#/recours?idOperation=...` | Gestion des recours |
| `#/attribution?idOperation=...` | Attribution |
| `#/echeancier?idOperation=...` | Échéancier & clé bailleurs |
| `#/visa-cf?idOperation=...` | Visa CF |
| `#/execution?idOperation=...` | Exécution OS |
| `#/avenants?idOperation=...` | Gestion avenants |
| `#/garanties?idOperation=...` | Garanties & mainlevée |
| `#/cloture?idOperation=...` | Clôture & réceptions |
| `#/dashboard-cf` | Dashboard CF |
| `#/admin/institution` | Config institution |
| `#/diagnostics/health` | État système |

### Aliases (rétro-compatibles)

Les anciennes routes ne cassent **jamais** :

```javascript
/ecr01a-import-ppm → /ppm-import
/ecr01b-ppm-unitaire → /ppm-list
/ecr01c-fiche-marche → /fiche-marche
/ecr02a-procedure-pv → /procedure
/ecr02b-recours → /recours
/ecr03a-attribution → /attribution
/ecr03b-echeancier-cle → /echeancier
/ecr04a-visa-cf → /visa-cf
/ecr04a-execution-os → /execution
/ecr04b-avenants → /avenants
/ecr04c-garanties-resiliation → /garanties
/ecr05-cloture-receptions → /cloture
/ecr06-dashboard-cf → /dashboard-cf
```

## 💾 Persistance des données

### LocalStorage (par défaut)

- Clé : `sidcf:db:v1`
- Sérialisation JSON
- Seed automatique si vide

### Airtable (optionnel)

Modifier `js/config/app-config.json` :

```json
{
  "dataProvider": "airtable",
  "airtable": {
    "enabled": true,
    "apiKey": "keyXXXXXXXXXXXXXX",
    "baseId": "appXXXXXXXXXXXXXX",
    "tables": {
      "OPERATION": "tblOperations",
      "AVENANT": "tblAvenants",
      ...
    }
  }
}
```

**Mapping 1:1** : Les champs Airtable doivent correspondre aux schémas dans `datastore/schema.js`.

Si la connexion échoue, l'app bascule automatiquement sur localStorage avec un warning.

## ⚖️ Règles réglementaires

### Configurables via `rules-config.json`

```json
{
  "seuils": {
    "SEUIL_CUMUL_AVENANTS": { "value": 30 },        // % max (BLOCANT)
    "SEUIL_ALERTE_AVENANTS": { "value": 25 },       // % alerte (WARN)
    "TAUX_MAX_AVANCE": { "value": 15 },             // % avance (BLOCANT)
    "DELAI_MAX_OS_APRES_VISA": { "value": 30 }      // jours (WARN)
  },
  "ano": {
    "modes_requierant_ano": ["AOO", "AON"],
    "bailleurs_requierant_ano": ["BM", "BAD", "UE", "AFD", "BEI", "BADEA"],
    "seuils_montant": {
      "TRAVAUX": { "value": 100000000 },
      "FOURNITURES": { "value": 50000000 },
      "SERVICES": { "value": 30000000 }
    }
  },
  "garanties": {
    "garantie_avance": { "taux_min": 10, "taux_max": 15 },
    "garantie_bonne_execution": { "taux_min": 5, "taux_max": 10 },
    "retenue_garantie": { "taux": 10 }
  }
}
```

### Matrices de procédures

Par type d'institution (ADMIN_CENTRALE, SOCIETE_ETAT, PROJET) :

- Montant → Mode de passation (PSC / PSD / AOO / PSO)
- Contrôle automatique avec proposition + alerte si dérogation

### Pièces obligatoires

Matrice dynamique dans `pieces-matrice.json` :
- 7 phases (INVITATION, OUVERTURE, ANALYSE, JUGEMENT, APPROBATION, EXECUTION, CLOTURE)
- 44 types de documents
- Mapping par mode de passation

## 🎨 Design System

### Palette DCF

```css
--color-primary: #0f5132       /* Vert DCF */
--color-primary-light: #146c43
--color-accent: #f59e0b        /* Orange */
--radius-lg: 12px              /* Border radius */
```

### Composants

- **Cards** : `.card`, `.card-header`, `.card-body`
- **Buttons** : `.btn-primary`, `.btn-secondary`, `.btn-accent`
- **Badges** : `.badge-success`, `.badge-warning`, `.badge-error`
- **Alerts** : `.alert-info`, `.alert-warning`, `.alert-error`
- **Tables** : `.table`, `.table-container`
- **Forms** : `.form-grid`, `.form-field`, `.form-actions`
- **KPIs** : `.kpi-grid`, `.kpi-card`

## 🧪 Tests et Diagnostics

### Health Check

Accéder à `#/diagnostics/health` pour :
- ✅ Vérifier conteneurs DOM
- ✅ CSS chargé
- ✅ DataService initialisé
- ✅ Statistiques base de données
- ✅ Routes actives

### Debug Panel

En cas d'erreur au boot, un panneau `#debugBoot` s'affiche automatiquement avec :
- Cause racine
- Stack trace
- Actions recommandées

### Console logs

Tous les logs sont stockés en mémoire et accessibles via :

```javascript
import logger from './js/lib/logger.js';
logger.getLogs();
logger.export(); // JSON export
```

## 📦 Ajouter un nouveau module

Exemple : Module "Ressources Humaines"

1. Créer `js/modules/rh/index.js` :

```javascript
import router from '../../router.js';
import { mount } from '../../lib/dom.js';

function renderRHHome() {
  mount('#app', '<div class="page">Module RH</div>');
}

export function registerRHRoutes() {
  router.register('/rh/home', renderRHHome);
}
```

2. Enregistrer dans `js/main.js` :

```javascript
import { registerRHRoutes } from './modules/rh/index.js';
// ...
registerRHRoutes();
```

3. Activer dans `config/app-config.json` :

```json
{
  "features": {
    "moduleRH": true
  }
}
```

4. Ajouter la carte dans `portal/portal-home.js`

## 🔧 Extension Airtable

### Structure des tables

Créer dans Airtable :

- **PPM_PLAN** : id, unite, exercice, source, fichier, auteur, createdAt
- **OPERATION** : id, planId, objet, typeMarche, montantPrevisionnel, etat, ...
- **AVENANT** : id, operationId, numero, type, variationMontant, cumulPourcent, ...
- **GARANTIE** : id, operationId, type, montant, taux, dateEmission, etat, ...
- **ANO** : id, operationId, type, organisme, decision, workflow dates
- **GROUPEMENT** : id, libelle, nature, mandataireId, membres[]
- **RECOURS** : id, operationId, type, dateDepot, decision
- **CLOTURE** : id, operationId, receptionProv, receptionDef, mainlevees

### Mapping

Les noms de champs Airtable doivent correspondre **exactement** aux propriétés du schéma.

Pour objets imbriqués : flatten automatique par l'adapter (`chaineBudgetaire.section` → `chaineBudgetaire_section`).

## 🚨 Points d'attention

### ⚠️ Règles d'or

1. **Ne jamais supprimer de routes legacy** → Utiliser des aliases
2. **Ne jamais supprimer de fichiers** → Déprécier via feature flags
3. **Index propre** : `index.html` charge `#/portal` sans paramètres
4. **Points de montage fixes** : `<aside id="sidebar">` et `<main id="app">`
5. **sidebar.js retourne du contenu** (pas de `<aside>` wrapper)

### 🔒 Sécurité

- **Pas de secrets dans le code** : `.env` pour Airtable
- **Validation côté client** : Rules engine actif
- **Sanitization** : Tous les inputs utilisent `textContent` ou validation stricte

### 📱 Responsive

- Grille fluide automatique
- Sidebar collapse sur mobile (<1024px)
- Tables scrollables horizontalement

## 📊 Parcours de démo (5 minutes)

1. **Portail** → Cliquer "Module Marché"
2. **PPM List** → Voir les opérations
3. **Fiche marché** → Timeline complète
4. **Dashboard CF** → KPIs et alertes
5. **Diagnostics** → Health check (tout vert)

## 🛠️ Développement

### Ajouter une règle

1. Éditer `rules-config.json`
2. Implémenter dans `datastore/rules-engine.js`
3. Afficher les messages dans les écrans

### Ajouter un référentiel

1. Éditer `registries.json`
2. Utiliser dans les selects : `dataService.getRegistry('NOM')`

### Ajouter une pièce obligatoire

1. Éditer `pieces-matrice.json`
2. Le moteur de règles vérifie automatiquement

## 🐛 Dépannage

### Écran blanc

1. Ouvrir la console (F12)
2. Vérifier les erreurs de chargement
3. Accéder à `#/diagnostics/health`
4. Recharger avec Ctrl+F5 (cache)

### Seed non chargé

```javascript
// Console
localStorage.removeItem('sidcf:db:v1');
location.reload();
```

### CSS manquants

Vérifier les chemins dans `index.html` :
```html
<link rel="stylesheet" href="css/variables.css">
```

## 📝 Licence

Propriété de la Direction du Contrôle Financier - Côte d'Ivoire

---

**Développé avec ❤️ en Vanilla JS**
*Aucune dépendance externe - Performance optimale*

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
