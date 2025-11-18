-- ============================================
-- Jeu de données cohérent pour SIDCF Portal
-- Version 5.0 - Données réalistes Côte d'Ivoire
-- ============================================
--
-- Principes de cohérence :
-- 1. Un marché PLANIFIE n'a PAS de procédure, attribution, visa, OS, avenants
-- 2. Un marché EN_PROC a une procédure en cours mais PAS d'attribution
-- 3. Un marché ATTRIBUE a une attribution mais PAS de visa CF
-- 4. Un marché VISE a un visa CF mais PAS d'OS de démarrage
-- 5. Un marché EN_EXEC a un OS et peut avoir des avenants
-- 6. Un marché CLOS a toutes les étapes + clôture
--
-- Modes de passation réels en Côte d'Ivoire :
-- - AOO : Appel d'Offres Ouvert (≥100M XOF TTC)
-- - AOR : Appel d'Offres Restreint (sur autorisation)
-- - PSO : Procédure Simplifiée à Compétition Ouverte (30-100M TTC)
-- - PSL : Procédure Simplifiée à Compétition Limitée (15-30M TTC)
-- - PSC : Procédure Simplifiée de Cotation (5-15M TTC)
-- - GRE : Gré à gré / Entente directe (sur autorisation)
--
-- Numérotation officielle : {TYPE} {SEQUENCE}/{ANNEE}
-- T = Travaux, F = Fournitures, S = Services, P = Prestations
--
-- IMPORTANT : Tous les montants prévisionnels sont TTC (incluent TVA 18%)
-- ============================================

-- Nettoyer les données existantes
TRUNCATE TABLE cloture, ordre_service, avenant, garantie, visa_cf, attribution, procedure, echeancier, cle_repartition, resiliation, operation CASCADE;

-- ============================================
-- OPERATIONS - 10 marchés couvrant tous les modes et étapes
-- ============================================

-- 1. Marché CLOS (AOO - Travaux ≥100M TTC)
-- Montant TTC : 531 000 000 XOF (HT: 450 000 000, TVA: 81 000 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Direction du Contrôle Financier', 2024,
'Construction de l''École Primaire Publique d''Abobo-Baoulé - Phase 1',
'TRAVAUX', 'AOO', 531000000, 'XOF', 12, 'CLOS',
'{"section": "22", "sectionLib": "Ministère de l''Éducation Nationale et de l''Alphabétisation", "programme": "P106", "programmeLib": "Développement de l''enseignement primaire", "activite": "A1061", "activiteLib": "Construction et équipement d''établissements primaires", "nature": "23", "natureLib": "Dépenses d''investissement", "bailleur": "BAD"}',
'2024-01-15');

-- 2. Marché EN_EXEC (PSO - Travaux 30-100M TTC)
-- Montant TTC : 88 500 000 XOF (HT: 75 000 000, TVA: 13 500 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'Direction du Contrôle Financier', 2024,
'Réhabilitation du Centre de Santé Urbain de Yopougon Sicogi',
'TRAVAUX', 'PSO', 88500000, 'XOF', 8, 'EN_EXEC',
'{"section": "25", "sectionLib": "Ministère de la Santé et de l''Hygiène Publique", "programme": "P201", "programmeLib": "Amélioration de l''offre de soins", "activite": "A2015", "activiteLib": "Réhabilitation des formations sanitaires", "nature": "23", "natureLib": "Dépenses d''investissement", "bailleur": "ETAT"}',
'2024-02-10');

