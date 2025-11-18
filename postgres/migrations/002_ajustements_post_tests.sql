-- ============================================
-- SIDCF Portal - Migration 002
-- Ajustements Post-Tests Utilisateurs
-- ============================================
-- Date: 2025-11-17
-- Description: Ajout des champs et tables manquants suite aux retours de tests
-- Conformité: Code des Marchés Publics CI + Pratiques DCF/DGMP

-- ============================================
-- 1. NOUVELLE TABLE: LOT
-- ============================================
CREATE TABLE IF NOT EXISTS lot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    objet TEXT NOT NULL,

    -- Montants prévisionnels
    montant_previsionnel_ht DECIMAL(15,2) DEFAULT 0,
    montant_previsionnel_ttc DECIMAL(15,2) DEFAULT 0,

    -- Livrables attendus
    livrables_attendus JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{type, libelle, quantite, unite}]

    -- Entreprises soumissionnaires sur le lot (JSONB pour flexibilité)
    soumissionnaires JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{entreprise_id, montant_offre_ht, montant_offre_ttc, rang}]

    -- Attributaire du lot (si alloti)
    attributaire_id UUID REFERENCES entreprise(id) ON DELETE SET NULL,
    montant_attribution_ht DECIMAL(15,2) DEFAULT 0,
    montant_attribution_ttc DECIMAL(15,2) DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lot_operation_id ON lot(operation_id);
CREATE INDEX idx_lot_attributaire_id ON lot(attributaire_id);

COMMENT ON TABLE lot IS 'Lots de marchés pour procédures allotis (PSC, PSL, PSO, AOO, PI)';
COMMENT ON COLUMN lot.soumissionnaires IS 'Liste des soumissionnaires sur le lot (optionnel, privilégier upload documentation)';

-- ============================================
-- 2. NOUVELLE TABLE: SOUMISSIONNAIRE (Optionnel)
-- ============================================
CREATE TABLE IF NOT EXISTS soumissionnaire (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lot(id) ON DELETE SET NULL,

    entreprise_id UUID REFERENCES entreprise(id) ON DELETE SET NULL,
    groupement_id UUID REFERENCES groupement(id) ON DELETE SET NULL,

    -- Offre
    montant_offre_ht DECIMAL(15,2) DEFAULT 0,
    montant_offre_ttc DECIMAL(15,2) DEFAULT 0,
    delai_propose INTEGER, -- en jours

    -- Évaluation
    rang INTEGER, -- classement après analyse
    note_technique DECIMAL(5,2),
    note_financiere DECIMAL(5,2),
    note_finale DECIMAL(5,2),

    -- Statut
    conforme BOOLEAN DEFAULT TRUE,
    retenu BOOLEAN DEFAULT FALSE,
    statut_sanctionne BOOLEAN DEFAULT FALSE, -- Liste noire
    motif_non_conformite TEXT,

    -- Documents
    documents JSONB DEFAULT '[]'::jsonb,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT check_entreprise_or_groupement CHECK (
        (entreprise_id IS NOT NULL AND groupement_id IS NULL) OR
        (entreprise_id IS NULL AND groupement_id IS NOT NULL)
    )
);

CREATE INDEX idx_soumissionnaire_operation_id ON soumissionnaire(operation_id);
CREATE INDEX idx_soumissionnaire_lot_id ON soumissionnaire(lot_id);
CREATE INDEX idx_soumissionnaire_entreprise_id ON soumissionnaire(entreprise_id);
CREATE INDEX idx_soumissionnaire_groupement_id ON soumissionnaire(groupement_id);
CREATE INDEX idx_soumissionnaire_retenu ON soumissionnaire(retenu);

COMMENT ON TABLE soumissionnaire IS 'Soumissionnaires (OPTIONNEL - privilégier upload documentation complète)';

-- ============================================
-- 3. MODIFICATIONS TABLE: operation
-- ============================================

-- Planification: Unité Opérationnelle
ALTER TABLE operation ADD COLUMN IF NOT EXISTS unite_operationnelle VARCHAR(255);
COMMENT ON COLUMN operation.unite_operationnelle IS 'Unité Opérationnelle (distinct de UA budgétaire)';

