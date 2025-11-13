# STRUCTURE DES ÉCRANS - WORKFLOW EXÉCUTION

## Date: 2025-01-13
## Statut: Séparation correcte implémentée

---

## ✅ CORRECTION EFFECTUÉE

Le problème identifié était la présence de **deux fichiers nommés "ecr04a-*.js"**, ce qui créait une confusion dans la structure des écrans.

### Avant la correction:
```
ecr03a-attribution.js
ecr03b-echeancier-cle.js
ecr04a-visa-cf.js          ❌ Doublon de numérotation
ecr04a-execution-os.js     ❌ Doublon de numérotation
ecr04b-avenants.js
ecr04c-garanties.js
ecr05-cloture.js
```

### Après la correction:
```
ecr03a-attribution.js       ✅ Attribution du marché
ecr03b-echeancier-cle.js    ✅ Échéancier & Clé de répartition
ecr03c-visa-cf.js           ✅ Visa du Contrôleur Financier
ecr04a-execution-os.js      ✅ Exécution: Ordres de Service (avec bureaux)
ecr04b-avenants.js          ✅ Avenants & Résiliation
ecr04c-garanties.js         ✅ Garanties
ecr05-cloture.js            ✅ Clôture
```

---

## 📋 WORKFLOW COMPLET D'UN MARCHÉ

### PHASE 1: PLANIFICATION
- **ECR01A** - Import PPM (CSV/Excel)
- **ECR01B** - Liste PPM avec filtres
- **ECR01C** - Fiche marché détaillée
- **ECR01D** - Créer ligne PPM manuelle

### PHASE 2: PROCÉDURE
- **ECR02A** - Procédure PV (Ouverture → Analyse → Jugement)
- **ECR02B** - Gestion des recours

### PHASE 3: ATTRIBUTION
- **ECR03A** - Attribution (Titulaire, Montant, ANO)
- **ECR03B** - Échéancier & Clé de répartition multi-bailleurs
- **ECR03C** - Visa du Contrôleur Financier ✨ (renommé de ecr04a)

### PHASE 4: EXÉCUTION (Séparation claire)

#### ECR04A - Ordres de Service
**Fichier:** `ecr04a-execution-os.js`
**Route:** `/execution`
**Alias:** `/ecr04a-execution-os`

**Fonctionnalités:**
- ✅ Créer un ordre de service (démarrage, arrêt, reprise, etc.)
- ✅ Définir le **Bureau de Contrôle** (UA ou Entreprise externe)
- ✅ Définir le **Bureau d'Études** (UA ou Entreprise externe)
- ✅ Upload du document d'OS
- ✅ Affichage de la liste des OS émis

**Champs spécifiques:**
```javascript
{
  type: 'DEMARRAGE' | 'ARRET' | 'REPRISE' | 'AUTRE',
  numero: string,
  dateEmission: date,
  objet: string,
  docRef: string,
  bureauControle: {
    type: 'UA' | 'ENTREPRISE',
    uaId: string,
    entrepriseId: string,
    nom: string
  },
  bureauEtudes: {
    type: 'UA' | 'ENTREPRISE',
    uaId: string,
    entrepriseId: string,
    nom: string
  }
}
```

---

#### ECR04B - Avenants & Résiliation
**Fichier:** `ecr04b-avenants.js`
**Route:** `/avenants`
**Alias:** `/ecr04b-avenants`

**Fonctionnalités:**
- ✅ Liste des avenants avec calcul du pourcentage cumulé
- ✅ Alertes automatiques (25% et 30% du montant initial)
- ✅ Créer un avenant (financier ou non financier)
- ✅ **Résiliation du marché** (section séparée)

**Section Résiliation:**
```javascript
{
  dateResiliation: date,
  motifRef: 'NON_EXECUTION' | 'MALFACON' | 'RETARD' | 'ABANDON' |
            'FORCE_MAJEURE' | 'INTERET_PUBLIC' | 'AUTRE',
  motifAutre: string,
  documentRef: string
}
```

**Motifs de résiliation:**
1. Non-exécution des travaux
2. Malfaçons graves
3. Retards importants
4. Abandon du chantier
5. Force majeure
6. Intérêt public
7. Autre motif (avec précisions)

**Workflow résiliation:**
1. Saisie de la date et du motif
2. Upload du document de résiliation (PDF)
3. Confirmation avec alerte d'irréversibilité
4. Mise à jour de l'état de l'opération à `RESILIE`
5. Blocage de toute action ultérieure

---

