# Seed Data - SIDCF Portal Module Marchés Publics

## Fichier: `seed-comprehensive.json`

### Description
Jeu de données complet et représentatif pour le système SIDCF Portal - Module Marchés Publics de Côte d'Ivoire.
Ce fichier contient des données réalistes couvrant tous les aspects du cycle de vie des marchés publics sur 3 années (2023-2025).

### Statistiques Globales

| Entité | Nombre | Description |
|--------|---------|-------------|
| **PPM_PLAN** | 3 | Plans de Passation des Marchés (2023, 2024, 2025) |
| **OPERATION** | 20 | Opérations de marchés (13 en 2023-2024, 3 en 2025) |
| **BUDGET_LINE** | 20 | Lignes budgétaires complètes |
| **ENTREPRISE** | 15 | Entreprises ivoiriennes réalistes |
| **GROUPEMENT** | 5 | Groupements/Consortiums |
| **PROCEDURE** | 17 | Procédures de passation (AOO, PSD, PSO, PSC, CI) |
| **RECOURS** | 2 | Recours soumissionnaires |
| **ATTRIBUTION** | 14 | Attributions de marchés |
| **VISA_CF** | 11 | Visas Contrôle Financier |
| **ORDRE_SERVICE** | 3 | Ordres de service (démarrage) |
| **AVENANT** | 3 | Avenants aux marchés |
| **RESILIATION** | 2 | Résiliations de marchés |
| **GARANTIE** | 13 | Garanties (Bonne Exécution, Retenue Garantie) |
| **CLOTURE** | 5 | Clôtures de marchés (PV Provisoire/Définitif) |
| **ANO** | 12 | Avis de Non-Objection |
| **ECHEANCIER** | 1 | Échéancier (pour grand projet) |
| **CLE_REPARTITION** | 1 | Clé de répartition multi-bailleurs |
| **DOCUMENT** | 0 | Documents stockés en Base64 dans localStorage |
| **DECOMPTE** | 0 | Décomptes (à implémenter) |
| **DIFFICULTE** | 0 | Difficultés (à implémenter) |

**Taille totale:** 128 KB

---

## Détail des Opérations

### Année 2023 (7 opérations)

#### OP-2023-001 - CLOS ✅
- **Objet:** Construction de 20 salles de classe à Bouaké
- **Montant:** 380 MFCFA
- **Titulaire:** ENT-001 (SOBEA Construction)
- **État:** CLOS
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, GARANTIE (mainlevée), CLOTURE

#### OP-2023-002 - CLOS ✅
- **Objet:** Fourniture d'équipements médicaux
- **Montant:** 850 MFCFA
- **Titulaire:** GRP-004 (Consortium SATMACI-PHARMACO)
- **État:** CLOS
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, GARANTIE (mainlevée), CLOTURE

#### OP-2023-003 - EXECUTION 🚧
- **Objet:** Réhabilitation route Yamoussoukro-Bouaké (75km)
- **Montant initial:** 12.5 MdsFCFA → **14.375 MdsFCFA** (avec avenant +15%)
- **Titulaire:** GRP-001 (Groupement COLAS-SOBEA)
- **État:** EXECUTION
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, ORDRE_SERVICE, AVENANT, GARANTIE (active), ECHEANCIER, CLE_REPARTITION

#### OP-2023-004 - CLOS ✅
- **Objet:** Étude d'impact environnemental
- **Montant:** 125 MFCFA
- **Titulaire:** ENT-008 (ETSO Études & Conseils)
- **État:** CLOS
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, GARANTIE (mainlevée), CLOTURE

#### OP-2023-005 - CLOS ✅
- **Objet:** Acquisition mobilier de bureau (500 lots)
- **Montant:** 45 MFCFA
- **Titulaire:** ENT-010 (MOBILEX)
- **État:** CLOS
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, GARANTIE (mainlevée), CLOTURE

#### OP-2023-006 - CLOS ✅
- **Objet:** Entretien climatisation bâtiments administratifs
- **Montant:** 18 MFCFA
- **Titulaire:** ENT-011 (CLIMATIC Services)
- **État:** CLOS
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, GARANTIE (mainlevée), CLOTURE

#### OP-2023-007 - RESILIE ❌
- **Objet:** Construction pont sur le fleuve Sassandra
- **Montant:** 2.8 MdsFCFA → **2.45 MdsFCFA** (après résiliation)
- **Titulaire:** ENT-002 (COLAS)
- **État:** RESILIE
- **Motif résiliation:** Non-respect délais et abandon chantier
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, RESILIATION, GARANTIE (appelée)

---

### Année 2024 (10 opérations)

