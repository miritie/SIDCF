# 📋 SIDCF Portal - Plan d'Ajustements Module Marchés v2.0

**Date**: 2025-11-17
**Objectif**: Intégrer les retours de tests utilisateurs
**Architecture**: PostgreSQL + Cloudflare R2

---

## 🎯 RÉSUMÉ EXÉCUTIF

Suite à l'analyse approfondie du document Word fourni, j'ai identifié **25+ ajustements majeurs** nécessaires pour assurer la conformité complète avec le Code des Marchés Publics de Côte d'Ivoire et les pratiques DCF/DGMP.

### Points Critiques Identifiés

1. ✅ **Distinction Marché de Base / Avenants** - Séparation claire des fichiers et données
2. ✅ **Gestion des Lots** - Support des lots multiples pour PSC, PSL, PSO, AOO, PI
3. ✅ **Soumissionnaires Optionnels** - Priorité à l'upload de documentation complète
4. ✅ **25+ Nouveaux Champs** - Coordonnées géo, dates, numéros de documents, etc.
5. ✅ **Seuils Officiels** - Validation conforme Code des Marchés CI

---

## 📊 ANALYSE PAR PHASE

### 1️⃣ PHASE PLANIFICATION

#### Champs Manquants Identifiés

| Champ | Description | Priorité | Statut |
|-------|-------------|----------|--------|
| **Unité Opérationnelle** | Distinct de UA budgétaire | 🔴 Haute | À ajouter |
| **Activité** | Code et libellé activité (distinct de Action) | 🔴 Haute | À ajouter |
| **Type d'Opération** | Marché 100M+ ou Contrat <100M | 🔴 Haute | À ajouter |
| **Coordonnées Géographiques** | Région, Département, Sous-Préfecture, **Village**, Latitude, Longitude | 🔴 Haute | À ajouter |

**Impact**: Ces champs sont **obligatoires** selon les spécifications métier.

**Solution**:
- Ajout de colonnes dans la table `operation`
- Interface de saisie avec sélection cascade (Région → Département → Sous-Préfecture → Village)
- Optionnel: Carte interactive pour saisie coordonnées GPS

---

### 2️⃣ PHASE CONTRACTUALISATION

#### Distinction par Mode de Passation

##### A. PSD (Procédure Simplifiée D'entente Directe)

| Document | Champ DB | Statut Actuel | Action |
|----------|----------|---------------|--------|
| Bon de commande | `bon_commande_doc` | ❌ Manquant | À ajouter |
| Facture proforma | `facture_proforma_doc` | ❌ Manquant | À ajouter |
| Statut sanctionné prestataire | `prestataire_sanctionne` | ❌ Manquant | À ajouter |

**Règle Métier**: PSD si montant **< 10M XOF**

##### B. PSC (Procédure Simplifiée de demande de Cotation)

| Document | Champ DB | Statut Actuel | Action |
|----------|----------|---------------|--------|
| Dossier de concurrence (ZIP) | `dossier_concurrence_doc` | ❌ Manquant | À ajouter |
| Formulaire de sélection | `formulaire_selection_doc` | ❌ Manquant | À ajouter |
| Date d'ouverture des plis | `dates->date_ouverture` | ✅ Existe (JSONB) | OK |
| **Date de sélection** | `date_selection` | ❌ Manquant | À ajouter |
| PV d'ouverture | `pv.ouverture` | ✅ Existe (JSONB) | OK |
| Rapport d'analyse | `rapport_analyse_doc` | ✅ Existe | OK |

**Règle Métier**: PSC si montant **10M - 30M XOF**

**Gestion des Soumissionnaires**:
> "Pour moi les soumissionnaires ne sont pas nécessaires. Si possibilité de charger de la documentation. Prioriser cette option."

**Solution Retenue**:
- Rendre la saisie des soumissionnaires **OPTIONNELLE**
- **Privilégier** l'upload du dossier de concurrence complet (archive ZIP)
- Ne capter QUE l'attributaire final

##### C. PSL/PSO/AOO/PI

