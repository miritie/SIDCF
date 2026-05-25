-- ============================================
-- Migration 023 : Opérations TEST-* additionnelles pour couvrir plus de combinaisons
-- ============================================
-- Couverture étendue pour la démonstration métier :
--   - Différents TYPES (SERVICES_COURANTS, TRAVAUX, FOURNITURES, SERVICES_INTELLECTUELS)
--   - Différentes TRANCHES de seuils (PSD/PSC/PSL/PSO/AOO)
--   - Différentes FORMES d'attributaire (SIMPLE, GROUPEMENT SOLIDAIRE, CONJOINT)
--   - Cas particuliers (dérogation déclarée à la planification, mono-bailleur, etc.)
--
-- UUIDs : 00000000-0000-0000-0000-19000000010N (10x série additionnelle)
--   Mais avec les entités test (procedure, etc.) en 00000000-0000-NNNN-XXXX-1900000001YY
-- ============================================

BEGIN;

-- Nettoyage
DELETE FROM mp_ano             WHERE id::text LIKE '00000000-0000-0012-%-1900000001%';
DELETE FROM mp_garantie        WHERE id::text LIKE '00000000-0000-0011-%-1900000001%';
DELETE FROM mp_decompte        WHERE id::text LIKE '00000000-0000-0010-%-1900000001%';
DELETE FROM mp_cle_repartition WHERE id::text LIKE '00000000-0000-0009-%-1900000001%';
DELETE FROM mp_echeancier      WHERE id::text LIKE '00000000-0000-0008-%-1900000001%';
DELETE FROM mp_resiliation     WHERE id::text LIKE '00000000-0000-0007-%-1900000001%';
DELETE FROM mp_cloture         WHERE id::text LIKE '00000000-0000-0006-%-1900000001%';
DELETE FROM mp_ordre_service   WHERE id::text LIKE '00000000-0000-0004-%-1900000001%';
DELETE FROM mp_visa_cf         WHERE id::text LIKE '00000000-0000-0003-%-1900000001%';
DELETE FROM mp_attribution     WHERE id::text LIKE '00000000-0000-0002-%-1900000001%';
DELETE FROM mp_procedure       WHERE id::text LIKE '00000000-0000-0001-%-1900000001%';
DELETE FROM mp_entreprise      WHERE id::text LIKE '00000000-0000-0099-%-1900000001%';
DELETE FROM mp_operation       WHERE id::text LIKE '00000000-0000-0000-0000-1900000001%';

-- ============================================================
-- 1) 4 OPÉRATIONS SUPPLÉMENTAIRES
-- ============================================================
INSERT INTO mp_operation (
  id, plan_id, budget_line_id, exercice, unite, objet,
  type_marche, mode_passation, revue, nature_prix,
  montant_previsionnel, montant_actuel, devise,
  type_financement, source_financement,
  chaine_budgetaire, delai_execution, duree_previsionnelle,
  categorie_prestation, beneficiaire, livrables, localisation,
  timeline, etat, proc_derogation, created_at, updated_at
) VALUES