-- 3. Marché VISE (PSO - Fournitures 30-100M TTC)
-- Montant TTC : 100 300 000 XOF (HT: 85 000 000, TVA: 15 300 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('33333333-3333-3333-3333-333333333333', 'Direction du Contrôle Financier', 2024,
'Fourniture et installation de matériel informatique pour la Direction Générale du Budget',
'FOURNITURES', 'PSO', 100300000, 'XOF', 3, 'VISE',
'{"section": "10", "sectionLib": "Ministère du Budget et du Portefeuille de l''État", "programme": "P050", "programmeLib": "Modernisation de l''administration financière", "activite": "A0503", "activiteLib": "Équipement informatique des services", "nature": "22", "natureLib": "Achats de biens", "bailleur": "ETAT"}',
'2024-03-05');

-- 4. Marché ATTRIBUE (AOO - PI ≥100M TTC)
-- Montant TTC : 141 600 000 XOF (HT: 120 000 000, TVA: 21 600 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('44444444-4444-4444-4444-444444444444', 'Direction du Contrôle Financier', 2024,
'Étude de faisabilité technique et économique du projet de réhabilitation de la route Abidjan-Bassam',
'PI', 'AOO', 141600000, 'XOF', 6, 'ATTRIBUE',
'{"section": "30", "sectionLib": "Ministère de l''Équipement et de l''Entretien Routier", "programme": "P301", "programmeLib": "Développement du réseau routier", "activite": "A3011", "activiteLib": "Études et contrôle des projets routiers", "nature": "21", "natureLib": "Services", "bailleur": "BM"}',
'2024-04-01');

-- 5. Marché EN_PROC (AOO - Travaux ≥100M TTC)
-- Montant TTC : 1 770 000 000 XOF (HT: 1 500 000 000, TVA: 270 000 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('55555555-5555-5555-5555-555555555555', 'Direction du Contrôle Financier', 2024,
'Construction du pont de l''Échangeur de Cocody - Lot 1 : Génie Civil',
'TRAVAUX', 'AOO', 1770000000, 'XOF', 24, 'EN_PROC',
'{"section": "30", "sectionLib": "Ministère de l''Équipement et de l''Entretien Routier", "programme": "P302", "programmeLib": "Construction d''ouvrages d''art", "activite": "A3021", "activiteLib": "Construction de ponts et viaducs", "nature": "23", "natureLib": "Dépenses d''investissement", "bailleur": "AFD"}',
'2024-05-15');

-- 6. Marché PLANIFIE (PSL - Services 15-30M TTC)
-- Montant TTC : 29 500 000 XOF (HT: 25 000 000, TVA: 4 500 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('66666666-6666-6666-6666-666666666666', 'Direction du Contrôle Financier', 2024,
'Maintenance préventive et curative du parc automobile de la DCF - Exercice 2024',
'SERVICES', 'PSL', 29500000, 'XOF', 12, 'PLANIFIE',
'{"section": "10", "sectionLib": "Ministère du Budget et du Portefeuille de l''État", "programme": "P051", "programmeLib": "Pilotage et soutien aux services", "activite": "A0511", "activiteLib": "Entretien du parc automobile", "nature": "24", "natureLib": "Services courants", "bailleur": "ETAT"}',
'2024-06-01');

-- 7. Marché PLANIFIE (PSC - Fournitures 5-15M TTC)
-- Montant TTC : 11 800 000 XOF (HT: 10 000 000, TVA: 1 800 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('77777777-7777-7777-7777-777777777777', 'Direction du Contrôle Financier', 2024,
'Fourniture de consommables informatiques pour la DCF - Lot 2024',
'FOURNITURES', 'PSC', 11800000, 'XOF', 2, 'PLANIFIE',
'{"section": "10", "sectionLib": "Ministère du Budget et du Portefeuille de l''État", "programme": "P051", "programmeLib": "Pilotage et soutien aux services", "activite": "A0512", "activiteLib": "Fournitures de bureau", "nature": "22", "natureLib": "Achats de biens", "bailleur": "ETAT"}',
'2024-06-15');

-- 8. Marché EN_EXEC (GRE - Services - Urgence)
-- Montant TTC : 23 600 000 XOF (HT: 20 000 000, TVA: 3 600 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('88888888-8888-8888-8888-888888888888', 'Direction du Contrôle Financier', 2024,
'Réparation urgente du système de climatisation centrale du bâtiment administratif',
'SERVICES', 'GRE', 23600000, 'XOF', 1, 'EN_EXEC',
'{"section": "10", "sectionLib": "Ministère du Budget et du Portefeuille de l''État", "programme": "P051", "programmeLib": "Pilotage et soutien aux services", "activite": "A0513", "activiteLib": "Entretien des bâtiments", "nature": "24", "natureLib": "Services courants", "bailleur": "ETAT"}',
'2024-07-01');

-- 9. Marché CLOS (PSL - Fournitures 15-30M TTC)
-- Montant TTC : 23 600 000 XOF (HT: 20 000 000, TVA: 3 600 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('99999999-9999-9999-9999-999999999999', 'Direction du Contrôle Financier', 2024,
'Acquisition de mobilier de bureau pour les nouveaux locaux de la DCF',
'FOURNITURES', 'PSL', 23600000, 'XOF', 2, 'CLOS',
'{"section": "10", "sectionLib": "Ministère du Budget et du Portefeuille de l''État", "programme": "P051", "programmeLib": "Pilotage et soutien aux services", "activite": "A0514", "activiteLib": "Équipement mobilier", "nature": "22", "natureLib": "Achats de biens", "bailleur": "ETAT"}',
'2024-03-01');

-- 10. Marché ATTRIBUE (PSC - Services 5-15M TTC)
-- Montant TTC : 8 260 000 XOF (HT: 7 000 000, TVA: 1 260 000)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Direction du Contrôle Financier', 2024,
'Formation du personnel aux nouvelles normes comptables SYSCOHADA révisé',
'SERVICES', 'PSC', 8260000, 'XOF', 1, 'ATTRIBUE',
'{"section": "10", "sectionLib": "Ministère du Budget et du Portefeuille de l''État", "programme": "P050", "programmeLib": "Modernisation de l''administration financière", "activite": "A0501", "activiteLib": "Formation et renforcement des capacités", "nature": "24", "natureLib": "Services courants", "bailleur": "ETAT"}',
'2024-05-01');

-- ============================================
-- PROCEDURES
-- Seulement pour les marchés qui ont passé la phase de planification
-- ============================================

-- Procédure OP-1 (CLOS) - T 001/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'COJO', 'AOO', 8,
'{"lancement": "2024-01-20", "publication": "2024-01-25", "depot": "2024-02-25", "ouverture": "2024-02-26", "analyse": "2024-03-05", "jugement": "2024-03-10"}',
'DA/T 001/2024', '2024-01-20');

-- Procédure OP-2 (EN_EXEC) - T 002/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'COJO', 'PSO', 5,
'{"lancement": "2024-02-15", "publication": "2024-02-20", "depot": "2024-03-10", "ouverture": "2024-03-11", "analyse": "2024-03-18", "jugement": "2024-03-22"}',
'DA/T 002/2024', '2024-02-15');

-- Procédure OP-3 (VISE) - F 003/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'COJO', 'PSO', 6,
'{"lancement": "2024-03-10", "publication": "2024-03-15", "depot": "2024-04-05", "ouverture": "2024-04-06", "analyse": "2024-04-12", "jugement": "2024-04-18"}',
'DA/F 003/2024', '2024-03-10');

-- Procédure OP-4 (ATTRIBUE) - P 004/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'COJO', 'AOO', 4,
'{"lancement": "2024-04-05", "publication": "2024-04-10", "depot": "2024-05-25", "ouverture": "2024-05-26", "analyse": "2024-06-05", "jugement": "2024-06-12"}',
'DA/P 004/2024', '2024-04-05');

-- Procédure OP-5 (EN_PROC) - T 005/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'COJO', 'AOO', 12,
'{"lancement": "2024-05-20", "publication": "2024-05-25", "depot": "2024-07-10"}',
NULL, '2024-05-20');

-- Procédure OP-8 (EN_EXEC - GRE) - S 008/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'COJO', 'GRE', 1,
'{"lancement": "2024-07-02", "depot": "2024-07-03", "ouverture": "2024-07-03", "analyse": "2024-07-04", "jugement": "2024-07-04"}',
'DA/S 008/2024', '2024-07-02');

