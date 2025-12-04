# Plan de Renforcement - Module Investissement DCF

## Statut: ✅ IMPLÉMENTÉ

### Résumé des livrables

| Fichier | Statut | Description |
|---------|--------|-------------|
| `postgres/migrations/012_investissement_enrichment.sql` | ✅ Créé | 10 nouvelles tables, 3 vues, enrichissement tables existantes |
| `postgres/migrations/013_investissement_seed_enriched.sql` | ✅ Créé | Données de démonstration pour tous les cas métier |
| `sidcf-portal/js/datastore/schema.js` | ✅ Modifié | 10 nouvelles entités ajoutées |
| `sidcf-portal/js/config/inv-registries.json` | ✅ Modifié | 15 nouveaux registres |
| `sidcf-portal/js/config/inv-rules-config.json` | ✅ Créé | 15 règles d'alertes paramétrables |
| `postgres/worker/src/index.js` | ✅ Modifié | 10 nouveaux mappings entités |
| `sidcf-portal/js/modules/investissement/screens/inv-dashboard.js` | ✅ Enrichi | Sections OPE, Instruments financiers |

---

# Plan de Renforcement - Module Investissement DCF

## Analyse de l'Existant

### Ce qui est déjà couvert (14 tables, 6 vues)
| Élément | Statut | Commentaire |
|---------|--------|-------------|
| inv_project | ✅ Bon | Structure complète mais enrichissements nécessaires |
| inv_budget | ✅ Bon | Notifié/éclaté présent, revisions JSON |
| inv_budget_breakdown | ✅ Bon | Chaîne budgétaire UA/Activité/Ligne |
| inv_transfer | ✅ Bon | Transferts trimestriels avec OP |
| inv_advance_letter | ✅ Bon | Lettres d'avance avec modalités |
| inv_component | ✅ Bon | Composantes projet |
| inv_activity | ✅ Bon | Activités PTBA |
| inv_physical_tracking | ✅ Bon | RSF + missions terrain |
| inv_financial_status | ✅ Bon | Situation financière consolidée |
| inv_glide | ✅ Bon | Glissements inter-annuels |
| inv_gar_indicator | ✅ Bon | Indicateurs GAR 3 niveaux |
| inv_evaluation | ✅ Bon | Évaluations GAR |
| inv_alert | ✅ Bon | Alertes automatiques |
| inv_document | ✅ Bon | Documents projet |

### Ce qui est superficiel ou absent

#### AXE A - Fiche signalétique Projet
| Besoin | Statut | Action |
|--------|--------|--------|
| Distinction SIGOBE_DIRECT | ❌ Absent | Renommer type_projet pour clarifier |
| dans_perimetre_controle_dcf | ❌ Absent | Ajouter champ |
| statut_temporal (NOUVEAU/REAPPARU) | ⚠️ Partiel | Enrichir nature_projet |
| Historique présence PIP | ❌ Absent | Ajouter table inv_pip_history |
| Critères OPE paramétrables | ❌ Absent | Ajouter table inv_ope_criteria |
| Acteurs étendus | ⚠️ Partiel | Ajouter autres rôles |

#### AXE B - Chaîne Notifié → Éclaté → Transféré → Exécuté
| Besoin | Statut | Action |
|--------|--------|--------|
| Source budget (LF initiale/rectificative) | ❌ Absent | Ajouter champ source_lf |
| Autorisation d'exécuter | ❌ Absent | Calculer montant_transfere + reports |
| Reports d'exercice | ❌ Absent | Ajouter champ reports_anterieurs |
| Blocage 2e transfert si pas éclaté | ⚠️ Logique | Implémenter dans règles |

#### AXE C - Lettres d'avance, OP provisoires, Régies
| Besoin | Statut | Action |
|--------|--------|--------|
| Lettres d'avance | ✅ Couvert | Structure existante OK |
| OP provisoires | ❌ Absent | Créer table inv_provisional_op |
| Régies | ❌ Absent | Créer table inv_imprest |
| Alerte délai lettre avance | ⚠️ Partiel | Améliorer calcul |

#### AXE D - Suivi physique & RSF
| Besoin | Statut | Action |
|--------|--------|--------|
| RSF avec classe 2/6 | ✅ Couvert | Existant |
| Baseline à l'OS démarrage | ⚠️ Partiel | Ajouter flag is_baseline |
| Lien livrable spécifique | ⚠️ Partiel | Améliorer |

#### AXE E - Pluriannualité & soutenabilité
| Besoin | Statut | Action |
|--------|--------|--------|
| Glissements par année | ✅ Couvert | inv_glide existe |
| Suivi trimestriel | ❌ Absent | Ajouter table inv_quarterly_tracking |
| Trajectoire vs réel | ⚠️ Partiel | Améliorer vues |

