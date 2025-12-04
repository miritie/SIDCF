-- ============================================
-- SIDCF Portal - Module Investissement Schema
-- ============================================
-- Migration: 010_investissement_schema.sql
-- Description: Création des tables pour le module Investissement (PIP)
-- Objectif: Suivi des Projets d'Investissement Publics selon la logique ivoirienne
--
-- Workflow: Notifié → Transféré → Budget éclaté → Exécuté
-- Types de projets: SIGOBE | Transfert | Hors SIGOBE
-- ============================================

-- Enable UUID extension (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INV_PROJECT - Projets d'investissement
-- ============================================
CREATE TABLE IF NOT EXISTS inv_project (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    code VARCHAR(50) UNIQUE NOT NULL,              -- Code SIGOBE ou interne
    nom TEXT NOT NULL,                              -- Nom du projet
    description TEXT,

    -- Classification
    type_projet VARCHAR(50) NOT NULL DEFAULT 'SIGOBE'
        CHECK (type_projet IN ('SIGOBE', 'TRANSFERT', 'HORS_SIGOBE')),
    nature_projet VARCHAR(50) DEFAULT 'NOUVEAU'
        CHECK (nature_projet IN ('NOUVEAU', 'RECURRENT', 'NOUVELLE_PHASE')),
    is_ope BOOLEAN DEFAULT FALSE,                   -- Opération Prioritaire de l'État
    is_prioritaire BOOLEAN DEFAULT FALSE,

    -- Entité exécutante
    type_entite VARCHAR(50) NOT NULL DEFAULT 'ADMIN'
        CHECK (type_entite IN ('UCP', 'EPN', 'COLLECTIVITE', 'ADMIN')),
    entite_executante VARCHAR(255),                 -- Nom de l'UCP/EPN/Collectivité
    entite_code VARCHAR(50),

    -- Cadre institutionnel
    ministere VARCHAR(255),
    ministere_code VARCHAR(50),
    secteur VARCHAR(255),                           -- Éducation, Santé, Routes, etc.
    secteur_code VARCHAR(50),
    domaine VARCHAR(255),                           -- Construction d'école, Centre de santé, etc.

    -- Localisation
    district VARCHAR(255),
    region VARCHAR(255),
    departement VARCHAR(255),
    commune VARCHAR(255),
    localisation_detail TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Financier global
    cout_total DECIMAL(18, 2) DEFAULT 0,            -- Coût total du projet
    devise VARCHAR(10) DEFAULT 'XOF',
    duree_prevue_mois INTEGER DEFAULT 12,
    date_debut_prevue DATE,
    date_fin_prevue DATE,

    -- Sources de financement (résumé)
    part_etat DECIMAL(18, 2) DEFAULT 0,
    part_bailleur DECIMAL(18, 2) DEFAULT 0,
    part_contrepartie DECIMAL(18, 2) DEFAULT 0,
    bailleurs JSONB DEFAULT '[]'::jsonb,            -- [{code, nom, montant, devise}]

    -- Acteurs
    controleur_financier VARCHAR(255),
    coordonnateur VARCHAR(255),
    responsable_financier VARCHAR(255),
    specialiste_marche VARCHAR(255),

    -- Statut workflow
    statut VARCHAR(50) DEFAULT 'PLANIFIE'
        CHECK (statut IN ('PLANIFIE', 'EN_COURS', 'SUSPENDU', 'TERMINE', 'ABANDONNE')),
    phase VARCHAR(50) DEFAULT 'NOTIFIE'
        CHECK (phase IN ('NOTIFIE', 'TRANSFERE', 'ECLATE', 'EXECUTE')),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_project_code ON inv_project(code);
CREATE INDEX idx_inv_project_type ON inv_project(type_projet);
CREATE INDEX idx_inv_project_entite ON inv_project(type_entite);
CREATE INDEX idx_inv_project_secteur ON inv_project(secteur_code);
CREATE INDEX idx_inv_project_ministere ON inv_project(ministere_code);
CREATE INDEX idx_inv_project_statut ON inv_project(statut);
CREATE INDEX idx_inv_project_ope ON inv_project(is_ope);

COMMENT ON TABLE inv_project IS 'Projets d''investissement publics (PIP)';

-- ============================================
-- 2. INV_BUDGET - Budgets par année
-- ============================================
CREATE TABLE IF NOT EXISTS inv_budget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    annee INTEGER NOT NULL,

    -- Montants LF/SIGOBE
    montant_initial DECIMAL(18, 2) DEFAULT 0,       -- Budget loi de finances
    montant_actuel DECIMAL(18, 2) DEFAULT 0,        -- Après révisions

    -- Historique des révisions
    revisions JSONB DEFAULT '[]'::jsonb,            -- [{date, ancien, nouveau, motif}]

    -- Comparaison
    montant_notifie DECIMAL(18, 2) DEFAULT 0,       -- Montant notifié (LF/SIGOBE)
    montant_eclate DECIMAL(18, 2) DEFAULT 0,        -- Somme des lignes éclatées
    ecart_notifie_eclate DECIMAL(18, 2) DEFAULT 0,  -- Différence (alerte si ≠ 0)

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, annee)
);