-- Procédure OP-9 (CLOS) - F 009/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'COJO', 'PSL', 4,
'{"lancement": "2024-03-05", "publication": "2024-03-08", "depot": "2024-03-20", "ouverture": "2024-03-21", "analyse": "2024-03-25", "jugement": "2024-03-28"}',
'DA/F 009/2024', '2024-03-05');

-- Procédure OP-10 (ATTRIBUE - PSC) - S 010/2024
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'COJO', 'PSC', 3,
'{"lancement": "2024-05-05", "depot": "2024-05-12", "ouverture": "2024-05-13", "analyse": "2024-05-15", "jugement": "2024-05-18"}',
'DA/S 010/2024', '2024-05-05');

-- PAS de procédure pour OP-6 et OP-7 (PLANIFIE)

-- ============================================
-- ATTRIBUTIONS
-- ============================================

-- Attribution OP-1 (CLOS) - SOGEA-SATOM CI
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'{"singleOrGroup": "SIMPLE", "nom": "SOGEA-SATOM CI", "entreprises": [{"raisonSociale": "SOGEA-SATOM CI", "ncc": "CI-2015-B-1234", "role": "TITULAIRE"}], "delaiExecution": 12}',
'{"previsionnel": 531000000, "ht": 450000000, "tva": 81000000, "ttc": 531000000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-03-15", "notification": "2024-03-20", "approbation": "2024-03-25"}',
'2024-03-15');