#### OP-2024-001 - EXECUTION 🚧
- **Objet:** Construction centre de santé rural à Korhogo
- **Montant initial:** 250 MFCFA → **307.5 MFCFA** (avec avenant +23%)
- **Titulaire:** ENT-004 (SOTRA-BTP)
- **État:** EXECUTION
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, ORDRE_SERVICE, AVENANT, GARANTIE (active)

#### OP-2024-002 - ATTRIBUE 📋
- **Objet:** Acquisition de 15 véhicules 4x4
- **Montant:** 75 MFCFA
- **Titulaire:** ENT-012 (AUTO-MECA)
- **État:** ATTRIBUE (signature en attente)
- **Entités associées:** PROCEDURE, ATTRIBUTION

#### OP-2024-003 - PLANIFIE 📅
- **Objet:** Étude de faisabilité projet routier Abidjan-Yamoussoukro
- **Montant:** 180 MFCFA
- **État:** PLANIFIE
- **Entités associées:** Aucune (pas encore de procédure lancée)

#### OP-2024-004 - EN_PROC 🔄
- **Objet:** Forage et équipement de 50 pompes hydrauliques
- **Montant:** 320 MFCFA
- **État:** EN_PROC (analyse des offres en cours)
- **Entités associées:** PROCEDURE (en analyse)

#### OP-2024-005 - EN_PROC 🔄
- **Objet:** Formation continue agents publics (500 personnes)
- **Montant:** 35 MFCFA
- **État:** EN_PROC (analyse des offres en cours)
- **Entités associées:** PROCEDURE (en analyse)

#### OP-2024-006 - VISE 📝
- **Objet:** Acquisition équipements pompiers
- **Montant:** 650 MFCFA
- **Titulaire:** ENT-005 (SATMACI)
- **État:** VISE (visa CF en cours)
- **Entités associées:** PROCEDURE, ATTRIBUTION, ANO, VISA_CF (en instruction)