#### AXE F - GAR
| Besoin | Statut | Action |
|--------|--------|--------|
| Indicateurs 3 niveaux | ✅ Couvert | OUTPUT/OUTCOME/IMPACT |
| Valeurs périodiques | ⚠️ Partiel | Créer table inv_gar_values |
| Validation CF/technique | ⚠️ Partiel | Améliorer workflow |

#### AXE G - Gouvernance & Documentation
| Besoin | Statut | Action |
|--------|--------|--------|
| Documents projet | ✅ Couvert | inv_document existe |
| Matrice documentaire | ❌ Absent | Créer table inv_doc_matrix |
| Fiches de décision CF | ❌ Absent | Créer table inv_decision |

#### AXE H - Vision Portefeuille
| Besoin | Statut | Action |
|--------|--------|--------|
| Par bailleur | ✅ Couvert | Vue SQL existe |
| Par ministère | ✅ Couvert | Vue SQL existe |
| Par UCP/EPN | ✅ Couvert | Vue SQL existe |
| Par région | ✅ Couvert | Vue SQL existe |
| Vue OPE dédiée | ❌ Absent | Créer vue v_inv_portfolio_ope |
| Par secteur | ⚠️ Partiel | Améliorer |

#### AXE I - Paramétrage & moteur d'alertes
| Besoin | Statut | Action |
|--------|--------|--------|
| Règles paramétrables | ❌ Absent | Créer table inv_settings |
| Types d'alertes extensibles | ⚠️ Partiel | Registre JSON existe |
| Calcul dynamique | ❌ Absent | Créer moteur JS |

---

## Plan d'Implémentation

### Migration 012: Enrichissement schéma

```sql
-- Nouveaux champs inv_project
ALTER TABLE inv_project ADD COLUMN IF NOT EXISTS dans_perimetre_dcf VARCHAR(20) DEFAULT 'OUI';
ALTER TABLE inv_project ADD COLUMN IF NOT EXISTS statut_temporal VARCHAR(50);
ALTER TABLE inv_project ADD COLUMN IF NOT EXISTS historique_pip JSONB DEFAULT '[]';
ALTER TABLE inv_project ADD COLUMN IF NOT EXISTS acteurs JSONB DEFAULT '{}';

-- Nouveaux champs inv_budget
ALTER TABLE inv_budget ADD COLUMN IF NOT EXISTS source_lf VARCHAR(50) DEFAULT 'LF_INITIALE';
ALTER TABLE inv_budget ADD COLUMN IF NOT EXISTS reports_anterieurs DECIMAL(18,2) DEFAULT 0;
ALTER TABLE inv_budget ADD COLUMN IF NOT EXISTS autorisation_executer DECIMAL(18,2) DEFAULT 0;

-- Table OP Provisoires
CREATE TABLE inv_provisional_op (...)

-- Table Régies
CREATE TABLE inv_imprest (...)

-- Table Suivi trimestriel
CREATE TABLE inv_quarterly_tracking (...)

-- Table Valeurs GAR périodiques
CREATE TABLE inv_gar_values (...)

-- Table Matrice documentaire
CREATE TABLE inv_doc_matrix (...)

-- Table Décisions CF/DCF
CREATE TABLE inv_decision (...)

-- Table Paramètres / Règles
CREATE TABLE inv_settings (...)

-- Table Critères OPE
CREATE TABLE inv_ope_criteria (...)

-- Table Historique PIP
CREATE TABLE inv_pip_history (...)
```

### Fichiers à modifier/créer

#### Backend (Worker API)
- `postgres/worker/src/index.js` - Ajouter mappings nouvelles entités

#### Schémas JS
- `sidcf-portal/js/datastore/schema.js` - Ajouter nouvelles entités

#### Configuration
- `sidcf-portal/js/config/inv-registries.json` - Enrichir registres
- `sidcf-portal/js/config/inv-rules-config.json` - NOUVEAU: Règles alertes

#### Écrans
- `inv-dashboard.js` - KPIs enrichis, alertes OPE
- `inv-projets-list.js` - Filtres enrichis
- `inv-projet-fiche.js` - Onglets enrichis (8+ onglets)
- `inv-portefeuille.js` - Vue OPE dédiée
- `inv-alertes.js` - Moteur d'alertes dynamique

#### Nouveaux écrans potentiels
- `inv-parametrage.js` - Écran admin pour règles
- `inv-ope-dashboard.js` - Dashboard OPE dédié