-- Attribution OP-2 (EN_EXEC) - SETAO
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'{"singleOrGroup": "SIMPLE", "nom": "SETAO", "entreprises": [{"raisonSociale": "SETAO", "ncc": "CI-2010-B-5678", "role": "TITULAIRE"}], "delaiExecution": 8}',
'{"previsionnel": 88500000, "ht": 75000000, "tva": 13500000, "ttc": 88500000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-04-02", "notification": "2024-04-08", "approbation": "2024-04-12"}',
'2024-04-02');

-- Attribution OP-3 (VISE) - INFRA TECH SARL
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'{"singleOrGroup": "SIMPLE", "nom": "INFRA TECH SARL", "entreprises": [{"raisonSociale": "INFRA TECH SARL", "ncc": "CI-2018-B-9012", "role": "TITULAIRE"}], "delaiExecution": 3}',
'{"previsionnel": 100300000, "ht": 85000000, "tva": 15300000, "ttc": 100300000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-04-22", "notification": "2024-04-26", "approbation": "2024-05-02"}',
'2024-04-22');

-- Attribution OP-4 (ATTRIBUE) - Groupement CIRA-BNETD
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
'{"singleOrGroup": "GROUPEMENT", "nom": "Groupement CIRA-BNETD", "entreprises": [{"raisonSociale": "CIRA Ingénieurs Conseils", "ncc": "CI-2008-B-3456", "role": "MANDATAIRE"}, {"raisonSociale": "BNETD", "ncc": "CI-1995-A-0001", "role": "COTRAITANT"}], "delaiExecution": 6}',
'{"previsionnel": 141600000, "ht": 120000000, "tva": 21600000, "ttc": 141600000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-06-15", "notification": "2024-06-20"}',
'2024-06-15');

-- Attribution OP-8 (EN_EXEC - GRE) - CLIMASERVICE CI
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888',
'{"singleOrGroup": "SIMPLE", "nom": "CLIMASERVICE CI", "entreprises": [{"raisonSociale": "CLIMASERVICE CI", "ncc": "CI-2012-B-7890", "role": "TITULAIRE"}], "delaiExecution": 1}',
'{"previsionnel": 23600000, "ht": 20000000, "tva": 3600000, "ttc": 23600000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-07-05", "notification": "2024-07-05", "approbation": "2024-07-06"}',
'2024-07-05');

-- Attribution OP-9 (CLOS) - MOBILIER OFFICE CI
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'{"singleOrGroup": "SIMPLE", "nom": "MOBILIER OFFICE CI", "entreprises": [{"raisonSociale": "MOBILIER OFFICE CI", "ncc": "CI-2016-B-2345", "role": "TITULAIRE"}], "delaiExecution": 2}',
'{"previsionnel": 23600000, "ht": 20000000, "tva": 3600000, "ttc": 23600000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-04-02", "notification": "2024-04-05", "approbation": "2024-04-08"}',
'2024-04-02');

-- Attribution OP-10 (ATTRIBUE) - CABINET AUDIT CONSEIL
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, created_at) VALUES
('a0000000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'{"singleOrGroup": "SIMPLE", "nom": "CABINET AUDIT CONSEIL", "entreprises": [{"raisonSociale": "CABINET AUDIT CONSEIL", "ncc": "CI-2019-B-6789", "role": "TITULAIRE"}], "delaiExecution": 1}',
'{"previsionnel": 8260000, "ht": 7000000, "tva": 1260000, "ttc": 8260000, "tauxTva": 18, "devise": "XOF"}',
'{"attribution": "2024-05-22", "notification": "2024-05-25"}',
'2024-05-22');