CREATE INDEX idx_inv_budget_project ON inv_budget(project_id);
CREATE INDEX idx_inv_budget_annee ON inv_budget(annee);

COMMENT ON TABLE inv_budget IS 'Budgets annuels des projets d''investissement';

-- ============================================
-- 3. INV_BUDGET_BREAKDOWN - Budget éclaté
-- ============================================
CREATE TABLE IF NOT EXISTS inv_budget_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES inv_budget(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    -- Chaîne budgétaire
    ua_code VARCHAR(50),
    ua_lib TEXT,
    activite_code VARCHAR(50),
    activite_lib TEXT,
    ligne_code VARCHAR(50),
    ligne_lib TEXT,

    -- Composante (lien PTBA)
    composante_id UUID,
    composante_nom VARCHAR(255),

    -- Montants
    montant_prevu DECIMAL(18, 2) DEFAULT 0,
    montant_engage DECIMAL(18, 2) DEFAULT 0,
    observations TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_breakdown_budget ON inv_budget_breakdown(budget_id);
CREATE INDEX idx_inv_breakdown_project ON inv_budget_breakdown(project_id);
CREATE INDEX idx_inv_breakdown_ua ON inv_budget_breakdown(ua_code);

COMMENT ON TABLE inv_budget_breakdown IS 'Détail des lignes de budget éclaté (UA/Activité/Ligne)';

-- ============================================
-- 4. INV_TRANSFER - Transferts trimestriels
-- ============================================
CREATE TABLE IF NOT EXISTS inv_transfer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    annee INTEGER NOT NULL,
    trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),

    -- Montants
    montant_prevu DECIMAL(18, 2) DEFAULT 0,
    montant_transfere DECIMAL(18, 2) DEFAULT 0,
    date_op DATE,                                   -- Date de l'OP de transfert
    numero_op VARCHAR(50),

    -- Écart et statut
    ecart DECIMAL(18, 2) DEFAULT 0,
    statut VARCHAR(50) DEFAULT 'PREVU'
        CHECK (statut IN ('PREVU', 'EN_ATTENTE', 'TRANSFERE', 'PARTIEL')),
    commentaire TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, annee, trimestre)
);

CREATE INDEX idx_inv_transfer_project ON inv_transfer(project_id);
CREATE INDEX idx_inv_transfer_annee ON inv_transfer(annee);
CREATE INDEX idx_inv_transfer_statut ON inv_transfer(statut);

COMMENT ON TABLE inv_transfer IS 'Transferts budgétaires trimestriels';

