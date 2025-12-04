-- ============================================
-- SIDCF Portal - Module Investissement Seed Data
-- ============================================
-- Migration: 011_investissement_seed.sql
-- Description: Données de démonstration pour le module Investissement
-- Ces données permettent de tester toutes les fonctionnalités du module
-- ============================================

-- ============================================
-- 1. PROJETS D'INVESTISSEMENT
-- ============================================

-- Projet 1: PAPSE-II (TRANSFERT, avec alertes)
INSERT INTO inv_project (
    id, code, nom, description, type_projet, nature_projet, is_ope, is_prioritaire,
    type_entite, entite_executante, entite_code,
    ministere, ministere_code, secteur, secteur_code, domaine,
    district, region, departement, commune,
    cout_total, devise, duree_prevue_mois, date_debut_prevue, date_fin_prevue,
    part_etat, part_bailleur, part_contrepartie, bailleurs,
    controleur_financier, coordonnateur, responsable_financier, specialiste_marche,
    statut, phase
) VALUES (
    'a1b2c3d4-0001-0001-0001-000000000001',
    'PAPSE-II',
    'Programme d''Appui au Plan Sectoriel Éducation II',
    'Programme visant à améliorer l''accès et la qualité de l''éducation de base en Côte d''Ivoire',
    'TRANSFERT', 'RECURRENT', FALSE, TRUE,
    'UCP', 'UCP-PAPSE', 'UCP001',
    'Ministère de l''Éducation Nationale', 'MEN', 'Éducation', 'EDUCATION', 'Construction et équipement d''écoles',
    'District d''Abidjan', 'Abidjan', 'Abidjan', 'Cocody',
    75000000000, 'XOF', 60, '2021-01-01', '2025-12-31',
    15000000000, 55000000000, 5000000000,
    '[{"code": "BM", "nom": "Banque Mondiale", "montant": 40000000000, "devise": "XOF"}, {"code": "AFD", "nom": "AFD", "montant": 15000000000, "devise": "XOF"}]',
    'M. KOUASSI Yao', 'Dr. N''GUESSAN Aka', 'Mme KOFFI Adjoua', 'M. TRAORE Moussa',
    'EN_COURS', 'EXECUTE'
);

-- Projet 2: PEJEDEC (SIGOBE, écart notifié/éclaté)
INSERT INTO inv_project (
    id, code, nom, description, type_projet, nature_projet, is_ope, is_prioritaire,
    type_entite, entite_executante, entite_code,
    ministere, ministere_code, secteur, secteur_code, domaine,
    district, region, departement, commune,
    cout_total, devise, duree_prevue_mois, date_debut_prevue, date_fin_prevue,
    part_etat, part_bailleur, part_contrepartie, bailleurs,
    controleur_financier, coordonnateur, responsable_financier, specialiste_marche,
    statut, phase
) VALUES (
    'a1b2c3d4-0002-0002-0002-000000000002',
    'PEJEDEC',
    'Projet Emploi Jeunes et Développement des Compétences',
    'Projet d''insertion professionnelle des jeunes et renforcement des compétences',
    'SIGOBE', 'NOUVEAU', FALSE, FALSE,
    'UCP', 'UCP-PEJEDEC', 'UCP002',
    'Ministère de la Promotion de la Jeunesse', 'MPJ', 'Social', 'SOCIAL', 'Formation et insertion professionnelle',
    'District d''Abidjan', 'Abidjan', 'Abidjan', 'Plateau',
    42000000000, 'XOF', 48, '2022-01-01', '2025-12-31',
    8000000000, 32000000000, 2000000000,
    '[{"code": "BAD", "nom": "Banque Africaine de Développement", "montant": 32000000000, "devise": "XOF"}]',
    'Mme BAMBA Fanta', 'M. DIALLO Seydou', 'M. OUATTARA Ibrahim', 'Mme KONATE Mariam',
    'EN_COURS', 'ECLATE'
);