#### OP-2024-007 - EXECUTION 🚧
- **Objet:** Réhabilitation MACA Abidjan
- **Montant initial:** 480 MFCFA → **576 MFCFA** (avec avenant +20%)
- **Titulaire:** ENT-006 (AIGLE D'OR BTP)
- **État:** EXECUTION
- **Entités associées:** PROCEDURE, ATTRIBUTION, VISA_CF, ANO, ORDRE_SERVICE, AVENANT, GARANTIE (active)

#### OP-2024-008 - EN_PROC 🔄
- **Objet:** Installation panneaux solaires dans 30 établissements scolaires
- **Montant:** 890 MFCFA
- **Titulaire pressenti:** GRP-005 (Groupement SOLAR-TECH / CFAO)
- **État:** EN_PROC (attribution en cours)
- **Entités associées:** PROCEDURE (en attribution), ATTRIBUTION (provisoire)

#### OP-2024-009 - VISE 📝
- **Objet:** Fourniture moustiquaires imprégnées (2M unités)
- **Montant:** 720 MFCFA
- **Titulaire:** ENT-013 (PHARMACO-CI)
- **État:** VISE (visa CF en cours)
- **Entités associées:** PROCEDURE, ATTRIBUTION, ANO, VISA_CF (en instruction)

#### OP-2024-010 - RESILIE ❌
- **Objet:** Aménagement périmètres rizicoles (500 hectares)
- **Montant:** 1.2 MdsFCFA → **1.02 MdsFCFA** (après résiliation)
- **Titulaire:** GRP-002 (Consortium AGRO-PLUS / HYDRO-CI)
- **État:** RESILIE
- **Motif résiliation:** Réaffectation budgétaire (autorité contractante)
- **Entités associées:** PROCEDURE, ATTRIBUTION, ANO, RESILIATION

---

### Année 2025 (3 opérations)

#### OP-2025-001 - PLANIFIE 📅
- **Objet:** Réfection voirie quartiers Abidjan (25km)
- **Montant:** 3.5 MdsFCFA
- **État:** PLANIFIE
- **Entités associées:** Aucune

#### OP-2025-002 - PLANIFIE 📅
- **Objet:** Déploiement infrastructure réseau fibre optique
- **Montant:** 1.85 MdsFCFA
- **État:** PLANIFIE
- **Entités associées:** Aucune

#### OP-2025-003 - EN_PROC 🔄
- **Objet:** Formation agents protection civile (300 personnes)
- **Montant:** 42 MFCFA
- **État:** EN_PROC (analyse des offres)
- **Entités associées:** PROCEDURE (en analyse)

---

## Répartition par État

| État | Nombre | Opérations |
|------|---------|-----------|
| **PLANIFIE** | 3 | OP-2024-003, OP-2025-001, OP-2025-002 |
| **EN_PROC** | 4 | OP-2024-004, OP-2024-005, OP-2024-008, OP-2025-003 |
| **ATTRIBUE** | 1 | OP-2024-002 |
| **VISE** | 2 | OP-2024-006, OP-2024-009 |
| **EXECUTION** | 3 | OP-2023-003, OP-2024-001, OP-2024-007 |
| **RESILIE** | 2 | OP-2023-007, OP-2024-010 |
| **CLOS** | 5 | OP-2023-001, OP-2023-002, OP-2023-004, OP-2023-005, OP-2023-006 |

---

## Cas d'Usage Couverts

### ✅ Cycle de vie complet
- 5 marchés clôturés avec PV provisoire et définitif
- 3 marchés en exécution avec OS et suivi
- 2 marchés visés par le CF
- 1 marché attribué en attente signature
- 4 marchés en procédure
- 3 marchés en planification

### ✅ Modifications contractuelles
- 3 avenants (augmentation 15%, 20%, 23%)
- Calcul du cumul des avenants
- Prolongation de délais

### ✅ Incidents
- 2 résiliations (faute entrepreneur + autorité contractante)
- 2 recours RGMP (1 rejeté, 1 accepté)
- 1 garantie appelée (résiliation)

### ✅ Garanties financières
- 8 garanties de Bonne Exécution
- 5 Retenues de Garantie
- Mainlevées pour marchés clôturés
- Garantie appelée pour marché résilié

### ✅ Financements complexes
- Multi-bailleurs (BM 70% + TRESOR 30% pour OP-2023-003)
- Échéancier de paiement en 7 tranches
- Différents types: Trésor, Emprunt, Don

### ✅ Types de marchés
- **TRAVAUX:** Infrastructure routière, bâtiments, forages, énergie
- **FOURNITURES:** Équipements médicaux, véhicules, mobilier, moustiquaires
- **SERVICES_INTELLECTUELS:** Études d'impact, faisabilité, formation
- **SERVICES_COURANTS:** Maintenance climatisation

### ✅ Modes de passation
- **AOO:** Appel d'Offres Ouvert (grands projets)
- **PSD:** Prestation Sur Devis (fournitures)
- **PSO:** Prestation Simplifiée Ouverte (services intellectuels)
- **PSC:** Prestation Simplifiée Concurrentielle (services courants)
- **CI:** Comparaison d'Initiatives (prestations intellectuelles)

### ✅ Acteurs économiques
- 15 entreprises ivoiriennes (construction, fournitures, services, études)
- 5 groupements/consortiums (solidaires et conjoints)
- Titulaires individuels et groupés

---

## Utilisation

### Chargement initial
```javascript
import datastore from './js/datastore/datastore.js';

// Charger le seed
const response = await fetch('/js/datastore/seed-comprehensive.json');
const seedData = await response.json();

// Importer dans le datastore
await datastore.importSeedData(seedData);

console.log('Seed data loaded!');
```

### Vérification
```javascript
const operations = await datastore.getAll('OPERATION');
console.log(`${operations.length} opérations chargées`);

const clos = operations.filter(op => op.etat === 'CLOS');
console.log(`${clos.length} marchés clôturés`);

const enExec = operations.filter(op => op.etat === 'EXECUTION');
console.log(`${enExec.length} marchés en exécution`);
```

---

## Notes Techniques

### Cohérence des données
- Toutes les dates sont cohérentes avec le cycle de vie
- Les montants correspondent entre les entités liées
- Les IDs de référence sont tous valides
- Les états sont conformes au workflow

### Données réalistes
- Noms d'entreprises ivoiriennes authentiques
- Coordonnées GPS réelles des localités
- Montants en FCFA conformes aux marchés publics CI
- Références au Code des Marchés Publics CI

### Performance
- Fichier optimisé: 128 KB
- Chargement rapide
- Structure JSON valide
- Indexation efficace par IDs

---

## Évolutions Possibles

### Extensions recommandées
1. Ajouter 30+ opérations supplémentaires pour atteindre ~150 opérations
2. Enrichir les entités DOCUMENT (exemples Base64)
3. Ajouter des DECOMPTE pour les marchés en exécution
4. Créer des DIFFICULTE pour illustrer le suivi des problèmes
5. Ajouter plus de recours RGMP
6. Créer des ANO avec rejets et conditions

### Cas d'usage additionnels
- Marchés à prix révisable
- Sous-traitance
- Nantissement
- Suspension de marché
- Ordres d'arrêt
- Pénalités de retard
- Révision de prix

---

## Support

Pour toute question sur les données seed:
- Consulter la documentation dans `/sidcf-portal/docs/`
- Vérifier les schémas de données dans `/sidcf-portal/js/models/`
- Référence: `rules-config.json` pour les règles métier

---

**Généré le:** 2025-01-14
**Version:** 1.0
**Auteur:** Claude Code (Anthropic)