-- PAS d'attribution pour OP-5 (EN_PROC) car procédure pas terminée
-- PAS d'attribution pour OP-6 et OP-7 (PLANIFIE)

-- ============================================
-- ECHEANCIERS
-- ============================================

-- Échéancier OP-1 (CLOS)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'[{"numero": 1, "libelle": "Avance démarrage", "pourcentage": 20, "montant": 106200000, "datePrevisionnelle": "2024-04-01", "statut": "PAYE"},
  {"numero": 2, "libelle": "Fondations achevées", "pourcentage": 25, "montant": 132750000, "datePrevisionnelle": "2024-06-01", "statut": "PAYE"},
  {"numero": 3, "libelle": "Structure achevée", "pourcentage": 30, "montant": 159300000, "datePrevisionnelle": "2024-09-01", "statut": "PAYE"},
  {"numero": 4, "libelle": "Finitions et réception", "pourcentage": 25, "montant": 132750000, "datePrevisionnelle": "2024-12-01", "statut": "PAYE"}]',
531000000, 100.00, '2024-03-15');

-- Échéancier OP-2 (EN_EXEC)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'[{"numero": 1, "libelle": "Avance démarrage", "pourcentage": 30, "montant": 26550000, "datePrevisionnelle": "2024-04-25", "statut": "PAYE"},
  {"numero": 2, "libelle": "Mi-parcours", "pourcentage": 40, "montant": 35400000, "datePrevisionnelle": "2024-07-01", "statut": "EN_COURS"},
  {"numero": 3, "libelle": "Réception", "pourcentage": 30, "montant": 26550000, "datePrevisionnelle": "2024-10-01", "statut": "A_VENIR"}]',
88500000, 100.00, '2024-04-12');

-- Échéancier OP-3 (VISE)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'[{"numero": 1, "libelle": "Livraison et installation", "pourcentage": 70, "montant": 70210000, "datePrevisionnelle": "2024-06-15", "statut": "A_VENIR"},
  {"numero": 2, "libelle": "Formation et réception", "pourcentage": 30, "montant": 30090000, "datePrevisionnelle": "2024-07-15", "statut": "A_VENIR"}]',
100300000, 100.00, '2024-05-02');

-- Échéancier OP-9 (CLOS)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'[{"numero": 1, "libelle": "Livraison", "pourcentage": 100, "montant": 23600000, "datePrevisionnelle": "2024-05-15", "statut": "PAYE"}]',
23600000, 100.00, '2024-04-08');

-- ============================================
-- CLES DE REPARTITION
-- Pour les marchés multi-bailleurs
-- ============================================

-- Clé répartition OP-1 (BAD 70%, ETAT 30%)
INSERT INTO cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'[{"bailleur": "BAD", "pourcentage": 70, "montant": 371700000}, {"bailleur": "ETAT", "pourcentage": 30, "montant": 159300000}]',
531000000, 100.00, '2024-03-15');

-- Clé répartition OP-5 (AFD 80%, ETAT 20%)
INSERT INTO cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at) VALUES
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555',
'[{"bailleur": "AFD", "pourcentage": 80, "montant": 1416000000}, {"bailleur": "ETAT", "pourcentage": 20, "montant": 354000000}]',
1770000000, 100.00, '2024-05-20');

-- ============================================
-- VISAS CF
-- ============================================

-- Visa CF OP-1 (CLOS)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
'VISE', '2024-03-28', '2024-03-28');

-- Visa CF OP-2 (EN_EXEC)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222',
'VISE', '2024-04-18', '2024-04-18');

-- Visa CF OP-3 (VISE)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333',
'VISE', '2024-05-08', '2024-05-08');

-- Visa CF OP-8 (EN_EXEC - GRE)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888',
'VISE', '2024-07-08', '2024-07-08');

-- Visa CF OP-9 (CLOS)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999',
'VISE', '2024-04-12', '2024-04-12');