-- Projet 3: ProSEB (TRANSFERT, OPE, exécuté > transféré)
INSERT INTO inv_project (
    id, code, nom, description, type_projet, nature_projet, is_ope, is_prioritaire,
    type_entite, entite_executante, entite_code,
    ministere, ministere_code, secteur, secteur_code, domaine,
    district, region, departement, commune,
    cout_total, devise, duree_prevue_mois, date_debut_prevue, date_fin_prevue,
    part_etat, part_bailleur, part_contrepartie, bailleurs,
    controleur_financier, coordonnateur, responsable_financier, specialiste_marche,
    statut, phase
) VALUES (
    'a1b2c3d4-0003-0003-0003-000000000003',
    'ProSEB',
    'Projet Secteur Éducation de Base',
    'Amélioration de l''accès à l''éducation de base dans les zones rurales',
    'TRANSFERT', 'RECURRENT', TRUE, TRUE,
    'UCP', 'UCP-ProSEB', 'UCP003',
    'Ministère de l''Éducation Nationale', 'MEN', 'Éducation', 'EDUCATION', 'Construction d''écoles primaires',
    'Sassandra-Marahoué', 'Marahoué', 'Bouaflé', 'Bouaflé',
    52000000000, 'XOF', 60, '2020-06-01', '2025-05-31',
    12000000000, 38000000000, 2000000000,
    '[{"code": "AFD", "nom": "AFD", "montant": 38000000000, "devise": "XOF"}]',
    'M. KOUAME Paul', 'Dr. ASSI Léon', 'Mme TANOH Marie', 'M. YAPI Eric',
    'EN_COURS', 'EXECUTE'
);

-- Projet 4: PASEA (SIGOBE, OPE, variation coût > 30%)
INSERT INTO inv_project (
    id, code, nom, description, type_projet, nature_projet, is_ope, is_prioritaire,
    type_entite, entite_executante, entite_code,
    ministere, ministere_code, secteur, secteur_code, domaine,
    district, region, departement, commune,
    cout_total, devise, duree_prevue_mois, date_debut_prevue, date_fin_prevue,
    part_etat, part_bailleur, part_contrepartie, bailleurs,
    controleur_financier, coordonnateur, responsable_financier, specialiste_marche,
    statut, phase
) VALUES (
    'a1b2c3d4-0004-0004-0004-000000000004',
    'PASEA',
    'Projet d''Appui au Secteur Eau et Assainissement',
    'Amélioration de l''accès à l''eau potable et à l''assainissement',
    'SIGOBE', 'NOUVEAU', TRUE, TRUE,
    'EPN', 'ONEP', 'EPN001',
    'Ministère de l''Hydraulique', 'MH', 'Eau et Assainissement', 'EAU_ASSAINISSEMENT', 'Hydraulique villageoise',
    'District des Savanes', 'Poro', 'Korhogo', 'Korhogo',
    73840000000, 'XOF', 48, '2022-01-01', '2025-12-31',
    15000000000, 55000000000, 3840000000,
    '[{"code": "BM", "nom": "Banque Mondiale", "montant": 55000000000, "devise": "XOF"}]',
    'M. SORO Mamadou', 'Ing. COULIBALY Drissa', 'Mme SANOGO Awa', 'M. FOFANA Lacina',
    'EN_COURS', 'EXECUTE'
);

-- Projet 5: C2D-SANTE (TRANSFERT, lettre avance non régularisée)
INSERT INTO inv_project (
    id, code, nom, description, type_projet, nature_projet, is_ope, is_prioritaire,
    type_entite, entite_executante, entite_code,
    ministere, ministere_code, secteur, secteur_code, domaine,
    district, region, departement, commune,
    cout_total, devise, duree_prevue_mois, date_debut_prevue, date_fin_prevue,
    part_etat, part_bailleur, part_contrepartie, bailleurs,
    controleur_financier, coordonnateur, responsable_financier, specialiste_marche,
    statut, phase
) VALUES (
    'a1b2c3d4-0005-0005-0005-000000000005',
    'C2D-SANTE',
    'Programme Santé C2D Phase III',
    'Renforcement du système de santé et amélioration de l''accès aux soins',
    'TRANSFERT', 'NOUVELLE_PHASE', FALSE, TRUE,
    'ADMIN', 'MSHP', 'ADM001',
    'Ministère de la Santé et de l''Hygiène Publique', 'MSHP', 'Santé', 'SANTE', 'Construction de centres de santé',
    'District d''Abidjan', 'Abidjan', 'Abidjan', 'Yopougon',
    28000000000, 'XOF', 36, '2023-01-01', '2025-12-31',
    5000000000, 22000000000, 1000000000,
    '[{"code": "AFD", "nom": "AFD", "montant": 22000000000, "devise": "XOF"}]',
    'Dr. KONE Aminata', 'Dr. TOURE Ibrahima', 'M. GNAGNE Appolinaire', 'Mme BROU Christelle',
    'EN_COURS', 'TRANSFERE'
);