-- Planification: Activité
ALTER TABLE operation ADD COLUMN IF NOT EXISTS activite_code VARCHAR(50);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS activite_lib TEXT;
COMMENT ON COLUMN operation.activite_code IS 'Code activité (distinct de Action)';
COMMENT ON COLUMN operation.activite_lib IS 'Libellé activité';

-- Planification: Type d'opération
ALTER TABLE operation ADD COLUMN IF NOT EXISTS type_operation VARCHAR(50);
ALTER TABLE operation ADD CONSTRAINT check_type_operation
    CHECK (type_operation IN ('MARCHE_100M_PLUS', 'CONTRAT_MOINS_100M'));
COMMENT ON COLUMN operation.type_operation IS 'Classification selon montant: Marché 100M+ ou Contrat <100M';

-- Planification: Coordonnées géographiques
ALTER TABLE operation ADD COLUMN IF NOT EXISTS coordonnees_geo JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN operation.coordonnees_geo IS 'Localisation géographique précise (région, département, sous-préfecture, village, lat, lng)';

-- Planification: Seuils conformité
ALTER TABLE operation ADD COLUMN IF NOT EXISTS seuil_montant_min DECIMAL(15,2);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS seuil_montant_max DECIMAL(15,2);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS conforme_seuils BOOLEAN DEFAULT TRUE;
COMMENT ON COLUMN operation.seuil_montant_min IS 'Seuil minimum pour le mode de passation sélectionné';
COMMENT ON COLUMN operation.seuil_montant_max IS 'Seuil maximum pour le mode de passation sélectionné';
COMMENT ON COLUMN operation.conforme_seuils IS 'Indique si le montant est conforme aux seuils du mode (FALSE = dérogation)';

CREATE INDEX idx_operation_coordonnees_geo ON operation USING gin(coordonnees_geo);
CREATE INDEX idx_operation_conforme_seuils ON operation(conforme_seuils);

-- ============================================
-- 4. MODIFICATIONS TABLE: procedure
-- ============================================

-- Contractualisation: Dates
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS date_selection TIMESTAMPTZ;
COMMENT ON COLUMN procedure.date_selection IS 'Date de sélection finale du prestataire (PSD/PSC)';

-- Contractualisation: Documents PSD
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS bon_commande_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS facture_proforma_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS prestataire_sanctionne BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN procedure.bon_commande_doc IS 'URL Cloudflare R2 - Bon de commande (PSD)';
COMMENT ON COLUMN procedure.facture_proforma_doc IS 'URL Cloudflare R2 - Facture proforma (PSD)';
COMMENT ON COLUMN procedure.prestataire_sanctionne IS 'Prestataire sur liste noire (vérification obligatoire)';

-- Contractualisation: Documents PSC/PSL/PSO/AOO
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS dossier_concurrence_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS formulaire_selection_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS courrier_invitation_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS mandat_representation_doc TEXT;
COMMENT ON COLUMN procedure.dossier_concurrence_doc IS 'URL Cloudflare R2 - Archive complète du dossier de concurrence (ZIP)';
COMMENT ON COLUMN procedure.formulaire_selection_doc IS 'URL Cloudflare R2 - Formulaire de sélection (PSC)';
COMMENT ON COLUMN procedure.courrier_invitation_doc IS 'URL Cloudflare R2 - Courrier d\'invitation COJO';
COMMENT ON COLUMN procedure.mandat_representation_doc IS 'URL Cloudflare R2 - Mandats de représentation';

CREATE INDEX idx_procedure_prestataire_sanctionne ON procedure(prestataire_sanctionne);

-- ============================================
-- 5. MODIFICATIONS TABLE: attribution
-- ============================================

-- Attribution: Références documents
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS numero_bon_commande VARCHAR(50);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS numero_lettre_marche VARCHAR(50);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS numero_facture_definitive VARCHAR(50);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS date_visa_cf TIMESTAMPTZ;
COMMENT ON COLUMN attribution.numero_bon_commande IS 'Numéro bon de commande (PSD)';
COMMENT ON COLUMN attribution.numero_lettre_marche IS 'Numéro lettre de marché (PSC)';
COMMENT ON COLUMN attribution.numero_facture_definitive IS 'Numéro facture définitive (PSD/PSC)';
COMMENT ON COLUMN attribution.date_visa_cf IS 'Date de visa CF (sur acte de dépense)';