| Document | Champ DB | Statut Actuel | Action |
|----------|----------|---------------|--------|
| Courrier d'invitation | `courrier_invitation_doc` | ❌ Manquant | À ajouter |
| Mandat de représentation | `mandat_representation_doc` | ❌ Manquant | À ajouter |
| DAO complet | `dossier_appel_doc` | ✅ Existe | OK |
| PV d'ouverture | `pv.ouverture` | ✅ Existe (JSONB) | OK |
| Rapport d'analyse | `rapport_analyse_doc` | ✅ Existe | OK |
| PV de jugement | `pv.jugement` | ✅ Existe (JSONB) | OK |

**Gestion des Lots**:
- Nouvelle table `lot` pour supporter les marchés allotis
- Relation: `operation` 1→N `lot`
- Chaque lot peut avoir des soumissionnaires distincts

---

### 3️⃣ PHASE ATTRIBUTION

#### Distinction PSD vs PSC vs Autres Modes

| Mode | Champ Spécifique | Statut Actuel | Action |
|------|------------------|---------------|--------|
| **PSD** | Numéro bon de commande | ❌ Manquant | À ajouter |
| **PSD** | Numéro facture définitive | ❌ Manquant | À ajouter |
| **PSD** | Date de visa CF (sur acte de dépense) | ❌ Manquant | À ajouter |
| **PSC** | Numéro lettre de marché | ❌ Manquant | À ajouter |
| **PSC** | Lettre de marché (document) | ❌ Manquant | À ajouter |
| **PSC** | Date de visa CF (sur acte de dépense) | ❌ Manquant | À ajouter |
| **PSL/PSO/AOO/PI** | Marché signé et approuvé | ✅ Existe partiellement | À compléter |

#### ⚠️ POINT CRITIQUE: Fichier du Marché de Base

**Problème Identifié** (commentaire utilisateur):
> "J'avais aussi interrogé sur le fichier du marché de base qui n'a pas été mentionné comme le fichier de l'avenant. On parle ici du fichier de l'avenant mais on ne parle pas du fichier du marché de base. À quel moment ce dernier fichier est capté?"

**Solution**:
- Le fichier du **marché de base** doit être capté à l'étape **ATTRIBUTION** (ou APPROBATION)
- Champ: `attribution.marche_signe_doc`
- Le fichier d'**avenant** est capté à l'étape **EXÉCUTION** → Avenants
- Champ: `avenant.avenant_signe_doc` (**DISTINCT** du marché de base)

**Interface**:
```
📋 ATTRIBUTION
  ├─ Marché de base signé ✅ marche_base_v1.pdf
  └─ ...

📝 EXÉCUTION - Avenants
  ├─ Avenant N°1 ✅ avenant_01.pdf
  ├─ Avenant N°2 ✅ avenant_02.pdf
  └─ ...
```

---

### 4️⃣ PHASE EXÉCUTION

#### Séparation Marché de Base / Avenants

**Problème Identifié** (commentaires utilisateurs):
> "Je te propose de bien séparer et faire distinguer les informations qui concernent le marché/contrat de base et le marché/contrat d'avenant. Fais le stp à tous les niveaux des autres modes."

**Solution**:

##### Marché de Base (Données dans `ordre_service`)
- Numéro OS DEMARRAGE
- Date OS
- Durée d'exécution prévue
- Date de fin prévisionnelle
- Bureau de contrôle
- Bureau d'études

##### Avenants (Données dans table `avenant`)
| Champ | Description | Ajouté |
|-------|-------------|--------|
| `type` | Type d'avenant détaillé (6 types) | ✅ Oui |
| `avenant_signe_doc` | **Fichier avenant signé** (DISTINCT marché de base) | ❌ À ajouter |
| `justificatif_avenant_doc` | Pièces justificatives (obligatoire si ≥30%) | ❌ À ajouter |
| `montant_avant` | Montant du marché avant avenant | ❌ À ajouter |
| `montant_apres` | Montant du marché après avenant | ❌ À ajouter |
| `duree_avant` | Durée avant avenant (jours) | ❌ À ajouter |
| `duree_apres` | Durée après avenant (jours) | ❌ À ajouter |
| `objet_avant` | Objet avant avenant | ❌ À ajouter |
| `objet_apres` | Objet après avenant | ❌ À ajouter |

