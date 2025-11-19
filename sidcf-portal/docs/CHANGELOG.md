# 📝 Changelog - SIDCF Portal Module Marchés

Toutes les modifications notables de ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2025-11-12

### 🎉 Livraison Majeure - MVP Production v2.0

Finalisation et renforcement du Module Marchés pour conformité complète au Code des Marchés CI et pratiques DCF/DGMP.

### ✨ Ajouté

#### Entités de Données
- **GROUPEMENT**: Gestion des groupements d'entreprises (co-traitance/sous-traitance)
  - Champs: libelle, nature, mandataireId, membres, banque, compte, actif
  - Support mandataire + co-traitants + sous-traitants avec parts en %
- **ANO**: Avis de Non-Objection (DGMP/Bailleurs)
  - Types: PROCEDURE, AVENANT
  - Workflow: demande → réponse (ACCORD/REFUS/EN_ATTENTE)
  - Organismes: DGMP, Bailleurs (BM, BAD, UE, AFD, etc.)
- **DOCUMENT**: Gestion documentaire enrichie
  - Phase: INVITATION, OUVERTURE, ANALYSE, JUGEMENT, APPROBATION, EXECUTION, CLOTURE
  - typeDocument mappé sur pieces-matrice.json
  - Statuts: DRAFT, VALIDE, REJETE
  - Versioning, validation workflow

#### Entités Enrichies
- **ENTREPRISE**:
  - `ncc` (Numéro Compte Contribuable - identifiant unique)
  - `rccm`, `sigle`, `ifu`
  - `contacts` (array de contacts multiples)
  - `banque.code`, `banque.libelle`, `banque.agence`
  - `compte.type` (IBAN/RIB), `compte.numero`, `compte.intitule`
- **OPERATION**:
  - `procDerogation` (détection automatique + justificatifs)
  - Timeline étendue (PLANIF → PROC → ATTR → VISE → EXEC → CLOT)

#### Configuration & Règles

**pieces-matrice.json** (NEW - 400 lines)
- 7 phases documentaires complètes
- 44 types de pièces référencés
- Mapping par phase + mode de passation + ANO
- Pièces obligatoires vs optionnelles
- Description détaillée par document
- Règles ANO intégrées (modes/bailleurs/seuils)

**rules-config.json** (ENRICHED - +150 lines)
- Section `ano`:
  - `modes_requierant_ano`: ["AOO", "AON"]
  - `bailleurs_requierant_ano`: ["BM", "BAD", "UE", "AFD", "BEI", "BADEA"]
  - Seuils par type marché (TRAVAUX: 100M, FOURNITURES: 50M, SERVICES: 30M)
  - `delai_reponse_max`: 30 jours
  - `ano_avenant.enabled`: true, seuil 15%
- Section `garanties`:
  - Taux garantie avance: 10-15%
  - Taux garantie bonne exécution: 5-10%
  - Retenue de garantie: 10%
  - Durées (avance: 365j, bonne exec: 730j)
- Section `referentiels`:
  - 16 référentiels complets (modes, types, décisions, motifs, etc.)
  - Décisions CF: VISA, RESERVE, REFUS avec motifs détaillés
  - Types avenants: FINAN, DUREE, MIXTE, TECH
  - Motifs avenants: 7 motifs standards
  - Types garanties: 4 types
  - Types recours + décisions
  - Types OS
  - Sources financement (8 bailleurs)

#### Écrans

**ecr03b-echeancier-cle.js** (NEW - 450 lines)
- Échéancier de paiement (périodique ou libre)
- Clé de répartition pluri-annuelle/pluri-bailleurs
- Validations automatiques:
  - Σ montants = montant marché (tolerance 1 XOF)
  - Σ % = 100% (tolerance 0.01%)
- Interface tableau dynamique
- Recalcul automatique des %
- Alertes visuelles (rouge si invalide, vert si OK)
- CRUD lignes (ajout/suppression/modification)

#### Composants UI

**document-checklist.js** (NEW - 350 lines)
- Widget checklist pièces par phase
- Filtre automatique par mode de passation
- Stats: Total / Fournis / Manquants
- Badges visuels:
  - ✅ Fourni (vert)
  - ⛔ Manquant obligatoire (rouge)
  - ⚠️ Optionnel (orange)
- Versioning documents
- Upload + View callbacks
- Mode compact pour dashboard (renderChecklistSummary)
- Calcul complétude par phase (%)

#### Documentation

**LIVRAISON_FINALE.md** (NEW - 1000+ lines)
- Architecture technique complète
- 16 entités documentées
- 8 écrans fonctionnels détaillés
- 6 scénarios de test end-to-end
- Guide UX/UI avec design system
- API Data Service reference
- Adapter pattern (localStorage/Airtable)
- Checklist déploiement
- Métriques qualité
- Roadmap phases 1-3
- Support & troubleshooting

**CHANGELOG.md** (THIS FILE)
- Historique complet des modifications

### 🔄 Modifié

#### Schémas
- `ENTREPRISE`: Structure enrichie (ncc, rccm, contacts[], banque{}, compte{})
- `DOCUMENT`: Ajout phase, typeDocument, obligatoire, statut, validation workflow
- `ENTITIES`: Ajout GROUPEMENT, ANO dans la liste

#### Écrans Existants
- **ecr02a-procedure-pv.js**: Workflow ANO préparé (structure pour intégration future)
- **ecr03a-attribution.js**: Structure adaptée pour référentiel ENTREPRISE/GROUPEMENT (à compléter)
- **ecr04b-avenants.js**: ANO avenant préparé (>15% bailleurs)

#### Routes
- `/echeancier`: Passage de stub à écran fonctionnel (renderEcheancierCle)

