# 📋 ENRICHISSEMENT SIDCF PORTAL - Phases Attribution, Visa CF, OS, Avenants & Clôture

**Date** : 2025-11-13
**Version** : 2.7
**Statut** : ✅ SCHÉMAS COMPLÉTÉS - WIDGETS À CRÉER

---

## 🎯 OBJECTIF

Enrichir le module Marchés SIDCF pour couvrir **l'intégralité du processus** depuis la planification jusqu'à la clôture, en conformité avec :
- Le **Code des Marchés Publics CI**
- Les **pratiques DCF/DGMP**
- Le **Manuel de Procédures de Passation** (aide memoire - procedure.pdf)
- La **Fiche de Suivi de Collecte des Documents** (fiche suivi des document.pdf)

---

## 📦 PHASE 1 : ATTRIBUTION

### 1.1 Schéma ATTRIBUTION enrichi

**Fichier** : `js/datastore/schema.js` (lignes 205-250)

#### Nouveautés :

✅ **Attributaire précis** :
- `entrepriseId` (si simple)
- `groupementId` (si groupement)
- `groupType` (COTRAITANCE | SOUSTRAITANCE)

✅ **Garanties et Cautionnement** :
```javascript
garanties: {
  garantieAvance: { existe, montant, dateEmission, dateEcheance, docRef },
  garantieBonneExec: { existe, montant, dateEmission, dateEcheance, docRef },
  cautionnement: { existe, montant, dateEmission, dateEcheance, docRef }
}
```

✅ **Réserves du Contrôleur Financier** :
```javascript
decisionCF: {
  aReserves: false, // true si réserves
  typeReserve: null, // code from MOTIF_RESERVE
  motifReserve: '', // Texte libre
  commentaire: ''
}
```

---

## 💰 PHASE 2 : CLÉ DE RÉPARTITION MULTI-BAILLEURS

### 2.1 Schéma CLE_LIGNE enrichi

**Fichier** : `js/datastore/schema.js` (lignes 349-359)

#### Nouveautés :

✅ **Support de la TVA par l'État** :
```javascript
etatSupporteTVA: false, // Si true, l'État supporte 18% du TTC
montantTVAEtat: 0 // Calcul automatique : TTC * 0.18
```

✅ **Base de calcul flexible** :
```javascript
baseCalc: 'HT' | 'TTC' | 'HT_TTC'
```

✅ **Évaluation automatique** :
- `pourcentage` : % de la contribution par rapport au montant total du marché
- Somme des pourcentages doit = 100%

### 2.2 Comportement

1. **Ajout d'une ligne** → Calcul automatique du %
2. **État supporte TVA** → Ajout automatique d'une ligne "TVA État" = 18% TTC
3. **Contributions multiples** → Tableau récapitulatif en temps réel
4. **Validation** → Alerte si total ≠ 100%

---

## 📅 PHASE 3 : ÉCHÉANCIER DE PAIEMENT AVEC LIVRABLES

### 3.1 Schéma ECHEANCIER enrichi

**Fichier** : `js/datastore/schema.js` (lignes 317-337)

#### Nouveautés :

✅ **Périodicité configurable** :
```javascript
periodicite: 'LIBRE' | 'MENSUEL' | 'TRIMESTRIEL' | 'SEMESTRIEL' | 'ANNUEL'
periodiciteJours: null // Si LIBRE, nombre de jours entre échéances
```

✅ **Suivi global** :
```javascript
totalPourcent: 0 // Doit atteindre 100%
```

### 3.2 Schéma ECHEANCE_ITEM enrichi

✅ **Livrables prévisionnels** :
```javascript
livrablesCibles: [], // IDs des livrables concernés
statutsLivrables: {
  livrableId: {
    statut: 'DEMARRE' | 'EN_COURS' | 'TERMINE',
    pourcentage: 0-100 // Si EN_COURS
  }
}
```

✅ **Calculs automatiques** :
```javascript
montant: 0,
pourcentage: 0 // % par rapport au montant total du marché
```

### 3.3 Comportement

1. **Ajout d'une échéance** → Sélection des livrables depuis la liste définie avec le marché
2. **Statut livrable** :
   - NON_DEMARRE → pas de pourcentage
   - DEMARRE → 0%
   - EN_COURS → saisie d'un % (1-99%)
   - TERMINE → 100%
3. **Validation globale** → Somme des échéances = 100%

---

## ✅ PHASE 4 : VISA DU CONTRÔLEUR FINANCIER

### 4.1 Nouveau schéma VISA_CF

**Fichier** : `js/datastore/schema.js` (lignes 481-505)

```javascript
VISA_CF: {
  id, operationId, attributionId,

  // Décision
  decision: 'VISA' | 'VISA_RESERVE' | 'REFUS' | 'EN_ATTENTE',
  dateDecision,

  // Documents
  contratDoc: null, // Contrat numéroté, approuvé, enregistré
  lettreMarche: null,
  formulaireSelection: null,

  // Réserves (si VISA_RESERVE)
  typeReserve, motifReserve,

  // Refus (si REFUS)
  motifRefus, commentaireRefus
}
```

