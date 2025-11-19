-- ============================================
-- Jeu de données cohérent pour SIDCF Portal
-- Version 7.0 - Données 2025, Bailleurs & UA variés
-- ============================================
--
-- Couverture :
-- - 6 MODES : AOO, PSO, PSL, PSC, GRE, PI
-- - 4 TYPES : TRAVAUX, FOURNITURES, SERVICES, PI
-- - 10 BAILLEURS : TRESOR, BAD, BM, AFD, UE, BID, BOAD, JICA, USAID, KFW
-- - 8 UA variées (pas seulement DCF)
-- - 6 ETAPES : PLANIFIE, EN_PROC, ATTRIBUE, VISE, EN_EXEC, CLOS
-- - 15 OPERATIONS au total
--
-- Tous les montants sont TTC (incluent TVA 18%)
-- ============================================

-- Nettoyer les données existantes
TRUNCATE TABLE cloture, ordre_service, avenant, garantie, visa_cf, attribution, procedure, echeancier, cle_repartition, resiliation, operation CASCADE;

-- ============================================
-- OPERATIONS - 15 marchés couvrant toutes les combinaisons
-- ============================================

-- OP-01: CLOS - AOO - TRAVAUX - BAD - Direction Générale du Budget (DGB)
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Direction Générale du Budget', 2025,
'Construction du nouveau siège régional DGB - San Pedro',
'TRAVAUX', 'AOO', 531000000, 'XOF', 12, 'CLOS',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P050", "programmeLib": "Modernisation administration", "activite": "A0501", "activiteLib": "Construction bâtiments", "nature": "23", "natureLib": "Investissement", "bailleur": "BAD"}',
'2025-01-15');

-- OP-02: EN_EXEC - PSO - TRAVAUX - TRESOR - Direction Régionale Santé Abidjan
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'Direction Régionale Santé Abidjan', 2025,
'Réhabilitation du Centre Hospitalier Régional de Yopougon',
'TRAVAUX', 'PSO', 88500000, 'XOF', 8, 'EN_EXEC',
'{"section": "25", "sectionLib": "Ministère de la Santé", "programme": "P201", "programmeLib": "Amélioration offre de soins", "activite": "A2015", "activiteLib": "Réhabilitation sanitaires", "nature": "23", "natureLib": "Investissement", "bailleur": "TRESOR"}',
'2025-02-10');

-- OP-03: VISE - PSO - FOURNITURES - BM - Direction des Systèmes d'Information
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('33333333-3333-3333-3333-333333333333', 'Direction des Systèmes d''Information', 2025,
'Fourniture et installation de serveurs et équipements réseaux',
'FOURNITURES', 'PSO', 100300000, 'XOF', 3, 'VISE',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P050", "programmeLib": "Modernisation admin financière", "activite": "A0503", "activiteLib": "Équipement informatique", "nature": "22", "natureLib": "Achats de biens", "bailleur": "BM"}',
'2025-03-05');

-- OP-04: ATTRIBUE - AOO - PI - AFD - BNETD
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('44444444-4444-4444-4444-444444444444', 'Bureau National d''Études Techniques', 2025,
'Étude de faisabilité technique autoroute Abidjan-Bassam 2ème phase',
'PI', 'AOO', 141600000, 'XOF', 6, 'ATTRIBUE',
'{"section": "30", "sectionLib": "Ministère de l''Équipement Routier", "programme": "P301", "programmeLib": "Développement réseau routier", "activite": "A3011", "activiteLib": "Études projets routiers", "nature": "21", "natureLib": "Services", "bailleur": "AFD"}',
'2025-04-01');

-- OP-05: EN_PROC - AOO - TRAVAUX - UE - Direction des Grands Travaux
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('55555555-5555-5555-5555-555555555555', 'Direction des Grands Travaux', 2025,
'Construction du pont de l''Échangeur de Cocody - Lot Principal',
'TRAVAUX', 'AOO', 1770000000, 'XOF', 24, 'EN_PROC',
'{"section": "30", "sectionLib": "Ministère de l''Équipement Routier", "programme": "P302", "programmeLib": "Ouvrages d''art", "activite": "A3021", "activiteLib": "Construction ponts", "nature": "23", "natureLib": "Investissement", "bailleur": "UE"}',
'2025-05-15');

