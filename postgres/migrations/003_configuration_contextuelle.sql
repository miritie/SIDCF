-- ============================================
-- Migration 003: Configuration Contextuelle des Étapes et Champs
-- ============================================
-- Cette migration crée les tables de configuration pour gérer
-- les étapes et champs selon les procédures (PSD, PSC, PSL, PSO, AOO, PI)

-- Table de configuration des étapes (phases)
CREATE TABLE IF NOT EXISTS phase_config (
    id SERIAL PRIMARY KEY,
    mode_passation VARCHAR(10) NOT NULL, -- PSD, PSC, PSL, PSO, AOO, PI
    phase_code VARCHAR(20) NOT NULL, -- PLANIF, PROCEDURE, ATTRIBUTION, VISA_CF, EXECUTION, CLOTURE
    phase_order INTEGER NOT NULL, -- Ordre d'affichage

    -- Libellés configurables
    titre VARCHAR(100) NOT NULL,
    sous_titre VARCHAR(200),
    description TEXT,

    -- Icône et couleur
    icon VARCHAR(50), -- emoji ou icon name
    color VARCHAR(20), -- classe CSS ou code couleur

    -- État et visibilité
    is_active BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT true,

    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(mode_passation, phase_code)
);

-- Table de configuration des champs
CREATE TABLE IF NOT EXISTS field_config (
    id SERIAL PRIMARY KEY,
    mode_passation VARCHAR(10) NOT NULL,
    phase_code VARCHAR(20) NOT NULL,
    field_key VARCHAR(100) NOT NULL, -- Clé unique du champ

    -- Libellés
    label VARCHAR(200) NOT NULL,
    placeholder VARCHAR(200),
    help_text TEXT,

    -- Type et validation
    field_type VARCHAR(50) NOT NULL, -- text, number, date, select, file, textarea, etc.
    validation_rules JSONB, -- {required: true, min: 0, max: 100, pattern: "..."}
    default_value TEXT,

    -- Options pour les select/radio
    options JSONB, -- [{value: "...", label: "..."}]

    -- Groupe de champs
    field_group VARCHAR(100), -- documents, dates, montants, identification, etc.
    field_order INTEGER DEFAULT 0,

    -- Visibilité et état
    is_visible BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    is_readonly BOOLEAN DEFAULT false,

    -- Conditions d'affichage
    show_if JSONB, -- Conditions pour afficher le champ

    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(mode_passation, phase_code, field_key),
    FOREIGN KEY (mode_passation, phase_code) REFERENCES phase_config(mode_passation, phase_code) ON DELETE CASCADE
);