**Types d'Avenant Détaillés** (selon spécifications):
1. `AVEC_INCIDENCE_FINANCIERE`
2. `SANS_INCIDENCE_FINANCIERE`
3. `PORTANT_SUR_DUREE`
4. `PORTANT_SUR_LIBELLE`
5. `PORTANT_SUR_NATURE_ECO`
6. `MIXTE`

---

### 5️⃣ PHASE CLÔTURE

#### Champs Manquants

| Champ | Description | Statut | Action |
|-------|-------------|--------|--------|
| `date_fin_reelle` | Date de fin réelle du marché | ❌ Manquant | À ajouter |
| `date_dernier_decompte` | Date du dernier décompte | ❌ Manquant | À ajouter |
| `satisfaction_beneficiaires` | Feedback des bénéficiaires | ❌ Manquant | À ajouter |
| `livrables_conformes` | Livrables conformes? (Oui/Non) | ❌ Manquant | À ajouter |

**Règle Métier** (commentaire utilisateur):
> "Ce point fait suite au constat relevé lors des rapports qualités SIDCF sur les marchés achevés. Date du dernier décompte ou capter le dernier OP sur le marché/contrat (pour mieux indiquer que le marché/contrat est terminé)."

**Solution**:
- `date_fin_reelle` = `date_dernier_decompte`
- Cette date marque la **fin effective** du marché
- Permet de calculer les délais réels d'exécution

---

## 🗂️ GESTION DES LOTS

### Cas d'Usage

Les lots s'appliquent aux modes: **PSC, PSL, PSO, AOO, PI**

### Structure de Données

```sql
TABLE lot
├─ id (UUID)
├─ operation_id (FK)
├─ numero (INT) -- Numéro du lot
├─ objet (TEXT) -- Objet du lot
├─ montant_previsionnel_ht (DECIMAL)
├─ montant_previsionnel_ttc (DECIMAL)
├─ livrables_attendus (JSONB) -- [{type, libelle, quantite}]
├─ soumissionnaires (JSONB) -- OPTIONNEL [{entreprise_id, montant_offre}]
├─ attributaire_id (FK entreprise)
└─ montant_attribution_ht/ttc (DECIMAL)
```

### Workflow

```
1. PROCÉDURE
   └─ Créer lots (si marché alloti)

2. Pour chaque lot:
   └─ Optionnel: Ajouter soumissionnaires
   └─ OU: Upload dossier concurrence complet

3. ATTRIBUTION
   └─ Pour chaque lot: Sélectionner attributaire
```

---

## 📍 COORDONNÉES GÉOGRAPHIQUES

### Spécification

> "Coordonnées géographiques du Marché/contrat (arriver au village)"

### Structure de Données

```json
{
  "coordonnees_geo": {
    "region": "Abidjan",
    "departement": "Yopougon",
    "sous_prefecture": "Yopougon",
    "village": "Ananeraie",
    "latitude": 5.3599517,
    "longitude": -4.0082563
  }
}
```

### Interface Utilisateur

```html
<select id="region" required>
  <option value="">-- Région --</option>
  <option value="Abidjan">Abidjan</option>
  <option value="Yamoussoukro">Yamoussoukro</option>
  ...
</select>

<select id="departement" required>
  <option value="">-- Département --</option>
  <!-- Chargement dynamique selon région -->
</select>

<select id="sous_prefecture">
  <option value="">-- Sous-Préfecture --</option>
  <!-- Chargement dynamique selon département -->
</select>

<input type="text" id="village" placeholder="Nom du village">

<!-- Coordonnées GPS (optionnel) -->
<input type="number" step="0.000001" id="latitude">
<input type="number" step="0.000001" id="longitude">

<!-- Optionnel: Carte interactive OpenStreetMap -->
<div id="map" style="height: 300px;"></div>
```