### 4.2 Écran ECR04A - Visa CF (À CRÉER)

**Objectif** : Permettre au CF de donner son avis après la contractualisation

**Workflow** :
1. **Chargement des documents** (contrat, lettre marché, formulaire)
2. **Décision du CF** :
   - **VISA** → Passage à l'étape OS
   - **VISA_RESERVE** → Passage avec réserves documentées
   - **REFUS** → Blocage, retour à l'attribution
3. **Traçabilité totale** des documents et décisions

---

## 🚀 PHASE 5 : ORDRE DE SERVICE (OS) DE DÉMARRAGE

### 5.1 Schéma ORDRE_SERVICE enrichi

**Fichier** : `js/datastore/schema.js` (lignes 454-479)

#### Nouveautés :

✅ **Bureau de Contrôle** :
```javascript
bureauControle: {
  type: 'UA' | 'ENTREPRISE',
  uaId: null, // si UA
  entrepriseId: null, // si ENTREPRISE
  nom: '' // Auto-renseigné
}
```

✅ **Bureau d'Études** (même structure)

### 5.2 Comportement

1. **Sélection UA** → Liste des UA disponibles
2. **Sélection ENTREPRISE** → Recherche par NCC ou raison sociale
   - Si inexistante → Création sur place
3. **Nom auto-rempli** selon le type sélectionné

---

## 📝 PHASE 6 : AVENANTS & RÉSILIATION

### 6.1 Schéma AVENANT enrichi

**Fichier** : `js/datastore/schema.js` (lignes 361-389)

#### Nouveautés :

✅ **Incidence financière** :
```javascript
aIncidenceFinanciere: true | false,
variationMontant: 0,
nouveauMontantTotal: 0,
incidencePourcent: 0, // % variation / montant initial
cumulPourcent: 0 // Cumul avenants (vigilance seuils réglementaires)
```

✅ **ANO** :
```javascript
anoRequired: false, // true si ANO DGMP/Bailleur requis
anoDoc: null
```

### 6.2 Nouveau schéma RESILIATION

**Fichier** : `js/datastore/schema.js` (lignes 391-400)

```javascript
RESILIATION: {
  id, operationId,
  dateResiliation,
  motifRef, // code from MOTIF_RESILIATION
  motifAutre,
  documentRef
}
```

### 6.3 Comportement

**Avenant** :
1. Type : FINAN | DELAI | TECH
2. Si FINAN :
   - Calcul automatique de l'incidence %
   - Calcul du cumul avec avenants précédents
   - **Alerte si cumul > seuil réglementaire** (ex: 15%)
3. Si cumul élevé → ANO obligatoire

**Résiliation** :
1. Date + motif obligatoire
2. Document PV résiliation
3. **Blocage de l'exécution** → Changement d'état marché

---

## 🏁 PHASE 7 : CLÔTURE

### 7.1 Schéma CLOTURE enrichi

**Fichier** : `js/datastore/schema.js` (lignes 418-449)

#### Nouveautés :

✅ **Décomptes payés** :
```javascript
decomptes: [], // IDs des décomptes (lien module paiement)
montantTotalPaye: 0, // Somme paiements effectifs
montantMarcheTotal: 0, // Montant marché total
ecartMontant: 0 // Différence (alerte si écart)
```

✅ **Réceptions détaillées** :
```javascript
receptionProv: { date, pv, reserves },
receptionDef: { date, pv }
```

✅ **Mainlevées garanties** :
```javascript
mainlevees: [] // IDs des garanties avec mainlevée
```

### 7.2 Comportement

1. **PV Provisoire** → Date + upload PV + réserves éventuelles
2. **PV Définitif** → Date + upload PV
3. **Décomptes** :
   - Récupération automatique depuis module paiement
   - Comparaison montant payé vs montant marché
   - **Alerte si écart > seuil**
4. **Mainlevées** → Liste des garanties à libérer

---

## 📊 REGISTRIES AJOUTÉS

### Nouvelles listes de référence

**Fichier** : `js/config/registries.json`

| Registry | Codes | Usage |
|----------|-------|-------|
| `DECISION_CF` | VISA, VISA_RESERVE, REFUS, EN_ATTENTE | Décisions du CF |
| `STATUT_LIVRABLE` | NON_DEMARRE, DEMARRE, EN_COURS, TERMINE | Suivi livrables |
| `TYPE_BUREAU` | UA, ENTREPRISE | Bureau contrôle/études |
| `PERIODICITE_ECHEANCE` | LIBRE, MENSUEL, TRIMESTRIEL, etc. | Échéancier paiement |
| `BASE_CALCUL_CLE` | HT, TTC, HT_TTC | Calcul clé répartition |

---

## 🛠️ ENTITÉS CRÉÉES/MODIFIÉES

### Nouvelles entités

1. **LIVRABLE** (déjà créé v2.6)
2. **VISA_CF** ✨ NOUVEAU
3. **RESILIATION** ✨ NOUVEAU

### Entités enrichies