#### ECR04C - Garanties
**Fichier:** `ecr04c-garanties.js`
**Route:** `/garanties`
**Alias:** `/ecr04c-garanties-resiliation`

**Fonctionnalités:**
- ✅ Garantie de bonne exécution
- ✅ Garantie de restitution d'avance
- ✅ Calcul automatique du montant selon le taux
- ✅ Workflow de mainlevée (après réception définitive)

**Types de garanties:**
- Garantie de bonne exécution (5-10% du montant marché)
- Garantie de restitution d'avance (si avance > 0)

---

### PHASE 5: CLÔTURE
- **ECR05** - Clôture complète
  - Réception provisoire (date, PV, réserves)
  - Réception définitive (date, PV)
  - Mainlevées des garanties
  - Décompte final
  - Synthèse finale

### PHASE 6: TABLEAU DE BORD
- **ECR06** - Dashboard CF (KPIs, alertes, suivi)

---

## 🔄 SÉPARATION CLAIRE: OS vs AVENANTS vs GARANTIES

| Écran | Objet | Responsabilité |
|-------|-------|----------------|
| **ECR04A - Exécution/OS** | Ordre de Service | Matérialiser le démarrage et définir les bureaux (contrôle/études) |
| **ECR04B - Avenants** | Modifications du marché | Gérer les avenants (financiers/non financiers) et la résiliation |
| **ECR04C - Garanties** | Sécurités financières | Gérer les garanties et leur mainlevée |

**Principe de séparation:**
- **OS** = Point de départ de l'exécution, document administratif
- **Avenants** = Modifications contractuelles en cours d'exécution
- **Garanties** = Sécurités financières exigées du titulaire

---

## 📊 ROUTAGE ET NAVIGATION

### Routes principales:
```javascript
router.register('/visa-cf', renderVisaCF);          // ECR03C
router.register('/execution', renderExecutionOS);   // ECR04A
router.register('/avenants', renderAvenants);       // ECR04B
router.register('/garanties', renderGaranties);     // ECR04C
```

### Aliases (rétro-compatibilité):
```javascript
router.alias('/ecr03c-visa-cf', '/visa-cf');
router.alias('/ecr04a-execution-os', '/execution');
router.alias('/ecr04b-avenants', '/avenants');
router.alias('/ecr04c-garanties-resiliation', '/garanties');
```

---

## 🎯 VÉRIFICATION DE LA SÉPARATION

### Test 1: Fichiers distincts
```bash
$ ls -1 js/modules/marche/screens/ | grep "ecr04"

ecr04a-execution-os.js     ✅ Un seul fichier ecr04a
ecr04b-avenants.js         ✅ Avenants séparés
ecr04c-garanties.js        ✅ Garanties séparées
```

### Test 2: Routes distinctes
```bash
/execution   → ECR04A (OS + Bureaux)
/avenants    → ECR04B (Avenants + Résiliation)
/garanties   → ECR04C (Garanties + Mainlevée)
```

### Test 3: Imports dans index.js
```javascript
import renderVisaCF from './screens/ecr03c-visa-cf.js';        ✅
import renderExecutionOS from './screens/ecr04a-execution-os.js'; ✅
import renderAvenants from './screens/ecr04b-avenants.js';     ✅
import renderGaranties from './screens/ecr04c-garanties.js';   ✅
```

---

## 📝 MODIFICATIONS EFFECTUÉES

1. **Renommage de fichier:**
   - `ecr04a-visa-cf.js` → `ecr03c-visa-cf.js`

2. **Mise à jour de l'import dans index.js:**
   - Ligne 14: `import renderVisaCF from './screens/ecr03c-visa-cf.js';`

3. **Mise à jour du commentaire de fichier:**
   - Header du fichier: `ECR03C - Visa du Contrôleur Financier`
   - Logger: `logger.info('[ECR03C] Chargement écran Visa CF')`

4. **Vérification des alias:**
   - Alias `/ecr03c-visa-cf` déjà présent et fonctionnel

---

## ✅ CONCLUSION

La séparation entre **OS**, **Avenants** et **Garanties** est maintenant **claire et visible** dans la structure des fichiers:

- **ECR03C** - Visa CF (étape de validation préalable)
- **ECR04A** - Ordres de Service avec bureaux de contrôle/études
- **ECR04B** - Avenants & Résiliation (modifications contractuelles)
- **ECR04C** - Garanties (sécurités financières)

Chaque écran a une **responsabilité unique** et est accessible par une **route distincte**.

---

**Dernière mise à jour:** 2025-01-13
**Validé par:** Claude Code (Assistant IA)
