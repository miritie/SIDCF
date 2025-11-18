-- ============================================
-- SIDCF Portal - PostgreSQL Schema Migration
-- ============================================
-- Migration complète du schéma localStorage vers PostgreSQL
-- Connexion: postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.c-3.us-east-1.aws.neon.tech/neondb

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PPM_PLAN - Plans de Passation des Marchés
-- ============================================
CREATE TABLE IF NOT EXISTS ppm_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unite VARCHAR(255) NOT NULL,
    exercice INTEGER NOT NULL,
    source VARCHAR(20) DEFAULT 'UNITAIRE' CHECK (source IN ('IMPORT', 'UNITAIRE')),
    fichier TEXT,
    feuille TEXT,
    auteur VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ppm_plan_exercice ON ppm_plan(exercice);
CREATE INDEX idx_ppm_plan_unite ON ppm_plan(unite);

-- ============================================
-- 2. BUDGET_LINE - Lignes budgétaires
-- ============================================
CREATE TABLE IF NOT EXISTS budget_line (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section VARCHAR(50),
    section_lib TEXT,
    programme VARCHAR(50),
    programme_lib TEXT,
    grande_nature VARCHAR(10),
    ua_code VARCHAR(50),
    ua_lib TEXT,
    zone_code VARCHAR(50),
    zone_lib TEXT,
    action_code VARCHAR(50),
    action_lib TEXT,
    activite_code VARCHAR(50),
    activite_lib TEXT,
    type_financement VARCHAR(50),
    source_financement VARCHAR(50),
    ligne_code VARCHAR(50),
    ligne_lib TEXT,
    ae DECIMAL(15,2) DEFAULT 0,
    cp DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_line_ua_code ON budget_line(ua_code);
CREATE INDEX idx_budget_line_activite_code ON budget_line(activite_code);

-- ============================================
-- 3. OPERATION - Marchés / Opérations
-- ============================================
CREATE TABLE IF NOT EXISTS operation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES ppm_plan(id) ON DELETE SET NULL,
    budget_line_id UUID REFERENCES budget_line(id) ON DELETE SET NULL,

    -- Identification
    unite VARCHAR(255) NOT NULL,
    exercice INTEGER,
    objet TEXT NOT NULL,

    -- Classification
    type_marche VARCHAR(100),
    mode_passation VARCHAR(100),
    categorie_procedure VARCHAR(100),
    nature_prix VARCHAR(100),
    revue VARCHAR(100),

    -- Financier
    montant_previsionnel DECIMAL(15,2) DEFAULT 0,
    montant_actuel DECIMAL(15,2) DEFAULT 0,
    devise VARCHAR(10) DEFAULT 'XOF',
    type_financement VARCHAR(100),
    source_financement VARCHAR(100),

    -- Technique
    duree_previsionnelle INTEGER DEFAULT 0,
    delai_execution INTEGER DEFAULT 0,
    categorie_prestation VARCHAR(100),
    beneficiaire TEXT,
    livrables JSONB DEFAULT '[]'::jsonb,

    -- Chaîne budgétaire (JSONB pour structure complexe)
    chaine_budgetaire JSONB DEFAULT '{}'::jsonb,

    -- Localisation (JSONB pour structure complexe)
    localisation JSONB DEFAULT '{}'::jsonb,

    -- Workflow
    timeline JSONB DEFAULT '["PLANIF"]'::jsonb,
    etat VARCHAR(50) DEFAULT 'PLANIFIE',
    proc_derogation JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_operation_plan_id ON operation(plan_id);
CREATE INDEX idx_operation_budget_line_id ON operation(budget_line_id);
CREATE INDEX idx_operation_exercice ON operation(exercice);
CREATE INDEX idx_operation_etat ON operation(etat);
CREATE INDEX idx_operation_type_marche ON operation(type_marche);
CREATE INDEX idx_operation_unite ON operation(unite);

-- ============================================
-- 4. LIVRABLE - Livrables / Réalisations
-- ============================================
CREATE TABLE IF NOT EXISTS livrable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    type VARCHAR(100),
    libelle TEXT,
    localisation JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_livrable_operation_id ON livrable(operation_id);

-- ============================================
-- 5. ENTREPRISE - Entreprises soumissionnaires
-- ============================================
CREATE TABLE IF NOT EXISTS entreprise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ncc VARCHAR(50) UNIQUE,
    rccm VARCHAR(50),
    raison_sociale VARCHAR(255) NOT NULL,
    sigle VARCHAR(50),
    ifu VARCHAR(50),
    adresse TEXT,
    telephone VARCHAR(50),
    email VARCHAR(255),
    contacts JSONB DEFAULT '[]'::jsonb,
    banque JSONB DEFAULT '{}'::jsonb,
    compte JSONB DEFAULT '{}'::jsonb,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entreprise_ncc ON entreprise(ncc);
CREATE INDEX idx_entreprise_raison_sociale ON entreprise(raison_sociale);
CREATE INDEX idx_entreprise_actif ON entreprise(actif);

-- ============================================
-- 6. GROUPEMENT - Groupements d'entreprises
-- ============================================
CREATE TABLE IF NOT EXISTS groupement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    libelle VARCHAR(255) NOT NULL,
    nature VARCHAR(50) DEFAULT 'COTRAITANCE' CHECK (nature IN ('COTRAITANCE', 'SOUSTRAITANCE')),
    mandataire_id UUID REFERENCES entreprise(id) ON DELETE SET NULL,
    membres JSONB DEFAULT '[]'::jsonb,
    banque JSONB DEFAULT '{}'::jsonb,
    compte JSONB DEFAULT '{}'::jsonb,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_groupement_mandataire_id ON groupement(mandataire_id);
CREATE INDEX idx_groupement_actif ON groupement(actif);

-- ============================================
-- 7. PROCEDURE - Procédures de passation
-- ============================================
CREATE TABLE IF NOT EXISTS procedure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    commission VARCHAR(50) DEFAULT 'COJO',
    mode_passation VARCHAR(100),
    categorie VARCHAR(50) DEFAULT 'NATIONALE',
    type_dossier_appel VARCHAR(100),
    dossier_appel_doc TEXT,
    dates JSONB DEFAULT '{}'::jsonb,
    nb_offres_recues INTEGER DEFAULT 0,
    nb_offres_classees INTEGER DEFAULT 0,
    pv JSONB DEFAULT '{}'::jsonb,
    rapport_analyse_doc TEXT,
    decision_attribution_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_procedure_operation_id ON procedure(operation_id);

-- ============================================
-- 8. RECOURS - Recours gracieux/contentieux
-- ============================================
CREATE TABLE IF NOT EXISTS recours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'GRACIEUX',
    date_depot TIMESTAMPTZ,
    date_resolution TIMESTAMPTZ,
    docs JSONB DEFAULT '[]'::jsonb,
    statut VARCHAR(50) DEFAULT 'EN_COURS',
    commentaire TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recours_operation_id ON recours(operation_id);
CREATE INDEX idx_recours_statut ON recours(statut);

-- ============================================
-- 9. ATTRIBUTION - Attributions de marché
-- ============================================
CREATE TABLE IF NOT EXISTS attribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    attributaire JSONB DEFAULT '{}'::jsonb,
    montants JSONB DEFAULT '{}'::jsonb,
    garanties JSONB DEFAULT '{}'::jsonb,
    dates JSONB DEFAULT '{}'::jsonb,
    decision_cf JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attribution_operation_id ON attribution(operation_id);

-- ============================================
-- 10. ANO - Avis de Non-Objection
-- ============================================
CREATE TABLE IF NOT EXISTS ano (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'PROCEDURE',
    avenant_id UUID,
    organisme VARCHAR(100) DEFAULT 'DGMP',
    organisme_detail TEXT,
    date_demande TIMESTAMPTZ,
    date_reponse TIMESTAMPTZ,
    decision VARCHAR(50),
    motif_refus TEXT,
    document_demande TEXT,
    document_reponse TEXT,
    commentaire TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ano_operation_id ON ano(operation_id);
CREATE INDEX idx_ano_decision ON ano(decision);

-- ============================================
-- 11. ECHEANCIER - Échéanciers de paiement
-- ============================================
CREATE TABLE IF NOT EXISTS echeancier (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    periodicite VARCHAR(50) DEFAULT 'LIBRE',
    periodicite_jours INTEGER,
    items JSONB DEFAULT '[]'::jsonb,
    total DECIMAL(15,2) DEFAULT 0,
    total_pourcent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_echeancier_operation_id ON echeancier(operation_id);

-- ============================================
-- 12. CLE_REPARTITION - Clés de répartition
-- ============================================
CREATE TABLE IF NOT EXISTS cle_repartition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    lignes JSONB DEFAULT '[]'::jsonb,
    total DECIMAL(15,2) DEFAULT 0,
    sum_pourcent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cle_repartition_operation_id ON cle_repartition(operation_id);

-- ============================================
-- 13. VISA_CF - Visas du Contrôleur Financier
-- ============================================
CREATE TABLE IF NOT EXISTS visa_cf (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    attribution_id UUID REFERENCES attribution(id) ON DELETE SET NULL,
    decision VARCHAR(50),
    date_decision TIMESTAMPTZ,
    contrat_doc TEXT,
    lettre_marche TEXT,
    formulaire_selection TEXT,
    type_reserve VARCHAR(100),
    motif_reserve TEXT,
    motif_refus VARCHAR(100),
    commentaire_refus TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visa_cf_operation_id ON visa_cf(operation_id);
CREATE INDEX idx_visa_cf_attribution_id ON visa_cf(attribution_id);
CREATE INDEX idx_visa_cf_decision ON visa_cf(decision);

-- ============================================
-- 14. ORDRE_SERVICE - Ordres de service
-- ============================================
CREATE TABLE IF NOT EXISTS ordre_service (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    date_emission TIMESTAMPTZ,
    objet TEXT,
    doc_ref TEXT,
    bureau_controle JSONB DEFAULT '{}'::jsonb,
    bureau_etudes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ordre_service_operation_id ON ordre_service(operation_id);
CREATE INDEX idx_ordre_service_numero ON ordre_service(numero);

-- ============================================
-- 15. AVENANT - Avenants de marché
-- ============================================
CREATE TABLE IF NOT EXISTS avenant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    numero INTEGER DEFAULT 1,
    type VARCHAR(50) DEFAULT 'FINAN',
    a_incidence_financiere BOOLEAN DEFAULT TRUE,
    variation_montant DECIMAL(15,2) DEFAULT 0,
    variation_duree INTEGER DEFAULT 0,
    nouveau_montant_total DECIMAL(15,2) DEFAULT 0,
    nouveau_delai_total INTEGER DEFAULT 0,
    incidence_pourcent DECIMAL(5,2) DEFAULT 0,
    cumul_pourcent DECIMAL(5,2) DEFAULT 0,
    date_signature TIMESTAMPTZ,
    motif_ref VARCHAR(100),
    motif_autre TEXT,
    document_ref TEXT,
    visa_cf_ref TEXT,
    ano_required BOOLEAN DEFAULT FALSE,
    ano_doc TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_avenant_operation_id ON avenant(operation_id);
CREATE INDEX idx_avenant_type ON avenant(type);

-- ============================================
-- 16. RESILIATION - Résiliations de marché
-- ============================================
CREATE TABLE IF NOT EXISTS resiliation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    date_resiliation TIMESTAMPTZ,
    motif_ref VARCHAR(100),
    motif_autre TEXT,
    document_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resiliation_operation_id ON resiliation(operation_id);

-- ============================================
-- 17. GARANTIE - Garanties bancaires
-- ============================================
CREATE TABLE IF NOT EXISTS garantie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'BONNE_EXEC',
    montant DECIMAL(15,2) DEFAULT 0,
    taux DECIMAL(5,2) DEFAULT 0,
    date_emission TIMESTAMPTZ,
    date_echeance TIMESTAMPTZ,
    etat VARCHAR(50) DEFAULT 'ACTIVE',
    doc TEXT,
    mainlevee_date TIMESTAMPTZ,
    mainlevee_doc TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_garantie_operation_id ON garantie(operation_id);
CREATE INDEX idx_garantie_type ON garantie(type);
CREATE INDEX idx_garantie_etat ON garantie(etat);

-- ============================================
-- 18. CLOTURE - Clôtures de marché
-- ============================================
CREATE TABLE IF NOT EXISTS cloture (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    reception_prov JSONB DEFAULT '{}'::jsonb,
    reception_def JSONB DEFAULT '{}'::jsonb,
    decomptes JSONB DEFAULT '[]'::jsonb,
    montant_total_paye DECIMAL(15,2) DEFAULT 0,
    montant_marche_total DECIMAL(15,2) DEFAULT 0,
    ecart_montant DECIMAL(15,2) DEFAULT 0,
    mainlevees JSONB DEFAULT '[]'::jsonb,
    synthese_finale TEXT,
    clos_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cloture_operation_id ON cloture(operation_id);

-- ============================================
-- 19. DOCUMENT - Documents associés
-- ============================================
CREATE TABLE IF NOT EXISTS document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES operation(id) ON DELETE CASCADE,
    entity_type VARCHAR(50),
    entity_id UUID,
    phase VARCHAR(50),
    type_document VARCHAR(100),
    nom VARCHAR(255) NOT NULL,
    fichier TEXT, -- URL Cloudflare R2
    taille BIGINT DEFAULT 0,
    version INTEGER DEFAULT 1,
    obligatoire BOOLEAN DEFAULT FALSE,
    statut VARCHAR(50) DEFAULT 'DRAFT',
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMPTZ,
    validated_by VARCHAR(255),
    validated_at TIMESTAMPTZ,
    commentaire TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_operation_id ON document(operation_id);
CREATE INDEX idx_document_entity_type ON document(entity_type);
CREATE INDEX idx_document_entity_id ON document(entity_id);
CREATE INDEX idx_document_phase ON document(phase);
CREATE INDEX idx_document_type_document ON document(type_document);

-- ============================================
-- 20. DECOMPTE - Décomptes de paiement
-- ============================================
CREATE TABLE IF NOT EXISTS decompte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    type_op VARCHAR(50) DEFAULT 'CUMULS',
    numero_op VARCHAR(50),
    date_decompte TIMESTAMPTZ,
    acompte_htva DECIMAL(15,2) DEFAULT 0,
    avance DECIMAL(15,2) DEFAULT 0,
    garantie DECIMAL(15,2) DEFAULT 0,
    penalite DECIMAL(15,2) DEFAULT 0,
    net_htva DECIMAL(15,2) DEFAULT 0,
    net_ttc DECIMAL(15,2) DEFAULT 0,
    etat VARCHAR(50) DEFAULT 'DRAFT',
    bailleur VARCHAR(100),
    decision VARCHAR(50),
    taux_execution DECIMAL(5,2) DEFAULT 0,
    ordre_service_id UUID REFERENCES ordre_service(id) ON DELETE SET NULL,
    document_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decompte_operation_id ON decompte(operation_id);
CREATE INDEX idx_decompte_numero ON decompte(numero);
CREATE INDEX idx_decompte_etat ON decompte(etat);

-- ============================================
-- 21. DIFFICULTE - Difficultés d'exécution
-- ============================================
CREATE TABLE IF NOT EXISTS difficulte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    statut_traitement VARCHAR(50) DEFAULT 'EN_COURS',
    decision VARCHAR(100),
    probleme TEXT,
    date_decision TIMESTAMPTZ,
    nom_decideur VARCHAR(255),
    fichier TEXT,
    impact VARCHAR(50) DEFAULT 'FAIBLE',
    categorie_probleme VARCHAR(100),
    actions_correctives TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_difficulte_operation_id ON difficulte(operation_id);
CREATE INDEX idx_difficulte_statut ON difficulte(statut_traitement);
CREATE INDEX idx_difficulte_impact ON difficulte(impact);

-- ============================================
-- Triggers pour updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$$;

-- ============================================
-- Vues utiles pour les statistiques
-- ============================================

-- Vue: Opérations avec détails complets
CREATE OR REPLACE VIEW v_operations_full AS
SELECT
    o.*,
    p.unite as plan_unite,
    p.exercice as plan_exercice,
    bl.ua_lib,
    bl.activite_lib,
    COUNT(DISTINCT l.id) as nb_livrables,
    COUNT(DISTINCT av.id) as nb_avenants,
    COUNT(DISTINCT d.id) as nb_documents
FROM operation o
LEFT JOIN ppm_plan p ON o.plan_id = p.id
LEFT JOIN budget_line bl ON o.budget_line_id = bl.id
LEFT JOIN livrable l ON l.operation_id = o.id
LEFT JOIN avenant av ON av.operation_id = o.id
LEFT JOIN document d ON d.operation_id = o.id
GROUP BY o.id, p.id, bl.id;

-- Vue: Statistiques globales
CREATE OR REPLACE VIEW v_stats_global AS
SELECT
    (SELECT COUNT(*) FROM operation) as total_marches,
    (SELECT COUNT(*) FROM operation WHERE etat = 'EN_COURS') as marches_en_cours,
    (SELECT COUNT(*) FROM operation WHERE etat = 'CLOTURE') as marches_clos,
    (SELECT SUM(montant_actuel) FROM operation) as montant_total,
    (SELECT COUNT(*) FROM entreprise WHERE actif = TRUE) as entreprises_actives,
    (SELECT COUNT(*) FROM avenant) as total_avenants,
    (SELECT COUNT(*) FROM document) as total_documents;

-- ============================================
-- Commentaires sur les tables
-- ============================================
COMMENT ON TABLE ppm_plan IS 'Plans de Passation des Marchés (PPM)';
COMMENT ON TABLE operation IS 'Marchés publics / Opérations';
COMMENT ON TABLE budget_line IS 'Lignes budgétaires';
COMMENT ON TABLE livrable IS 'Livrables attendus pour chaque marché';
COMMENT ON TABLE entreprise IS 'Entreprises soumissionnaires et titulaires';
COMMENT ON TABLE groupement IS 'Groupements d''entreprises (cotraitance/sous-traitance)';
COMMENT ON TABLE procedure IS 'Procédures de passation des marchés';
COMMENT ON TABLE recours IS 'Recours gracieux et contentieux';
COMMENT ON TABLE attribution IS 'Attributions de marchés aux entreprises';
COMMENT ON TABLE ano IS 'Avis de Non-Objection (DGMP/Bailleurs)';
COMMENT ON TABLE echeancier IS 'Échéanciers de paiement';
COMMENT ON TABLE cle_repartition IS 'Clés de répartition multi-bailleurs';
COMMENT ON TABLE visa_cf IS 'Visas du Contrôleur Financier';
COMMENT ON TABLE ordre_service IS 'Ordres de service';
COMMENT ON TABLE avenant IS 'Avenants de marchés';
COMMENT ON TABLE resiliation IS 'Résiliations de marchés';
COMMENT ON TABLE garantie IS 'Garanties bancaires et cautionnements';
COMMENT ON TABLE cloture IS 'Clôtures de marchés (réception provisoire/définitive)';
COMMENT ON TABLE document IS 'Documents associés (stockés sur Cloudflare R2)';
COMMENT ON TABLE decompte IS 'Décomptes de paiement';
COMMENT ON TABLE difficulte IS 'Difficultés d''exécution';
