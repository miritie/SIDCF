# SIDCF Portal - Système Intégré de la Dépense et du Contrôle Financier

## 📋 Vue d'ensemble

SIDCF Portal est une application web vanilla (HTML + JavaScript ES modules + CSS) conçue pour la gestion des marchés publics, investissements et matières dans le cadre du contrôle financier en Côte d'Ivoire.

**Version :** 1.0.0 MVP
**Stack :** 100% Vanilla JS (ES modules) - Pas de framework
**Architecture :** Modulaire, extensible, paramétrée par JSON

## ✨ Fonctionnalités principales

### Module Marché (Actif)
- ✅ Gestion PPM (Plan de Passation des Marchés)
- ✅ Import Excel PPM
- ✅ Fiche marché complète
- ✅ Suivi des avenants avec alertes automatiques (seuils 25% / 30%)
- ✅ Gestion des procédures et PV
- ✅ Attribution et contrôle CF
- ✅ Dashboard consolidé

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
│   │   ├── schema.js         # Entités (OPERATION, AVENANT, etc.)
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
│   │       └── form.js
│   ├── portal/
│   │   └── portal-home.js    # Sélection de module
│   ├── modules/
│   │   ├── marche/
│   │   │   ├── index.js      # Enregistrement routes + aliases
│   │   │   └── screens/      # 12 écrans (PPM, procédure, etc.)
│   │   ├── investissement/   # Placeholder
│   │   └── matiere/          # Placeholder
│   ├── admin/
│   │   ├── param-institution.js
│   │   ├── referentiels.js
│   │   ├── regles-procedures.js
│   │   └── matrice-pieces.js
│   └── diagnostics/
│       └── health.js
└── README.md
```

## 🔄 Routage et Rétro-compatibilité

### Routes principales

| Route | Description |
|-------|-------------|
| `#/portal` | Portail d'accueil |
| `#/ppm-list` | Liste PPM & opérations |
| `#/ppm-import` | Import Excel PPM |
| `#/fiche-marche?idOperation=...` | Détail marché |
| `#/avenants?idOperation=...` | Gestion avenants |
| `#/dashboard-cf` | Dashboard CF |
| `#/admin/institution` | Config institution |
| `#/diagnostics/health` | État système |

### Aliases (rétro-compatibles)

Les anciennes routes ne cassent **jamais** :

```javascript
/ecr01a-import-ppm → /ppm-import
/ecr01b-ppm-unitaire → /ppm-list
/ecr04b-avenants → /avenants
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
  "SEUIL_CUMUL_AVENANTS": 30,        // % max (BLOCANT)
  "SEUIL_ALERTE_AVENANTS": 25,       // % alerte (WARN)
  "TAUX_MAX_AVANCE": 15,             // % avance (BLOCANT)
  "DELAI_MAX_OS_APRES_VISA": 30      // jours (WARN)
}
```

### Matrices de procédures

Par type d'institution (ADMIN_CENTRALE, SOCIETE_ETAT, PROJET) :

- Montant → Mode de passation (PSC / PSD / AOO / PSO)
- Contrôle automatique avec proposition + alerte si dérogation

### Pièces obligatoires

Matrice dynamique par :
- Phase (PLANIF / PROC / ATTR / EXEC / CLOT)
- Mode de passation
- Type de marché

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

## 📊 Parcours de démo (2 minutes)

1. **Portail** → Cliquer "Module Marché"
2. **PPM List** → Voir 3 opérations seed
3. **Fiche marché** → Cliquer sur "Construction centre de santé"
4. **Avenants** → Voir alerte jaune 25.5% (proche seuil 30%)
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