-- Projet 6: PRICI (SIGOBE, OPE, RSF manquant)
INSERT INTO inv_project (
    id, code, nom, description, type_projet, nature_projet, is_ope, is_prioritaire,
    type_entite, entite_executante, entite_code,
    ministere, ministere_code, secteur, secteur_code, domaine,
    district, region, departement, commune,
    cout_total, devise, duree_prevue_mois, date_debut_prevue, date_fin_prevue,
    part_etat, part_bailleur, part_contrepartie, bailleurs,
    controleur_financier, coordonnateur, responsable_financier, specialiste_marche,
    statut, phase
) VALUES (
    'a1b2c3d4-0006-0006-0006-000000000006',
    'PRICI',
    'Projet de Renaissance des Infrastructures de Côte d''Ivoire',
    'Réhabilitation et construction d''infrastructures routières et de transport',
    'SIGOBE', 'NOUVEAU', TRUE, TRUE,
    'EPN', 'AGEROUTE', 'EPN002',
    'Ministère de l''Équipement et de l''Entretien Routier', 'MEER', 'Infrastructures', 'INFRASTRUCTURES', 'Routes et ponts',
    'National', 'Multirégion', 'National', 'National',
    125000000000, 'XOF', 72, '2020-01-01', '2025-12-31',
    25000000000, 95000000000, 5000000000,
    '[{"code": "BM", "nom": "Banque Mondiale", "montant": 65000000000, "devise": "XOF"}, {"code": "BAD", "nom": "BAD", "montant": 30000000000, "devise": "XOF"}]',
    'M. KOFFI Marcel', 'Ing. ASSOUMOU Gilbert', 'Mme BENIE Estelle', 'M. VANGA Patrick',
    'EN_COURS', 'EXECUTE'
);

-- ============================================
-- 2. BUDGETS ANNUELS
-- ============================================

-- Budget PAPSE-II 2024
INSERT INTO inv_budget (
    id, project_id, annee,
    montant_initial, montant_actuel, revisions,
    montant_notifie, montant_eclate, ecart_notifie_eclate
) VALUES (
    'b1b2c3d4-0001-0001-0001-000000000001',
    'a1b2c3d4-0001-0001-0001-000000000001',
    2024,
    42000000000, 45000000000,
    '[{"date": "2024-03-15", "ancien": 42000000000, "nouveau": 45000000000, "motif": "Ajustement LF complémentaire"}]',
    45000000000, 44500000000, 500000000
);

-- Budget PEJEDEC 2024
INSERT INTO inv_budget (
    id, project_id, annee,
    montant_initial, montant_actuel, revisions,
    montant_notifie, montant_eclate, ecart_notifie_eclate
) VALUES (
    'b1b2c3d4-0002-0002-0002-000000000002',
    'a1b2c3d4-0002-0002-0002-000000000002',
    2024,
    28000000000, 28000000000, '[]',
    28000000000, 27500000000, 500000000
);

-- Budget ProSEB 2024
INSERT INTO inv_budget (
    id, project_id, annee,
    montant_initial, montant_actuel, revisions,
    montant_notifie, montant_eclate, ecart_notifie_eclate
) VALUES (
    'b1b2c3d4-0003-0003-0003-000000000003',
    'a1b2c3d4-0003-0003-0003-000000000003',
    2024,
    35000000000, 35000000000, '[]',
    35000000000, 35000000000, 0
);

-- Budget PASEA 2024
INSERT INTO inv_budget (
    id, project_id, annee,
    montant_initial, montant_actuel, revisions,
    montant_notifie, montant_eclate, ecart_notifie_eclate
) VALUES (
    'b1b2c3d4-0004-0004-0004-000000000004',
    'a1b2c3d4-0004-0004-0004-000000000004',
    2024,
    52000000000, 73840000000,
    '[{"date": "2024-06-01", "ancien": 52000000000, "nouveau": 73840000000, "motif": "Extension périmètre (+42%)"}]',
    73840000000, 73840000000, 0
);

