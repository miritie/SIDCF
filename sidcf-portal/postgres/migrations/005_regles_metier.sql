-- ============================================
-- Migration 005: Règles Métier Paramétrables
-- ============================================
-- Stockage des règles métier, seuils, validations et matrices
-- Éditables via l'interface d'administration

-- Table des règles métier
CREATE TABLE IF NOT EXISTS regles_metier (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE, -- Ex: SEUIL_CUMUL_AVENANTS
    categorie VARCHAR(50) NOT NULL, -- seuils, validations, delais, ano, garanties, matrices
    sous_categorie VARCHAR(50), -- Ex: avenants, avance, etc.

    -- Libellés
    label VARCHAR(200) NOT NULL,
    description TEXT,

    -- Valeur et unité
    valeur DECIMAL(15, 2),
    unite VARCHAR(20), -- %, jours, XOF, etc.
    valeur_min DECIMAL(15, 2), -- Pour les plages (ex: garanties 3-5%)
    valeur_max DECIMAL(15, 2),

    -- Sévérité (pour validations)
    severite VARCHAR(20), -- BLOCK, WARN, INFO

    -- Données JSON pour configurations complexes
    config_json JSONB, -- Ex: pour ANO, matrices, etc.

    -- État
    is_active BOOLEAN DEFAULT true,
    is_editable BOOLEAN DEFAULT true, -- Certaines règles ne sont pas modifiables

    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Index
CREATE INDEX idx_regles_categorie ON regles_metier(categorie);
CREATE INDEX idx_regles_active ON regles_metier(is_active);
CREATE INDEX idx_regles_code ON regles_metier(code);

-- Table d'historique des modifications de règles
CREATE TABLE IF NOT EXISTS regles_historique (
    id SERIAL PRIMARY KEY,
    regle_id INTEGER REFERENCES regles_metier(id) ON DELETE CASCADE,
    regle_code VARCHAR(100) NOT NULL,

    -- Valeurs avant/après
    ancienne_valeur DECIMAL(15, 2),
    nouvelle_valeur DECIMAL(15, 2),
    ancien_config JSONB,
    nouveau_config JSONB,

    -- Qui et quand
    modifie_par VARCHAR(100),
    modifie_le TIMESTAMP DEFAULT NOW(),
    motif TEXT
);

-- Trigger pour historique
CREATE OR REPLACE FUNCTION log_regle_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.valeur IS DISTINCT FROM NEW.valeur) OR (OLD.config_json IS DISTINCT FROM NEW.config_json) THEN
        INSERT INTO regles_historique (
            regle_id, regle_code, ancienne_valeur, nouvelle_valeur,
            ancien_config, nouveau_config, modifie_par
        ) VALUES (
            NEW.id, NEW.code, OLD.valeur, NEW.valeur,
            OLD.config_json, NEW.config_json, NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_regle_modification
    AFTER UPDATE ON regles_metier
    FOR EACH ROW
    EXECUTE FUNCTION log_regle_modification();

-- ============================================
-- INSERTION DES RÈGLES PAR DÉFAUT
-- ============================================

-- SEUILS
INSERT INTO regles_metier (code, categorie, label, description, valeur, unite, severite, is_editable) VALUES
('SEUIL_CUMUL_AVENANTS', 'seuils', 'Cumul maximum d''avenants', 'Cumul maximum d''avenants autorisé (% du montant initial)', 30, '%', 'BLOCK', true),
('SEUIL_ALERTE_AVENANTS', 'seuils', 'Seuil d''alerte pour avenants', 'Seuil d''alerte déclenché avant blocage', 25, '%', 'WARN', true),
('TAUX_MAX_AVANCE', 'seuils', 'Taux maximum d''avance', 'Taux maximum d''avance de démarrage', 15, '%', 'BLOCK', true),
('DELAI_MAX_OS_APRES_VISA', 'seuils', 'Délai max OS après visa', 'Délai maximum pour émettre l''OS après visa CF', 30, 'jours', 'WARN', true),
('DELAI_MAINLEVEE_GARANTIE', 'seuils', 'Délai mainlevée garantie', 'Délai après réception définitive pour mainlevée', 365, 'jours', 'WARN', true);

-- VALIDATIONS
INSERT INTO regles_metier (code, categorie, label, description, severite, is_active, is_editable) VALUES
('VALIDATION_MONTANT_MARCHE', 'validations', 'Validation montant marché', 'Vérifier que le montant du marché est cohérent avec le PPM', 'BLOCK', true, false),
('VALIDATION_DATE_OS', 'validations', 'Validation date OS', 'La date d''OS doit être postérieure à l''attribution', 'BLOCK', true, false),
('VALIDATION_CUMUL_AVENANTS', 'validations', 'Validation cumul avenants', 'Le cumul des avenants ne doit pas dépasser le seuil autorisé', 'BLOCK', true, false),
('VALIDATION_GARANTIE_AVANCE', 'validations', 'Validation garantie avance', 'Une garantie d''avance est requise si avance > 0', 'BLOCK', true, false),
('VALIDATION_NCC_ATTRIBUTAIRE', 'validations', 'Validation NCC attributaire', 'Le NCC de l''attributaire doit être valide', 'WARN', true, true);

-- DÉLAIS TYPES
INSERT INTO regles_metier (code, categorie, sous_categorie, label, description, valeur, unite, is_editable) VALUES
('DELAI_RECOURS_ATTRIBUTION', 'delais', 'recours', 'Délai de recours après attribution', 'Délai pour déposer un recours', 10, 'jours', true),
('DELAI_PUBLICATION_ANO', 'delais', 'ano', 'Délai de publication ANO', 'Délai de publication de l''Avis de Non-Objection', 15, 'jours', true),
('DELAI_GARANTIE_DEFINITIF', 'delais', 'garantie', 'Délai de garantie après réception définitive', 'Durée de garantie par défaut', 365, 'jours', true);

-- GARANTIES
INSERT INTO regles_metier (code, categorie, sous_categorie, label, description, valeur_min, valeur_max, unite, is_editable) VALUES
('GARANTIE_BONNE_EXECUTION_MIN', 'garanties', 'execution', 'Garantie bonne exécution (min)', 'Taux minimum de garantie de bonne exécution', 3, 5, '%', false),
('GARANTIE_BONNE_EXECUTION_MAX', 'garanties', 'execution', 'Garantie bonne exécution (max)', 'Taux maximum de garantie de bonne exécution', 3, 5, '%', false),
('RETENUE_GARANTIE', 'garanties', 'retenue', 'Retenue de garantie', 'Pourcentage de retenue de garantie', 10, 10, '%', false);

-- MATRICES DES PROCÉDURES (JSON)
INSERT INTO regles_metier (code, categorie, label, description, config_json, is_editable) VALUES
('MATRICE_PROCEDURES_ADMIN_CENTRALE', 'matrices', 'Matrice procédures - Admin Centrale',
 'Seuils et procédures pour administrations centrales',
 '{
   "type_autorite": "ADMIN_CENTRALE",
   "description": "Seuils pour administrations centrales",
   "seuils": [
     {"mode": "PSD", "label": "Procédure Simplifiée d''Entente Directe", "min": 0, "max": 10000000, "description": "< 10M XOF"},
     {"mode": "PSC", "label": "Procédure Simplifiée de Cotation", "min": 10000000, "max": 30000000, "description": "10M - 30M XOF"},
     {"mode": "PSL", "label": "Procédure Simplifiée à Compétition Limitée", "min": 30000000, "max": 50000000, "description": "30M - 50M XOF"},
     {"mode": "PSO", "label": "Procédure Simplifiée à Compétition Ouverte", "min": 50000000, "max": 100000000, "description": "50M - 100M XOF"},
     {"mode": "AOO", "label": "Appel d''Offres Ouvert", "min": 100000000, "max": null, "description": "≥ 100M XOF"},
     {"mode": "PI", "label": "Prestations Intellectuelles", "min": null, "max": null, "description": "Variable selon qualification"}
   ]
 }'::jsonb, true);

-- ANO (Avis de Non-Objection)
INSERT INTO regles_metier (code, categorie, label, description, config_json, is_editable) VALUES
('ANO_CONFIGURATION', 'ano', 'Configuration ANO',
 'Modes et bailleurs requérant un Avis de Non-Objection',
 '{
   "description": "Certains marchés requièrent un ANO du bailleur avant attribution",
   "modes_requierant_ano": ["AOO", "PSO", "PSL", "PI"],
   "bailleurs_requierant_ano": ["BAD", "BM", "AFD", "UE"],
   "seuils_montant": {
     "TRAVAUX": {"value": 100000000, "unit": "XOF"},
     "FOURNITURES": {"value": 50000000, "unit": "XOF"},
     "SERVICES": {"value": 30000000, "unit": "XOF"},
     "PRESTATIONS_INTELLECTUELLES": {"value": 20000000, "unit": "XOF"}
   }
 }'::jsonb, true);

COMMIT;