-- OP-06: PLANIFIE - PSL - SERVICES - TRESOR - Direction du Contrôle Financier
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('66666666-6666-6666-6666-666666666666', 'Direction du Contrôle Financier', 2025,
'Maintenance préventive du parc automobile DCF - 2025',
'SERVICES', 'PSL', 29500000, 'XOF', 12, 'PLANIFIE',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P051", "programmeLib": "Pilotage services", "activite": "A0511", "activiteLib": "Entretien automobile", "nature": "24", "natureLib": "Services courants", "bailleur": "TRESOR"}',
'2025-06-01');

-- OP-07: PLANIFIE - PSC - FOURNITURES - TRESOR - Direction des Ressources Humaines
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('77777777-7777-7777-7777-777777777777', 'Direction des Ressources Humaines', 2025,
'Fourniture de mobilier de bureau et consommables - Lot 2025',
'FOURNITURES', 'PSC', 11800000, 'XOF', 2, 'PLANIFIE',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P051", "programmeLib": "Pilotage services", "activite": "A0512", "activiteLib": "Fournitures bureau", "nature": "22", "natureLib": "Achats de biens", "bailleur": "TRESOR"}',
'2025-06-15');

-- OP-08: EN_EXEC - GRE - SERVICES - TRESOR - Direction des Marchés Publics
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('88888888-8888-8888-8888-888888888888', 'Direction Générale des Marchés Publics', 2025,
'Réparation urgente système climatisation bâtiment DGMP',
'SERVICES', 'GRE', 23600000, 'XOF', 1, 'EN_EXEC',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P051", "programmeLib": "Pilotage services", "activite": "A0513", "activiteLib": "Entretien bâtiments", "nature": "24", "natureLib": "Services courants", "bailleur": "TRESOR"}',
'2025-07-01');

-- OP-09: CLOS - PSL - FOURNITURES - BOAD - Direction de la Comptabilité Publique
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('99999999-9999-9999-9999-999999999999', 'Direction de la Comptabilité Publique', 2025,
'Acquisition de mobilier ergonomique nouveaux locaux DCP',
'FOURNITURES', 'PSL', 23600000, 'XOF', 2, 'CLOS',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P051", "programmeLib": "Pilotage services", "activite": "A0514", "activiteLib": "Équipement mobilier", "nature": "22", "natureLib": "Achats de biens", "bailleur": "BOAD"}',
'2025-03-01');

-- OP-10: ATTRIBUE - PSC - SERVICES - JICA - Direction de la Formation Continue
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Direction de la Formation Continue', 2025,
'Formation personnel aux normes SYSCOHADA révisé et IFRS',
'SERVICES', 'PSC', 8260000, 'XOF', 1, 'ATTRIBUE',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P050", "programmeLib": "Modernisation admin", "activite": "A0501", "activiteLib": "Formation capacités", "nature": "24", "natureLib": "Services courants", "bailleur": "JICA"}',
'2025-05-01');

-- OP-11: EN_EXEC - AOO - TRAVAUX - BID - Office National de l'Eau Potable
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Office National de l''Eau Potable', 2025,
'Construction de 5 forages et châteaux d''eau - Région du Zanzan',
'TRAVAUX', 'AOO', 472000000, 'XOF', 18, 'EN_EXEC',
'{"section": "28", "sectionLib": "Ministère de l''Hydraulique", "programme": "P401", "programmeLib": "Accès eau potable", "activite": "A4011", "activiteLib": "Forages et châteaux d''eau", "nature": "23", "natureLib": "Investissement", "bailleur": "BID"}',
'2025-02-20');

-- OP-12: VISE - PSL - SERVICES - USAID - Inspection Générale des Finances
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Inspection Générale des Finances', 2025,
'Audit comptable et financier exercice 2024 - IGF',
'SERVICES', 'PSL', 28320000, 'XOF', 3, 'VISE',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P050", "programmeLib": "Modernisation admin", "activite": "A0502", "activiteLib": "Contrôle et audit", "nature": "21", "natureLib": "Services", "bailleur": "USAID"}',
'2025-04-10');

-- OP-13: EN_PROC - PSO - FOURNITURES - KFW - Direction du Parc Automobile
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Direction du Parc Automobile de l''État', 2025,
'Fourniture de véhicules 4x4 pour missions régionales',
'FOURNITURES', 'PSO', 65000000, 'XOF', 4, 'EN_PROC',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P051", "programmeLib": "Pilotage services", "activite": "A0515", "activiteLib": "Acquisition véhicules", "nature": "22", "natureLib": "Achats de biens", "bailleur": "KFW"}',
'2025-05-20');

