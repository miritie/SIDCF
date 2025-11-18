-- ============================================
-- Migration 004: Configuration des champs Attribution, Exécution, Clôture
-- ============================================

-- ============================================
-- PHASE ATTRIBUTION
-- ============================================

-- PSD: Attribution simplifiée (Bon de commande)
INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
('PSD', 'ATTRIBUTION', 'numero_bc', 'Numéro de bon de commande', 'text', 'identification', 1, true),
('PSD', 'ATTRIBUTION', 'facture_proforma', 'Facture proforma', 'file', 'documents', 2, false),
('PSD', 'ATTRIBUTION', 'facture_definitive', 'Facture définitive', 'file', 'documents', 3, false),
('PSD', 'ATTRIBUTION', 'montant_attribution', 'Montant d''attribution', 'number', 'montants', 10, true),
('PSD', 'ATTRIBUTION', 'duree_execution', 'Durée d''exécution (jours)', 'number', 'dates', 20, true),
('PSD', 'ATTRIBUTION', 'date_visa_cf', 'Date de visa CF (le cas échéant)', 'date', 'dates', 21, false),
('PSD', 'ATTRIBUTION', 'ncc_attributaire', 'NCC de l''attributaire', 'text', 'attributaire', 30, true),
('PSD', 'ATTRIBUTION', 'raison_sociale', 'Raison sociale', 'text', 'attributaire', 31, true),
('PSD', 'ATTRIBUTION', 'banque', 'Banque', 'text', 'attributaire', 32, false),
('PSD', 'ATTRIBUTION', 'numero_compte', 'Numéro de compte bancaire', 'text', 'attributaire', 33, false),
('PSD', 'ATTRIBUTION', 'avance_demarrage', 'Avance de démarrage', 'select', 'garanties', 40, false),
('PSD', 'ATTRIBUTION', 'taux_avance', 'Taux d''avance (%)', 'number', 'garanties', 41, false),
('PSD', 'ATTRIBUTION', 'montant_avance', 'Montant de l''avance', 'number', 'garanties', 42, false),
('PSD', 'ATTRIBUTION', 'garantie_avance', 'Garantie de l''avance', 'file', 'garanties', 43, false),
('PSD', 'ATTRIBUTION', 'duree_garantie', 'Durée de garantie (jours)', 'number', 'garanties', 44, false);

-- PSC: Attribution avec lettre de marché
INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
('PSC', 'ATTRIBUTION', 'numero_bc', 'Numéro de bon de commande', 'text', 'identification', 1, true),
('PSC', 'ATTRIBUTION', 'numero_lettre_marche', 'Numéro de lettre de marché', 'text', 'identification', 2, false),
('PSC', 'ATTRIBUTION', 'facture_definitive', 'Facture définitive', 'file', 'documents', 3, false),
('PSC', 'ATTRIBUTION', 'montant_prestation', 'Montant de la prestation', 'number', 'montants', 10, true),
('PSC', 'ATTRIBUTION', 'duree_execution', 'Durée d''exécution', 'number', 'dates', 20, true),
('PSC', 'ATTRIBUTION', 'date_visa_cf', 'Date de visa CF (le cas échéant)', 'date', 'dates', 21, false),
('PSC', 'ATTRIBUTION', 'ncc_attributaire', 'NCC', 'text', 'attributaire', 30, true),
('PSC', 'ATTRIBUTION', 'raison_sociale', 'Raison sociale', 'text', 'attributaire', 31, true),
('PSC', 'ATTRIBUTION', 'banque', 'Banque', 'text', 'attributaire', 32, false),
('PSC', 'ATTRIBUTION', 'numero_compte', 'Numéro de compte', 'text', 'attributaire', 33, false),
('PSC', 'ATTRIBUTION', 'avance_demarrage', 'Avance de démarrage', 'select', 'garanties', 40, false),
('PSC', 'ATTRIBUTION', 'montant_avance', 'Montant de l''avance', 'number', 'garanties', 41, false),
('PSC', 'ATTRIBUTION', 'garantie_avance', 'Garantie de l''avance', 'file', 'garanties', 42, false),
('PSC', 'ATTRIBUTION', 'duree_garantie', 'Durée de garantie', 'number', 'garanties', 43, false);

-- PSL, PSO, AOO: Attribution avec garanties complètes
DO $$
DECLARE
    proc VARCHAR(10);