### 🐛 Corrigé
- Schema ATTRIBUTION: Mapping correct avec existing structure (singleOrGroup, entreprises[])
- Timeline state updates: Utilisation spread operator au lieu de push direct
- Document checklist: Gestion des modes "ALL" dans le filtre

### 📚 Documentation
- flux-budget-marche.md: Ajout section ANO, échéancier, clé de répartition
- DEVELOPER_GUIDE.md: Templates mis à jour avec nouvelles entités
- IMPLEMENTATION_SUMMARY.md: Mise à jour métriques (44% → 50% complété)

### 🔧 Configuration
- app-config.json: Structure Airtable adapter ready
- rules-config.json: +150 lines de règles métier
- pieces-matrice.json: 400 lines matrice documentaire

---

## [1.1.0] - 2025-11-12 (Session Précédente)

### ✨ Ajouté

#### Écrans
- **ecr02a-procedure-pv.js** (280 lines): Procédure avec dérogation automatique
- **ecr03a-attribution.js** (650 lines): Attribution simple/groupement
- **ecr04a-visa-cf.js** (350 lines): Visa CF (VISA/RESERVE/REFUS)
- **ecr04a-execution-os.js** (430 lines): Exécution & Ordres de Service

#### Fonctionnalités
- Dérogation automatique (procédure hors barème)
- Upload document obligatoire si dérogation
- Timeline avec 6 états (PLANIF → PROC → ATTR → VISE → EXEC → CLOT)
- Delay alert (>30 jours après visa sans OS)
- Attribution entreprise simple ou groupement
- Calcul automatique TTC (HT × (1 + TVA%))
- OS types: DEMARRAGE, ARRET, REPRISE, COMPLEMENTAIRE

#### Documentation
- **flux-budget-marche.md** (600 lines): Business flows complets
- **DEVELOPER_GUIDE.md** (400 lines): Guide développeur avec templates
- **IMPLEMENTATION_SUMMARY.md** (650 lines): Résumé de session

### 🔄 Modifié
- Timeline widget: Navigation click-to-navigate
- OPERATION schema: Ajout `procDerogation` flag

### 📊 Métriques
- Écrans: 7/16 (44%)
- Ligne de code: ~6 000

---

## [1.0.0] - 2025-11-10 (Version Initiale)

### ✨ Ajouté

#### Architecture
- Router hash-based (#/route)
- Data Service avec adapter pattern
- LocalStorage adapter (default)
- Schema 13 entités initiales

#### Écrans
- **ecr01a-import-ppm.js**: Import PPM Excel (placeholder)
- **ecr01b-ppm-unitaire.js**: Liste PPM avec filtres basiques
- **ecr01c-fiche-marche.js**: Hub central / fiche marché
- **ecr04b-avenants.js**: Avenants avec seuils 25/30%

#### Widgets
- **steps.js**: Timeline 6 états
- **drawer.js**: Slide-in panel
- **budget-line-viewer.js**: Viewer BUDGET_LINE (18 champs)

#### Configuration
- **rules-config.json**: Barèmes, seuils, validations
- **app-config.json**: Config application
- **seed.json**: Données d'exemple

#### CSS
- Design system (variables, base, layout, components)
- 400+ lines de styles

#### Documentation
- README.md
- README_INTEGRATION.md
- INTEGRATION_REPORT.md

### 📊 Métriques Initiales
- Écrans: 4/16 (25%)
- Entités: 13
- Widgets: 3
- Ligne de code: ~4 000

---

## Légende

- ✨ Ajouté: Nouvelles fonctionnalités
- 🔄 Modifié: Modifications de fonctionnalités existantes
- 🐛 Corrigé: Corrections de bugs
- 📚 Documentation: Ajouts/modifications documentation
- 🔧 Configuration: Changements de configuration
- 🗑️ Supprimé: Fonctionnalités retirées
- 🔒 Sécurité: Corrections de vulnérabilités
- ⚡ Performance: Optimisations
- 🎨 UI/UX: Améliorations interface

---

## Roadmap

### [2.1.0] - Phase 1 Completion (Prévu: 1-2 semaines)

**Écrans Prioritaires**:
- [ ] ecr02b-recours.js (2h)
- [ ] ecr04c-garanties-resiliation.js (2h)
- [ ] ecr05-cloture-receptions.js (2h)

**Estimation**: 6h

### [2.2.0] - Phase 2 Dashboards (Prévu: 2-3 semaines)

**Dashboards & Admin**:
- [ ] ecr06-dashboard-cf.js (3h)
- [ ] ecr07-admin-parametres.js (3h)

**Estimation**: 6h

### [3.0.0] - Phase 3 Enrichissements (Prévu: 1 mois)

**Features Avancées**:
- [ ] PPM List Enhanced (20 colonnes + filtres cascade) (3h)
- [ ] PPM Create Line (2h)
- [ ] Airtable Adapter complet (4h)
- [ ] Excel Import/Export avancé (5h)
- [ ] Search & Filters avancés (4h)

**Estimation**: 18h

### [4.0.0] - Phase 4 Production (Prévu: 2 mois)

**Production Ready**:
- [ ] Performance optimizations (virtual scroll, workers)
- [ ] UX polish (modals, toasts, animations, dark mode)
- [ ] Security (auth JWT, RBAC, audit trail)
- [ ] Reporting (PDF, charts, tableaux de bord)
- [ ] Mobile responsive
- [ ] Accessibility (ARIA, keyboard)
- [ ] Cross-browser testing
- [ ] Load testing (>1000 operations)

---

**Maintenu par**: Équipe SIDCF Dev
**License**: Propriétaire - Gouvernement de Côte d'Ivoire
**Contact**: [Email équipe]