-- ============================================
-- 3. BUDGET ÉCLATE (BREAKDOWN)
-- ============================================

-- PAPSE-II breakdown
INSERT INTO inv_budget_breakdown (project_id, budget_id, ua_code, ua_lib, activite_code, activite_lib, ligne_code, ligne_lib, montant_prevu, montant_engage)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001', 'UA-EDU-01', 'Direction Infrastructure Scolaire', 'ACT-001', 'Construction salles de classe', 'L-INV-01', 'Ligne investissement infrastructure', 25000000000, 22000000000),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001', 'UA-EDU-02', 'Direction Équipement', 'ACT-002', 'Équipement mobilier scolaire', 'L-INV-02', 'Ligne investissement équipement', 12000000000, 10500000000),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001', 'UA-EDU-03', 'Direction Formation', 'ACT-003', 'Formation des enseignants', 'L-INV-03', 'Ligne formation', 7500000000, 6800000000);

-- ============================================
-- 4. TRANSFERTS TRIMESTRIELS
-- ============================================

-- Transferts PAPSE-II 2024
INSERT INTO inv_transfer (project_id, annee, trimestre, montant_prevu, montant_transfere, date_op, numero_op, statut, commentaire)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 2024, 1, 12000000000, 12000000000, '2024-01-15', 'OP-2024-001', 'TRANSFERE', 'Transfert T1 complet'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 2024, 2, 11500000000, 11500000000, '2024-04-10', 'OP-2024-045', 'TRANSFERE', 'Transfert T2 complet'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 2024, 3, 11000000000, 10000000000, '2024-07-20', 'OP-2024-098', 'PARTIEL', 'Transfert partiel - reste 1 Md'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 2024, 4, 10000000000, 5000000000, NULL, NULL, 'EN_ATTENTE', 'En attente OP');

-- Transferts ProSEB 2024 (avec anomalie transféré < exécuté)
INSERT INTO inv_transfer (project_id, annee, trimestre, montant_prevu, montant_transfere, date_op, numero_op, statut, commentaire)
VALUES
    ('a1b2c3d4-0003-0003-0003-000000000003', 2024, 1, 9000000000, 9000000000, '2024-01-20', 'OP-2024-012', 'TRANSFERE', NULL),
    ('a1b2c3d4-0003-0003-0003-000000000003', 2024, 2, 8500000000, 8500000000, '2024-04-15', 'OP-2024-056', 'TRANSFERE', NULL),
    ('a1b2c3d4-0003-0003-0003-000000000003', 2024, 3, 8500000000, 8500000000, '2024-07-18', 'OP-2024-089', 'TRANSFERE', NULL),
    ('a1b2c3d4-0003-0003-0003-000000000003', 2024, 4, 9000000000, 2000000000, NULL, NULL, 'PARTIEL', 'Transfert partiel');

-- ============================================
-- 5. LETTRES D'AVANCE
-- ============================================

-- Lettre avance PAPSE-II (régularisée)
INSERT INTO inv_advance_letter (project_id, reference, montant, date_emission, date_echeance, modalite, ua_reserve, montant_regularise, date_regularisation, statut, commentaire)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'LA-2024-001', 2500000000, '2024-02-20', '2024-05-20', 'RESERVE', 'UA-EDU-01', 2500000000, '2024-05-15', 'REGULARISEE', 'Régularisée dans les délais');

-- Lettre avance PAPSE-II (partiellement régularisée)
INSERT INTO inv_advance_letter (project_id, reference, montant, date_emission, date_echeance, modalite, ua_rallonge, montant_regularise, date_regularisation, statut, commentaire)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'LA-2024-002', 1800000000, '2024-08-10', '2024-11-10', 'RALLONGE', 'UA-EDU-02', 500000000, NULL, 'PARTIELLE', 'Reste 1,3 Mds à régulariser');

-- Lettre avance C2D-SANTE (non régularisée - dépassement délai)
INSERT INTO inv_advance_letter (project_id, reference, montant, date_emission, date_echeance, modalite, ua_reserve, montant_regularise, date_regularisation, statut, delai_regularisation_jours, commentaire)
VALUES
    ('a1b2c3d4-0005-0005-0005-000000000005', 'LA-2024-008', 1500000000, '2024-06-01', '2024-08-31', 'RESERVE', 'UA-SANTE-01', 0, NULL, 'EXPIREE', 90, 'Délai dépassé de 30+ jours');