-- OP-14: CLOS - GRE - PI - AFD - Agence Nationale de l'Environnement
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Agence Nationale de l''Environnement', 2025,
'Étude d''impact environnemental projet échangeur Cocody',
'PI', 'GRE', 35400000, 'XOF', 2, 'CLOS',
'{"section": "30", "sectionLib": "Ministère de l''Équipement", "programme": "P302", "programmeLib": "Ouvrages d''art", "activite": "A3022", "activiteLib": "Études environnementales", "nature": "21", "natureLib": "Services", "bailleur": "AFD"}',
'2025-01-10');

-- OP-15: PLANIFIE - AOO - TRAVAUX - UE - Direction Générale des Impôts
INSERT INTO operation (id, unite, exercice, objet, type_marche, mode_passation, montant_previsionnel, devise, delai_execution, etat, chaine_budgetaire, created_at) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Direction Générale des Impôts', 2025,
'Construction du nouveau siège de la DGI - Plateau',
'TRAVAUX', 'AOO', 850000000, 'XOF', 24, 'PLANIFIE',
'{"section": "10", "sectionLib": "Ministère du Budget", "programme": "P052", "programmeLib": "Infrastructure admin", "activite": "A0521", "activiteLib": "Construction bâtiments", "nature": "23", "natureLib": "Investissement", "bailleur": "UE"}',
'2025-07-01');

-- ============================================
-- PROCEDURES
-- Pour les marchés ayant dépassé la phase PLANIFIE
-- ============================================

-- OP-01 (CLOS) - T 001/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'COJO', 'AOO', 8,
'{"lancement": "2025-01-20", "publication": "2025-01-25", "depot": "2025-02-25", "ouverture": "2025-02-26", "analyse": "2025-03-05", "jugement": "2025-03-10"}',
'DA/T 001/2025', '2025-01-20');

-- OP-02 (EN_EXEC) - T 002/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'COJO', 'PSO', 5,
'{"lancement": "2025-02-15", "publication": "2025-02-20", "depot": "2025-03-10", "ouverture": "2025-03-11", "analyse": "2025-03-18", "jugement": "2025-03-22"}',
'DA/T 002/2025', '2025-02-15');

-- OP-03 (VISE) - F 003/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'COJO', 'PSO', 6,
'{"lancement": "2025-03-10", "publication": "2025-03-15", "depot": "2025-04-05", "ouverture": "2025-04-06", "analyse": "2025-04-12", "jugement": "2025-04-18"}',
'DA/F 003/2025', '2025-03-10');

-- OP-04 (ATTRIBUE) - P 004/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'COJO', 'AOO', 4,
'{"lancement": "2025-04-05", "publication": "2025-04-10", "depot": "2025-05-10", "ouverture": "2025-05-11", "analyse": "2025-05-18", "jugement": "2025-05-25"}',
'DA/P 004/2025', '2025-04-05');

-- OP-05 (EN_PROC) - T 005/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'COJO', 'AOO', 12,
'{"lancement": "2025-05-20", "publication": "2025-05-25", "depot": "2025-07-25", "ouverture": "2025-07-26", "analyse": null, "jugement": null}',
NULL, '2025-05-20');

-- OP-08 (EN_EXEC) - S 008/2025 - GRE
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'COJO', 'GRE', 1,
'{"lancement": "2025-07-02", "publication": null, "depot": "2025-07-05", "ouverture": "2025-07-05", "analyse": "2025-07-06", "jugement": "2025-07-08"}',
'DA/S 008/2025', '2025-07-02');

-- OP-09 (CLOS) - F 009/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('b9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'COJO', 'PSL', 4,
'{"lancement": "2025-03-05", "publication": "2025-03-08", "depot": "2025-03-25", "ouverture": "2025-03-26", "analyse": "2025-03-28", "jugement": "2025-04-02"}',
'DA/F 009/2025', '2025-03-05');

-- OP-10 (ATTRIBUE) - S 010/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'COJO', 'PSC', 3,
'{"lancement": "2025-05-05", "publication": "2025-05-08", "depot": "2025-05-20", "ouverture": "2025-05-21", "analyse": "2025-05-23", "jugement": "2025-05-28"}',
'DA/S 010/2025', '2025-05-05');