BEGIN
    FOREACH proc IN ARRAY ARRAY['PSL', 'PSO', 'AOO']
    LOOP
        INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
        (proc, 'ATTRIBUTION', 'numero_marche', 'Numéro du marché', 'text', 'identification', 1, true),
        (proc, 'ATTRIBUTION', 'montant_attribution', 'Montant d''attribution', 'number', 'montants', 10, true),
        (proc, 'ATTRIBUTION', 'ncc_attributaire', 'NCC de l''attributaire', 'text', 'attributaire', 20, true),
        (proc, 'ATTRIBUTION', 'raison_sociale', 'Raison sociale', 'text', 'attributaire', 21, true),
        (proc, 'ATTRIBUTION', 'banque', 'Banque', 'text', 'attributaire', 22, false),
        (proc, 'ATTRIBUTION', 'numero_compte', 'Numéro de compte', 'text', 'attributaire', 23, false),
        (proc, 'ATTRIBUTION', 'avance_demarrage', 'Avance de démarrage', 'select', 'garanties', 30, false),
        (proc, 'ATTRIBUTION', 'taux_avance', 'Taux d''avance (15% forfaitaire/facultatif)', 'number', 'garanties', 31, false),
        (proc, 'ATTRIBUTION', 'montant_avance', 'Montant de l''avance', 'number', 'garanties', 32, false),
        (proc, 'ATTRIBUTION', 'garantie_avance', 'Garantie de l''avance', 'file', 'garanties', 33, false),
        (proc, 'ATTRIBUTION', 'garantie_bonne_execution', 'Garantie de bonne exécution (3-5%)', 'file', 'garanties', 34, true),
        (proc, 'ATTRIBUTION', 'taux_garantie_execution', 'Taux garantie exécution (%)', 'number', 'garanties', 35, true),
        (proc, 'ATTRIBUTION', 'montant_garantie_execution', 'Montant garantie exécution', 'number', 'garanties', 36, true),
        (proc, 'ATTRIBUTION', 'duree_garantie', 'Durée de garantie (jours)', 'number', 'garanties', 37, true),
        (proc, 'ATTRIBUTION', 'type_livrable', 'Type de livrable', 'select', 'livrable', 40, true),
        (proc, 'ATTRIBUTION', 'livrable', 'Livrable', 'text', 'livrable', 41, true),
        (proc, 'ATTRIBUTION', 'coords_geo', 'Coordonnées géographiques', 'text', 'localisation', 50, false);
    END LOOP;
END $$;

-- PI: Attribution sans garanties d'avance
INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
('PI', 'ATTRIBUTION', 'numero_contrat', 'Numéro du contrat', 'text', 'identification', 1, true),
('PI', 'ATTRIBUTION', 'montant_attribution', 'Montant d''attribution', 'number', 'montants', 10, true),
('PI', 'ATTRIBUTION', 'date_visa_cf', 'Date de visa CF', 'date', 'dates', 15, false),
('PI', 'ATTRIBUTION', 'ncc_attributaire', 'NCC', 'text', 'attributaire', 20, true),
('PI', 'ATTRIBUTION', 'raison_sociale', 'Raison sociale', 'text', 'attributaire', 21, true),
('PI', 'ATTRIBUTION', 'banque', 'Banque', 'text', 'attributaire', 22, false),
('PI', 'ATTRIBUTION', 'numero_compte', 'Numéro de compte', 'text', 'attributaire', 23, false),
('PI', 'ATTRIBUTION', 'type_livrable', 'Type de livrable', 'select', 'livrable', 30, true),
('PI', 'ATTRIBUTION', 'livrable', 'Livrable', 'text', 'livrable', 31, true),
('PI', 'ATTRIBUTION', 'coords_geo', 'Coordonnées géographiques', 'text', 'localisation', 40, false);

-- ============================================
-- PHASE EXÉCUTION (Commune avec variations)
-- ============================================

DO $$
DECLARE
    proc VARCHAR(10);
BEGIN
    FOREACH proc IN ARRAY ARRAY['PSD', 'PSC', 'PSL', 'PSO', 'AOO', 'PI']
    LOOP
        INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
        (proc, 'EXECUTION', 'numero_os', 'Numéro Ordre de Service (OS)', 'text', 'identification', 1, true),
        (proc, 'EXECUTION', 'date_os', 'Date de l''OS / Notification', 'date', 'dates', 10, true),
        (proc, 'EXECUTION', 'duree_execution', 'Durée d''exécution (jours)', 'number', 'dates', 11, true),
        (proc, 'EXECUTION', 'date_fin_prev', 'Date de fin prévisionnelle', 'date', 'dates', 12, false),
        (proc, 'EXECUTION', 'bureau_controle', 'Bureau de contrôle', 'text', 'suivi', 20, false),
        (proc, 'EXECUTION', 'bureau_etude', 'Bureau d''étude', 'text', 'suivi', 21, false),
        (proc, 'EXECUTION', 'date_resiliation', 'Date de résiliation', 'date', 'resiliation', 30, false),
        (proc, 'EXECUTION', 'motif_resiliation', 'Motif de résiliation', 'textarea', 'resiliation', 31, false);
    END LOOP;
END $$;

-- ============================================
-- PHASE CLÔTURE (Commune à tous)
-- ============================================

DO $$
DECLARE
    proc VARCHAR(10);
BEGIN
    FOREACH proc IN ARRAY ARRAY['PSD', 'PSC', 'PSL', 'PSO', 'AOO', 'PI']
    LOOP
        INSERT INTO field_config (mode_passation, phase_code, field_key, label, field_type, field_group, field_order, is_required) VALUES
        (proc, 'CLOTURE', 'date_reception_provisoire', 'Date de réception provisoire', 'date', 'dates', 1, true),
        (proc, 'CLOTURE', 'pv_reception_provisoire', 'PV de réception provisoire', 'file', 'documents', 2, true),
        (proc, 'CLOTURE', 'periode_garantie', 'Période de garantie (jours)', 'number', 'dates', 10, true),
        (proc, 'CLOTURE', 'date_reception_def_prev', 'Date réception définitive prévisionnelle', 'date', 'dates', 11, false),
        (proc, 'CLOTURE', 'date_fin_marche', 'Date de fin du marché (dernier décompte)', 'date', 'dates', 12, false),
        (proc, 'CLOTURE', 'date_reception_def_reelle', 'Date réception définitive réelle (CF)', 'date', 'dates', 20, false),
        (proc, 'CLOTURE', 'pv_reception_definitive', 'PV de réception définitive', 'file', 'documents', 21, false);
    END LOOP;
END $$;

COMMIT;
