# SIDCF Portal - Guide d'Intégration Module Marché

## 🚀 Démarrage Rapide

```bash
# 1. Lancer le serveur HTTP
python3 -m http.server 7001

# 2. Ouvrir le navigateur
open http://localhost:7001

# 3. Vérifier le chargement des seed data
# Ouvrir la console F12 et chercher: "[DataService] Seed data loaded"
```

## 📦 Nouveautés Intégrées

### 1. Ligne Budgétaire (BUDGET_LINE)

Chaque opération peut maintenant être liée à une ligne budgétaire complète incluant :
- Section budgétaire, Programme, Unité Administrative (UA)
- Action, Activité, Nature économique
- Type et source de financement (État, Bailleur)
- Autorisations d'Engagement (AE) et Crédits de Paiement (CP)

**Voir un exemple** :
- Aller sur http://localhost:7001#/ppm-list
- Cliquer sur "Construction d'un centre de santé rural"
- Observer le panneau "Ligne budgétaire" avec bouton "👁️ Voir détails"
- Cliquer sur le bouton → Drawer s'ouvre avec tous les détails

### 2. Timeline de Progression

Chaque opération affiche maintenant sa progression dans le cycle de vie :

```
PLANIF → PROC → ATTR → VISE → EXEC → CLOT
```

- ✅ Vert = Étape complétée
- 🟠 Orange (pulsant) = Étape en cours
- ⚪ Gris = Étape à venir
- 👆 Cliquable = Navigation vers l'écran de l'étape

**Voir en action** :
- http://localhost:7001#/fiche-marche?idOperation=OP-2024-001
- Vous verrez les 5 premières étapes complétées, CLOT en attente

### 3. Widgets Réutilisables

Trois nouveaux composants UI :

| Widget | Fichier | Usage |
|--------|---------|-------|
| Timeline Steps | `js/ui/widgets/steps.js` | Afficher la progression |
| Drawer | `js/ui/widgets/drawer.js` | Panneau latéral coulissant |
| Budget Viewer | `js/ui/widgets/budget-line-viewer.js` | Détails ligne budgétaire |

## 🎨 Exemples de Code

### Afficher la Timeline

```javascript
import { renderSteps } from '../ui/widgets/steps.js';

async function myScreen(params) {
  const fullData = await dataService.getOperationFull(params.idOperation);

  const page = el('div', { className: 'page' }, [
    // Timeline en haut
    renderSteps(fullData, params.idOperation),

    // Votre contenu...
  ]);

  mount('#app', page);
}
```

### Ouvrir un Drawer avec Budget Line

```javascript
import { showBudgetLineDetails } from '../ui/widgets/budget-line-viewer.js';

// Récupérer la ligne budgétaire
const budgetLine = await dataService.getBudgetLineForOperation(operationId);

// Afficher dans un drawer
showBudgetLineDetails(budgetLine);
```

### Créer un Drawer Personnalisé

```javascript
import { openDrawer } from '../ui/widgets/drawer.js';

const content = el('div', {}, [
  el('h2', {}, 'Mon contenu'),
  el('p', {}, 'Lorem ipsum...')
]);

openDrawer('Titre du Drawer', content, {
  width: '600px',
  position: 'right',
  onClose: () => console.log('Fermé!')
});
```

## 🗃️ Données de Test (Seed)

5 lignes budgétaires disponibles :

| ID | Section | Programme | UA | AE | CP |
|----|---------|-----------|----|----|-----|
| BL-2024-001 | 101 Représentation Nationale | E-Parlement | 31990001 | 850M | 850M |
| BL-2024-002 | 120 Santé | Centres de santé ruraux | 12011001 | 5.5Mds | 4.2Mds |
| BL-2024-003 | 135 Équipement Routier | Études routières BAD | 13512003 | 12Mds | 8.5Mds |
| BL-2024-004 | 110 Admin Territoire | Véhicules administratifs | 11002001 | 3.2Mds | 3.2Mds |
| BL-2024-005 | 145 Éducation | Écoles primaires UE | 14523001 | 7.8Mds | 6.5Mds |

3 opérations de test liées :
- **OP-2024-001** : Centre de santé Korhogo → BL-2024-002
- **OP-2024-002** : Véhicules administratifs → BL-2024-004
- **OP-2024-003** : Étude routière ABJ-YAM → BL-2024-003

## ⚙️ Configuration

### Seuils et Règles (`js/config/rules-config.json`)

```json
{
  "seuils": {
    "SEUIL_CUMUL_AVENANTS": { "value": 30, "unit": "%", "severity": "BLOCK" },
    "SEUIL_ALERTE_AVENANTS": { "value": 25, "unit": "%", "severity": "WARN" },
    "DELAI_MAX_OS_APRES_VISA": { "value": 30, "unit": "jours", "severity": "WARN" }
  }
}
```

