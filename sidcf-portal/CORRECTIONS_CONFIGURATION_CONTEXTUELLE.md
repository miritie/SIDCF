# Corrections Configuration Contextuelle - SIDCF Portal

**Date:** 2025-11-18
**Statut:** Configuration corrigée et validée selon spécifications

---

## ✅ Corrections Apportées

### 1. Champs Manquants Ajoutés

#### **A. Attribution - Tous modes**

**Ajout `programmation`** (requis pour tous):
- PSD, PSC, PSL, PSO, AOO, PI

**Ajout champs garanties détaillés** (AOO, PSO, PSL):
- `tauxAvance` (pour calculer montant)
- `tauxGarantieBonneExecution` (3-5% pour AOO)
- `montantGarantieBonneExecution` (calculé ou saisi)

#### **B. Clôture - Tous modes**

**Ajout `dateDernierDecompte`** (optionnel):
- Permet d'indiquer que le marché est physiquement terminé
- Basé sur commentaires [ed33-36] des spécifications

### 2. PI - Correction Garanties

**✅ Correction selon [ed23]:**
> "A supprimer, pour les PI on a pas de garantie ni d'avance"

**Champs cachés pour PI:**
```json
"champs_caches": [
  "avanceDemarrage",
  "tauxAvance",
  "montantAvance",
  "garantieAvance",
  "garantieBonneExecution",
  "tauxGarantieBonneExecution",
  "montantGarantieBonneExecution",
  "dureeGarantie"
]
```

**Note ajoutée:**
> "PI: Pas de garanties ni d'avance - Art. spécifique prestations intellectuelles"

### 3. PSL - Correction COJO

**Ajout `cojo_obligatoire: true` pour PSL**

Selon spécifications:
> "Invitations transmises aux différents membres qui doivent siégés en commission pour le choix du prestataire"

### 4. PSO - Correction COJO

**Ajout `cojo_obligatoire: true` pour PSO**

PSO requiert également une COJO (procédure à compétition ouverte).

### 5. Notes Ajoutées pour Clarté

**PSD:**
```json
"note": "PSD: Bon de commande, garanties optionnelles"
```

**PSC:**
```json
"attribution": {
  "note": "PSC: Bon de commande + Numéro marché/lettre de marché le cas échéant"
},
"cloture": {
  "note": "PSC: Satisfaction bénéficiaires/livrables + Date dernier décompte"
}
```

**PSL:**
```json
"note": "PSL: Garanties optionnelles mais recommandées - Si avance: taux 15% max, Si garantie: 3-5%"
```

**PSO:**
```json
"note": "PSO: Garanties optionnelles mais recommandées - Si avance: taux 15% max, Si garantie: 3-5%"
```

**AOO:**
```json
"taux_avance": {
  "min": 0,
  "max": 15,
  "recommande": 15,
  "note": "Forfaitaire 15% ou Facultative 15% - Art 129 et 130"
},
"taux_garantie_bonne_exec": {
  "min": 3,
  "max": 5,
  "recommande": 5,
  "note": "Obligatoire entre 3% et 5% - Art 97.3"
},
"note": "AOO: Garanties obligatoires - Avance forfaitaire/facultative 15%, Garantie bonne exécution 3-5%"
```

**Clôture (tous modes):**
```json
"note": "Date dernier décompte pour indiquer marché physiquement terminé"
```

---

## 📋 Configuration Finale par Mode

### PSD - Procédure Simplifiée d'Entente Directe

**Contractualisation:**
- **Documents requis:** BON_COMMANDE, FACTURE_PROFORMA
- **Documents optionnels:** DEVIS_CONCURRENCE
- **Soumissionnaires:** NON
- **Lots:** NON
- **Recours:** NON
- **COJO:** NON

**Attribution:**
- **Champs requis:** numeroBC, montantAttribution, dureeExecution, ncc, raisonSociale, banque, numeroCompte, typeLivrable, livrable, echeancier, cleRepartition, **programmation**
- **Champs optionnels:** avanceDemarrage, tauxAvance, montantAvance, garantieAvance, montantGarantie, dureeGarantie, coordGPS, dateVisaCF
- **Champs cachés:** numeroMarche, lettreMarche