-- OP-11 (EN_EXEC) - T 011/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'COJO', 'AOO', 7,
'{"lancement": "2025-02-25", "publication": "2025-03-01", "depot": "2025-04-01", "ouverture": "2025-04-02", "analyse": "2025-04-10", "jugement": "2025-04-15"}',
'DA/T 011/2025', '2025-02-25');

-- OP-12 (VISE) - S 012/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('bcccccc1-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'COJO', 'PSL', 5,
'{"lancement": "2025-04-15", "publication": "2025-04-18", "depot": "2025-05-08", "ouverture": "2025-05-09", "analyse": "2025-05-15", "jugement": "2025-05-20"}',
'DA/S 012/2025', '2025-04-15');

-- OP-13 (EN_PROC) - F 013/2025
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('bdddddd1-dddd-dddd-dddd-dddddddddddd', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'COJO', 'PSO', 8,
'{"lancement": "2025-05-25", "publication": "2025-05-28", "depot": "2025-06-20", "ouverture": "2025-06-21", "analyse": null, "jugement": null}',
NULL, '2025-05-25');

-- OP-14 (CLOS) - P 014/2025 - GRE
INSERT INTO procedure (id, operation_id, commission, mode_passation, nb_offres_recues, dates, decision_attribution_ref, created_at) VALUES
('beeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'COJO', 'GRE', 1,
'{"lancement": "2025-01-12", "publication": null, "depot": "2025-01-15", "ouverture": "2025-01-15", "analyse": "2025-01-16", "jugement": "2025-01-18"}',
'DA/P 014/2025', '2025-01-12');

-- ============================================
-- ATTRIBUTIONS
-- Pour les marchés ayant dépassé la phase EN_PROC
-- ============================================

-- OP-01 (CLOS)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "SOGEA-SATOM CI", "ncc": "1234567A", "contact": "sogea@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 545000000, "corrige": 540000000, "attribue": 531000000, "ttc": 531000000}',
'{"signature": "2025-03-15", "delaiExecution": 12, "delaiUnite": "MOIS", "numeroContrat": "MC/T 001/2025"}',
'{"ano": {"requis": true, "numero": "ANO/2025/001", "date": "2025-03-12", "autorite": "DGMP"}}',
'2025-03-15');

-- OP-02 (EN_EXEC)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "COLAS CI", "ncc": "2345678B", "contact": "colas@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 92000000, "corrige": 90000000, "attribue": 88500000, "ttc": 88500000}',
'{"signature": "2025-04-10", "delaiExecution": 8, "delaiUnite": "MOIS", "numeroContrat": "MC/T 002/2025"}',
'{}',
'2025-04-10');

-- OP-03 (VISE)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "CFAO TECHNOLOGIES", "ncc": "3456789C", "contact": "cfao.tech@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 105000000, "corrige": 102000000, "attribue": 100300000, "ttc": 100300000}',
'{"signature": "2025-04-25", "delaiExecution": 3, "delaiUnite": "MOIS", "numeroContrat": "MC/F 003/2025"}',
'{"ano": {"requis": true, "numero": "ANO/2025/002", "date": "2025-04-22", "autorite": "DGMP"}}',
'2025-04-25');

-- OP-04 (ATTRIBUE)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
'{"singleOrGroup": "GROUPEMENT", "nomGroupement": "Consortium BNETD-SETEC", "entreprises": [{"raisonSociale": "BNETD", "ncc": "4567890D", "contact": "bnetd@ci.com", "role": "MANDATAIRE"}, {"raisonSociale": "SETEC", "ncc": "5678901E", "contact": "setec@ci.com", "role": "COTRAITANT"}]}',
'{"soumis": 148000000, "corrige": 145000000, "attribue": 141600000, "ttc": 141600000}',
'{"signature": "2025-06-01", "delaiExecution": 6, "delaiUnite": "MOIS", "numeroContrat": "MC/P 004/2025"}',
'{"ano": {"requis": true, "numero": "ANO/2025/003", "date": "2025-05-28", "autorite": "DGMP"}}',
'2025-06-01');

-- OP-08 (EN_EXEC) - GRE
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('a8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "CLIMASERVICE CI", "ncc": "8901234H", "contact": "climaservice@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 23600000, "corrige": 23600000, "attribue": 23600000, "ttc": 23600000}',
'{"signature": "2025-07-10", "delaiExecution": 1, "delaiUnite": "MOIS", "numeroContrat": "MC/S 008/2025"}',
'{}',
'2025-07-10');