-- ============================================
-- 6. COMPOSANTES
-- ============================================

-- Composantes PAPSE-II
INSERT INTO inv_component (project_id, code, nom, description, cout_prevu, cout_actuel, zone_intervention, livrables_principaux, ordre)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'C1', 'Infrastructure scolaire', 'Construction et réhabilitation d''établissements scolaires', 40000000000, 38000000000, 'National', '["500 salles de classe", "50 blocs sanitaires", "100 clôtures"]', 1),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'C2', 'Équipement et matériel', 'Fourniture de mobilier et matériel pédagogique', 20000000000, 19500000000, 'National', '["25000 tables-bancs", "5000 kits enseignants", "1000 tableaux"]', 2),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'C3', 'Renforcement des capacités', 'Formation des enseignants et encadreurs', 15000000000, 15000000000, 'National', '["10000 enseignants formés", "500 directeurs formés", "200 inspecteurs formés"]', 3);

-- ============================================
-- 7. ACTIVITÉS PTBA
-- ============================================

INSERT INTO inv_activity (project_id, component_id, code, libelle, date_debut, date_fin, annee, budget_prevu, budget_execute, source, statut, taux_realisation)
SELECT
    'a1b2c3d4-0001-0001-0001-000000000001',
    id,
    'A1.1',
    'Construction salles de classe',
    '2024-01-15',
    '2024-12-31',
    2024,
    25000000000,
    18000000000,
    'BAILLEUR',
    'EN_COURS',
    72
FROM inv_component WHERE code = 'C1' AND project_id = 'a1b2c3d4-0001-0001-0001-000000000001';

-- ============================================
-- 8. SITUATION FINANCIÈRE
-- ============================================

-- PAPSE-II 2024
INSERT INTO inv_financial_status (project_id, annee, mois, montant_notifie, montant_eclate, montant_transfere, montant_execute, rae, rab, taux_execution, taux_absorption)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 2024, NULL, 45000000000, 44500000000, 38500000000, 32100000000, 6400000000, 12900000000, 83.4, 71.3);

-- ProSEB 2024 (exécuté > transféré)
INSERT INTO inv_financial_status (project_id, annee, mois, montant_notifie, montant_eclate, montant_transfere, montant_execute, rae, rab, taux_execution, taux_absorption)
VALUES
    ('a1b2c3d4-0003-0003-0003-000000000003', 2024, NULL, 35000000000, 35000000000, 28000000000, 28120000000, -120000000, 6880000000, 100.4, 80.3);

-- PASEA 2024
INSERT INTO inv_financial_status (project_id, annee, mois, montant_notifie, montant_eclate, montant_transfere, montant_execute, rae, rab, taux_execution, taux_absorption)
VALUES
    ('a1b2c3d4-0004-0004-0004-000000000004', 2024, NULL, 73840000000, 73840000000, 45500000000, 38250000000, 7250000000, 35590000000, 84.1, 51.8);

-- ============================================
-- 9. GLISSEMENTS BUDGÉTAIRES
-- ============================================

-- PAPSE-II glissements
INSERT INTO inv_glide (project_id, annee_origine, annee_destination, montant_initial, montant_realise, montant_glisse, ecart_absolu, ecart_pourcentage, motif, categorie_motif, is_variation_critique)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 2023, 2024, 42000000000, 35000000000, 7000000000, -7000000000, -16.7, 'Retard procédures marché', 'ADMINISTRATIF', FALSE),
    ('a1b2c3d4-0001-0001-0001-000000000001', 2022, 2023, 38000000000, 32000000000, 6000000000, -6000000000, -15.8, 'Difficultés terrain', 'TECHNIQUE', FALSE);

-- PASEA glissement critique (+42%)
INSERT INTO inv_glide (project_id, annee_origine, annee_destination, montant_initial, montant_realise, montant_glisse, ecart_absolu, ecart_pourcentage, motif, categorie_motif, is_variation_critique)
VALUES
    ('a1b2c3d4-0004-0004-0004-000000000004', 2023, 2024, 52000000000, 73840000000, 0, 21840000000, 42.0, 'Extension périmètre projet - nouveaux marchés nécessaires', 'FINANCIER', TRUE);