-- PAS de visa pour OP-4 et OP-10 (ATTRIBUE) car en attente
-- PAS de visa pour OP-5 (EN_PROC) car pas d'attribution
-- PAS de visa pour OP-6 et OP-7 (PLANIFIE)

-- ============================================
-- ORDRES DE SERVICE
-- ============================================

-- OS OP-1 (CLOS)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, bureau_controle, bureau_etudes, created_at) VALUES
('01111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'OS/T 001/2024/01', '2024-04-01',
'Ordre de service de démarrage des travaux de construction de l''EPP Abobo-Baoulé',
'{"type": "ENTREPRISE", "nom": "BNETD - Bureau de Contrôle"}',
'{"type": "ENTREPRISE", "nom": "BNETD - Maîtrise d''œuvre"}',
'2024-04-01');

-- OS OP-2 (EN_EXEC)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, bureau_controle, bureau_etudes, created_at) VALUES
('02222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'OS/T 002/2024/01', '2024-04-25',
'Ordre de service de démarrage des travaux de réhabilitation du CSU Yopougon Sicogi',
'{"type": "UA", "nom": "Direction des Infrastructures Sanitaires"}',
'{"type": "ENTREPRISE", "nom": "TERRABO Ingénierie"}',
'2024-04-25');

-- OS OP-8 (EN_EXEC - GRE)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, bureau_controle, bureau_etudes, created_at) VALUES
('08888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888',
'OS/S 008/2024/01', '2024-07-10',
'Ordre de service de démarrage des travaux de réparation du système de climatisation',
'{"type": "UA", "nom": "Service Technique DCF"}',
'{"type": null, "nom": ""}',
'2024-07-10');

-- OS OP-9 (CLOS)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, bureau_controle, bureau_etudes, created_at) VALUES
('09999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'OS/F 009/2024/01', '2024-04-15',
'Ordre de service de livraison du mobilier de bureau',
'{"type": "UA", "nom": "Service Logistique DCF"}',
'{"type": null, "nom": ""}',
'2024-04-15');

-- PAS d'OS pour OP-3 (VISE) car pas encore démarré
-- PAS d'OS pour OP-4 et OP-10 (ATTRIBUE) car pas de visa
-- PAS d'OS pour OP-5 (EN_PROC) car pas d'attribution
-- PAS d'OS pour OP-6 et OP-7 (PLANIFIE)

-- ============================================
-- AVENANTS
-- ============================================

-- Avenant OP-2 (EN_EXEC) - Avenant mixte suite intempéries
-- Variation 7 080 000 XOF = 8% du montant initial (88 500 000 TTC)
INSERT INTO avenant (id, operation_id, numero, type, a_incidence_financiere, variation_montant, variation_duree, nouveau_montant_total, nouveau_delai_total, incidence_pourcent, cumul_pourcent, date_signature, motif_ref, motif_autre, created_at) VALUES
('af222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222',
1, 'MIXTE', TRUE, 7080000, 2, 95580000, 10, 8.00, 8.00, '2024-08-15',
'INTEMPERIES',
'Suite aux fortes pluies de juillet-août 2024 ayant causé l''inondation du chantier et l''arrêt des travaux pendant 3 semaines, un avenant de prolongation de délai de 2 mois et une indemnisation de 7 080 000 XOF TTC sont accordés.',
'2024-08-15');

-- PAS d'avenants pour les autres marchés

-- ============================================
-- GARANTIES
-- ============================================

-- Garantie OP-1 (CLOS) - Libérée
-- taux = 5% du montant TTC
INSERT INTO garantie (id, operation_id, type, montant, taux, date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc, created_at) VALUES
('91111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'BONNE_EXEC', 26550000, 5.00, '2024-03-28', '2025-03-28', 'LIBEREE',
'GB/2024/SGBCI/SOGEA/001', '2025-01-15', 'ML/2025/SGBCI/001', '2024-03-28');

-- Garantie OP-2 (EN_EXEC) - Active
INSERT INTO garantie (id, operation_id, type, montant, taux, date_emission, date_echeance, etat, doc, created_at) VALUES
('92222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'BONNE_EXEC', 4425000, 5.00, '2024-04-20', '2025-04-20', 'ACTIVE',
'GB/2024/BICICI/SETAO/001', '2024-04-20');