**Clôture:**
- **Champs optionnels:** dateDernierDecompte

---

### PSC - Procédure Simplifiée de Demande de Cotation

**Contractualisation:**
- **Documents requis:** DOSSIER_CONCURRENCE, FORMULAIRE_SELECTION, PV_OUVERTURE
- **Documents optionnels:** RAPPORT_ANALYSE, DOSSIER_RECOURS
- **Soumissionnaires:** OUI (ncc, raisonSociale, natureSiGroupement, statutSanction)
- **Lots:** OUI (entreprisesSoumissionnaires, objet, montantPrevHT, montantPrevTTC, livrablesAttendus)
- **Recours:** OUI (motifRecours)
- **COJO:** NON
- **Dates:** dateOuverture, dateSelection

**Attribution:**
- **Champs requis:** numeroBC, numeroMarche, montantAttribution, dureeExecution, ncc, raisonSociale, banque, numeroCompte, typeLivrable, livrable, echeancier, cleRepartition, **programmation**
- **Champs optionnels:** numeroFacture, dateVisaCF, avanceDemarrage, tauxAvance, montantAvance, garantieAvance, dureeGarantie, coordGPS

**Clôture:**
- **Champs optionnels:** satisfactionBeneficiaires, dateDernierDecompte

---

### PSL - Procédure Simplifiée à Compétition Limitée

**Contractualisation:**
- **Documents requis:** COURRIER_INVITATION, DAO, PV_OUVERTURE, RAPPORT_ANALYSE, PV_JUGEMENT
- **Documents optionnels:** MANDAT_REPRESENTATION, DOSSIER_RECOURS, COURRIERS_ANO, ECLAIRCISSEMENTS
- **Soumissionnaires:** OUI (+ statutJuridique)
- **Lots:** OUI
- **Recours:** OUI
- **Validation DGMP:** OUI ✅
- **COJO:** OUI ✅
- **Dates:** dateOuverture, dateJugement

**Attribution:**
- **Champs requis:** numeroMarche, montantAttribution, ncc, raisonSociale, banque, numeroCompte, typeLivrable, livrable, coordGPS, echeancier, cleRepartition, **programmation**
- **Champs optionnels:** dateVisaCF, avanceDemarrage, tauxAvance, montantAvance, garantieAvance, garantieBonneExecution, tauxGarantieBonneExecution, montantGarantieBonneExecution, dureeGarantie

**Clôture:**
- **Champs optionnels:** dateDernierDecompte

---

### PSO - Procédure Simplifiée à Compétition Ouverte

**Contractualisation:**
- **Documents requis:** COURRIER_INVITATION, DAO, PV_OUVERTURE, RAPPORT_ANALYSE, PV_JUGEMENT
- **Documents optionnels:** MANDAT_REPRESENTATION, DOSSIER_RECOURS, COURRIERS_ANO, ECLAIRCISSEMENTS
- **Soumissionnaires:** OUI (ncc, raisonSociale, natureSiGroupement, statutSanction)
- **Lots:** OUI
- **Recours:** OUI
- **Validation DGMP:** OUI ✅
- **Publication obligatoire:** OUI ✅
- **COJO:** OUI ✅
- **Dates:** dateOuverture, dateJugement

**Attribution:**
- **Champs requis:** numeroMarche, montantAttribution, ncc, raisonSociale, banque, numeroCompte, typeLivrable, livrable, coordGPS, echeancier, cleRepartition, **programmation**
- **Champs optionnels:** dateVisaCF, avanceDemarrage, tauxAvance, montantAvance, garantieAvance, garantieBonneExecution, tauxGarantieBonneExecution, montantGarantieBonneExecution, dureeGarantie

**Clôture:**
- **Champs optionnels:** dateDernierDecompte

---

### AOO - Appel d'Offres Ouvert