-- ============================================
-- 10. INDICATEURS GAR
-- ============================================

INSERT INTO inv_gar_indicator (project_id, code, libelle, niveau, unite, baseline, baseline_annee, cibles, valeur_actuelle, date_derniere_mesure, source_verification, frequence_mesure)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'IND-01', 'Nombre de salles de classe construites', 'OUTPUT', 'Nombre', 0, 2021, '[{"annee": 2024, "valeur": 300}, {"annee": 2025, "valeur": 500}]', 245, '2024-09-30', 'Rapport trimestriel UCP', 'TRIMESTRIELLE'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'IND-02', 'Nombre d''enseignants formés', 'OUTPUT', 'Nombre', 0, 2021, '[{"annee": 2024, "valeur": 5000}, {"annee": 2025, "valeur": 10000}]', 4200, '2024-09-30', 'Attestations de formation', 'TRIMESTRIELLE'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'IND-03', 'Taux de scolarisation primaire', 'OUTCOME', '%', 78.5, 2021, '[{"annee": 2024, "valeur": 82}, {"annee": 2025, "valeur": 85}]', 80.2, '2024-06-30', 'Statistiques scolaires MENETFP', 'ANNUELLE'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'IND-04', 'Taux d''achèvement du primaire', 'IMPACT', '%', 65.0, 2021, '[{"annee": 2025, "valeur": 75}]', 68.5, '2024-06-30', 'Enquête ménages', 'ANNUELLE');

-- ============================================
-- 11. SUIVI PHYSIQUE
-- ============================================

INSERT INTO inv_physical_tracking (project_id, type_suivi, type_mission, date_suivi, localisation, observations, resultat, photos)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'MISSION_TERRAIN', 'PERIODIQUE', '2024-09-15', 'Bouaké', 'Construction en bonne progression, 85% des travaux terminés sur les sites visités', 'CONFORME', '["photo1.jpg", "photo2.jpg", "photo3.jpg"]'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'RSF', NULL, '2024-08-01', 'Abidjan', 'RSF validé - Pièces justificatives conformes aux normes', 'CONFORME', '[]'),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'MISSION_TERRAIN', 'PONCTUELLE', '2024-06-20', 'Korhogo', 'Retard mineur sur livraison équipements (2 semaines)', 'ECART_MINEUR', '["photo4.jpg", "photo5.jpg", "photo6.jpg", "photo7.jpg", "photo8.jpg"]');

-- ============================================
-- 12. ALERTES
-- ============================================

-- Budget éclaté manquant
INSERT INTO inv_alert (project_id, type_alerte, code_alerte, priorite, titre, description, entite_type, annee, statut, date_detection, lien_action)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'BUDGET_ECLATE_MANQUANT', 'BEM-001', 'CRITIQUE', 'Projet en transfert sans budget éclaté complet', 'Le projet PAPSE-II est de type TRANSFERT mais le budget éclaté présente un écart de 500M avec le notifié', 'INV_BUDGET', 2024, 'ACTIVE', '2024-10-01', '/investissement/projet?id=p1&tab=budget');

-- Écart notifié/éclaté
INSERT INTO inv_alert (project_id, type_alerte, code_alerte, priorite, titre, description, entite_type, annee, valeur_seuil, valeur_actuelle, statut, date_detection, lien_action)
VALUES
    ('a1b2c3d4-0002-0002-0002-000000000002', 'ECART_NOTIFIE_ECLATE', 'ENE-002', 'MAJEURE', 'Écart Notifié/Éclaté significatif', 'Le montant notifié (28 000 M) ne correspond pas au budget éclaté (27 500 M). Écart de 500 M FCFA.', 'INV_BUDGET', 2024, 0, 500000000, 'ACTIVE', '2024-09-15', '/investissement/projet?id=p2&tab=budget');