1. **ATTRIBUTION** → garanties, cautionnement, réserves CF
2. **CLE_LIGNE** → TVA État, base calcul flexible
3. **ECHEANCIER** → périodicité, livrables, statuts
4. **AVENANT** → incidence financière, cumul %, ANO
5. **ORDRE_SERVICE** → bureau contrôle/études
6. **CLOTURE** → décomptes, écarts, mainlevées

---

## ⚙️ WIDGETS À CRÉER (PROCHAINE ÉTAPE)

### Priorité HAUTE

1. **Widget Clé de Répartition multi-bailleurs**
   - Ajout/suppression lignes
   - Calcul automatique des %
   - Support TVA État (18%)
   - Tableau récapitulatif

2. **Widget Échéancier avec livrables**
   - Sélection périodicité
   - Ajout échéances
   - Attribution livrables par échéance
   - Suivi statuts livrables (%)
   - Validation total = 100%

3. **Écran VISA CF (ECR04A)**
   - Upload documents (contrat, lettre, formulaire)
   - Décision CF (radio buttons)
   - Réserves (si VISA_RESERVE)
   - Refus (si REFUS)

4. **Écran OS enrichi**
   - Sélecteur bureau contrôle (UA/ENTREPRISE)
   - Sélecteur bureau études (UA/ENTREPRISE)
   - Recherche entreprise (NCC/raison sociale)
   - Création entreprise si inexistante

5. **Écran Avenants complet**
   - Type avenant (FINAN/DELAI/TECH)
   - Calcul incidence % (si FINAN)
   - Calcul cumul % avec avenants précédents
   - Alerte seuil dépassé
   - Upload ANO (si requis)

6. **Écran Résiliation**
   - Date + motif
   - Upload PV résiliation
   - Confirmation blocage exécution

7. **Écran Clôture enrichi**
   - PV provisoire + définitif
   - Liste décomptes payés
   - Comparaison montants (marché vs payé)
   - Liste garanties + mainlevées

---

## 🔗 COMPORTEMENTS SELON TYPE DE PROCÉDURE

### D'après aide-memoire-procedure.pdf

| Procédure | Seuil | Commission | Documents spécifiques |
|-----------|-------|------------|----------------------|
| **AOO** (Appel d'Offres Ouvert) | ≥ 100M XOF | COJO | AAO + DAO + PV (ouverture, analyse, jugement) |
| **AOR** (Appel d'Offres Restreint) | Variable | COJO | Liste restreinte + DAO |
| **PSC** (Procédure Simplifiée Cotation) | < seuil PSC | COPE | DDC (Dossier Demande Cotations) |
| **PSL** (Procédure Simplifiée Limitée) | < seuil PSL | COPE | DAC |
| **PSO** (Procédure Simplifiée Ouverte) | < seuil PSO | COPE | DAC |
| **Entente Directe** | Exceptionnel | COPE | Justification dérogation |

### Différences comportementales

1. **Commission** :
   - COJO → Administrations centrales (procédures > 100M)
   - COPE → Projets, collectivités, procédures simplifiées

2. **Documents d'appel** :
   - AOO/AOR → **DAO** (Dossier d'Appel d'Offres)
   - PSC → **DDC** (Dossier Demande Cotations)
   - PSO/PSL → **DAC** (Dossier d'Appel à Concurrence)
   - Services intellectuels → **AMI** (Avis Manifestation d'Intérêt)

3. **Délais** :
   - AON : 4 semaines min
   - AOI : 6 semaines min
   - PSC/PSO : délais réduits

4. **ANO (Avis Non Objection)** :
   - Obligatoire si financement externe (DGMP + BAILLEUR)
   - Phases ANO : après analyse, après jugement, avant signature

---

## ✅ CONFORMITÉ RÉGLEMENTAIRE

### Code des Marchés Publics CI

✅ Commissions (COJO/COPE) selon type d'UA
✅ Documents obligatoires selon procédure
✅ PV pour chaque étape (ouverture, analyse, jugement)
✅ Visa CF avant démarrage
✅ Garanties et cautionnement
✅ Avenants avec seuils réglementaires
✅ Clôture avec PV provisoire/définitif

### Pratiques DCF/DGMP

✅ Traçabilité totale des documents
✅ Réserves CF documentées
✅ ANO si financement externe
✅ Clé de répartition multi-bailleurs
✅ Suivi décomptes vs marché total

---

## 📈 PROCHAINES ACTIONS

### Phase 1 : Widgets & Écrans (1-2 jours)
- [ ] Widget Clé de Répartition
- [ ] Widget Échéancier avec livrables
- [ ] Écran VISA CF
- [ ] Enrichir écran Attribution

### Phase 2 : Écrans Avancés (1-2 jours)
- [ ] Écran OS enrichi
- [ ] Écran Avenants complet
- [ ] Écran Résiliation
- [ ] Écran Clôture enrichi

### Phase 3 : Tests & Documentation (1 jour)
- [ ] Tests end-to-end (PLANIF → CLOT)
- [ ] Documentation utilisateur
- [ ] Formation équipe

---

**FIN DU DOCUMENT**