**Contractualisation:**
- **Documents requis:** COURRIER_INVITATION, DAO, PV_OUVERTURE, RAPPORT_ANALYSE, PV_JUGEMENT
- **Documents optionnels:** MANDAT_REPRESENTATION, DOSSIER_RECOURS, COURRIERS_ANO, ECLAIRCISSEMENTS
- **Soumissionnaires:** OUI (+ statutJuridique)
- **Lots:** OUI
- **Recours:** OUI
- **Validation DGMP:** OUI ✅
- **Publication obligatoire:** OUI ✅
- **COJO:** OUI ✅
- **Dates:** dateOuverture, dateJugement

**Attribution:**
- **Champs requis:** numeroMarche, montantAttribution, ncc, raisonSociale, banque, numeroCompte, **avanceDemarrage**, **tauxAvance**, **montantAvance**, **garantieAvance**, **garantieBonneExecution**, **tauxGarantieBonneExecution**, **montantGarantieBonneExecution**, **dureeGarantie**, typeLivrable, livrable, coordGPS, echeancier, cleRepartition, **programmation**
- **Garanties OBLIGATOIRES:**
  - Avance: 0-15% (recommandé 15%) - Art 129 et 130
  - Bonne exécution: 3-5% (recommandé 5%) - Art 97.3

**Clôture:**
- **Champs optionnels:** dateDernierDecompte

---

### PI - Prestations Intellectuelles

**Contractualisation:**
- **Documents requis:** COURRIER_INVITATION, AMI_DP, PV_OUVERTURE, RAPPORT_ANALYSE, PV_JUGEMENT
- **Documents optionnels:** MANDAT_REPRESENTATION, DOSSIER_RECOURS, COURRIERS_ANO, ECLAIRCISSEMENTS
- **Soumissionnaires:** OUI (+ statutJuridique)
- **Lots:** OUI
- **Recours:** OUI
- **Validation DGMP:** OUI ✅
- **Publication obligatoire:** OUI ✅
- **COJO:** OUI ✅
- **Méthodes sélection:** QBS, QCBS, FBS, LCS
- **Dates:** dateOuverture, dateJugement

**Attribution:**
- **Champs requis:** numeroMarche, montantAttribution, ncc, raisonSociale, banque, numeroCompte, typeLivrable, livrable, coordGPS, echeancier, cleRepartition, **programmation**
- **Champs optionnels:** dateVisaCF
- **Champs CACHÉS:** ❌ avanceDemarrage, tauxAvance, montantAvance, garantieAvance, garantieBonneExecution, tauxGarantieBonneExecution, montantGarantieBonneExecution, dureeGarantie
- **Note:** PAS de garanties ni d'avance pour PI

**Clôture:**
- **Champs optionnels:** dateDernierDecompte

---

## 🎯 Matrice de Validation

### Garanties par Mode

| Mode | Avance | Taux Avance | Garantie Bonne Exec | Taux Garantie | Statut |
|------|--------|-------------|---------------------|---------------|---------|
| PSD  | ⚠️ Optionnel | 0-15% | ⚠️ Optionnel | - | Optionnel |
| PSC  | ⚠️ Optionnel | 0-15% | ⚠️ Optionnel | - | Optionnel |
| PSL  | ⚠️ Optionnel | 0-15% | ⚠️ Optionnel | 3-5% | Recommandé |
| PSO  | ⚠️ Optionnel | 0-15% | ⚠️ Optionnel | 3-5% | Recommandé |
| AOO  | ✅ Obligatoire | 0-15% (rec: 15%) | ✅ Obligatoire | 3-5% (rec: 5%) | Obligatoire |
| PI   | ❌ Interdit | - | ❌ Interdit | - | Pas applicable |

### COJO par Mode

| Mode | COJO | Validation DGMP | Publication |
|------|------|-----------------|-------------|
| PSD  | ❌ Non | ❌ Non | ❌ Non |
| PSC  | ❌ Non | ❌ Non | ❌ Non |
| PSL  | ✅ Oui | ✅ Oui | ⚠️ Limitée |
| PSO  | ✅ Oui | ✅ Oui | ✅ Oui |
| AOO  | ✅ Oui | ✅ Oui | ✅ Oui |
| PI   | ✅ Oui | ✅ Oui | ✅ Oui |