---

## 📐 SEUILS OFFICIELS

### Code des Marchés Publics CI

| Mode | Seuil Minimum | Seuil Maximum | Description |
|------|---------------|---------------|-------------|
| **PSD** | 0 XOF | 10 000 000 XOF | Procédure Simplifiée D'entente Directe |
| **PSC** | 10 000 000 XOF | 30 000 000 XOF | Procédure Simplifiée de demande de Cotation |
| **PSL** | 30 000 000 XOF | 50 000 000 XOF | Procédure Simplifiée à Compétition Limitée |
| **PSO** | 50 000 000 XOF | 100 000 000 XOF | Procédure Simplifiée à Compétition Ouverte |
| **AOO** | 100 000 000 XOF | ∞ | Appel d'Offres Ouvert |
| **PI** | Variable | Variable | Prestations Intellectuelles |

### Validation

```javascript
function validateModePassation(montant, modeSuggere) {
  const seuils = {
    'PSD': { min: 0, max: 10000000 },
    'PSC': { min: 10000000, max: 30000000 },
    'PSL': { min: 30000000, max: 50000000 },
    'PSO': { min: 50000000, max: 100000000 },
    'AOO': { min: 100000000, max: Infinity }
  };

  const seuil = seuils[modeSuggere];

  if (montant < seuil.min || montant >= seuil.max) {
    return {
      conforme: false,
      message: '⚠️ DÉROGATION DÉTECTÉE - Procédure non conforme au barème',
      actionRequise: 'Upload document justificatif obligatoire'
    };
  }

  return { conforme: true };
}
```

---

## 🎨 MAQUETTES INTERFACES

### 1. Écran PLANIFICATION - Coordonnées Géographiques

```
┌─────────────────────────────────────────────────┐
│ 📍 LOCALISATION GÉOGRAPHIQUE                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ Région * [Abidjan ▼]    Département * [Yopougon ▼] │
│                                                 │
│ Sous-Préfecture [Yopougon ▼]    Village [Ananeraie] │
│                                                 │
│ Latitude [5.3599517]    Longitude [-4.0082563]  │
│                                                 │
│ ┌─────────────────────────────────────────┐    │
│ │         🗺️ Carte Interactive            │    │
│ │                                         │    │
│ │              📍 Marker                  │    │
│ │                                         │    │
│ │     (Cliquer pour placer le marqueur)  │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [💾 Enregistrer Localisation]                   │
└─────────────────────────────────────────────────┘
```

### 2. Écran CONTRACTUALISATION - Formulaires Dynamiques

```
┌─────────────────────────────────────────────────┐
│ ⚖️ PROCÉDURE DE PASSATION                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Mode de Passation * [PSD ▼]                     │
│ Montant: 8 500 000 XOF                          │
│                                                 │
│ ✅ Conforme au barème PSD (< 10M XOF)           │
│                                                 │
│ ┌─ Documents PSD ─────────────────────────┐    │
│ │                                         │    │
│ │ Bon de Commande * [📎 Choisir fichier]  │    │
│ │ Facture Proforma * [📎 Choisir fichier] │    │
│ │                                         │    │
│ │ ☐ Prestataire sanctionné (liste noire) │    │
│ │                                         │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [💾 Enregistrer Procédure]                      │
└─────────────────────────────────────────────────┘

─── Si PSC ───

┌─────────────────────────────────────────────────┐
│ ⚖️ PROCÉDURE DE PASSATION                       │
├─────────────────────────────────────────────────┤
│                                                 │
│ Mode de Passation * [PSC ▼]                     │
│ Montant: 25 000 000 XOF                         │
│                                                 │
│ ✅ Conforme au barème PSC (10M - 30M XOF)       │
│                                                 │
│ ┌─ Documents PSC ─────────────────────────┐    │
│ │                                         │    │
│ │ Dossier de Concurrence (ZIP) *         │    │
│ │ [📎 dossier_concurrence.zip]            │    │
│ │                                         │    │
│ │ Formulaire de Sélection *               │    │
│ │ [📎 formulaire_selection.pdf]           │    │
│ │                                         │    │
│ │ Date Ouverture Plis * [2025-11-15]     │    │
│ │ Date Sélection * [2025-11-20]          │    │
│ │                                         │    │
│ │ PV d'Ouverture [📎 Optionnel]           │    │
│ │ Rapport d'Analyse [📎 Optionnel]        │    │
│ │                                         │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─ Gestion des Lots (Optionnel) ──────────┐    │
│ │                                         │    │
│ │ [+ Ajouter un Lot]                      │    │
│ │                                         │    │
│ │ 📦 Lot 1: Fournitures Bureau            │    │
│ │    Montant prévisionnel: 15M XOF        │    │
│ │    [✏️ Modifier] [🗑️ Supprimer]          │    │
│ │                                         │    │
│ │ 📦 Lot 2: Matériel Informatique         │    │
│ │    Montant prévisionnel: 10M XOF        │    │
│ │    [✏️ Modifier] [🗑️ Supprimer]          │    │
│ │                                         │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [💾 Enregistrer Procédure]                      │
└─────────────────────────────────────────────────┘
```