-- OP-09 (CLOS)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('a9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "MOBILIER OFFICE CI", "ncc": "9012345I", "contact": "mobilier@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 25000000, "corrige": 24000000, "attribue": 23600000, "ttc": 23600000}',
'{"signature": "2025-04-08", "delaiExecution": 2, "delaiUnite": "MOIS", "numeroContrat": "MC/F 009/2025"}',
'{}',
'2025-04-08');

-- OP-10 (ATTRIBUE)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "CABINET FORMATION EXPERT", "ncc": "0123456J", "contact": "formation@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 8500000, "corrige": 8300000, "attribue": 8260000, "ttc": 8260000}',
'{"signature": "2025-06-05", "delaiExecution": 1, "delaiUnite": "MOIS", "numeroContrat": "MC/S 010/2025"}',
'{}',
'2025-06-05');

-- OP-11 (EN_EXEC)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('abbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "SOGEA HYDRAULIQUE", "ncc": "1234567K", "contact": "sogea.hydro@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 485000000, "corrige": 478000000, "attribue": 472000000, "ttc": 472000000}',
'{"signature": "2025-04-25", "delaiExecution": 18, "delaiUnite": "MOIS", "numeroContrat": "MC/T 011/2025"}',
'{"ano": {"requis": true, "numero": "ANO/2025/004", "date": "2025-04-20", "autorite": "DGMP"}}',
'2025-04-25');

-- OP-12 (VISE)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('acccccc1-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "KPMG CI", "ncc": "2345678L", "contact": "kpmg@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 30000000, "corrige": 29000000, "attribue": 28320000, "ttc": 28320000}',
'{"signature": "2025-05-28", "delaiExecution": 3, "delaiUnite": "MOIS", "numeroContrat": "MC/S 012/2025"}',
'{}',
'2025-05-28');

-- OP-14 (CLOS)
INSERT INTO attribution (id, operation_id, attributaire, montants, dates, decision_cf, created_at) VALUES
('aeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'{"singleOrGroup": "SIMPLE", "entreprises": [{"raisonSociale": "ANDE - Agence Nationale De l''Environnement", "ncc": "3456789M", "contact": "ande@ci.com", "role": "TITULAIRE"}]}',
'{"soumis": 35400000, "corrige": 35400000, "attribue": 35400000, "ttc": 35400000}',
'{"signature": "2025-01-22", "delaiExecution": 2, "delaiUnite": "MOIS", "numeroContrat": "MC/P 014/2025"}',
'{}',
'2025-01-22');

-- ============================================
-- ECHEANCIERS
-- ============================================

-- OP-01 (CLOS)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'[{"numero": 1, "libelle": "Avance démarrage", "pourcentage": 20, "montant": 106200000, "datePrevisionnelle": "2025-04-01", "statut": "PAYE"},
  {"numero": 2, "libelle": "Fondations", "pourcentage": 25, "montant": 132750000, "datePrevisionnelle": "2025-06-01", "statut": "PAYE"},
  {"numero": 3, "libelle": "Structure", "pourcentage": 30, "montant": 159300000, "datePrevisionnelle": "2025-09-01", "statut": "PAYE"},
  {"numero": 4, "libelle": "Finitions", "pourcentage": 25, "montant": 132750000, "datePrevisionnelle": "2025-12-01", "statut": "PAYE"}]',
531000000, 100.00, '2025-03-15');

-- OP-02 (EN_EXEC)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'[{"numero": 1, "libelle": "Avance", "pourcentage": 30, "montant": 26550000, "datePrevisionnelle": "2025-04-25", "statut": "PAYE"},
  {"numero": 2, "libelle": "Mi-parcours", "pourcentage": 40, "montant": 35400000, "datePrevisionnelle": "2025-07-01", "statut": "EN_COURS"},
  {"numero": 3, "libelle": "Réception", "pourcentage": 30, "montant": 26550000, "datePrevisionnelle": "2025-10-01", "statut": "A_VENIR"}]',
88500000, 100.00, '2025-04-12');