**Pour changer un seuil** :
1. Éditer `js/config/rules-config.json`
2. Modifier la valeur (ex: 30 → 35)
3. Recharger la page (Ctrl+R)
4. Aucun code à recompiler !

### Registries (`js/config/registries.json`)

26 référentiels configurables :
- TYPE_INSTITUTION, TYPE_MARCHE, MODE_PASSATION
- LOCALITE_CI (Régions > Départements > Communes > Localités)
- BAILLEUR (BAD, BM, AFD, UE, BID, JICA, KfW, BIDC, etc.)
- ETAT_MARCHE, DECISION_CF, TYPE_GARANTIE, etc.

**Pour ajouter un bailleur** :
```json
{
  "BAILLEUR": [
    { "code": "NOUVEAU", "label": "Nouveau Bailleur" }
  ]
}
```

## 🎯 Prochaines Implémentations

### Écrans à Finaliser

1. **ecr01b-ppm-unitaire.js** — Table filtrable avancée
   - Filtres multi-critères (exercice, UA, type, montant, région, texte)
   - Export CSV
   - Pagination 25/50/100

2. **ecr02a-procedure-pv.js** — Procédure avec dérogation
   - Détection auto dérogation (mode hors barème)
   - Upload document justificatif obligatoire
   - Badge dérogation sur écrans suivants

3. **ecr03a-attribution.js** — Attribution
   - Entreprise simple ou groupement (co-traitance / sous-traitance)
   - Décision CF (VISA / RESERVE / REFUS)

4. **ecr03b-echeancier-cle.js** — Échéancier & Clé
   - Échéancier périodique ou libre
   - Clé de répartition (année, bailleur, nature, %)
   - Validation : Σ montants = montant marché, Σ % = 100%

5. **ecr04a-execution-os.js** — Ordres de Service
   - Liste OS avec dates et numéros
   - Alerte si OS > 30j après visa

6-10. Autres écrans (recours, garanties, clôture, dashboard...)

### Effort Estimé

- Écran simple (recours, garanties, clôture) : **2h** chacun
- Écran moyen (attribution, OS) : **3h** chacun
- Écran complexe (PPM filtrable, échéancier) : **4h** chacun

**Total** : 24-28h pour finaliser les 10 écrans

## 🧪 Tests Suggérés

### Test 1 : Timeline Interactive

```
1. Aller sur http://localhost:7001#/fiche-marche?idOperation=OP-2024-001
2. Observer la timeline : PLANIF → EXEC = vert, CLOT = gris
3. Cliquer sur "📋 Identité" → rien (bouton statique)
4. Cliquer sur "⚖️ Procédure" → navigation vers /procedure
```

### Test 2 : Budget Line Drawer

```
1. Sur la fiche marché OP-2024-001
2. Panneau "Ligne budgétaire" visible
3. Cliquer "👁️ Voir détails"
4. Drawer s'ouvre à droite avec 8 sections
5. Cliquer sur overlay ou ESC → drawer se ferme
```

### Test 3 : Alerte Seuil Avenants

```
1. Aller sur http://localhost:7001#/avenants?idOperation=OP-2024-001
2. Observer l'alerte orange : "Cumul 25.5% approche le seuil (30%)"
3. Modifier seed.json : variationMontant → 80000000 (> 30%)
4. Recharger localStorage (localStorage.clear() + F5)
5. Alerte devient rouge : "Seuil dépassé 🚫"
```

## 📚 Documentation Complète

Voir [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md) pour :
- Liste complète des modifications
- Architecture technique détaillée
- Guides d'utilisation des widgets
- Checklist de déploiement
- Recommandations futures

## 🐛 Dépannage

### Problème : Loader infini

**Solution** :
```bash
# Vérifier que le serveur HTTP tourne
lsof -i :7001

# Si rien, le lancer
python3 -m http.server 7001
```

### Problème : "Aucune opération trouvée"

**Solution** :
```javascript
// Console navigateur F12
localStorage.clear()
location.reload()
// Les seed data doivent se charger
```

### Problème : "Module not found"

**Solution** : Vérifier les imports relatifs
```javascript
// ❌ Mauvais
import { el } from './lib/dom.js'  // Chemin relatif incorrect

// ✅ Bon
import { el } from '../../../lib/dom.js'  // Bon nombre de ../
```

## 📞 Contact & Support

Pour toute question :
1. Consulter [INTEGRATION_REPORT.md](INTEGRATION_REPORT.md)
2. Inspecter la console F12 pour les erreurs
3. Vérifier les imports dans `js/datastore/schema.js`

**Principe clé** : Tous les écrans suivent le même pattern :
```
Import widgets → Récupérer fullData → Afficher timeline →
Vérifier règles → Afficher alertes/blocages
```

---

**Version** : MVP Foundation v1.0
**Date** : 2025-01-12
**Licence** : Propriétaire SIDCF
