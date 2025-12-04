-- ============================================
-- SIDCF Portal - Module Investissement Enrichment
-- ============================================
-- Migration: 012_investissement_enrichment.sql
-- Description: Renforcement du module Investissement pour conformité DCF
-- Axes couverts: A→I (Fiche projet, Chaîne budgétaire, Lettres d'avance,
--                     OP provisoires, Régies, Suivi physique, GAR, Gouvernance,
--                     Portefeuille, Paramétrage alertes)
-- ============================================

-- ============================================
-- AXE A - ENRICHISSEMENT FICHE PROJET
-- ============================================

-- Nouveaux champs pour inv_project
ALTER TABLE inv_project
    ADD COLUMN IF NOT EXISTS dans_perimetre_dcf VARCHAR(20) DEFAULT 'OUI'
        CHECK (dans_perimetre_dcf IN ('OUI', 'NON', 'PARTIEL')),
    ADD COLUMN IF NOT EXISTS statut_temporal VARCHAR(50) DEFAULT 'NOUVEAU'
        CHECK (statut_temporal IN ('NOUVEAU', 'REAPPARU_MEME_DYNAMIQUE', 'REAPPARU_NOUVELLE_DYNAMIQUE', 'PHASE_CONTINUATION')),
    ADD COLUMN IF NOT EXISTS historique_pip JSONB DEFAULT '[]'::jsonb,  -- [{annee, montant, statut}]
    ADD COLUMN IF NOT EXISTS acteurs JSONB DEFAULT '{}'::jsonb,         -- Acteurs supplémentaires
    ADD COLUMN IF NOT EXISTS date_premiere_inscription DATE,
    ADD COLUMN IF NOT EXISTS nb_annees_pip INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS code_sigobe VARCHAR(100),
    ADD COLUMN IF NOT EXISTS reference_convention VARCHAR(255),
    ADD COLUMN IF NOT EXISTS date_signature_convention DATE,
    ADD COLUMN IF NOT EXISTS date_mise_en_vigueur DATE;

COMMENT ON COLUMN inv_project.dans_perimetre_dcf IS 'Projet dans le périmètre de contrôle DCF';
COMMENT ON COLUMN inv_project.statut_temporal IS 'Statut temporel: NOUVEAU, REAPPARU, PHASE_CONTINUATION';
COMMENT ON COLUMN inv_project.historique_pip IS 'Historique des inscriptions au PIP par année';
COMMENT ON COLUMN inv_project.acteurs IS 'Acteurs additionnels: {comptable, auditeur, responsable_passation, etc.}';

-- ============================================
-- Table: INV_PIP_HISTORY - Historique présence PIP
-- ============================================
CREATE TABLE IF NOT EXISTS inv_pip_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    annee INTEGER NOT NULL,
    montant_inscrit DECIMAL(18, 2) DEFAULT 0,
    montant_execute DECIMAL(18, 2) DEFAULT 0,
    taux_execution DECIMAL(5, 2) DEFAULT 0,

    statut VARCHAR(50) DEFAULT 'INSCRIT'
        CHECK (statut IN ('INSCRIT', 'SUSPENDU', 'RETIRE', 'TERMINE')),

    rang_priorite INTEGER,                          -- Rang dans les priorités nationales
    observations TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, annee)
);

CREATE INDEX idx_inv_pip_history_project ON inv_pip_history(project_id);
CREATE INDEX idx_inv_pip_history_annee ON inv_pip_history(annee);

COMMENT ON TABLE inv_pip_history IS 'Historique des inscriptions annuelles au Programme d''Investissement Public';

-- ============================================
-- Table: INV_OPE_CRITERIA - Critères OPE paramétrables
-- ============================================
CREATE TABLE IF NOT EXISTS inv_ope_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,

    -- Critère
    type_critere VARCHAR(50) NOT NULL DEFAULT 'INCLUSION'
        CHECK (type_critere IN ('INCLUSION', 'EXCLUSION', 'PRIORITE')),

    -- Conditions (JSON pour flexibilité)
    conditions JSONB DEFAULT '[]'::jsonb,           -- [{field, operator, value}]

    -- Paramètres
    poids INTEGER DEFAULT 1,                        -- Pour scoring si applicable
    is_bloquant BOOLEAN DEFAULT FALSE,

    -- Statut
    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inv_ope_criteria IS 'Critères paramétrables pour identifier les Opérations Prioritaires de l''État';