### Gestion Soumissionnaires/Lots

| Mode | Soumissionnaires | Champs Spécifiques | Lots | Recours |
|------|------------------|---------------------|------|---------|
| PSD  | ❌ Non | - | ❌ Non | ❌ Non |
| PSC  | ✅ Oui | ncc, raison, nature, statut | ✅ Oui | ✅ Oui |
| PSL  | ✅ Oui | + statutJuridique | ✅ Oui | ✅ Oui |
| PSO  | ✅ Oui | ncc, raison, nature, statut | ✅ Oui | ✅ Oui |
| AOO  | ✅ Oui | + statutJuridique | ✅ Oui | ✅ Oui |
| PI   | ✅ Oui | + statutJuridique | ✅ Oui | ✅ Oui |

---

## 📝 Champs Spécifiques Ajoutés

### Attribution

**Nouveaux champs pour tous:**
- `programmation` (requis)

**Nouveaux champs garanties (AOO, PSO, PSL):**
- `tauxAvance` (optionnel PSO/PSL, requis AOO)
- `tauxGarantieBonneExecution` (optionnel PSO/PSL, requis AOO)
- `montantGarantieBonneExecution` (optionnel PSO/PSL, requis AOO)

### Clôture

**Nouveaux champs pour tous:**
- `dateDernierDecompte` (optionnel) - Permet d'indiquer marché physiquement terminé

**Spécifique PSC:**
- `satisfactionBeneficiaires` (optionnel) - Évaluation livrables/bénéficiaires

---

## ✅ Checklist de Conformité

### Configuration Complète
- [x] PSD: Seuils 0-10M XOF
- [x] PSC: Seuils 10-30M XOF
- [x] PSL: Seuils 30-50M XOF
- [x] PSO: Seuils 50-100M XOF
- [x] AOO: Seuils ≥100M XOF
- [x] PI: Pas de seuil fixe

### Champs Contextuels
- [x] Champs requis par mode et phase
- [x] Champs optionnels par mode et phase
- [x] Champs cachés par mode et phase
- [x] Documents requis/optionnels
- [x] Notes explicatives

### Garanties
- [x] PSD/PSC: Optionnelles
- [x] PSL/PSO: Optionnelles mais recommandées
- [x] AOO: Obligatoires avec taux
- [x] PI: Interdites (cachées)

### COJO
- [x] PSD/PSC: Non
- [x] PSL: Oui (commission)
- [x] PSO: Oui
- [x] AOO: Oui
- [x] PI: Oui

### Soumissionnaires/Lots
- [x] PSD: Non
- [x] PSC+: Oui avec champs appropriés
- [x] Statut juridique pour PSL/AOO/PI

### Clôture
- [x] Date dernier décompte (tous)
- [x] Satisfaction bénéficiaires (PSC)

---

## 🚀 Prochaines Étapes

La configuration contextuelle est maintenant **complète et validée**. Les prochaines étapes sont:

1. **Modifier ECR02a** - Implémenter affichage contextuel avec widgets soumissionnaires/lots
2. **Modifier ECR03a** - Appliquer contextualisation garanties
3. **Modifier ECR04b** - Séparer visuellement marché base/avenants
4. **Modifier ECR05** - Ajouter champs optionnels contextuels
5. **Tests d'intégration** - Valider chaque mode de passation

---

## 📚 Références

- **Spécifications:** Document utilisateur détaillé (PSD, PSC, PSL, PSO, AOO, PI)
- **Code des Marchés Publics CI:** Articles 97.3, 98, 129, 130
- **Fichier configuration:** [rules-config.json](sidcf-portal/js/config/rules-config.json)
- **Bibliothèque contextualisation:** [procedure-context.js](sidcf-portal/js/lib/procedure-context.js)

---

**Configuration validée le:** 2025-11-18
**Statut:** ✅ Prêt pour implémentation dans les écrans