-- Table d'historique des modifications de configuration
CREATE TABLE IF NOT EXISTS config_history (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_phase_config_mode ON phase_config(mode_passation);
CREATE INDEX idx_phase_config_active ON phase_config(is_active);
CREATE INDEX idx_field_config_mode_phase ON field_config(mode_passation, phase_code);
CREATE INDEX idx_field_config_visible ON field_config(is_visible);
CREATE INDEX idx_field_config_group ON field_config(field_group);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_phase_config_updated_at BEFORE UPDATE ON phase_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_config_updated_at BEFORE UPDATE ON field_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERTION DES CONFIGURATIONS PAR DÉFAUT
-- ============================================

-- Configuration des étapes pour PSD (Procédure Simplifiée d'Entente Directe)
INSERT INTO phase_config (mode_passation, phase_code, phase_order, titre, sous_titre, icon, color) VALUES
('PSD', 'PLANIF', 1, 'Planification', 'Inscription au PPM', '📋', 'blue'),
('PSD', 'PROCEDURE', 2, 'Contractualisation', 'Sélection directe du prestataire', '📝', 'orange'),
('PSD', 'ATTRIBUTION', 3, 'Attribution', 'Bon de commande & Facture', '✅', 'green'),
('PSD', 'EXECUTION', 4, 'Exécution', 'Ordre de service & Suivi', '⚙️', 'purple'),
('PSD', 'CLOTURE', 5, 'Clôture', 'Réceptions provisoire & définitive', '🏁', 'gray');

-- Configuration des étapes pour PSC (Procédure Simplifiée de Cotation)
INSERT INTO phase_config (mode_passation, phase_code, phase_order, titre, sous_titre, icon, color) VALUES
('PSC', 'PLANIF', 1, 'Planification', 'Inscription au PPM', '📋', 'blue'),
('PSC', 'PROCEDURE', 2, 'Procédure', 'Demande de cotation (3 fournisseurs)', '📝', 'orange'),
('PSC', 'ATTRIBUTION', 3, 'Attribution', 'Sélection & Attribution', '✅', 'green'),
('PSC', 'EXECUTION', 4, 'Exécution', 'OS & Suivi des travaux', '⚙️', 'purple'),
('PSC', 'CLOTURE', 5, 'Clôture', 'Réceptions & PV', '🏁', 'gray');

-- Configuration des étapes pour PSL (Procédure Simplifiée à Compétition Limitée)
INSERT INTO phase_config (mode_passation, phase_code, phase_order, titre, sous_titre, icon, color) VALUES
('PSL', 'PLANIF', 1, 'Planification', 'Inscription au PPM', '📋', 'blue'),
('PSL', 'PROCEDURE', 2, 'Procédure', 'Validation DGMP & Commission COJO', '📝', 'orange'),
('PSL', 'ATTRIBUTION', 3, 'Attribution', 'Attribution & Garanties', '✅', 'green'),
('PSL', 'VISA_CF', 4, 'Visa CF', 'Contrôle financier', '🔍', 'yellow'),
('PSL', 'EXECUTION', 5, 'Exécution', 'OS & Avenants', '⚙️', 'purple'),
('PSL', 'CLOTURE', 6, 'Clôture', 'Réceptions & Clôture', '🏁', 'gray');

-- Configuration des étapes pour PSO (Procédure Simplifiée à Compétition Ouverte)
INSERT INTO phase_config (mode_passation, phase_code, phase_order, titre, sous_titre, icon, color) VALUES
('PSO', 'PLANIF', 1, 'Planification', 'Inscription au PPM', '📋', 'blue'),
('PSO', 'PROCEDURE', 2, 'Procédure', 'Validation DGMP & Commission COJO', '📝', 'orange'),
('PSO', 'ATTRIBUTION', 3, 'Attribution', 'Attribution & Garanties', '✅', 'green'),
('PSO', 'VISA_CF', 4, 'Visa CF', 'Contrôle financier', '🔍', 'yellow'),
('PSO', 'EXECUTION', 5, 'Exécution', 'OS & Avenants', '⚙️', 'purple'),
('PSO', 'CLOTURE', 6, 'Clôture', 'Réceptions & Clôture', '🏁', 'gray');

-- Configuration des étapes pour AOO (Appel d'Offres Ouvert)
INSERT INTO phase_config (mode_passation, phase_code, phase_order, titre, sous_titre, icon, color) VALUES
('AOO', 'PLANIF', 1, 'Planification', 'Inscription au PPM', '📋', 'blue'),
('AOO', 'PROCEDURE', 2, 'Procédure', 'DAO validé DGMP & Commission COJO', '📝', 'orange'),
('AOO', 'ATTRIBUTION', 3, 'Attribution', 'Attribution & Garanties', '✅', 'green'),
('AOO', 'VISA_CF', 4, 'Visa CF', 'Contrôle financier', '🔍', 'yellow'),
('AOO', 'EXECUTION', 5, 'Exécution', 'OS & Suivi', '⚙️', 'purple'),
('AOO', 'CLOTURE', 6, 'Clôture', 'Réceptions & Clôture', '🏁', 'gray');

-- Configuration des étapes pour PI (Prestations Intellectuelles)
INSERT INTO phase_config (mode_passation, phase_code, phase_order, titre, sous_titre, icon, color) VALUES
('PI', 'PLANIF', 1, 'Planification', 'Inscription au PPM', '📋', 'blue'),
('PI', 'PROCEDURE', 2, 'Procédure', 'AMI/DP & Sélection technique', '📝', 'orange'),
('PI', 'ATTRIBUTION', 3, 'Attribution', 'Contrat de prestation', '✅', 'green'),
('PI', 'VISA_CF', 4, 'Visa CF', 'Contrôle financier', '🔍', 'yellow'),
('PI', 'EXECUTION', 5, 'Exécution', 'Ordre de service & Suivi', '⚙️', 'purple'),
('PI', 'CLOTURE', 6, 'Clôture', 'Réception des livrables', '🏁', 'gray');

-- ============================================
-- CONFIGURATION DES CHAMPS - PHASE PLANIFICATION (Commune à tous)
-- ============================================

-- Champs communs à toutes les procédures pour la planification
DO $$
DECLARE
    proc VARCHAR(10);
BEGIN
    FOREACH proc IN ARRAY ARRAY['PSD', 'PSC', 'PSL', 'PSO', 'AOO', 'PI']
    LOOP
        INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
        (proc, 'PLANIF', 'section', 'Section', 'text', 'programmation', 1, true),
        (proc, 'PLANIF', 'programme', 'Programme', 'text', 'programmation', 2, true),
        (proc, 'PLANIF', 'action', 'Action', 'text', 'programmation', 3, true),
        (proc, 'PLANIF', 'nature_depense', 'Nature de dépense (économique)', 'select', 'programmation', 4, true),
        (proc, 'PLANIF', 'type_marche', 'Type de marché/contrat', 'select', 'identification', 10, true),
        (proc, 'PLANIF', 'objet_marche', 'Objet du marché/contrat', 'textarea', 'identification', 11, true),
        (proc, 'PLANIF', 'mode_passation', 'Mode de passation', 'select', 'identification', 12, true),
        (proc, 'PLANIF', 'dotation', 'Dotation du marché/contrat', 'number', 'montants', 20, true),
        (proc, 'PLANIF', 'montant_estimatif_ht', 'Montant prévisionnel HT', 'number', 'montants', 21, true),
        (proc, 'PLANIF', 'montant_estimatif_ttc', 'Montant prévisionnel TTC', 'number', 'montants', 22, true),
        (proc, 'PLANIF', 'type_livrable', 'Type de livrable', 'select', 'livrable', 30, true),
        (proc, 'PLANIF', 'livrable', 'Livrable attendu', 'text', 'livrable', 31, true),
        (proc, 'PLANIF', 'localite', 'Localité', 'text', 'localisation', 40, false),
        (proc, 'PLANIF', 'coords_geo', 'Coordonnées géographiques', 'text', 'localisation', 41, false),
        (proc, 'PLANIF', 'date_debut_prev', 'Date de début prévisionnelle', 'date', 'dates', 50, false),
        (proc, 'PLANIF', 'date_fin_prev', 'Date de fin prévisionnelle', 'date', 'dates', 51, false),
        (proc, 'PLANIF', 'duree_prev', 'Durée prévisionnelle (jours)', 'number', 'dates', 52, false);
    END LOOP;
END $$;

-- ============================================
-- CONFIGURATION DES CHAMPS - PHASE PROCÉDURE
-- ============================================

-- PSD: Entente directe (pas de procédure formelle)
INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
('PSD', 'PROCEDURE', 'bon_commande', 'Bon de commande', 'file', 'documents', 1, false),
('PSD', 'PROCEDURE', 'facture_proforma', 'Facture proforma', 'file', 'documents', 2, false),
('PSD', 'PROCEDURE', 'dossier_concurrence', 'Dossier de concurrence (le cas échéant)', 'file', 'documents', 3, false),
('PSD', 'PROCEDURE', 'ncc_prestataire', 'NCC du prestataire', 'text', 'identification', 10, true),
('PSD', 'PROCEDURE', 'raison_sociale', 'Raison sociale', 'text', 'identification', 11, true),
('PSD', 'PROCEDURE', 'statut_sanctionne', 'Statut sanctionné', 'select', 'identification', 12, true);

-- PSC: Demande de cotation (3 fournisseurs)
INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
('PSC', 'PROCEDURE', 'dossier_concurrence', 'Dossier de concurrence (cotations, proformas)', 'file', 'documents', 1, true),
('PSC', 'PROCEDURE', 'formulaire_selection', 'Formulaire de sélection', 'file', 'documents', 2, true),
('PSC', 'PROCEDURE', 'pv_ouverture', 'PV d''ouverture', 'file', 'documents', 3, false),
('PSC', 'PROCEDURE', 'rapport_analyse', 'Rapport d''analyse', 'file', 'documents', 4, false),
('PSC', 'PROCEDURE', 'dossier_recours', 'Dossier de recours', 'file', 'documents', 5, false),
('PSC', 'PROCEDURE', 'date_ouverture', 'Date d''ouverture des plis', 'date', 'dates', 10, true),
('PSC', 'PROCEDURE', 'date_selection', 'Date de sélection', 'date', 'dates', 11, true);

-- PSL, PSO, AOO, PI: Procédures avec COJO
DO $$
DECLARE
    proc VARCHAR(10);
BEGIN
    FOREACH proc IN ARRAY ARRAY['PSL', 'PSO', 'AOO', 'PI']
    LOOP
        INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
        (proc, 'PROCEDURE', 'courrier_invitation', 'Courrier d''invitation COJO', 'file', 'documents', 1, true),
        (proc, 'PROCEDURE', 'mandat_representation', 'Mandat de représentation', 'file', 'documents', 2, false),
        (proc, 'PROCEDURE', 'dossier_appel_concurrence', 'Dossier d''appel à concurrence (DAO/AMI/DP)', 'file', 'documents', 3, true),
        (proc, 'PROCEDURE', 'pv_ouverture', 'PV d''ouverture', 'file', 'documents', 4, true),
        (proc, 'PROCEDURE', 'rapport_analyse', 'Rapport d''analyse', 'file', 'documents', 5, true),
        (proc, 'PROCEDURE', 'pv_jugement', 'PV de jugement', 'file', 'documents', 6, true),
        (proc, 'PROCEDURE', 'dossier_recours', 'Dossier de recours', 'file', 'documents', 7, false),
        (proc, 'PROCEDURE', 'date_ouverture', 'Date d''ouverture des plis', 'date', 'dates', 10, true),
        (proc, 'PROCEDURE', 'date_jugement', 'Date de jugement', 'date', 'dates', 11, true),
        (proc, 'PROCEDURE', 'type_commission', 'Type de commission', 'select', 'procedure', 20, true),
        (proc, 'PROCEDURE', 'categorie', 'Catégorie', 'select', 'procedure', 21, true),
        (proc, 'PROCEDURE', 'nb_offres_recues', 'Nombre d''offres reçues', 'number', 'procedure', 30, false),
        (proc, 'PROCEDURE', 'nb_offres_classees', 'Nombre d''offres classées', 'number', 'procedure', 31, false);
    END LOOP;
END $$;

COMMIT;