-- Critères OPE par défaut
INSERT INTO inv_ope_criteria (code, libelle, description, type_critere, conditions, poids)
VALUES
    ('OPE_MONTANT_ELEVE', 'Montant élevé', 'Projet avec montant total > 50 milliards', 'INCLUSION', '[{"field": "cout_total", "operator": ">", "value": 50000000000}]', 3),
    ('OPE_PRESIDENTIEL', 'Engagement présidentiel', 'Projet issu d''un engagement présidentiel', 'INCLUSION', '[{"field": "is_prioritaire", "operator": "=", "value": true}]', 5),
    ('OPE_SECTEUR_CIBLE', 'Secteur prioritaire', 'Éducation, Santé, Infrastructures', 'INCLUSION', '[{"field": "secteur_code", "operator": "in", "value": ["EDUCATION", "SANTE", "INFRASTRUCTURES"]}]', 2),
    ('OPE_BAILLEUR_MAJEUR', 'Bailleur majeur', 'Financement BM, BAD, AFD > 80%', 'INCLUSION', '[{"field": "part_bailleur_pct", "operator": ">", "value": 80}]', 2)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- AXE B - ENRICHISSEMENT CHAÎNE BUDGÉTAIRE
-- ============================================

-- Nouveaux champs pour inv_budget
ALTER TABLE inv_budget
    ADD COLUMN IF NOT EXISTS source_lf VARCHAR(50) DEFAULT 'LF_INITIALE'
        CHECK (source_lf IN ('LF_INITIALE', 'LF_RECTIFICATIVE', 'COLLECTIF')),
    ADD COLUMN IF NOT EXISTS reports_anterieurs DECIMAL(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS autorisation_executer DECIMAL(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS plafond_engagement DECIMAL(18, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS date_notification DATE,
    ADD COLUMN IF NOT EXISTS reference_notification VARCHAR(100);

COMMENT ON COLUMN inv_budget.source_lf IS 'Source loi de finances: initiale, rectificative, collectif';
COMMENT ON COLUMN inv_budget.reports_anterieurs IS 'Reports budgétaires des exercices antérieurs';
COMMENT ON COLUMN inv_budget.autorisation_executer IS 'montant_transfere + reports_anterieurs';

-- Trigger pour calculer automatiquement l'autorisation d'exécuter
CREATE OR REPLACE FUNCTION calculate_autorisation_executer()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer l'autorisation d'exécuter
    SELECT COALESCE(SUM(montant_transfere), 0) INTO NEW.autorisation_executer
    FROM inv_transfer
    WHERE project_id = NEW.project_id
      AND annee = NEW.annee
      AND statut IN ('TRANSFERE', 'PARTIEL');

    NEW.autorisation_executer := NEW.autorisation_executer + COALESCE(NEW.reports_anterieurs, 0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AXE C - OP PROVISOIRES
-- ============================================
CREATE TABLE IF NOT EXISTS inv_provisional_op (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    reference VARCHAR(100) NOT NULL,
    montant DECIMAL(18, 2) NOT NULL,
    date_emission DATE NOT NULL,
    annee_exercice INTEGER NOT NULL,

    -- Régularisation
    montant_regularise DECIMAL(18, 2) DEFAULT 0,
    date_regularisation DATE,
    reference_regularisation VARCHAR(100),

    -- Statut
    statut VARCHAR(50) DEFAULT 'EMIS'
        CHECK (statut IN ('EMIS', 'PARTIEL', 'REGULARISE', 'ANNULE', 'REPORTE')),

    -- Si annulé en fin d'année
    date_annulation DATE,
    motif_annulation TEXT,

    -- Si reporté comme dépense prioritaire
    is_prioritaire_n_plus_1 BOOLEAN DEFAULT FALSE,
    annee_report INTEGER,

    -- Lien avec la dépense
    objet TEXT,
    beneficiaire VARCHAR(255),
    ua_code VARCHAR(50),

    commentaire TEXT,
    document_ref TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_prov_op_project ON inv_provisional_op(project_id);
CREATE INDEX idx_inv_prov_op_annee ON inv_provisional_op(annee_exercice);
CREATE INDEX idx_inv_prov_op_statut ON inv_provisional_op(statut);

COMMENT ON TABLE inv_provisional_op IS 'Ordres de paiement provisoires - doivent être régularisés ou annulés en fin d''exercice';

-- ============================================
-- AXE C - RÉGIES
-- ============================================
CREATE TABLE IF NOT EXISTS inv_imprest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    -- Identification
    reference VARCHAR(100) NOT NULL,
    type_regie VARCHAR(50) DEFAULT 'AVANCES'
        CHECK (type_regie IN ('AVANCES', 'RECETTES', 'MIXTE')),

    -- Montants
    plafond DECIMAL(18, 2) NOT NULL,                -- Plafond autorisé
    montant_alimente DECIMAL(18, 2) DEFAULT 0,      -- Total alimenté par OP
    montant_depense DECIMAL(18, 2) DEFAULT 0,       -- Total dépensé
    montant_justifie DECIMAL(18, 2) DEFAULT 0,      -- Total justifié/régularisé
    solde_disponible DECIMAL(18, 2) DEFAULT 0,      -- Calculé

    -- Régisseur
    regisseur_nom VARCHAR(255),
    regisseur_fonction VARCHAR(255),
    date_nomination DATE,

    -- Statut
    statut VARCHAR(50) DEFAULT 'ACTIVE'
        CHECK (statut IN ('ACTIVE', 'SUSPENDUE', 'CLOTUREE')),

    -- Dates
    date_creation DATE,
    date_dernier_approvisionnement DATE,
    date_derniere_justification DATE,

    -- Documents
    arrete_creation_ref TEXT,
    document_cautionnement TEXT,

    commentaire TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_imprest_project ON inv_imprest(project_id);
CREATE INDEX idx_inv_imprest_statut ON inv_imprest(statut);

COMMENT ON TABLE inv_imprest IS 'Régies d''avances et de recettes pour exécution hors SIGOBE';

-- Table des mouvements de régie
CREATE TABLE IF NOT EXISTS inv_imprest_movement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imprest_id UUID NOT NULL REFERENCES inv_imprest(id) ON DELETE CASCADE,

    type_mouvement VARCHAR(50) NOT NULL
        CHECK (type_mouvement IN ('ALIMENTATION', 'DEPENSE', 'JUSTIFICATION', 'REVERSEMENT')),

    montant DECIMAL(18, 2) NOT NULL,
    date_mouvement DATE NOT NULL,
    reference VARCHAR(100),

    -- Pour dépenses
    objet TEXT,
    beneficiaire VARCHAR(255),
    piece_justificative TEXT,

    -- Pour alimentation
    numero_op VARCHAR(100),

    commentaire TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_imprest_mvt_imprest ON inv_imprest_movement(imprest_id);
CREATE INDEX idx_inv_imprest_mvt_date ON inv_imprest_movement(date_mouvement);

COMMENT ON TABLE inv_imprest_movement IS 'Mouvements de régie: alimentation, dépenses, justifications';

-- ============================================
-- AXE E - SUIVI TRIMESTRIEL
-- ============================================
CREATE TABLE IF NOT EXISTS inv_quarterly_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    annee INTEGER NOT NULL,
    trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),

    -- Planification vs Réalisation
    niveau_attendu DECIMAL(5, 2) DEFAULT 0,         -- % prévu à ce trimestre
    niveau_reel DECIMAL(5, 2) DEFAULT 0,            -- % réel à ce trimestre
    ecart DECIMAL(5, 2) DEFAULT 0,

    -- Financier
    budget_prevu_cumule DECIMAL(18, 2) DEFAULT 0,
    budget_execute_cumule DECIMAL(18, 2) DEFAULT 0,
    taux_execution DECIMAL(5, 2) DEFAULT 0,

    -- Physique
    activites_prevues INTEGER DEFAULT 0,
    activites_realisees INTEGER DEFAULT 0,
    livrables_attendus INTEGER DEFAULT 0,
    livrables_livres INTEGER DEFAULT 0,

    -- Appréciation
    appreciation VARCHAR(50) DEFAULT 'NORMAL'
        CHECK (appreciation IN ('EXCELLENT', 'BON', 'NORMAL', 'RETARD', 'CRITIQUE')),

    -- Commentaires
    observations TEXT,
    actions_correctives TEXT,
    risques_identifies TEXT,

    -- Validation
    date_rapport DATE,
    valide_par VARCHAR(255),
    date_validation DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, annee, trimestre)
);

CREATE INDEX idx_inv_quarterly_project ON inv_quarterly_tracking(project_id);
CREATE INDEX idx_inv_quarterly_periode ON inv_quarterly_tracking(annee, trimestre);

COMMENT ON TABLE inv_quarterly_tracking IS 'Suivi trimestriel de l''avancement physique et financier';

-- ============================================
-- AXE F - VALEURS GAR PÉRIODIQUES
-- ============================================
CREATE TABLE IF NOT EXISTS inv_gar_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicator_id UUID NOT NULL REFERENCES inv_gar_indicator(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    -- Période
    annee INTEGER NOT NULL,
    periode VARCHAR(20) DEFAULT 'ANNUEL'
        CHECK (periode IN ('T1', 'T2', 'T3', 'T4', 'S1', 'S2', 'ANNUEL')),

    -- Valeurs
    valeur_cible DECIMAL(18, 4),
    valeur_realisee DECIMAL(18, 4),
    ecart DECIMAL(18, 4),
    taux_atteinte DECIMAL(5, 2),

    -- Source
    source_donnee TEXT,
    methode_collecte TEXT,
    date_collecte DATE,

    -- Commentaires
    observations TEXT,
    facteurs_succes TEXT,
    facteurs_echec TEXT,

    -- Validation
    valide_par VARCHAR(255),
    date_validation DATE,
    validateur_type VARCHAR(50)
        CHECK (validateur_type IN ('CF', 'TECHNIQUE', 'MIXTE')),

    document_ref TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(indicator_id, annee, periode)
);

CREATE INDEX idx_inv_gar_values_indicator ON inv_gar_values(indicator_id);
CREATE INDEX idx_inv_gar_values_project ON inv_gar_values(project_id);
CREATE INDEX idx_inv_gar_values_periode ON inv_gar_values(annee, periode);

COMMENT ON TABLE inv_gar_values IS 'Valeurs périodiques des indicateurs GAR';

-- ============================================
-- AXE G - MATRICE DOCUMENTAIRE
-- ============================================
CREATE TABLE IF NOT EXISTS inv_doc_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Contexte d'application
    type_projet VARCHAR(50),                        -- SIGOBE | TRANSFERT | HORS_SIGOBE | ALL
    phase_projet VARCHAR(50),                       -- NOTIFIE | TRANSFERE | ECLATE | EXECUTE | ALL
    type_entite VARCHAR(50),                        -- UCP | EPN | COLLECTIVITE | ADMIN | ALL

    -- Document requis
    categorie_document VARCHAR(50) NOT NULL,
    type_document VARCHAR(100) NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,

    -- Exigences
    obligatoire BOOLEAN DEFAULT FALSE,
    bloquant BOOLEAN DEFAULT FALSE,                 -- Bloque passage à phase suivante
    delai_production_jours INTEGER,                 -- Délai attendu

    -- Fréquence (pour documents récurrents)
    recurrent BOOLEAN DEFAULT FALSE,
    frequence VARCHAR(50)                           -- MENSUEL | TRIMESTRIEL | ANNUEL
        CHECK (frequence IN ('MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL')),

    -- Validateur attendu
    validateur VARCHAR(50)
        CHECK (validateur IN ('CF', 'DCF', 'UCP', 'MINISTERE', 'BAILLEUR')),

    -- Ordre d'affichage
    ordre INTEGER DEFAULT 1,

    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_doc_matrix_type ON inv_doc_matrix(type_projet, phase_projet);
CREATE INDEX idx_inv_doc_matrix_categorie ON inv_doc_matrix(categorie_document);

COMMENT ON TABLE inv_doc_matrix IS 'Matrice des documents attendus selon le type et la phase du projet';

-- Documents de base de la matrice
INSERT INTO inv_doc_matrix (type_projet, phase_projet, type_entite, categorie_document, type_document, libelle, obligatoire, bloquant, validateur, ordre)
VALUES
    -- Documents pour tous les projets
    ('ALL', 'NOTIFIE', 'ALL', 'FICHE_VIE', 'FICHE_PROJET', 'Fiche de projet', TRUE, FALSE, 'CF', 1),
    ('ALL', 'NOTIFIE', 'ALL', 'TDR', 'TDR_PROJET', 'Termes de référence', TRUE, FALSE, 'UCP', 2),
    ('ALL', 'NOTIFIE', 'ALL', 'PTBA', 'PTBA_ANNUEL', 'Plan de Travail et Budget Annuel', TRUE, TRUE, 'CF', 3),

    -- Documents pour projets en transfert
    ('TRANSFERT', 'ECLATE', 'ALL', 'DECISION_CF', 'VALIDATION_BUDGET_ECLATE', 'Validation budget éclaté', TRUE, TRUE, 'CF', 1),
    ('TRANSFERT', 'EXECUTE', 'ALL', 'RAPPORT', 'RSF_PERIODIQUE', 'Rapport de Suivi Financier', TRUE, FALSE, 'CF', 1),

    -- Documents pour UCP
    ('ALL', 'EXECUTE', 'UCP', 'AUDIT', 'AUDIT_ANNUEL', 'Rapport d''audit annuel', TRUE, FALSE, 'BAILLEUR', 1),
    ('ALL', 'EXECUTE', 'UCP', 'RAPPORT', 'RAPPORT_ACTIVITE', 'Rapport d''activité', TRUE, FALSE, 'UCP', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- AXE G - DÉCISIONS CF/DCF
-- ============================================
CREATE TABLE IF NOT EXISTS inv_decision (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES inv_project(id) ON DELETE CASCADE,

    -- Identification
    reference VARCHAR(100) NOT NULL,
    type_decision VARCHAR(50) NOT NULL
        CHECK (type_decision IN ('AVIS', 'VISA', 'DEROGATION', 'REJET', 'SUSPENSION', 'MAINLEVEE', 'AUTRE')),

    -- Contenu
    objet TEXT NOT NULL,
    motif TEXT,

    -- Signataires
    emetteur VARCHAR(50) DEFAULT 'CF'
        CHECK (emetteur IN ('CF', 'DCF', 'DGBF', 'MINISTERE')),
    signataire_nom VARCHAR(255),
    signataire_fonction VARCHAR(255),

    -- Dates
    date_decision DATE NOT NULL,
    date_effet DATE,
    date_expiration DATE,

    -- Statut
    statut VARCHAR(50) DEFAULT 'VALIDE'
        CHECK (statut IN ('PROJET', 'VALIDE', 'ANNULE', 'EXPIRE')),

    -- Liens
    entite_concernee VARCHAR(50),                   -- BUDGET | MARCHE | AVENANT | LETTRE_AVANCE | etc.
    entite_id UUID,

    -- Document
    document_ref TEXT,
    fichier_url TEXT,

    commentaire TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_decision_project ON inv_decision(project_id);
CREATE INDEX idx_inv_decision_type ON inv_decision(type_decision);
CREATE INDEX idx_inv_decision_date ON inv_decision(date_decision);
CREATE INDEX idx_inv_decision_emetteur ON inv_decision(emetteur);

COMMENT ON TABLE inv_decision IS 'Décisions du Contrôle Financier et de la DCF';

-- ============================================
-- AXE I - PARAMÈTRES ET RÈGLES D'ALERTES
-- ============================================
CREATE TABLE IF NOT EXISTS inv_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    code VARCHAR(100) UNIQUE NOT NULL,
    categorie VARCHAR(50) NOT NULL
        CHECK (categorie IN ('SEUIL', 'DELAI', 'REGLE', 'AFFICHAGE', 'WORKFLOW')),

    libelle VARCHAR(255) NOT NULL,
    description TEXT,

    -- Valeur (flexible)
    valeur_type VARCHAR(20) DEFAULT 'NUMBER'
        CHECK (valeur_type IN ('NUMBER', 'STRING', 'BOOLEAN', 'JSON', 'DATE')),
    valeur_number DECIMAL(18, 4),
    valeur_string TEXT,
    valeur_boolean BOOLEAN,
    valeur_json JSONB,

    -- Unité (si applicable)
    unite VARCHAR(50),                              -- %, jours, FCFA, etc.

    -- Limites (si NUMBER)
    valeur_min DECIMAL(18, 4),
    valeur_max DECIMAL(18, 4),

    -- Gestion
    modifiable BOOLEAN DEFAULT TRUE,
    actif BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inv_settings_categorie ON inv_settings(categorie);
CREATE INDEX idx_inv_settings_code ON inv_settings(code);

COMMENT ON TABLE inv_settings IS 'Paramètres et règles configurables du module Investissement';

-- Paramètres par défaut
INSERT INTO inv_settings (code, categorie, libelle, description, valeur_type, valeur_number, unite)
VALUES
    ('SEUIL_VARIATION_BUDGET', 'SEUIL', 'Seuil variation budget critique', 'Variation de coût déclenchant une alerte critique', 'NUMBER', 30, '%'),
    ('SEUIL_ECART_NOTIFIE_ECLATE', 'SEUIL', 'Tolérance écart notifié/éclaté', 'Écart accepté entre notifié et éclaté', 'NUMBER', 0, 'FCFA'),
    ('DELAI_REGULARISATION_LA', 'DELAI', 'Délai régularisation lettre avance', 'Délai par défaut pour régulariser une lettre d''avance', 'NUMBER', 90, 'jours'),
    ('DELAI_REGULARISATION_OP_PROV', 'DELAI', 'Délai régularisation OP provisoire', 'Délai avant fin d''exercice pour régulariser', 'NUMBER', 60, 'jours'),
    ('PERIODICITE_MISSION_TERRAIN', 'DELAI', 'Périodicité missions terrain', 'Fréquence par défaut des missions de terrain', 'NUMBER', 60, 'jours'),
    ('SEUIL_RETARD_EXECUTION', 'SEUIL', 'Seuil retard exécution', 'Retard déclenchant une alerte (écart prévu vs réel)', 'NUMBER', 15, '%'),
    ('CLASSE_RSF_OBLIGATOIRE', 'REGLE', 'Classes avec RSF obligatoire', 'Classes de dépenses nécessitant un RSF', 'JSON', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Mettre à jour le JSON pour CLASSE_RSF_OBLIGATOIRE
UPDATE inv_settings
SET valeur_json = '["2"]'::jsonb
WHERE code = 'CLASSE_RSF_OBLIGATOIRE';

INSERT INTO inv_settings (code, categorie, libelle, description, valeur_type, valeur_boolean)
VALUES
    ('BLOCAGE_TRANSFERT_SANS_ECLATE', 'REGLE', 'Bloquer 2e transfert sans éclaté', 'Empêcher le 2e transfert si pas de budget éclaté', 'BOOLEAN', TRUE),
    ('ALERTE_NON_BLOQUANTE_DOC', 'REGLE', 'Alertes documents non bloquantes', 'Les alertes de documents manquants ne sont pas bloquantes', 'BOOLEAN', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- AXE H - VUE PORTEFEUILLE OPE
-- ============================================
CREATE OR REPLACE VIEW v_inv_portfolio_ope AS
SELECT
    p.id,
    p.code,
    p.nom,
    p.type_projet,
    p.type_entite,
    p.entite_executante,
    p.secteur,
    p.secteur_code,
    p.ministere,
    p.cout_total,
    p.statut,
    p.phase,
    fs.montant_notifie,
    fs.montant_transfere,
    fs.montant_execute,
    fs.taux_execution,
    fs.taux_absorption,
    COALESCE(al.nb_alertes, 0) as nb_alertes,
    COALESCE(al.nb_critiques, 0) as nb_alertes_critiques,
    EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM COALESCE(p.date_premiere_inscription, p.date_debut_prevue)) + 1 as nb_annees_execution,
    p.bailleurs
FROM inv_project p
LEFT JOIN inv_financial_status fs ON fs.project_id = p.id
    AND fs.annee = EXTRACT(YEAR FROM CURRENT_DATE)
    AND fs.mois IS NULL
LEFT JOIN (
    SELECT project_id,
           COUNT(*) as nb_alertes,
           COUNT(CASE WHEN priorite = 'CRITIQUE' THEN 1 END) as nb_critiques
    FROM inv_alert WHERE statut = 'ACTIVE' GROUP BY project_id
) al ON al.project_id = p.id
WHERE p.is_ope = TRUE AND p.statut != 'ABANDONNE'
ORDER BY p.cout_total DESC;

COMMENT ON VIEW v_inv_portfolio_ope IS 'Vue dédiée aux Opérations Prioritaires de l''État';

-- ============================================
-- Vue: Synthèse alertes par type
-- ============================================
CREATE OR REPLACE VIEW v_inv_alerts_summary AS
SELECT
    type_alerte,
    code_alerte,
    priorite,
    COUNT(*) as total,
    COUNT(CASE WHEN statut = 'ACTIVE' THEN 1 END) as actives,
    COUNT(CASE WHEN statut = 'ACQUITTEE' THEN 1 END) as acquittees,
    COUNT(CASE WHEN statut = 'RESOLUE' THEN 1 END) as resolues
FROM inv_alert
GROUP BY type_alerte, code_alerte, priorite
ORDER BY
    CASE priorite
        WHEN 'CRITIQUE' THEN 1
        WHEN 'MAJEURE' THEN 2
        WHEN 'MINEURE' THEN 3
        ELSE 4
    END,
    total DESC;

-- ============================================
-- Vue: Soutenabilité projets (trajectoire)
-- ============================================
CREATE OR REPLACE VIEW v_inv_sustainability AS
SELECT
    p.id,
    p.code,
    p.nom,
    p.cout_total as cout_initial,
    b.montant_actuel as cout_actuel,
    CASE
        WHEN p.cout_total > 0
        THEN ROUND(((b.montant_actuel - p.cout_total) / p.cout_total) * 100, 2)
        ELSE 0
    END as variation_pct,
    CASE
        WHEN p.cout_total > 0 AND ((b.montant_actuel - p.cout_total) / p.cout_total) * 100 > 30
        THEN TRUE
        ELSE FALSE
    END as variation_critique,
    g.montant_glisse as dernier_glissement,
    g.motif as motif_glissement,
    p.date_debut_prevue,
    p.date_fin_prevue,
    CURRENT_DATE - p.date_debut_prevue as jours_execution,
    p.date_fin_prevue - CURRENT_DATE as jours_restants
FROM inv_project p
LEFT JOIN inv_budget b ON b.project_id = p.id
    AND b.annee = EXTRACT(YEAR FROM CURRENT_DATE)
LEFT JOIN inv_glide g ON g.project_id = p.id
    AND g.annee_origine = EXTRACT(YEAR FROM CURRENT_DATE) - 1
WHERE p.statut IN ('EN_COURS', 'SUSPENDU');

COMMENT ON VIEW v_inv_sustainability IS 'Vue de soutenabilité: évolution des coûts et délais';

-- ============================================
-- Triggers pour updated_at sur nouvelles tables
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
        AND table_name IN ('inv_pip_history', 'inv_ope_criteria', 'inv_provisional_op',
                          'inv_imprest', 'inv_quarterly_tracking', 'inv_gar_values',
                          'inv_doc_matrix', 'inv_decision', 'inv_settings')
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
COMMENT ON VIEW v_inv_portfolio_ope IS 'Portefeuille des Opérations Prioritaires de l''État';
COMMENT ON VIEW v_inv_alerts_summary IS 'Synthèse des alertes par type et priorité';
COMMENT ON VIEW v_inv_sustainability IS 'Analyse de soutenabilité des projets';

-- ============================================
-- Message de confirmation
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration 012 - Enrichissement Investissement';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Nouvelles tables créées:';
  RAISE NOTICE '  - inv_pip_history';
  RAISE NOTICE '  - inv_ope_criteria';
  RAISE NOTICE '  - inv_provisional_op';
  RAISE NOTICE '  - inv_imprest';
  RAISE NOTICE '  - inv_imprest_movement';
  RAISE NOTICE '  - inv_quarterly_tracking';
  RAISE NOTICE '  - inv_gar_values';
  RAISE NOTICE '  - inv_doc_matrix';
  RAISE NOTICE '  - inv_decision';
  RAISE NOTICE '  - inv_settings';
  RAISE NOTICE 'Nouvelles vues:';
  RAISE NOTICE '  - v_inv_portfolio_ope';
  RAISE NOTICE '  - v_inv_alerts_summary';
  RAISE NOTICE '  - v_inv_sustainability';
  RAISE NOTICE '==============================================';
END $$;