-- ============================================
-- 5. INV_ADVANCE_LETTER - Lettres d'avance
-- ============================================
CREATE TABLE IF NOT EXISTS inv_advance_letter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    reference VARCHAR(100) NOT NULL,
    montant DECIMAL(18, 2) NOT NULL,
    date_emission DATE,
    date_echeance DATE,

    -- Modalité de couverture
    modalite VARCHAR(50) DEFAULT 'RESERVE'
        CHECK (modalite IN ('RESERVE', 'RALLONGE', 'MIXTE')),
    ua_reserve VARCHAR(50),                         -- UA où la réserve est faite
    ua_rallonge VARCHAR(50),                        -- UA de la rallonge

    -- Régularisation
    montant_regularise DECIMAL(18, 2) DEFAULT 0,
    date_regularisation DATE,
    statut VARCHAR(50) DEFAULT 'EMISE'
        CHECK (statut IN ('EMISE', 'PARTIELLE', 'REGULARISEE', 'EXPIREE')),

    delai_regularisation_jours INTEGER DEFAULT 90,
    document_ref TEXT,
    commentaire TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_advance_project ON inv_advance_letter(project_id);
CREATE INDEX idx_inv_advance_statut ON inv_advance_letter(statut);

COMMENT ON TABLE inv_advance_letter IS 'Lettres d''avance et régularisations';

-- ============================================
-- 6. INV_COMPONENT - Composantes du projet
-- ============================================
CREATE TABLE IF NOT EXISTS inv_component (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    code VARCHAR(50),
    nom VARCHAR(255) NOT NULL,
    description TEXT,

    -- Budget
    cout_prevu DECIMAL(18, 2) DEFAULT 0,
    cout_actuel DECIMAL(18, 2) DEFAULT 0,

    -- Zone d'intervention
    zone_intervention TEXT,

    -- Livrables principaux
    livrables_principaux JSONB DEFAULT '[]'::jsonb, -- [{type, description}]

    -- Marchés associés (liens vers module Marché)
    marches_associes JSONB DEFAULT '[]'::jsonb,     -- [operation_id, ...]

    -- Indicateurs
    indicateurs JSONB DEFAULT '[]'::jsonb,          -- [{code, libelle, baseline, cible}]

    ordre INTEGER DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_component_project ON inv_component(project_id);

COMMENT ON TABLE inv_component IS 'Composantes des projets d''investissement';

-- ============================================
-- 7. INV_ACTIVITY - Activités PTBA
-- ============================================
CREATE TABLE IF NOT EXISTS inv_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,
    component_id UUID REFERENCES inv_component(id) ON DELETE SET NULL,

    code VARCHAR(50),
    libelle TEXT NOT NULL,
    description TEXT,

    -- Planification
    date_debut DATE,
    date_fin DATE,
    annee INTEGER,
    trimestre INTEGER,

    -- Budget
    budget_prevu DECIMAL(18, 2) DEFAULT 0,
    budget_execute DECIMAL(18, 2) DEFAULT 0,

    -- Source de financement
    source VARCHAR(50) DEFAULT 'ETAT'
        CHECK (source IN ('ETAT', 'BAILLEUR', 'MIXTE')),
    bailleur_code VARCHAR(50),

    -- Livrable et indicateur
    livrable_attendu TEXT,
    indicateur_code VARCHAR(50),

    -- Statut
    statut VARCHAR(50) DEFAULT 'PLANIFIE'
        CHECK (statut IN ('PLANIFIE', 'EN_COURS', 'TERMINE', 'REPORTE', 'ANNULE')),
    taux_realisation DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_activity_project ON inv_activity(project_id);
CREATE INDEX idx_inv_activity_component ON inv_activity(component_id);
CREATE INDEX idx_inv_activity_annee ON inv_activity(annee);
CREATE INDEX idx_inv_activity_statut ON inv_activity(statut);

COMMENT ON TABLE inv_activity IS 'Activités du Plan de Travail et Budget Annuel (PTBA)';

-- ============================================
-- 8. INV_PHYSICAL_TRACKING - Suivi physique (RSF, missions terrain)
-- ============================================
CREATE TABLE IF NOT EXISTS inv_physical_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,
    component_id UUID REFERENCES inv_component(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES inv_activity(id) ON DELETE SET NULL,

    -- Type de suivi
    type_suivi VARCHAR(50) NOT NULL DEFAULT 'RSF'
        CHECK (type_suivi IN ('RSF', 'MISSION_TERRAIN', 'RAPPORT_TECHNIQUE')),

    -- RSF spécifique
    classe_rsf INTEGER CHECK (classe_rsf IN (2, 6)), -- Classe 2 ou 6

    -- Mission terrain spécifique
    type_mission VARCHAR(50) CHECK (type_mission IN ('BASELINE', 'PONCTUELLE', 'PERIODIQUE')),
    periodicite_jours INTEGER DEFAULT 60,           -- Par défaut: tous les 2 mois

    -- Données communes
    date_suivi DATE NOT NULL,
    date_prochaine DATE,
    livrable_concerne TEXT,

    -- Localisation
    localisation TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Résultats
    observations TEXT,
    resultat VARCHAR(50) DEFAULT 'CONFORME'
        CHECK (resultat IN ('CONFORME', 'ECART_MINEUR', 'ECART_MAJEUR', 'NON_CONFORME')),
    actions_requises TEXT,

    -- Documents
    document_ref TEXT,
    photos JSONB DEFAULT '[]'::jsonb,               -- [url1, url2, ...]

    -- Validation
    valide_par VARCHAR(255),
    date_validation DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_physical_project ON inv_physical_tracking(project_id);
CREATE INDEX idx_inv_physical_type ON inv_physical_tracking(type_suivi);
CREATE INDEX idx_inv_physical_date ON inv_physical_tracking(date_suivi);
CREATE INDEX idx_inv_physical_classe ON inv_physical_tracking(classe_rsf);

COMMENT ON TABLE inv_physical_tracking IS 'Suivi physique: RSF, missions terrain, rapports techniques';

-- ============================================
-- 9. INV_FINANCIAL_STATUS - Situation financière
-- ============================================
CREATE TABLE IF NOT EXISTS inv_financial_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    annee INTEGER NOT NULL,
    mois INTEGER,                                   -- NULL pour synthèse annuelle

    -- Montants cumulés
    montant_notifie DECIMAL(18, 2) DEFAULT 0,
    montant_eclate DECIMAL(18, 2) DEFAULT 0,
    montant_transfere DECIMAL(18, 2) DEFAULT 0,
    montant_execute DECIMAL(18, 2) DEFAULT 0,

    -- Restes
    rae DECIMAL(18, 2) DEFAULT 0,                   -- Reste à Exécuter (transféré - exécuté)
    rab DECIMAL(18, 2) DEFAULT 0,                   -- Reste à Budgétiser

    -- Taux
    taux_execution DECIMAL(5, 2) DEFAULT 0,         -- execute / transfere * 100
    taux_absorption DECIMAL(5, 2) DEFAULT 0,        -- execute / notifie * 100

    -- Détail par bailleur
    execution_par_bailleur JSONB DEFAULT '[]'::jsonb, -- [{bailleur, montant, taux}]

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, annee, mois)
);