-- Transféré < Exécuté
INSERT INTO inv_alert (project_id, type_alerte, code_alerte, priorite, titre, description, entite_type, annee, valeur_seuil, valeur_actuelle, statut, date_detection, lien_action)
VALUES
    ('a1b2c3d4-0003-0003-0003-000000000003', 'TRANSFERE_INFERIEUR_EXECUTE', 'TIE-003', 'CRITIQUE', 'Exécuté supérieur au transféré', 'Le montant exécuté (28 120 M) dépasse le montant transféré (28 000 M). Anomalie de +120 M FCFA.', 'INV_FINANCIAL_STATUS', 2024, 28000000000, 28120000000, 'ACTIVE', '2024-10-05', '/investissement/projet?id=p3&tab=financier');

-- Variation coût > 30%
INSERT INTO inv_alert (project_id, type_alerte, code_alerte, priorite, titre, description, entite_type, annee, valeur_seuil, valeur_actuelle, statut, date_detection, lien_action)
VALUES
    ('a1b2c3d4-0004-0004-0004-000000000004', 'VARIATION_COUT_CRITIQUE', 'VCC-004', 'CRITIQUE', 'Variation du coût > 30%', 'Le coût du projet a augmenté de 42% par rapport au budget initial (52 Mds → 73.84 Mds). Nouveaux marchés requis.', 'INV_GLIDE', 2024, 30, 42, 'ACTIVE', '2024-08-20', '/investissement/projet?id=p4&tab=financier');

-- Lettre d'avance non régularisée
INSERT INTO inv_alert (project_id, type_alerte, code_alerte, priorite, titre, description, entite_type, annee, valeur_seuil, valeur_actuelle, statut, date_detection, lien_action)
VALUES
    ('a1b2c3d4-0005-0005-0005-000000000005', 'LETTRE_AVANCE_NON_REGULARISEE', 'LAR-005', 'MAJEURE', 'Lettre d''avance non régularisée', 'La lettre d''avance LA-2024-008 de 1 500 M FCFA n''est pas régularisée. Délai dépassé de 30+ jours.', 'INV_ADVANCE_LETTER', 2024, 90, 120, 'ACTIVE', '2024-09-25', '/investissement/projet?id=p5&tab=transferts');

-- RSF manquant classe 2
INSERT INTO inv_alert (project_id, type_alerte, code_alerte, priorite, titre, description, entite_type, annee, statut, date_detection, lien_action)
VALUES
    ('a1b2c3d4-0006-0006-0006-000000000006', 'RSF_MANQUANT_CLASSE_2', 'RSF-006', 'MAJEURE', 'RSF manquant pour dépenses classe 2', 'Des dépenses de classe 2 (investissement infrastructure) ont été exécutées sans RSF validé associé.', 'INV_PHYSICAL_TRACKING', 2024, 'ACTIVE', '2024-10-08', '/investissement/projet?id=p6&tab=physique');

-- ============================================
-- 13. DOCUMENTS
-- ============================================

INSERT INTO inv_document (project_id, categorie, type_document, titre, description, reference, date_document, statut, obligatoire)
VALUES
    ('a1b2c3d4-0001-0001-0001-000000000001', 'FICHE_VIE', 'Fiche de vie projet', 'Fiche de vie du projet PAPSE-II', 'Document de suivi du cycle de vie', 'FV-PAPSE-2024', '2024-01-15', 'VALIDE', TRUE),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'PTBA', 'Plan de travail', 'PTBA 2024 - PAPSE-II', 'Plan de travail et budget annuel 2024', 'PTBA-2024-001', '2024-01-10', 'VALIDE', TRUE),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'DECISION_CF', 'Avis CF', 'Avis CF sur avenant n°2', 'Décision du Contrôle Financier', 'DCF-2024-045', '2024-06-20', 'VALIDE', FALSE),
    ('a1b2c3d4-0001-0001-0001-000000000001', 'RAPPORT', 'Rapport d''avancement', 'Rapport d''avancement T3 2024', 'Rapport trimestriel Q3', 'RAP-Q3-2024', '2024-10-05', 'DRAFT', FALSE);

-- ============================================
-- FIN DU SEED
-- ============================================

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Seed data for Module Investissement inserted successfully!';
  RAISE NOTICE 'Projects: 6';
  RAISE NOTICE 'Budgets: 4';
  RAISE NOTICE 'Transfers: 8';
  RAISE NOTICE 'Advance Letters: 3';
  RAISE NOTICE 'Alerts: 6';
END $$;