-- OP-03 (VISE)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
'[{"numero": 1, "libelle": "Livraison matériel", "pourcentage": 70, "montant": 70210000, "datePrevisionnelle": "2025-06-15", "statut": "A_VENIR"},
  {"numero": 2, "libelle": "Installation et formation", "pourcentage": 30, "montant": 30090000, "datePrevisionnelle": "2025-07-15", "statut": "A_VENIR"}]',
100300000, 100.00, '2025-05-02');

-- OP-09 (CLOS)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('e9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'[{"numero": 1, "libelle": "Livraison complète", "pourcentage": 100, "montant": 23600000, "datePrevisionnelle": "2025-05-15", "statut": "PAYE"}]',
23600000, 100.00, '2025-04-08');

-- OP-11 (EN_EXEC)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('ebbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'[{"numero": 1, "libelle": "Avance", "pourcentage": 15, "montant": 70800000, "datePrevisionnelle": "2025-05-01", "statut": "PAYE"},
  {"numero": 2, "libelle": "Forage 1-2", "pourcentage": 30, "montant": 141600000, "datePrevisionnelle": "2025-08-01", "statut": "EN_COURS"},
  {"numero": 3, "libelle": "Forage 3-5", "pourcentage": 35, "montant": 165200000, "datePrevisionnelle": "2025-12-01", "statut": "A_VENIR"},
  {"numero": 4, "libelle": "Réception", "pourcentage": 20, "montant": 94400000, "datePrevisionnelle": "2026-06-01", "statut": "A_VENIR"}]',
472000000, 100.00, '2025-04-28');

-- OP-14 (CLOS)
INSERT INTO echeancier (id, operation_id, items, total, total_pourcent, created_at) VALUES
('eeeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'[{"numero": 1, "libelle": "Rapport provisoire", "pourcentage": 50, "montant": 17700000, "datePrevisionnelle": "2025-02-15", "statut": "PAYE"},
  {"numero": 2, "libelle": "Rapport final", "pourcentage": 50, "montant": 17700000, "datePrevisionnelle": "2025-03-15", "statut": "PAYE"}]',
35400000, 100.00, '2025-01-25');

-- ============================================
-- CLES DE REPARTITION
-- Pour les marchés multi-bailleurs
-- ============================================

-- OP-01 (BAD 70%, TRESOR 30%)
INSERT INTO cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'[{"bailleur": "BAD", "pourcentage": 70, "montant": 371700000}, {"bailleur": "TRESOR", "pourcentage": 30, "montant": 159300000}]',
531000000, 100.00, '2025-03-15');

-- OP-05 (UE 80%, TRESOR 20%)
INSERT INTO cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at) VALUES
('c5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555',
'[{"bailleur": "UE", "pourcentage": 80, "montant": 1416000000}, {"bailleur": "TRESOR", "pourcentage": 20, "montant": 354000000}]',
1770000000, 100.00, '2025-05-20');

-- OP-11 (BID 75%, TRESOR 25%)
INSERT INTO cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at) VALUES
('cbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'[{"bailleur": "BID", "pourcentage": 75, "montant": 354000000}, {"bailleur": "TRESOR", "pourcentage": 25, "montant": 118000000}]',
472000000, 100.00, '2025-04-28');

-- OP-14 (AFD 60%, TRESOR 40%)
INSERT INTO cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at) VALUES
('ceeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'[{"bailleur": "AFD", "pourcentage": 60, "montant": 21240000}, {"bailleur": "TRESOR", "pourcentage": 40, "montant": 14160000}]',
35400000, 100.00, '2025-01-25');

-- ============================================
-- VISAS CF
-- ============================================

-- OP-01 (CLOS)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111',
'FAVORABLE', '2025-03-18', '2025-03-18');

-- OP-02 (EN_EXEC)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222',
'FAVORABLE', '2025-04-15', '2025-04-15');

-- OP-03 (VISE)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333',
'FAVORABLE', '2025-04-28', '2025-04-28');

-- OP-08 (EN_EXEC)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888',
'FAVORABLE', '2025-07-12', '2025-07-12');

-- OP-09 (CLOS)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('f9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999',
'FAVORABLE', '2025-04-10', '2025-04-10');

-- OP-11 (EN_EXEC)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('fbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'abbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'FAVORABLE', '2025-04-28', '2025-04-28');

-- OP-12 (VISE)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('fcccccc1-cccc-cccc-cccc-cccccccccccc', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'acccccc1-cccc-cccc-cccc-cccccccccccc',
'FAVORABLE', '2025-06-01', '2025-06-01');