CREATE INDEX idx_inv_financial_project ON inv_financial_status(project_id);
CREATE INDEX idx_inv_financial_annee ON inv_financial_status(annee);

COMMENT ON TABLE inv_financial_status IS 'Situation financière consolidée par période';

-- ============================================
-- 10. INV_GLIDE - Glissements budgétaires
-- ============================================
CREATE TABLE IF NOT EXISTS inv_glide (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    annee_origine INTEGER NOT NULL,
    annee_destination INTEGER NOT NULL,

    -- Montants
    montant_initial DECIMAL(18, 2) DEFAULT 0,       -- Prévu année origine
    montant_realise DECIMAL(18, 2) DEFAULT 0,       -- Réalisé année origine
    montant_glisse DECIMAL(18, 2) DEFAULT 0,        -- Reporté année suivante

    -- Écarts
    ecart_absolu DECIMAL(18, 2) DEFAULT 0,
    ecart_pourcentage DECIMAL(5, 2) DEFAULT 0,

    -- Justification
    motif TEXT,
    categorie_motif VARCHAR(50)
        CHECK (categorie_motif IN ('TECHNIQUE', 'FINANCIER', 'ADMINISTRATIF', 'FORCE_MAJEURE', 'AUTRE')),

    -- Alerte si variation > seuil
    is_variation_critique BOOLEAN DEFAULT FALSE,    -- > 30%

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, annee_origine)
);