-- Garantie OP-9 (CLOS) - Libérée
INSERT INTO garantie (id, operation_id, type, montant, taux, date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc, created_at) VALUES
('99999999-9999-9999-9999-999999999991', '99999999-9999-9999-9999-999999999999',
'BONNE_EXEC', 1180000, 5.00, '2024-04-12', '2024-07-12', 'LIBEREE',
'GB/2024/NSIA/MOBILIER/001', '2024-06-20', 'ML/2024/NSIA/001', '2024-04-12');

-- PAS de garantie pour OP-3 (VISE) car pas encore démarré
-- PAS de garantie pour OP-4, OP-5, OP-6, OP-7, OP-10

-- ============================================
-- CLOTURES
-- ============================================

-- Clôture OP-1
INSERT INTO cloture (id, operation_id, reception_prov, reception_def, decomptes, montant_total_paye, montant_marche_total, ecart_montant, mainlevees, synthese_finale, clos_at, created_at) VALUES
('c0111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'{"date": "2024-09-15", "pv_ref": "PV/RP/T 001/2024", "reservees": [], "participants": ["Maître d''ouvrage: DCF", "Maître d''œuvre: BNETD", "Titulaire: SOGEA-SATOM CI"]}',
'{"date": "2024-12-20", "pv_ref": "PV/RD/T 001/2024", "reservees": [], "participants": ["Maître d''ouvrage: DCF", "Maître d''œuvre: BNETD", "Titulaire: SOGEA-SATOM CI", "Contrôleur: BNETD"]}',
'[{"numero": 1, "montant": 106200000, "date": "2024-04-15"}, {"numero": 2, "montant": 132750000, "date": "2024-06-30"}, {"numero": 3, "montant": 159300000, "date": "2024-09-30"}, {"numero": "Final", "montant": 132750000, "date": "2024-12-28"}]',
531000000, 531000000, 0,
'[{"type": "BONNE_EXEC", "date": "2025-01-15", "ref": "ML/2025/SGBCI/001"}]',
'Travaux réalisés conformément au cahier des charges. Réception définitive prononcée sans réserve le 20/12/2024. Tous les décomptes payés. Garantie de bonne exécution libérée.',
'2024-12-20', '2024-12-20');

-- Clôture OP-9
INSERT INTO cloture (id, operation_id, reception_prov, reception_def, decomptes, montant_total_paye, montant_marche_total, ecart_montant, mainlevees, synthese_finale, clos_at, created_at) VALUES
('c0999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'{"date": "2024-05-20", "pv_ref": "PV/RP/F 009/2024", "reservees": [], "participants": ["Service Logistique DCF", "Titulaire: MOBILIER OFFICE CI"]}',
'{"date": "2024-06-15", "pv_ref": "PV/RD/F 009/2024", "reservees": [], "participants": ["Service Logistique DCF", "Titulaire: MOBILIER OFFICE CI"]}',
'[{"numero": 1, "montant": 23600000, "date": "2024-05-28"}]',
23600000, 23600000, 0,
'[{"type": "BONNE_EXEC", "date": "2024-06-20", "ref": "ML/2024/NSIA/001"}]',
'Mobilier livré conforme au bon de commande. Installation effectuée. Réception définitive prononcée le 15/06/2024.',
'2024-06-15', '2024-06-15');

-- PAS de clôture pour les autres marchés

-- ============================================
-- Résumé final des données
-- ============================================
SELECT 'Operations' as entity, COUNT(*) as count FROM operation
UNION ALL SELECT 'Procedures', COUNT(*) FROM procedure
UNION ALL SELECT 'Attributions', COUNT(*) FROM attribution
UNION ALL SELECT 'Visas CF', COUNT(*) FROM visa_cf
UNION ALL SELECT 'Ordres Service', COUNT(*) FROM ordre_service
UNION ALL SELECT 'Avenants', COUNT(*) FROM avenant
UNION ALL SELECT 'Echeanciers', COUNT(*) FROM echeancier
UNION ALL SELECT 'Cles Repartition', COUNT(*) FROM cle_repartition
UNION ALL SELECT 'Garanties', COUNT(*) FROM garantie
UNION ALL SELECT 'Clotures', COUNT(*) FROM cloture;