-- OP-14 (CLOS)
INSERT INTO visa_cf (id, operation_id, attribution_id, decision, date_decision, created_at) VALUES
('feeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'FAVORABLE', '2025-01-25', '2025-01-25');

-- ============================================
-- ORDRES DE SERVICE
-- ============================================

-- OP-01 (CLOS)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, doc_ref, bureau_controle, bureau_etudes, created_at) VALUES
('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'OS/T 001/2025/001', '2025-03-25', 'Ordre de service de démarrage des travaux',
'OS_DOC_001.pdf',
'{"type": "ENTREPRISE", "nom": "BNETD", "uaId": null, "entrepriseId": null}',
'{"type": "ENTREPRISE", "nom": "BNETD", "uaId": null, "entrepriseId": null}',
'2025-03-25');

-- OP-02 (EN_EXEC)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, doc_ref, bureau_controle, bureau_etudes, created_at) VALUES
('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'OS/T 002/2025/001', '2025-04-20', 'Démarrage des travaux de réhabilitation',
'OS_DOC_002.pdf',
'{"type": "UA", "nom": "Direction Régionale Santé", "uaId": null, "entrepriseId": null}',
NULL,
'2025-04-20');

-- OP-08 (EN_EXEC) - GRE
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, doc_ref, bureau_controle, bureau_etudes, created_at) VALUES
('d8888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888',
'OS/S 008/2025/001', '2025-07-15', 'Intervention urgente climatisation',
'OS_DOC_008.pdf', NULL, NULL, '2025-07-15');

-- OP-09 (CLOS)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, doc_ref, bureau_controle, bureau_etudes, created_at) VALUES
('d9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'OS/F 009/2025/001', '2025-04-15', 'Livraison et installation mobilier',
'OS_DOC_009.pdf', NULL, NULL, '2025-04-15');

-- OP-11 (EN_EXEC)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, doc_ref, bureau_controle, bureau_etudes, created_at) VALUES
('dbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'OS/T 011/2025/001', '2025-05-05', 'Démarrage travaux forages - Phase 1',
'OS_DOC_011.pdf',
'{"type": "ENTREPRISE", "nom": "ONEP", "uaId": null, "entrepriseId": null}',
'{"type": "ENTREPRISE", "nom": "SOGEHEL", "uaId": null, "entrepriseId": null}',
'2025-05-05');

-- OP-14 (CLOS)
INSERT INTO ordre_service (id, operation_id, numero, date_emission, objet, doc_ref, bureau_controle, bureau_etudes, created_at) VALUES
('deeeeee1-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'OS/P 014/2025/001', '2025-01-28', 'Démarrage étude environnementale',
'OS_DOC_014.pdf', NULL, NULL, '2025-01-28');

-- ============================================
-- AVENANTS
-- ============================================

-- OP-01 (CLOS) - Avenant de délai
INSERT INTO avenant (id, operation_id, numero, type, variation_montant, variation_duree, motif_ref, date_signature, document_ref, created_at) VALUES
('a0111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
1, 'DELAI', 0, 2, 'INTEMPERIES', '2025-07-15', 'AV_DOC_001.pdf', '2025-07-15');

-- OP-02 (EN_EXEC) - Avenant financier
INSERT INTO avenant (id, operation_id, numero, type, variation_montant, variation_duree, motif_ref, date_signature, document_ref, created_at) VALUES
('a0222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
1, 'FINAN', 8850000, 0, 'TRAVAUX_SUPP', '2025-06-20', 'AV_DOC_002.pdf', '2025-06-20');

-- OP-11 (EN_EXEC) - Avenant mixte
INSERT INTO avenant (id, operation_id, numero, type, variation_montant, variation_duree, motif_ref, date_signature, document_ref, created_at) VALUES
('a0bbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
1, 'MIXTE', 23600000, 3, 'CONTRAINTES_TERRAIN', '2025-08-10', 'AV_DOC_011.pdf', '2025-08-10');

-- ============================================
-- GARANTIES - Une par opération en exécution/clos
-- Cohérent avec le statut de l'opération
-- ============================================

-- OP-01 (CLOS) - Garantie LIBEREE
INSERT INTO garantie (id, operation_id, type, montant, date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc, created_at) VALUES
('01111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'BONNE_EXEC', 26550000, '2025-03-20', '2026-03-20', 'LIBEREE',
'GAR/2025/001 - SGBCI', '2025-11-15', 'ML/2025/001', '2025-03-20');