CREATE INDEX idx_inv_glide_project ON inv_glide(project_id);
CREATE INDEX idx_inv_glide_annee_origine ON inv_glide(annee_origine);
CREATE INDEX idx_inv_glide_critique ON inv_glide(is_variation_critique);

COMMENT ON TABLE inv_glide IS 'Glissements budgétaires inter-annuels';

-- ============================================
-- 11. INV_GAR_INDICATOR - Indicateurs GAR
-- ============================================
CREATE TABLE IF NOT EXISTS inv_gar_indicator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,
    component_id UUID REFERENCES inv_component(id) ON DELETE SET NULL,

    code VARCHAR(50),
    libelle TEXT NOT NULL,
    description TEXT,

    -- Niveau
    niveau VARCHAR(50) NOT NULL DEFAULT 'OUTPUT'
        CHECK (niveau IN ('OUTPUT', 'OUTCOME', 'IMPACT')),

    -- Valeurs
    unite VARCHAR(50),                              -- %, nombre, km, etc.
    baseline DECIMAL(18, 4),
    baseline_annee INTEGER,

    -- Cibles par année
    cibles JSONB DEFAULT '[]'::jsonb,               -- [{annee, valeur}]
    valeur_actuelle DECIMAL(18, 4),
    date_derniere_mesure DATE,

    -- Source de vérification
    source_verification TEXT,
    frequence_mesure VARCHAR(50) DEFAULT 'ANNUELLE'
        CHECK (frequence_mesure IN ('MENSUELLE', 'TRIMESTRIELLE', 'SEMESTRIELLE', 'ANNUELLE')),

    -- Objectif parent (si sous-indicateur)
    objectif_parent VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_gar_project ON inv_gar_indicator(project_id);
CREATE INDEX idx_inv_gar_niveau ON inv_gar_indicator(niveau);
CREATE INDEX idx_inv_gar_component ON inv_gar_indicator(component_id);

COMMENT ON TABLE inv_gar_indicator IS 'Indicateurs de la Gestion Axée sur les Résultats (GAR)';

-- ============================================
-- 12. INV_EVALUATION - Évaluations GAR
-- ============================================
CREATE TABLE IF NOT EXISTS inv_evaluation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES inv_gar_indicator(id) ON DELETE CASCADE,

    -- Période d'évaluation
    type_evaluation VARCHAR(50) NOT NULL DEFAULT 'ANNUELLE'
        CHECK (type_evaluation IN ('INFRA_ANNUELLE', 'ANNUELLE', 'PLURIANNUELLE', 'FINALE')),
    annee INTEGER NOT NULL,
    trimestre INTEGER,                              -- Pour infra-annuelle

    -- Valeurs mesurées
    valeur_cible DECIMAL(18, 4),
    valeur_realisee DECIMAL(18, 4),
    ecart DECIMAL(18, 4),
    ecart_pourcentage DECIMAL(5, 2),

    -- Statut
    statut VARCHAR(50) DEFAULT 'EN_BONNE_VOIE'
        CHECK (statut IN ('EN_BONNE_VOIE', 'A_RISQUE', 'NON_ATTEINT', 'DEPASSE')),

    -- Commentaires
    observations TEXT,
    actions_correctives TEXT,

    -- Validation
    valide_par VARCHAR(255),
    date_validation DATE,
    validateur_type VARCHAR(50)                     -- CF | ENTITE_TECHNIQUE
        CHECK (validateur_type IN ('CF', 'ENTITE_TECHNIQUE', 'DCF', 'MINISTERE')),

    document_ref TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_evaluation_project ON inv_evaluation(project_id);
CREATE INDEX idx_inv_evaluation_indicator ON inv_evaluation(indicator_id);
CREATE INDEX idx_inv_evaluation_annee ON inv_evaluation(annee);
CREATE INDEX idx_inv_evaluation_statut ON inv_evaluation(statut);