-- TEST-PSD-SVC (101) : SERVICES_COURANTS, 4M XOF, mode PSD, ATTRIBUE
('00000000-0000-0000-0000-190000000101'::uuid, NULL, NULL, 2026,
 'Assemblée N 1 Personnel',
 'TEST-PSD-SVC — Petites prestations IT (PSD attribué)',
 'SERVICES_COURANTS', 'PSD', 'AUCUNE', 'FORFAIT',
 4500000, 4500000, 'XOF', 'ETAT', 'TRESOR',
 jsonb_build_object(
   'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
   'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
   'activite', 'Prestations de services courants', 'activiteCode', 'ACT_13001_004',
   'nature', '221 - Fonctionnement courant', 'natureCode', '221',
   'ligneBudgetaire', 'ACT_13001_004221', 'bailleur', 'TRESOR',
   'bailleurs', jsonb_build_array('TRESOR'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 30, 30, 'SERVICE', 'Direction administrative',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                    'departement', 'Plateau', 'localite', 'Plateau'),
 '["PLANIF","EN_PROC","ATTRIBUE"]'::jsonb, 'ATTRIBUE', NULL,
 NOW() - INTERVAL '40 days', NOW() - INTERVAL '4 days'),

-- TEST-PSC-TRV (102) : TRAVAUX, 22M XOF, mode PSC, VISE (avec dérogation)
('00000000-0000-0000-0000-190000000102'::uuid, NULL, NULL, 2026,
 'Assemblée N 1 Investissements',
 'TEST-PSC-TRV — Aménagement parking (PSC visé, sans dérogation)',
 'TRAVAUX', 'PSC', 'A_PRIORI', 'UNITAIRE',
 22000000, 22000000, 'XOF', 'ETAT', 'TRESOR',
 jsonb_build_object(
   'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
   'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
   'activite', 'Réhabilitation des infrastructures administratives', 'activiteCode', 'ACT_13001_001',
   'nature', '231 - Constructions', 'natureCode', '231',
   'ligneBudgetaire', 'ACT_13001_001231', 'bailleur', 'TRESOR',
   'bailleurs', jsonb_build_array('TRESOR'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 90, 90, 'INFRASTRUCTURE', 'Direction administrative',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                    'departement', 'Cocody', 'localite', 'Riviera'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE"]'::jsonb, 'VISE', NULL,
 NOW() - INTERVAL '70 days', NOW() - INTERVAL '5 days'),

-- TEST-AOO-MULTI (103) : Travaux, 2.5G XOF, AOO multi-bailleurs, EN_EXEC (groupement SOLIDAIRE)
('00000000-0000-0000-0000-190000000103'::uuid, NULL, NULL, 2026,
 'Assemblée N 3 Investissements',
 'TEST-AOO-MULTI — Construction siège régional (AOO, groupement solidaire, multi-bailleurs)',
 'TRAVAUX', 'AOO', 'A_PRIORI', 'UNITAIRE',
 2500000000, 2500000000, 'XOF', 'EMPRUNT', 'BAD',
 jsonb_build_object(
   'section', 'Sénat', 'sectionCode', '13030016',
   'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
   'activite', 'Construction de bâtiments administratifs', 'activiteCode', 'ACT_13030_001',
   'nature', '231 - Constructions', 'natureCode', '231',
   'ligneBudgetaire', 'ACT_13030_001231', 'bailleur', 'BAD',
   'bailleurs', jsonb_build_array('BAD', 'BOAD', 'TRESOR'),
   'financements', jsonb_build_array(
     jsonb_build_object('montant', 0, 'typeFinancement', 'EMPRUNT', 'bailleur', 'BAD'),
     jsonb_build_object('montant', 0, 'typeFinancement', 'EMPRUNT', 'bailleur', 'BOAD'),
     jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 540, 540, 'INFRASTRUCTURE', 'Sénat — services généraux',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                    'departement', 'Plateau', 'localite', 'Plateau'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC"]'::jsonb, 'EN_EXEC', NULL,
 NOW() - INTERVAL '270 days', NOW() - INTERVAL '1 days'),

-- TEST-DEROG (104) : SERVICES_INTELLECTUELS, 8M XOF, AOO choisi alors que PSD recommandé → DÉROGATION
('00000000-0000-0000-0000-190000000104'::uuid, NULL, NULL, 2026,
 'Assemblée N 1 Personnel',
 'TEST-DEROG — Étude stratégique avec AOO en dérogation (PSD recommandé)',
 'SERVICES_INTELLECTUELS', 'AOO', 'A_PRIORI', 'FORFAIT',
 8000000, 8000000, 'XOF', 'ETAT', 'TRESOR',
 jsonb_build_object(
   'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
   'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
   'activite', 'Études et audits', 'activiteCode', 'ACT_13001_005',
   'nature', '222 - Achats de biens', 'natureCode', '222',
   'ligneBudgetaire', 'ACT_13001_005222', 'bailleur', 'TRESOR',
   'bailleurs', jsonb_build_array('TRESOR'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 60, 60, 'ETUDE', 'Direction administrative',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'regionCode', 'ABJ',
                    'departement', 'Plateau', 'localite', 'Plateau'),
 '["PLANIF"]'::jsonb, 'PLANIFIE',
 jsonb_build_object(
   'isDerogation', true,
   'docId', NULL,
   'comment', 'Dérogation déclarée à la planification : mode AOO retenu au lieu du mode recommandé PSD (tranche 0–10000000 XOF, matrice ADMIN_CENTRALE). À justifier à l''étape Procédure.',
   'validatedAt', NULL,
   'sourceEtape', 'PLANIF'),
 NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- ============================================================
-- 2) ENTREPRISES de référence pour les nouvelles attributions
-- ============================================================
INSERT INTO mp_entreprise
  (id, ncc, rccm, raison_sociale, sigle, adresse, telephone, email,
   banque, compte, actif, validation_status, validation_by, validation_date,
   created_at, updated_at)
VALUES
-- Pour 101 PSD-SVC
('00000000-0000-0099-0101-190000000101'::uuid,
 'CI-ITP-2021-1100', 'CI-ABJ-2021-B-11001', 'IT Pros CI SARL', 'ITP',
 'Cocody Angré 8e Tranche, Abidjan', '+225 27 23 47 58 69', 'contact@itpros-ci.test',
 jsonb_build_object('code', 'BACI', 'nom', 'Banque Atlantique CI', 'agence', 'Angré'),
 jsonb_build_object('rib', 'CI93 BACI 01010 0000110010001 12'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '45 days',
 NOW() - INTERVAL '90 days', NOW() - INTERVAL '45 days'),
-- Pour 102 PSC-TRV
('00000000-0000-0099-0102-190000000102'::uuid,
 'CI-AGE-2018-1200', 'CI-ABJ-2018-B-12002', 'Aménageurs Express CI', 'AECI',
 'Treichville Avenue 22, Abidjan', '+225 27 21 25 36 47', 'admin@amenageurs-ci.test',
 jsonb_build_object('code', 'SGCI', 'nom', 'Société Générale CI', 'agence', 'Treichville'),
 jsonb_build_object('rib', 'CI93 SGCI 01011 0000120020002 34'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '180 days',
 NOW() - INTERVAL '400 days', NOW() - INTERVAL '180 days'),
-- Pour 103 AOO-MULTI (mandataire)
('00000000-0000-0099-0103-190000000103'::uuid,
 'CI-MEGCSA-2010-1300', 'CI-ABJ-2010-B-13003', 'MegaConstruct Africa SA', 'MCA',
 'Plateau Tour D, Abidjan', '+225 27 20 30 40 60', 'siege@megaconstruct.test',
 jsonb_build_object('code', 'NSIA', 'nom', 'NSIA Banque CI', 'agence', 'Plateau'),
 jsonb_build_object('rib', 'CI93 NSIA 01012 0000130030003 56'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '500 days',
 NOW() - INTERVAL '2000 days', NOW() - INTERVAL '500 days'),
-- Pour 103 (cotitulaire 1)
('00000000-0000-0099-1103-190000000103'::uuid,
 'CI-BTPSO-2014-1400', 'CI-ABJ-2014-B-14004', 'BTP Solutions Ouest', 'BTPSO',
 'Yopougon Selmer, Abidjan', '+225 27 23 50 61 72', 'contact@btpsolutions-ouest.test',
 jsonb_build_object('code', 'ECOBANK', 'nom', 'Ecobank CI', 'agence', 'Yopougon'),
 jsonb_build_object('rib', 'CI93 ECOB 01013 0000140040004 78'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '300 days',
 NOW() - INTERVAL '1200 days', NOW() - INTERVAL '300 days'),
-- Pour 103 (cotitulaire 2)
('00000000-0000-0099-2103-190000000103'::uuid,
 'CI-IGT-2012-1500', 'CI-ABJ-2012-B-15005', 'Ingénierie Générale & Travaux', 'IGT',
 'Marcory Zone 4C, Abidjan', '+225 27 21 36 47 58', 'admin@igt-ci.test',
 jsonb_build_object('code', 'BICICI', 'nom', 'BICICI', 'agence', 'Marcory'),
 jsonb_build_object('rib', 'CI93 BICI 01014 0000150050005 90'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '400 days',
 NOW() - INTERVAL '1800 days', NOW() - INTERVAL '400 days');

-- ============================================================
-- 3) PROCEDURES pour 101 (ATTRIBUE), 102 (VISE), 103 (EN_EXEC)
-- ============================================================
INSERT INTO mp_procedure
  (id, operation_id, commission, mode_passation, categorie,
   type_dossier_appel, dossier_appel_doc, dates,
   nb_offres_recues, nb_offres_classees, pv, rapport_analyse_doc,
   decision_attribution_ref, created_at, updated_at)
VALUES
('00000000-0000-0001-0101-190000000101'::uuid,
 '00000000-0000-0000-0000-190000000101'::uuid,
 'COJO', 'PSD', 'NATIONALE', 'DC', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '40 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '15 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '4 days')::date),
 3, 3, jsonb_build_object('numero', 'PV-2026-101', 'date', (NOW() - INTERVAL '4 days')::date),
 'DOC_RAPPORT_101.pdf', 'DOC_DECISION_101.pdf',
 NOW() - INTERVAL '40 days', NOW() - INTERVAL '4 days'),

('00000000-0000-0001-0102-190000000102'::uuid,
 '00000000-0000-0000-0000-190000000102'::uuid,
 'COJO', 'PSC', 'NATIONALE', 'DC', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '70 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '40 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '20 days')::date),
 3, 3, jsonb_build_object('numero', 'PV-2026-102', 'date', (NOW() - INTERVAL '20 days')::date),
 'DOC_RAPPORT_102.pdf', 'DOC_DECISION_102.pdf',
 NOW() - INTERVAL '70 days', NOW() - INTERVAL '5 days'),

('00000000-0000-0001-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'COJO', 'AOO', 'INTERNATIONALE', 'DAO', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '270 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '225 days')::date,
                    'dateOuverturePlis', (NOW() - INTERVAL '225 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '180 days')::date),
 9, 6, jsonb_build_object('numero', 'PV-2026-103', 'date', (NOW() - INTERVAL '180 days')::date),
 'DOC_RAPPORT_103.pdf', 'DOC_DECISION_103.pdf',
 NOW() - INTERVAL '270 days', NOW() - INTERVAL '1 days');

-- ============================================================
-- 4) ATTRIBUTIONS pour 101, 102, 103
-- ============================================================
INSERT INTO mp_attribution
  (id, operation_id, attributaire, montants, garanties, dates, decision_cf,
   created_at, updated_at)
VALUES
-- 101 PSD-SVC : entreprise SIMPLE
('00000000-0000-0002-0101-190000000101'::uuid,
 '00000000-0000-0000-0000-190000000101'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'role', 'TITULAIRE',
     'entrepriseId', '00000000-0000-0099-0101-190000000101',
     'raisonSociale', 'IT Pros CI SARL', 'ncc', 'CI-ITP-2021-1100',
     'adresse', 'Cocody Angré 8e Tranche, Abidjan',
     'telephone', '+225 27 23 47 58 69', 'email', 'contact@itpros-ci.test'))),
 jsonb_build_object('ht', 3813559, 'ttc', 4500000, 'attribue', 4500000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '4 days')::date,
                    'signatureAC', (NOW() - INTERVAL '2 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),

-- 102 PSC-TRV : entreprise SIMPLE
('00000000-0000-0002-0102-190000000102'::uuid,
 '00000000-0000-0000-0000-190000000102'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'role', 'TITULAIRE',
     'entrepriseId', '00000000-0000-0099-0102-190000000102',
     'raisonSociale', 'Aménageurs Express CI', 'ncc', 'CI-AGE-2018-1200',
     'adresse', 'Treichville Avenue 22, Abidjan',
     'telephone', '+225 27 21 25 36 47', 'email', 'admin@amenageurs-ci.test'))),
 jsonb_build_object('ht', 18644068, 'ttc', 22000000, 'attribue', 22000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '20 days')::date,
                    'signatureAC', (NOW() - INTERVAL '15 days')::date,
                    'approbation', (NOW() - INTERVAL '5 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),

-- 103 AOO-MULTI : GROUPEMENT SOLIDAIRE (3 entreprises)
('00000000-0000-0002-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 jsonb_build_object('singleOrGroup', 'GROUPEMENT', 'groupType', 'SOLIDAIRE',
   'entreprises', jsonb_build_array(
     jsonb_build_object('role', 'MANDATAIRE',
       'entrepriseId', '00000000-0000-0099-0103-190000000103',
       'raisonSociale', 'MegaConstruct Africa SA', 'ncc', 'CI-MEGCSA-2010-1300',
       'adresse', 'Plateau Tour D, Abidjan'),
     jsonb_build_object('role', 'COTITULAIRE',
       'entrepriseId', '00000000-0000-0099-1103-190000000103',
       'raisonSociale', 'BTP Solutions Ouest', 'ncc', 'CI-BTPSO-2014-1400',
       'adresse', 'Yopougon Selmer, Abidjan'),
     jsonb_build_object('role', 'COTITULAIRE',
       'entrepriseId', '00000000-0000-0099-2103-190000000103',
       'raisonSociale', 'Ingénierie Générale & Travaux', 'ncc', 'CI-IGT-2012-1500',
       'adresse', 'Marcory Zone 4C, Abidjan'))),
 jsonb_build_object('ht', 2118644068, 'ttc', 2500000000, 'attribue', 2500000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '180 days')::date,
                    'signatureAC', (NOW() - INTERVAL '160 days')::date,
                    'approbation', (NOW() - INTERVAL '140 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 days');

-- ============================================================
-- 5) VISA CF pour 102 et 103
-- ============================================================
INSERT INTO mp_visa_cf
  (id, operation_id, attribution_id, decision, date_decision,
   contrat_doc, organe_approbateur, date_approbation, document_approbation,
   created_at, updated_at)
VALUES
('00000000-0000-0003-0102-190000000102'::uuid,
 '00000000-0000-0000-0000-190000000102'::uuid,
 '00000000-0000-0002-0102-190000000102'::uuid,
 'FAVORABLE', NOW() - INTERVAL '5 days', 'DOC_CONTRAT_102.pdf',
 'CF', (NOW() - INTERVAL '5 days')::date, 'DOC_APPROBATION_102.pdf',
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('00000000-0000-0003-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 '00000000-0000-0002-0103-190000000103'::uuid,
 'FAVORABLE', NOW() - INTERVAL '140 days', 'DOC_CONTRAT_103.pdf',
 'PRESIDENT_REPUBLIQUE', (NOW() - INTERVAL '140 days')::date, 'DOC_APPROBATION_103.pdf',
 NOW() - INTERVAL '140 days', NOW() - INTERVAL '140 days');

-- ============================================================
-- 6) ORDRE DE SERVICE pour 103
-- ============================================================
INSERT INTO mp_ordre_service
  (id, operation_id, numero, date_emission, objet, doc_ref,
   bureau_controle, bureau_etudes, created_at, updated_at)
VALUES
('00000000-0000-0004-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'OS-2026-103-01', NOW() - INTERVAL '130 days',
 'Ordre de démarrage des travaux de construction du siège régional',
 'DOC_OS_103.pdf', '{}'::jsonb, '{}'::jsonb,
 NOW() - INTERVAL '130 days', NOW() - INTERVAL '130 days');

COMMIT;

-- ============================================
-- Vérification globale
-- ============================================
SELECT
  SUBSTRING(op.id::text FROM 30) AS id_suffix,
  op.etat,
  op.type_marche,
  op.mode_passation,
  (op.montant_previsionnel/1000000)::int AS m_xof,
  SUBSTRING(op.objet, 1, 38) AS objet
FROM mp_operation op
WHERE op.id::text LIKE '00000000-0000-0000-0000-1900%'
ORDER BY op.id;