-- OP-02 (EN_EXEC) - Garantie ACTIVE
INSERT INTO garantie (id, operation_id, type, montant, date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc, created_at) VALUES
('02222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
'BONNE_EXEC', 4425000, '2025-04-25', '2026-04-25', 'ACTIVE',
'GAR/2025/002 - NSIA Banque', NULL, NULL, '2025-04-25');

-- OP-09 (CLOS) - Garantie LIBEREE
INSERT INTO garantie (id, operation_id, type, montant, date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc, created_at) VALUES
('09999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'BONNE_EXEC', 1180000, '2025-04-10', '2025-10-10', 'LIBEREE',
'GAR/2025/009 - BICICI', '2025-06-20', 'ML/2025/009', '2025-04-10');

-- OP-11 (EN_EXEC) - Garantie ACTIVE
INSERT INTO garantie (id, operation_id, type, montant, date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc, created_at) VALUES
('0bbbbb01-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
'BONNE_EXEC', 23600000, '2025-05-01', '2027-05-01', 'ACTIVE',
'GAR/2025/011 - Ecobank CI', NULL, NULL, '2025-05-01');

-- OP-14 (CLOS) - Pas de garantie requise (PI < 50M)

-- ============================================
-- CLOTURES
-- ============================================

-- OP-01
INSERT INTO cloture (id, operation_id, reception_prov, reception_def, decomptes, montant_total_paye, montant_marche_total, ecart_montant, mainlevees, synthese_finale, clos_at, created_at) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
'{"date": "2025-09-15", "pv_ref": "PV/RP/T 001/2025", "reservees": [], "participants": ["DGB", "BNETD", "SOGEA-SATOM"]}',
'{"date": "2025-11-20", "pv_ref": "PV/RD/T 001/2025", "reservees": [], "participants": ["DGB", "BNETD", "SOGEA-SATOM"]}',
'[{"numero": 1, "montant": 106200000, "date": "2025-04-15"}, {"numero": 2, "montant": 132750000, "date": "2025-06-30"}, {"numero": 3, "montant": 159300000, "date": "2025-09-30"}, {"numero": "Final", "montant": 132750000, "date": "2025-11-28"}]',
531000000, 531000000, 0,
'[{"type": "BONNE_EXEC", "date": "2025-11-15", "ref": "ML/2025/001"}]',
'Travaux conformes. Réception définitive prononcée sans réserve. Garanties libérées.',
'2025-11-20', '2025-11-20');

-- OP-09
INSERT INTO cloture (id, operation_id, reception_prov, reception_def, decomptes, montant_total_paye, montant_marche_total, ecart_montant, mainlevees, synthese_finale, clos_at, created_at) VALUES
('c9999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999',
'{"date": "2025-05-20", "pv_ref": "PV/RP/F 009/2025", "reservees": [], "participants": ["DCP", "MOBILIER OFFICE"]}',
'{"date": "2025-06-15", "pv_ref": "PV/RD/F 009/2025", "reservees": [], "participants": ["DCP", "MOBILIER OFFICE"]}',
'[{"numero": 1, "montant": 23600000, "date": "2025-05-28"}]',
23600000, 23600000, 0,
'[{"type": "BONNE_EXEC", "date": "2025-06-20", "ref": "ML/2025/009"}]',
'Mobilier livré conforme. Réception définitive le 15/06/2025.',
'2025-06-15', '2025-06-15');

-- OP-14
INSERT INTO cloture (id, operation_id, reception_prov, reception_def, decomptes, montant_total_paye, montant_marche_total, ecart_montant, mainlevees, synthese_finale, clos_at, created_at) VALUES
('ceeeeee0-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
'{"date": "2025-03-01", "pv_ref": "PV/RP/P 014/2025", "reservees": [], "participants": ["ANDE", "MEER"]}',
'{"date": "2025-03-20", "pv_ref": "PV/RD/P 014/2025", "reservees": [], "participants": ["ANDE", "MEER"]}',
'[{"numero": 1, "montant": 17700000, "date": "2025-02-20"}, {"numero": 2, "montant": 17700000, "date": "2025-03-25"}]',
35400000, 35400000, 0, '[]',
'Étude environnementale validée. Rapport final approuvé par la DGMP.',
'2025-03-20', '2025-03-20');

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