COMMENT ON TABLE inv_evaluation IS 'Évaluations des indicateurs GAR';

-- ============================================
-- 13. INV_ALERT - Alertes
-- ============================================
CREATE TABLE IF NOT EXISTS inv_alert (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    -- Type d'alerte
    type_alerte VARCHAR(100) NOT NULL,
    code_alerte VARCHAR(50) NOT NULL,

    -- Priorité
    priorite VARCHAR(20) NOT NULL DEFAULT 'MAJEURE'
        CHECK (priorite IN ('CRITIQUE', 'MAJEURE', 'MINEURE', 'INFO')),

    -- Description
    titre VARCHAR(255) NOT NULL,
    description TEXT,

    -- Référence
    entite_type VARCHAR(50),                        -- BUDGET, TRANSFER, ADVANCE_LETTER, etc.
    entite_id UUID,
    annee INTEGER,

    -- Valeurs de déclenchement
    valeur_seuil DECIMAL(18, 4),
    valeur_actuelle DECIMAL(18, 4),

    -- Statut
    statut VARCHAR(50) DEFAULT 'ACTIVE'
        CHECK (statut IN ('ACTIVE', 'ACQUITTEE', 'RESOLUE', 'EXPIREE')),

    -- Traitement
    date_detection TIMESTAMPTZ DEFAULT NOW(),
    date_acquittement TIMESTAMPTZ,
    acquitte_par VARCHAR(255),
    date_resolution TIMESTAMPTZ,
    resolution_commentaire TEXT,

    -- Lien direct vers la fiche
    lien_action TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_alert_project ON inv_alert(project_id);
CREATE INDEX idx_inv_alert_type ON inv_alert(type_alerte);
CREATE INDEX idx_inv_alert_code ON inv_alert(code_alerte);
CREATE INDEX idx_inv_alert_priorite ON inv_alert(priorite);
CREATE INDEX idx_inv_alert_statut ON inv_alert(statut);
CREATE INDEX idx_inv_alert_date ON inv_alert(date_detection);

COMMENT ON TABLE inv_alert IS 'Alertes automatiques et manuelles sur les projets';

-- ============================================
-- 14. INV_DOCUMENT - Documents projet
-- ============================================
CREATE TABLE IF NOT EXISTS inv_document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    -- Type de document
    categorie VARCHAR(50) NOT NULL
        CHECK (categorie IN ('FICHE_VIE', 'DECISION_CF', 'DEROGATION', 'OP_PROVISOIRE',
                            'LETTRE_AVANCE', 'TDR', 'AUDIT', 'PTBA', 'RAPPORT', 'AUTRE')),
    type_document VARCHAR(100),

    -- Métadonnées
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    date_document DATE,

    -- Fichier
    fichier_url TEXT,
    fichier_nom VARCHAR(255),
    fichier_taille BIGINT DEFAULT 0,

    -- Statut
    obligatoire BOOLEAN DEFAULT FALSE,
    statut VARCHAR(50) DEFAULT 'DRAFT'
        CHECK (statut IN ('DRAFT', 'VALIDE', 'REJETE', 'ARCHIVE')),

    -- Validation
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMPTZ,
    valide_par VARCHAR(255),
    date_validation TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_document_project ON inv_document(project_id);
CREATE INDEX idx_inv_document_categorie ON inv_document(categorie);
CREATE INDEX idx_inv_document_statut ON inv_document(statut);

COMMENT ON TABLE inv_document IS 'Documents associés aux projets d''investissement';

-- ============================================
-- VUES - Agrégations et synthèses
-- ============================================

-- Vue: Portefeuille par bailleur
CREATE OR REPLACE VIEW v_inv_portfolio_by_bailleur AS
SELECT
    b.bailleur_code,
    b.bailleur_nom,
    COUNT(DISTINCT p.id) as nb_projets,
    SUM(p.cout_total) as montant_total,
    SUM(fs.montant_notifie) as montant_notifie,
    SUM(fs.montant_transfere) as montant_transfere,
    SUM(fs.montant_execute) as montant_execute,
    CASE
        WHEN SUM(fs.montant_transfere) > 0
        THEN ROUND((SUM(fs.montant_execute) / SUM(fs.montant_transfere)) * 100, 2)
        ELSE 0
    END as taux_absorption,
    COUNT(DISTINCT CASE WHEN a.priorite = 'CRITIQUE' THEN a.id END) as alertes_critiques
FROM inv_project p
CROSS JOIN LATERAL jsonb_array_elements(p.bailleurs) AS b_elem
CROSS JOIN LATERAL jsonb_to_record(b_elem) AS b(bailleur_code TEXT, bailleur_nom TEXT, montant DECIMAL)
LEFT JOIN inv_financial_status fs ON fs.project_id = p.id AND fs.mois IS NULL
LEFT JOIN inv_alert a ON a.project_id = p.id AND a.statut = 'ACTIVE'
WHERE p.statut != 'ABANDONNE'
GROUP BY b.bailleur_code, b.bailleur_nom;

-- Vue: Portefeuille par ministère
CREATE OR REPLACE VIEW v_inv_portfolio_by_ministry AS
SELECT
    p.ministere_code,
    p.ministere,
    p.secteur_code,
    p.secteur,
    COUNT(*) as nb_projets,
    SUM(p.cout_total) as montant_total,
    SUM(fs.montant_execute) as montant_execute,
    CASE
        WHEN SUM(fs.montant_transfere) > 0
        THEN ROUND((SUM(fs.montant_execute) / SUM(fs.montant_transfere)) * 100, 2)
        ELSE 0
    END as taux_execution,
    COUNT(DISTINCT CASE WHEN a.priorite IN ('CRITIQUE', 'MAJEURE') THEN a.id END) as alertes_actives,
    COUNT(DISTINCT CASE WHEN p.is_ope = TRUE THEN p.id END) as nb_ope
FROM inv_project p
LEFT JOIN inv_financial_status fs ON fs.project_id = p.id AND fs.mois IS NULL
LEFT JOIN inv_alert a ON a.project_id = p.id AND a.statut = 'ACTIVE'
WHERE p.statut != 'ABANDONNE'
GROUP BY p.ministere_code, p.ministere, p.secteur_code, p.secteur;

-- Vue: Portefeuille par UCP/entité exécutante
CREATE OR REPLACE VIEW v_inv_portfolio_by_ucp AS
SELECT
    p.type_entite,
    p.entite_code,
    p.entite_executante,
    COUNT(*) as nb_projets,
    SUM(p.cout_total) as montant_total,
    SUM(fs.montant_transfere) as montant_transfere,
    SUM(fs.montant_execute) as montant_execute,
    CASE
        WHEN SUM(fs.montant_transfere) > 0
        THEN ROUND((SUM(fs.montant_execute) / SUM(fs.montant_transfere)) * 100, 2)
        ELSE 0
    END as performance,
    COUNT(DISTINCT CASE WHEN a.statut = 'ACTIVE' THEN a.id END) as alertes_actives
FROM inv_project p
LEFT JOIN inv_financial_status fs ON fs.project_id = p.id AND fs.mois IS NULL
LEFT JOIN inv_alert a ON a.project_id = p.id
WHERE p.statut != 'ABANDONNE'
GROUP BY p.type_entite, p.entite_code, p.entite_executante;

-- Vue: Portefeuille par région
CREATE OR REPLACE VIEW v_inv_portfolio_by_region AS
SELECT
    p.district,
    p.region,
    COUNT(*) as nb_projets,
    SUM(p.cout_total) as montant_total,
    SUM(fs.montant_execute) as montant_execute,
    CASE
        WHEN SUM(fs.montant_transfere) > 0
        THEN ROUND((SUM(fs.montant_execute) / SUM(fs.montant_transfere)) * 100, 2)
        ELSE 0
    END as taux_execution,
    COUNT(DISTINCT CASE WHEN p.is_ope = TRUE THEN p.id END) as nb_ope
FROM inv_project p
LEFT JOIN inv_financial_status fs ON fs.project_id = p.id AND fs.mois IS NULL
WHERE p.statut != 'ABANDONNE'
GROUP BY p.district, p.region;

-- Vue: Synthèse projets avec indicateurs clés
CREATE OR REPLACE VIEW v_inv_projects_summary AS
SELECT
    p.*,
    fs.montant_notifie,
    fs.montant_transfere,
    fs.montant_execute,
    fs.taux_execution,
    COALESCE(al.nb_alertes, 0) as nb_alertes,
    COALESCE(al.nb_critiques, 0) as nb_alertes_critiques,
    CASE
        WHEN p.type_projet = 'TRANSFERT' AND COALESCE(bb.nb_lignes, 0) = 0
        THEN TRUE
        ELSE FALSE
    END as alerte_budget_eclate_manquant
FROM inv_project p
LEFT JOIN inv_financial_status fs ON fs.project_id = p.id
    AND fs.annee = EXTRACT(YEAR FROM CURRENT_DATE) AND fs.mois IS NULL
LEFT JOIN (
    SELECT project_id,
           COUNT(*) as nb_alertes,
           COUNT(CASE WHEN priorite = 'CRITIQUE' THEN 1 END) as nb_critiques
    FROM inv_alert WHERE statut = 'ACTIVE' GROUP BY project_id
) al ON al.project_id = p.id
LEFT JOIN (
    SELECT project_id, COUNT(*) as nb_lignes
    FROM inv_budget_breakdown GROUP BY project_id
) bb ON bb.project_id = p.id;

-- Vue: Statistiques globales investissement
CREATE OR REPLACE VIEW v_inv_stats_global AS
SELECT
    (SELECT COUNT(*) FROM inv_project WHERE statut != 'ABANDONNE') as total_projets,
    (SELECT COUNT(*) FROM inv_project WHERE type_projet = 'TRANSFERT' AND statut != 'ABANDONNE') as projets_transfert,
    (SELECT COUNT(*) FROM inv_project WHERE is_ope = TRUE AND statut != 'ABANDONNE') as projets_ope,
    (SELECT COALESCE(SUM(cout_total), 0) FROM inv_project WHERE statut != 'ABANDONNE') as montant_total_portefeuille,
    (SELECT COALESCE(SUM(montant_notifie), 0) FROM inv_financial_status WHERE annee = EXTRACT(YEAR FROM CURRENT_DATE) AND mois IS NULL) as montant_notifie_annee,
    (SELECT COALESCE(SUM(montant_transfere), 0) FROM inv_financial_status WHERE annee = EXTRACT(YEAR FROM CURRENT_DATE) AND mois IS NULL) as montant_transfere_annee,
    (SELECT COALESCE(SUM(montant_execute), 0) FROM inv_financial_status WHERE annee = EXTRACT(YEAR FROM CURRENT_DATE) AND mois IS NULL) as montant_execute_annee,
    (SELECT COUNT(*) FROM inv_alert WHERE statut = 'ACTIVE' AND priorite = 'CRITIQUE') as alertes_critiques,
    (SELECT COUNT(*) FROM inv_alert WHERE statut = 'ACTIVE' AND priorite = 'MAJEURE') as alertes_majeures;

-- ============================================
-- Triggers pour updated_at automatique
-- ============================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name LIKE 'inv_%'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

-- ============================================
-- Commentaires finaux
-- ============================================
COMMENT ON VIEW v_inv_portfolio_by_bailleur IS 'Portefeuille agrégé par bailleur';
COMMENT ON VIEW v_inv_portfolio_by_ministry IS 'Portefeuille agrégé par ministère/secteur';
COMMENT ON VIEW v_inv_portfolio_by_ucp IS 'Portefeuille agrégé par UCP/entité exécutante';
COMMENT ON VIEW v_inv_portfolio_by_region IS 'Portefeuille agrégé par région';
COMMENT ON VIEW v_inv_projects_summary IS 'Synthèse des projets avec indicateurs clés';
COMMENT ON VIEW v_inv_stats_global IS 'Statistiques globales du module investissement';