### 3. Écran EXÉCUTION - Séparation Marché/Avenant

```
┌─────────────────────────────────────────────────┐
│ ▶️ EXÉCUTION DU MARCHÉ                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─ 📋 Marché de Base ───────────────────────┐  │
│ │                                           │  │
│ │ Numéro OS: OS-2025-001                    │  │
│ │ Date OS: 2025-01-10                       │  │
│ │ Durée: 180 jours                          │  │
│ │ Date Fin Prévue: 2025-07-09               │  │
│ │                                           │  │
│ │ Fichier Marché: ✅ marche_base_2025.pdf   │  │
│ │                                           │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌─ 📝 Avenants ─────────────────────────────┐  │
│ │                                           │  │
│ │ [+ Ajouter un Avenant]                    │  │
│ │                                           │  │
│ │ ┌─ Avenant N°1 ────────────────────────┐ │  │
│ │ │ Type: AVEC_INCIDENCE_FINANCIERE      │ │  │
│ │ │ Variation: +12 000 000 XOF           │ │  │
│ │ │ Cumul: 12% ⚠️ ALERTE 25% proche      │ │  │
│ │ │                                      │ │  │
│ │ │ Montant AVANT: 100 000 000 XOF       │ │  │
│ │ │ Montant APRÈS: 112 000 000 XOF       │ │  │
│ │ │                                      │ │  │
│ │ │ Fichier: ✅ avenant_01.pdf           │ │  │
│ │ │                                      │ │  │
│ │ │ [✏️ Modifier] [🗑️ Supprimer]          │ │  │
│ │ └──────────────────────────────────────┘ │  │
│ │                                           │  │
│ │ ┌─ Avenant N°2 ────────────────────────┐ │  │
│ │ │ Type: PORTANT_SUR_DUREE              │ │  │
│ │ │ Variation: +30 jours                 │ │  │
│ │ │ Cumul: 12% (inchangé)                │ │  │
│ │ │                                      │ │  │
│ │ │ Durée AVANT: 180 jours               │ │  │
│ │ │ Durée APRÈS: 210 jours               │ │  │
│ │ │                                      │ │  │
│ │ │ Fichier: ✅ avenant_02.pdf           │ │  │
│ │ │                                      │ │  │
│ │ │ [✏️ Modifier] [🗑️ Supprimer]          │ │  │
│ │ └──────────────────────────────────────┘ │  │
│ │                                           │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Écran CLÔTURE - Ajouts

```
┌─────────────────────────────────────────────────┐
│ 🏁 CLÔTURE DU MARCHÉ                            │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─ 📅 Réception Provisoire ───────────────┐    │
│ │ Date Réception Prov * [2025-07-15]     │    │
│ │ Période Garantie * [365] jours         │    │
│ │ PV Réception Prov * [📎 pv_prov.pdf]   │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─ 📆 Fin Réelle du Marché ───────────────┐    │
│ │ Date Dernier Décompte * [2025-07-10]   │    │
│ │ (Marque la fin effective du marché)    │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─ ✅ Réception Définitive ───────────────┐    │
│ │ Date Prévue: 2025-07-15 (calculée)     │    │
│ │ Date Réelle (CF): [2025-07-20]         │    │
│ │ PV Réception Def * [📎 pv_def.pdf]     │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ ┌─ ⭐ Satisfaction Bénéficiaires ─────────┐    │
│ │ Livrables Conformes? ○ Oui ● Non       │    │
│ │                                        │    │
│ │ Commentaires:                          │    │
│ │ ┌────────────────────────────────────┐ │    │
│ │ │ Les travaux ont été réalisés avec │ │    │
│ │ │ quelques réserves mineures...     │ │    │
│ │ └────────────────────────────────────┘ │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ [🔒 CLÔTURER LE MARCHÉ]                         │
│ ⚠️ Action irréversible                          │
└─────────────────────────────────────────────────┘
```

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1: Base de Données (3 jours)

**Tâches**:
1. ✅ Exécuter le script de migration `002_ajustements_post_tests.sql`
2. Créer les nouvelles tables: `lot`, `soumissionnaire`, `referentiel_seuils`
3. Ajouter les 25+ colonnes aux tables existantes
4. Créer les fonctions de validation PostgreSQL
5. Créer les vues métier enrichies
6. Tests de migration sur environnement de développement

**Livrables**:
- ✅ Script SQL complet
- Tests de migration validés
- Documentation schéma mis à jour

### Phase 2: Backend Cloudflare Worker (3 jours)

**Tâches**:
1. Adapter les API endpoints pour les nouveaux champs
2. Implémenter les règles de validation
3. Gérer l'upload multi-fichiers sur Cloudflare R2
4. Créer les endpoints pour gestion des lots
5. Implémenter les fonctions de validation côté serveur
6. Tests API end-to-end

**Livrables**:
- API endpoints mis à jour
- Documentation API (Swagger/OpenAPI)
- Tests Postman validés

### Phase 3: Frontend (5 jours)

**Tâches**:
1. **Jour 1**: Formulaires conditionnels par mode de passation (PSD, PSC, PSL, PSO, AOO, PI)
2. **Jour 2**: Interface coordonnées géographiques + carte interactive (optionnel)
3. **Jour 3**: Gestion des lots (CRUD) + soumissionnaires optionnels
4. **Jour 4**: Séparation visuelle Marché de Base / Avenants
5. **Jour 5**: Écran clôture avec nouveaux champs + tests intégration

**Livrables**:
- Interfaces utilisateur conformes aux maquettes
- Formulaires dynamiques fonctionnels
- Tests utilisateurs validés

### Phase 4: Tests & Documentation (2 jours)

**Tâches**:
1. Tests des workflows complets (6 modes de passation)
2. Validation conformité Code des Marchés CI
3. Tests de performance (charge, latence)
4. Rédaction guide utilisateur
5. Formation utilisateurs clés

**Livrables**:
- Guide utilisateur (PDF)
- Vidéos de formation (optionnel)
- Rapport de conformité

**DURÉE TOTALE: 13 jours ouvrés**

---

## ✅ CHECKLIST DE VALIDATION

### Conformité Métier

- [ ] Les 6 modes de passation sont supportés (PSD, PSC, PSL, PSO, AOO, PI)
- [ ] Les seuils officiels Code des Marchés CI sont implémentés
- [ ] Les formulaires sont adaptatifs selon le mode sélectionné
- [ ] La distinction Marché de Base / Avenants est claire
- [ ] Les lots sont gérables pour PSC, PSL, PSO, AOO, PI
- [ ] Les soumissionnaires sont optionnels (priorité documentation)
- [ ] Les coordonnées géographiques vont jusqu'au village
- [ ] La date de fin réelle = date dernier décompte
- [ ] La satisfaction des bénéficiaires est captée en clôture
- [ ] Tous les documents sont versionnés et traçables

### Technique

- [ ] Migration PostgreSQL exécutée sans erreur
- [ ] Toutes les tables et colonnes créées
- [ ] Les fonctions de validation PostgreSQL fonctionnent
- [ ] Les vues métier retournent les bonnes données
- [ ] Les API Cloudflare Worker répondent en <500ms
- [ ] L'upload multi-fichiers sur R2 fonctionne
- [ ] Les formulaires frontend sont réactifs
- [ ] Les validations côté client et serveur sont cohérentes
- [ ] Les tests end-to-end passent à 100%
- [ ] Les performances sont optimales (<2s chargement page)

### Documentation

- [ ] Schéma de données PostgreSQL documenté
- [ ] Guide utilisateur par mode de passation rédigé
- [ ] Documentation technique développeurs complète
- [ ] Matrice documentaire à jour
- [ ] Règles métier explicites et accessibles

---

## 📞 PROCHAINES ÉTAPES

### Actions Immédiates

1. **Validation du Plan** (Vous)
   - Lire ce document en détail
   - Valider les ajustements proposés
   - Identifier d'éventuels points manquants

2. **Préparation Migration** (Moi)
   - Backup complet base de données PostgreSQL
   - Tests migration sur environnement dev
   - Validation intégrité données

3. **Démarrage Phase 1** (3 jours)
   - Exécution migration PostgreSQL
   - Tests exhaustifs
   - Validation avec équipe technique

### Points de Décision

**1. Carte Interactive pour Coordonnées GPS**
- Option A: Intégration OpenStreetMap (gratuit)
- Option B: Google Maps (payant)
- Option C: Saisie manuelle uniquement
- **Recommandation**: Option A (OpenStreetMap)

**2. Gestion des Soumissionnaires**
- **Décision validée**: Optionnel, privilégier upload documentation

**3. Priorité des Développements**
- Proposition: PSD + PSC d'abord (80% des marchés), puis PSL/PSO/AOO/PI
- À valider selon votre stratégie de déploiement

---

## 📊 RÉCAPITULATIF DES AJUSTEMENTS

| Catégorie | Nombre d'Ajustements | Effort (jours) |
|-----------|----------------------|----------------|
| **Tables Nouvelles** | 2 (lot, soumissionnaire) | 1 |
| **Colonnes Nouvelles** | 25+ | 1 |
| **Fonctions Validation** | 6 | 1 |
| **Vues Métier** | 4 | 0.5 |
| **API Endpoints** | 8+ | 3 |
| **Interfaces Frontend** | 12+ écrans/composants | 5 |
| **Tests & Documentation** | - | 2 |
| **TOTAL** | **50+ ajustements** | **13 jours** |

---

## 📝 DOCUMENTS LIVRÉS

1. ✅ **SPECIFICATIONS_AJUSTEMENTS_v2.md** (50 pages)
   - Spécifications techniques complètes
   - Schémas PostgreSQL détaillés
   - Règles métier
   - Maquettes interfaces

2. ✅ **002_ajustements_post_tests.sql** (600+ lignes)
   - Script de migration PostgreSQL complet
   - Prêt à exécuter
   - Commenté et documenté

3. ✅ **PLAN_AJUSTEMENTS_MARCHES_v2.md** (ce document)
   - Plan d'action exécutif
   - Récapitulatif client-friendly
   - Checklist de validation

---

## 💬 QUESTIONS / CLARIFICATIONS

Si vous avez des questions ou souhaitez des clarifications sur:
- Les choix techniques
- Les priorités d'implémentation
- Les détails d'un ajustement spécifique
- Le planning proposé

N'hésitez pas à me solliciter. Je suis prêt à démarrer la phase d'implémentation dès validation de votre part.

---

**Version**: 2.0
**Date**: 2025-11-17
**Auteur**: Claude Code AI Assistant
**Statut**: 📋 **PLAN COMPLET - EN ATTENTE DE VALIDATION CLIENT**

---

🚀 **Prêt à démarrer la mise en œuvre dès votre validation!**