-- Attribution: Marché de base - Fichiers
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS marche_signe_doc TEXT;
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS lettre_marche_doc TEXT;
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS facture_definitive_doc TEXT;
COMMENT ON COLUMN attribution.marche_signe_doc IS 'URL R2 - Fichier du marché de base signé et approuvé';
COMMENT ON COLUMN attribution.lettre_marche_doc IS 'URL R2 - Lettre de marché (PSC)';
COMMENT ON COLUMN attribution.facture_definitive_doc IS 'URL R2 - Facture définitive (PSD/PSC)';

-- Attribution: Garanties détaillées
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS avance_demarrage_taux DECIMAL(5,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS avance_demarrage_montant DECIMAL(15,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_avance_doc TEXT;
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_bonne_execution_taux DECIMAL(5,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_bonne_execution_montant DECIMAL(15,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_bonne_execution_doc TEXT;
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_duree_jours INTEGER;
COMMENT ON COLUMN attribution.avance_demarrage_taux IS 'Taux avance de démarrage (max 15%)';
COMMENT ON COLUMN attribution.avance_demarrage_montant IS 'Montant avance de démarrage en XOF';
COMMENT ON COLUMN attribution.garantie_avance_doc IS 'URL R2 - Garantie d\'avance (si avance)';
COMMENT ON COLUMN attribution.garantie_bonne_execution_taux IS 'Taux garantie bonne exécution (3-10%)';
COMMENT ON COLUMN attribution.garantie_bonne_execution_montant IS 'Montant garantie bonne exécution en XOF';
COMMENT ON COLUMN attribution.garantie_bonne_execution_doc IS 'URL R2 - Garantie de bonne exécution';
COMMENT ON COLUMN attribution.garantie_duree_jours IS 'Durée de garantie en jours';

CREATE INDEX idx_attribution_date_visa_cf ON attribution(date_visa_cf);

-- ============================================
-- 6. MODIFICATIONS TABLE: avenant
-- ============================================

-- Avenant: Types détaillés
ALTER TABLE avenant DROP CONSTRAINT IF EXISTS avenant_type_check;
ALTER TABLE avenant ADD CONSTRAINT avenant_type_check CHECK (
    type IN (
        'AVEC_INCIDENCE_FINANCIERE',
        'SANS_INCIDENCE_FINANCIERE',
        'PORTANT_SUR_DUREE',
        'PORTANT_SUR_LIBELLE',
        'PORTANT_SUR_NATURE_ECO',
        'MIXTE'
    )
);

-- Avenant: Fichiers distincts du marché de base
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS avenant_signe_doc TEXT;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS justificatif_avenant_doc TEXT;
COMMENT ON COLUMN avenant.avenant_signe_doc IS 'URL R2 - Fichier de l\'avenant signé (DISTINCT du marché de base)';
COMMENT ON COLUMN avenant.justificatif_avenant_doc IS 'URL R2 - Pièces justificatives de l\'avenant (obligatoire si ≥30%)';

-- Avenant: Traçabilité état marché avant/après
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS montant_avant DECIMAL(15,2);
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS montant_apres DECIMAL(15,2);
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS duree_avant INTEGER;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS duree_apres INTEGER;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS objet_avant TEXT;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS objet_apres TEXT;
COMMENT ON COLUMN avenant.montant_avant IS 'Montant du marché avant avenant';
COMMENT ON COLUMN avenant.montant_apres IS 'Montant du marché après avenant';
COMMENT ON COLUMN avenant.duree_avant IS 'Durée en jours avant avenant';
COMMENT ON COLUMN avenant.duree_apres IS 'Durée en jours après avenant';

CREATE INDEX idx_avenant_cumul_pourcent ON avenant(cumul_pourcent);

-- ============================================
-- 7. MODIFICATIONS TABLE: ordre_service
-- ============================================

ALTER TABLE ordre_service ADD COLUMN IF NOT EXISTS duree_execution_prevue INTEGER;
ALTER TABLE ordre_service ADD COLUMN IF NOT EXISTS date_fin_previsionnelle TIMESTAMPTZ;
COMMENT ON COLUMN ordre_service.duree_execution_prevue IS 'Durée d\'exécution prévue à partir de l\'OS DEMARRAGE (en jours)';
COMMENT ON COLUMN ordre_service.date_fin_previsionnelle IS 'Date de fin prévisionnelle (calculée)';

-- ============================================
-- 8. MODIFICATIONS TABLE: cloture
-- ============================================

ALTER TABLE cloture ADD COLUMN IF NOT EXISTS date_fin_reelle TIMESTAMPTZ;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS date_dernier_decompte TIMESTAMPTZ;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS satisfaction_beneficiaires TEXT;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS livrables_conformes BOOLEAN DEFAULT TRUE;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS observations_finales TEXT;
COMMENT ON COLUMN cloture.date_fin_reelle IS 'Date de fin réelle du marché (date du dernier décompte)';
COMMENT ON COLUMN cloture.date_dernier_decompte IS 'Date du dernier décompte (identique à date_fin_reelle)';
COMMENT ON COLUMN cloture.satisfaction_beneficiaires IS 'Feedback des bénéficiaires sur les livrables';
COMMENT ON COLUMN cloture.livrables_conformes IS 'Livrables conformes aux spécifications? (Oui/Non)';
COMMENT ON COLUMN cloture.observations_finales IS 'Observations finales de clôture';

CREATE INDEX idx_cloture_date_fin_reelle ON cloture(date_fin_reelle);

-- ============================================
-- 9. MODIFICATIONS TABLE: entreprise
-- ============================================

ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS sanctionne BOOLEAN DEFAULT FALSE;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS date_sanction TIMESTAMPTZ;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS motif_sanction TEXT;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS fin_sanction TIMESTAMPTZ;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS statut_juridique VARCHAR(100);
COMMENT ON COLUMN entreprise.sanctionne IS 'Entreprise sur liste noire (interdiction de soumissionner)';
COMMENT ON COLUMN entreprise.date_sanction IS 'Date de début de la sanction';
COMMENT ON COLUMN entreprise.motif_sanction IS 'Motif de la sanction';
COMMENT ON COLUMN entreprise.fin_sanction IS 'Date de fin de la sanction (si temporaire)';
COMMENT ON COLUMN entreprise.statut_juridique IS 'Statut juridique de l\'entreprise';

CREATE INDEX idx_entreprise_sanctionne ON entreprise(sanctionne);

-- ============================================
-- 10. VUES MÉTIER ENRICHIES
-- ============================================

-- Vue: Opérations avec Géolocalisation
DROP VIEW IF EXISTS v_operations_geo;
CREATE VIEW v_operations_geo AS
SELECT
    o.id,
    o.objet,
    o.unite,
    o.exercice,
    o.mode_passation,
    o.montant_actuel,
    o.etat,
    o.coordonnees_geo->>'region' as region,
    o.coordonnees_geo->>'departement' as departement,
    o.coordonnees_geo->>'sous_prefecture' as sous_prefecture,
    o.coordonnees_geo->>'village' as village,
    CAST(o.coordonnees_geo->>'latitude' AS FLOAT) as latitude,
    CAST(o.coordonnees_geo->>'longitude' AS FLOAT) as longitude
FROM operation o
WHERE o.coordonnees_geo IS NOT NULL
AND o.coordonnees_geo->>'latitude' IS NOT NULL;

COMMENT ON VIEW v_operations_geo IS 'Opérations avec coordonnées géographiques pour mapping';

-- Vue: Marchés avec Avenants Cumulés
DROP VIEW IF EXISTS v_marches_avenants_cumul;
CREATE VIEW v_marches_avenants_cumul AS
SELECT
    o.id as operation_id,
    o.objet,
    o.montant_previsionnel as montant_initial,
    o.montant_actuel as montant_avec_avenants,
    COUNT(av.id) as nb_avenants,
    COALESCE(SUM(av.variation_montant), 0) as total_variation_montant,
    COALESCE(MAX(av.cumul_pourcent), 0) as cumul_pourcent_max,
    CASE
        WHEN COALESCE(MAX(av.cumul_pourcent), 0) >= 30 THEN 'CRITIQUE'
        WHEN COALESCE(MAX(av.cumul_pourcent), 0) >= 25 THEN 'ALERTE'
        ELSE 'NORMAL'
    END as statut_avenants
FROM operation o
LEFT JOIN avenant av ON av.operation_id = o.id
WHERE o.etat IN ('EN_EXEC', 'CLOTURE')
GROUP BY o.id;

COMMENT ON VIEW v_marches_avenants_cumul IS 'Suivi des avenants cumulés avec alertes 25/30%';

-- Vue: Statistiques par Mode de Passation
DROP VIEW IF EXISTS v_stats_mode_passation;
CREATE VIEW v_stats_mode_passation AS
SELECT
    mode_passation,
    COUNT(*) as nb_marches,
    SUM(montant_actuel) as montant_total,
    AVG(montant_actuel) as montant_moyen,
    COUNT(CASE WHEN etat = 'CLOTURE' THEN 1 END) as nb_clotures,
    COUNT(CASE WHEN conforme_seuils = FALSE THEN 1 END) as nb_derogations
FROM operation
WHERE mode_passation IS NOT NULL
GROUP BY mode_passation
ORDER BY nb_marches DESC;

COMMENT ON VIEW v_stats_mode_passation IS 'Statistiques par mode de passation';

-- Vue: Entreprises Sanctionnées Actives
DROP VIEW IF EXISTS v_entreprises_sanctionnees;
CREATE VIEW v_entreprises_sanctionnees AS
SELECT
    e.id,
    e.ncc,
    e.raison_sociale,
    e.date_sanction,
    e.fin_sanction,
    e.motif_sanction,
    CASE
        WHEN e.fin_sanction IS NULL THEN TRUE
        WHEN e.fin_sanction > NOW() THEN TRUE
        ELSE FALSE
    END as sanction_active
FROM entreprise e
WHERE e.sanctionne = TRUE;

COMMENT ON VIEW v_entreprises_sanctionnees IS 'Liste des entreprises sanctionnées avec statut actif/expiré';

-- ============================================
-- 11. FONCTIONS DE VALIDATION
-- ============================================

-- Validation: Planification
CREATE OR REPLACE FUNCTION validate_planification(op_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.objet IS NOT NULL
        AND o.type_marche IS NOT NULL
        AND o.mode_passation IS NOT NULL
        AND o.montant_previsionnel > 0
        AND o.coordonnees_geo IS NOT NULL
        AND o.coordonnees_geo->>'region' IS NOT NULL
        AS valid,
        CASE
            WHEN o.objet IS NULL THEN 'Objet obligatoire'
            WHEN o.type_marche IS NULL THEN 'Type de marché obligatoire'
            WHEN o.mode_passation IS NULL THEN 'Mode de passation obligatoire'
            WHEN o.montant_previsionnel <= 0 THEN 'Montant prévisionnel invalide'
            WHEN o.coordonnees_geo IS NULL OR o.coordonnees_geo->>'region' IS NULL
                THEN 'Coordonnées géographiques obligatoires (au moins la région)'
            ELSE 'Validation OK'
        END AS message
    FROM operation o
    WHERE o.id = op_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_planification IS 'Valide les champs obligatoires de la phase PLANIFICATION';

-- Validation: Procédure PSD
CREATE OR REPLACE FUNCTION validate_procedure_psd(proc_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (p.bon_commande_doc IS NOT NULL OR p.facture_proforma_doc IS NOT NULL)
        AND p.prestataire_sanctionne = FALSE
        AS valid,
        CASE
            WHEN p.bon_commande_doc IS NULL AND p.facture_proforma_doc IS NULL
                THEN 'Bon de commande ou Facture proforma obligatoire (PSD)'
            WHEN p.prestataire_sanctionne = TRUE
                THEN '⚠️ ALERTE: Prestataire sanctionné détecté'
            ELSE 'Validation OK'
        END AS message
    FROM procedure p
    WHERE p.id = proc_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_procedure_psd IS 'Valide une procédure PSD';

-- Validation: Procédure PSC
CREATE OR REPLACE FUNCTION validate_procedure_psc(proc_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.dossier_concurrence_doc IS NOT NULL
        AND p.formulaire_selection_doc IS NOT NULL
        AND p.dates->>'date_ouverture' IS NOT NULL
        AND p.date_selection IS NOT NULL
        AS valid,
        CASE
            WHEN p.dossier_concurrence_doc IS NULL
                THEN 'Dossier de concurrence obligatoire (PSC)'
            WHEN p.formulaire_selection_doc IS NULL
                THEN 'Formulaire de sélection obligatoire (PSC)'
            WHEN p.dates->>'date_ouverture' IS NULL
                THEN 'Date d\'ouverture obligatoire'
            WHEN p.date_selection IS NULL
                THEN 'Date de sélection obligatoire'
            ELSE 'Validation OK'
        END AS message
    FROM procedure p
    WHERE p.id = proc_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_procedure_psc IS 'Valide une procédure PSC';

-- Validation: Attribution
CREATE OR REPLACE FUNCTION validate_attribution(attr_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
DECLARE
    v_mode VARCHAR;
BEGIN
    SELECT o.mode_passation INTO v_mode
    FROM attribution a
    JOIN operation o ON a.operation_id = o.id
    WHERE a.id = attr_id;

    RETURN QUERY
    SELECT
        CASE
            -- PSD: Bon de commande OU Facture définitive
            WHEN v_mode = 'PSD' THEN
                a.numero_bon_commande IS NOT NULL OR a.numero_facture_definitive IS NOT NULL
            -- PSC: Lettre de marché
            WHEN v_mode = 'PSC' THEN
                a.numero_lettre_marche IS NOT NULL
            -- Autres modes: Marché signé
            ELSE
                a.marche_signe_doc IS NOT NULL
        END AS valid,
        CASE
            WHEN v_mode = 'PSD' AND a.numero_bon_commande IS NULL AND a.numero_facture_definitive IS NULL
                THEN 'Bon de commande ou Facture définitive obligatoire (PSD)'
            WHEN v_mode = 'PSC' AND a.numero_lettre_marche IS NULL
                THEN 'Numéro de lettre de marché obligatoire (PSC)'
            WHEN v_mode NOT IN ('PSD', 'PSC') AND a.marche_signe_doc IS NULL
                THEN 'Marché signé obligatoire'
            ELSE 'Validation OK'
        END AS message
    FROM attribution a
    WHERE a.id = attr_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_attribution IS 'Valide une attribution selon le mode de passation';

-- Validation: Avenant
CREATE OR REPLACE FUNCTION validate_avenant(av_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT, severity VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT
        av.avenant_signe_doc IS NOT NULL
        AND (
            av.cumul_pourcent < 30
            OR (av.cumul_pourcent >= 30 AND av.justificatif_avenant_doc IS NOT NULL)
        ) AS valid,
        CASE
            WHEN av.avenant_signe_doc IS NULL
                THEN 'Fichier d\'avenant signé obligatoire'
            WHEN av.cumul_pourcent >= 30 AND av.justificatif_avenant_doc IS NULL
                THEN '🚫 Justificatif obligatoire pour avenant ≥30%'
            WHEN av.cumul_pourcent >= 30
                THEN '🚫 CRITIQUE: Seuil 30% dépassé - Autorisation requise'
            WHEN av.cumul_pourcent >= 25
                THEN '⚠️ ATTENTION: Seuil 25% dépassé'
            ELSE 'Validation OK'
        END AS message,
        CASE
            WHEN av.cumul_pourcent >= 30 THEN 'CRITIQUE'
            WHEN av.cumul_pourcent >= 25 THEN 'ALERTE'
            ELSE 'NORMAL'
        END AS severity
    FROM avenant av
    WHERE av.id = av_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_avenant IS 'Valide un avenant avec gestion des seuils 25/30%';

-- Validation: Clôture
CREATE OR REPLACE FUNCTION validate_cloture(clot_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.reception_prov->>'date' IS NOT NULL
        AND c.reception_prov->>'pv_doc' IS NOT NULL
        AND c.date_dernier_decompte IS NOT NULL
        AS valid,
        CASE
            WHEN c.reception_prov->>'date' IS NULL
                THEN 'Date de réception provisoire obligatoire'
            WHEN c.reception_prov->>'pv_doc' IS NULL
                THEN 'PV de réception provisoire obligatoire'
            WHEN c.date_dernier_decompte IS NULL
                THEN 'Date du dernier décompte obligatoire'
            ELSE 'Validation OK'
        END AS message
    FROM cloture c
    WHERE c.id = clot_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_cloture IS 'Valide une clôture de marché';

-- ============================================
-- 12. TRIGGERS UPDATED_AT
-- ============================================

-- Appliquer le trigger updated_at aux nouvelles tables
CREATE TRIGGER update_lot_updated_at
BEFORE UPDATE ON lot
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soumissionnaire_updated_at
BEFORE UPDATE ON soumissionnaire
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. DONNÉES DE RÉFÉRENCE - Seuils Officiels
-- ============================================

-- Création table de référence seuils (optionnel, peut aussi être en JSON)
CREATE TABLE IF NOT EXISTS referentiel_seuils (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode_passation VARCHAR(50) NOT NULL UNIQUE,
    seuil_min DECIMAL(15,2),
    seuil_max DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertion des seuils officiels Code des Marchés CI
INSERT INTO referentiel_seuils (mode_passation, seuil_min, seuil_max, description) VALUES
('PSD', 0, 10000000, 'Procédure Simplifiée D''entente Directe'),
('PSC', 10000000, 30000000, 'Procédure Simplifiée de demande de Cotation'),
('PSL', 30000000, 50000000, 'Procédure Simplifiée à Compétition Limitée'),
('PSO', 50000000, 100000000, 'Procédure Simplifiée à Compétition Ouverte'),
('AOO', 100000000, NULL, 'Appel d''Offres Ouvert'),
('AON', 100000000, NULL, 'Appel d''Offres National'),
('PI', 0, NULL, 'Prestations Intellectuelles (pas de seuil fixe)')
ON CONFLICT (mode_passation) DO UPDATE SET
    seuil_min = EXCLUDED.seuil_min,
    seuil_max = EXCLUDED.seuil_max,
    description = EXCLUDED.description,
    updated_at = NOW();

COMMENT ON TABLE referentiel_seuils IS 'Seuils officiels par mode de passation (Code des Marchés Publics CI)';

-- ============================================
-- 14. INDEXES SUPPLÉMENTAIRES POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_operation_type_operation ON operation(type_operation);
CREATE INDEX IF NOT EXISTS idx_operation_activite_code ON operation(activite_code);
CREATE INDEX IF NOT EXISTS idx_procedure_date_selection ON procedure(date_selection);
CREATE INDEX IF NOT EXISTS idx_attribution_numero_lettre_marche ON attribution(numero_lettre_marche);
CREATE INDEX IF NOT EXISTS idx_avenant_type ON avenant(type);

-- ============================================
-- 15. VÉRIFICATIONS FINALES
-- ============================================

-- Liste des tables
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Statistiques colonnes ajoutées
SELECT
    table_name,
    COUNT(*) as nb_colonnes
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'operation', 'procedure', 'attribution', 'avenant',
    'ordre_service', 'cloture', 'entreprise', 'lot', 'soumissionnaire'
)
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- FIN DE LA MIGRATION 002
-- ============================================

-- Pour rollback (si nécessaire):
-- DROP TABLE IF EXISTS lot CASCADE;
-- DROP TABLE IF EXISTS soumissionnaire CASCADE;
-- DROP VIEW IF EXISTS v_operations_geo;
-- DROP VIEW IF EXISTS v_marches_avenants_cumul;
-- DROP VIEW IF EXISTS v_stats_mode_passation;
-- DROP VIEW IF EXISTS v_entreprises_sanctionnees;
-- DROP TABLE IF EXISTS referentiel_seuils;
-- ... puis supprimer les colonnes ajoutées avec ALTER TABLE ... DROP COLUMN

COMMENT ON SCHEMA public IS 'SIDCF Portal - Schéma PostgreSQL v2.0 - Migration 002 appliquée le 2025-11-17';
