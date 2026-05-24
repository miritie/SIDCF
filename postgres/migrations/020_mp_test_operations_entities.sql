-- ============================================
-- Migration 020 : Cohérence des entités pour les opérations de test Marché+
-- ============================================
-- Pour chaque opération TEST-* créée par la migration 019, on enrichit la
-- base avec les entités attendues à son état :
--
--   TEST-PLANIF   (001) → opération seule (rien à ajouter)
--   TEST-EN_PROC  (002) → procedure (DAO + dates)
--   TEST-ATTRIBUE (003) → procedure (complète) + attribution
--   TEST-VISE     (004) → procedure + attribution + visa_cf (favorable)
--   TEST-EN_EXEC  (005) → procedure + attribution + visa_cf + ordre_service
--   TEST-CLOS     (006) → procedure + attribution + visa_cf + ordre_service
--                          + garantie (mainlevée) + cloture (provisoire + def)
--   TEST-RESILIE  (007) → procedure + attribution + visa_cf + ordre_service
--                          + resiliation
--
-- Convention UUID : 00000000-0000-AABB-CCDD-19000000000X
--   où AABB = type entité (0001=procedure, 0002=attribution, 0003=visa_cf,
--   0004=ordre_service, 0005=garantie, 0006=cloture, 0007=resiliation)
--   et X = numéro de l'opération de test.
--
-- IDEMPOTENT : DELETE avant INSERT par UUID.
-- Réversible : DELETE FROM mp_* WHERE id::text LIKE '00000000-0000-00%-%-19%'
-- ============================================

BEGIN;

-- ============================================================
-- 1) Nettoyage des entités test (par UUID préfixé)
-- ============================================================
DELETE FROM mp_resiliation  WHERE id::text LIKE '00000000-0000-0007-%-19%';
DELETE FROM mp_cloture      WHERE id::text LIKE '00000000-0000-0006-%-19%';
DELETE FROM mp_garantie     WHERE id::text LIKE '00000000-0000-0005-%-19%';
DELETE FROM mp_ordre_service WHERE id::text LIKE '00000000-0000-0004-%-19%';
DELETE FROM mp_visa_cf      WHERE id::text LIKE '00000000-0000-0003-%-19%';
DELETE FROM mp_attribution  WHERE id::text LIKE '00000000-0000-0002-%-19%';
DELETE FROM mp_procedure    WHERE id::text LIKE '00000000-0000-0001-%-19%';

-- ============================================================
-- 2) PROCEDURES (pour les opérations à partir de EN_PROC)
-- ============================================================
INSERT INTO mp_procedure
  (id, operation_id, commission, mode_passation, categorie,
   type_dossier_appel, dossier_appel_doc, dates,
   nb_offres_recues, nb_offres_classees, pv, rapport_analyse_doc,
   decision_attribution_ref, created_at, updated_at)
VALUES
-- 002 EN_PROC : procédure démarrée, DAO en cours, pas encore d'offres
('00000000-0000-0001-0002-190000000002'::uuid,
 '00000000-0000-0000-0000-190000000002'::uuid,
 'COJO', 'PSC', 'NATIONALE',
 'DC', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '18 days')::date,
                    'dateRemiseOffres', (NOW() + INTERVAL '7 days')::date),
 0, 0, '{}'::jsonb, NULL, NULL,
 NOW() - INTERVAL '18 days', NOW() - INTERVAL '5 days'),

-- 003 ATTRIBUE : procédure complète avec PV d'attribution
('00000000-0000-0001-0003-190000000003'::uuid,
 '00000000-0000-0000-0000-190000000003'::uuid,
 'COJO', 'PSL', 'NATIONALE',
 'DAO', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '42 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '20 days')::date,
                    'dateOuverturePlis', (NOW() - INTERVAL '20 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '5 days')::date),
 4, 3, jsonb_build_object('numero', 'PV-2026-003', 'date', (NOW() - INTERVAL '5 days')::date),
 'DOC_RAPPORT_003.pdf', 'DOC_DECISION_003.pdf',
 NOW() - INTERVAL '42 days', NOW() - INTERVAL '5 days'),

-- 004 VISE : procédure complète, attribution actée
('00000000-0000-0001-0004-190000000004'::uuid,
 '00000000-0000-0000-0000-190000000004'::uuid,
 'COJO', 'PSO', 'NATIONALE',
 'DAO', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '85 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '60 days')::date,
                    'dateOuverturePlis', (NOW() - INTERVAL '60 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '15 days')::date),
 5, 4, jsonb_build_object('numero', 'PV-2026-004', 'date', (NOW() - INTERVAL '15 days')::date),
 'DOC_RAPPORT_004.pdf', 'DOC_DECISION_004.pdf',
 NOW() - INTERVAL '85 days', NOW() - INTERVAL '2 days'),

-- 005 EN_EXEC : procédure complète
('00000000-0000-0001-0005-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'COJO', 'AOO', 'NATIONALE',
 'DAO', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '175 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '140 days')::date,
                    'dateOuverturePlis', (NOW() - INTERVAL '140 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '110 days')::date),
 7, 5, jsonb_build_object('numero', 'PV-2026-005', 'date', (NOW() - INTERVAL '110 days')::date),
 'DOC_RAPPORT_005.pdf', 'DOC_DECISION_005.pdf',
 NOW() - INTERVAL '175 days', NOW() - INTERVAL '1 days'),

-- 006 CLOS : procédure complète
('00000000-0000-0001-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'COJO', 'AOO', 'NATIONALE',
 'DAO', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '415 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '380 days')::date,
                    'dateOuverturePlis', (NOW() - INTERVAL '380 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '350 days')::date),
 6, 4, jsonb_build_object('numero', 'PV-2025-006', 'date', (NOW() - INTERVAL '350 days')::date),
 'DOC_RAPPORT_006.pdf', 'DOC_DECISION_006.pdf',
 NOW() - INTERVAL '415 days', NOW() - INTERVAL '15 days'),

-- 007 RESILIE : procédure complète
('00000000-0000-0001-0007-190000000007'::uuid,
 '00000000-0000-0000-0000-190000000007'::uuid,
 'COJO', 'PSO', 'NATIONALE',
 'DAO', NULL,
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '115 days')::date,
                    'dateRemiseOffres', (NOW() - INTERVAL '85 days')::date,
                    'dateOuverturePlis', (NOW() - INTERVAL '85 days')::date,
                    'dateAttribution', (NOW() - INTERVAL '55 days')::date),
 3, 2, jsonb_build_object('numero', 'PV-2026-007', 'date', (NOW() - INTERVAL '55 days')::date),
 'DOC_RAPPORT_007.pdf', 'DOC_DECISION_007.pdf',
 NOW() - INTERVAL '115 days', NOW() - INTERVAL '10 days');

-- ============================================================
-- 3) ATTRIBUTIONS (à partir de ATTRIBUE)
-- ============================================================
INSERT INTO mp_attribution
  (id, operation_id, attributaire, montants, garanties, dates, decision_cf,
   created_at, updated_at)
VALUES
-- 003 ATTRIBUE
('00000000-0000-0002-0003-190000000003'::uuid,
 '00000000-0000-0000-0000-190000000003'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'raisonSociale', 'AudioVision CI SARL',
     'ncc', 'CI-AVS-2018-0123',
     'adresse', 'Plateau, Abidjan',
     'telephone', '+225 27 20 30 40 50',
     'email', 'contact@audiovision-ci.test'
   ))),
 jsonb_build_object('ht', 29661017, 'ttc', 35000000, 'attribue', 35000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '5 days')::date,
                    'signatureAC', (NOW() - INTERVAL '3 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

-- 004 VISE
('00000000-0000-0002-0004-190000000004'::uuid,
 '00000000-0000-0000-0000-190000000004'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'raisonSociale', 'AutoMobile Service CI',
     'ncc', 'CI-AMS-2019-0456',
     'adresse', 'Cocody, Abidjan',
     'telephone', '+225 27 22 33 44 55',
     'email', 'commercial@ams-ci.test'
   ))),
 jsonb_build_object('ht', 63559322, 'ttc', 75000000, 'attribue', 75000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '15 days')::date,
                    'signatureAC', (NOW() - INTERVAL '12 days')::date,
                    'approbation', (NOW() - INTERVAL '2 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),

-- 005 EN_EXEC
('00000000-0000-0002-0005-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 jsonb_build_object('singleOrGroup', 'GROUPEMENT', 'groupType', 'CONJOINT',
   'entreprises', jsonb_build_array(
     jsonb_build_object('role', 'MANDATAIRE', 'raisonSociale', 'BTP Constructions SA',
                        'ncc', 'CI-BTP-2015-0789', 'adresse', 'Marcory, Abidjan',
                        'telephone', '+225 27 21 35 45 55', 'email', 'siege@btp-constructions.test'),
     jsonb_build_object('role', 'COTITULAIRE', 'raisonSociale', 'Ivoire Béton Industrie',
                        'ncc', 'CI-IBI-2017-0234', 'adresse', 'Yopougon, Abidjan'))),
 jsonb_build_object('ht', 720338983, 'ttc', 850000000, 'attribue', 850000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '110 days')::date,
                    'signatureAC', (NOW() - INTERVAL '95 days')::date,
                    'approbation', (NOW() - INTERVAL '80 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '110 days', NOW() - INTERVAL '1 days'),

-- 006 CLOS
('00000000-0000-0002-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'raisonSociale', 'Réhab Pro Côte d''Ivoire',
     'ncc', 'CI-RPCI-2014-0567',
     'adresse', 'Treichville, Abidjan',
     'telephone', '+225 27 21 24 35 46',
     'email', 'contact@rehabpro-ci.test'
   ))),
 jsonb_build_object('ht', 1016949153, 'ttc', 1200000000, 'attribue', 1200000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '350 days')::date,
                    'signatureAC', (NOW() - INTERVAL '335 days')::date,
                    'approbation', (NOW() - INTERVAL '320 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '350 days', NOW() - INTERVAL '15 days'),

-- 007 RESILIE
('00000000-0000-0002-0007-190000000007'::uuid,
 '00000000-0000-0000-0000-190000000007'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'raisonSociale', 'NetClean Services',
     'ncc', 'CI-NCS-2020-0890',
     'adresse', 'Adjamé, Abidjan',
     'telephone', '+225 07 08 09 10 11',
     'email', 'admin@netclean-services.test'
   ))),
 jsonb_build_object('ht', 50847458, 'ttc', 60000000, 'attribue', 60000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '55 days')::date,
                    'signatureAC', (NOW() - INTERVAL '50 days')::date,
                    'approbation', (NOW() - INTERVAL '45 days')::date),
 '{}'::jsonb,
 NOW() - INTERVAL '55 days', NOW() - INTERVAL '10 days');

-- ============================================================
-- 4) VISA_CF / APPROBATIONS (à partir de VISE)
-- ============================================================
INSERT INTO mp_visa_cf
  (id, operation_id, attribution_id, decision, date_decision,
   contrat_doc, organe_approbateur, date_approbation, document_approbation,
   created_at, updated_at)
VALUES
-- 004 VISE
('00000000-0000-0003-0004-190000000004'::uuid,
 '00000000-0000-0000-0000-190000000004'::uuid,
 '00000000-0000-0002-0004-190000000004'::uuid,
 'FAVORABLE', NOW() - INTERVAL '2 days',
 'DOC_CONTRAT_004.pdf', 'CF',
 (NOW() - INTERVAL '2 days')::date,
 'DOC_APPROBATION_004.pdf',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- 005 EN_EXEC
('00000000-0000-0003-0005-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 '00000000-0000-0002-0005-190000000005'::uuid,
 'FAVORABLE', NOW() - INTERVAL '80 days',
 'DOC_CONTRAT_005.pdf', 'PRESIDENT_REPUBLIQUE',
 (NOW() - INTERVAL '80 days')::date,
 'DOC_APPROBATION_005.pdf',
 NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),

-- 006 CLOS
('00000000-0000-0003-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 '00000000-0000-0002-0006-190000000006'::uuid,
 'FAVORABLE', NOW() - INTERVAL '320 days',
 'DOC_CONTRAT_006.pdf', 'PRESIDENT_REPUBLIQUE',
 (NOW() - INTERVAL '320 days')::date,
 'DOC_APPROBATION_006.pdf',
 NOW() - INTERVAL '320 days', NOW() - INTERVAL '320 days'),

-- 007 RESILIE
('00000000-0000-0003-0007-190000000007'::uuid,
 '00000000-0000-0000-0000-190000000007'::uuid,
 '00000000-0000-0002-0007-190000000007'::uuid,
 'FAVORABLE', NOW() - INTERVAL '45 days',
 'DOC_CONTRAT_007.pdf', 'CF',
 (NOW() - INTERVAL '45 days')::date,
 'DOC_APPROBATION_007.pdf',
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days');

-- ============================================================
-- 5) ORDRES DE SERVICE (à partir de EN_EXEC)
-- ============================================================
INSERT INTO mp_ordre_service
  (id, operation_id, numero, date_emission, objet, doc_ref,
   bureau_controle, bureau_etudes, created_at, updated_at)
VALUES
-- 005 EN_EXEC
('00000000-0000-0004-0005-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'OS-2026-005-01', NOW() - INTERVAL '75 days',
 'Ordre de démarrage des travaux de construction',
 'DOC_OS_005.pdf', '{}'::jsonb, '{}'::jsonb,
 NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days'),

-- 006 CLOS
('00000000-0000-0004-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'OS-2025-006-01', NOW() - INTERVAL '315 days',
 'Ordre de démarrage de la réhabilitation',
 'DOC_OS_006.pdf', '{}'::jsonb, '{}'::jsonb,
 NOW() - INTERVAL '315 days', NOW() - INTERVAL '315 days'),

-- 007 RESILIE
('00000000-0000-0004-0007-190000000007'::uuid,
 '00000000-0000-0000-0000-190000000007'::uuid,
 'OS-2026-007-01', NOW() - INTERVAL '40 days',
 'Ordre de démarrage des prestations de nettoyage',
 'DOC_OS_007.pdf', '{}'::jsonb, '{}'::jsonb,
 NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days');

-- ============================================================
-- 6) GARANTIES (CLOS uniquement, mainlevée prononcée)
-- ============================================================
INSERT INTO mp_garantie
  (id, operation_id, type, montant, taux,
   date_emission, date_echeance, etat, doc,
   mainlevee_date, mainlevee_doc, created_at, updated_at)
VALUES
-- 006 CLOS — Bonne exécution levée
('00000000-0000-0005-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'BONNE_EXEC', 60000000, 5,
 NOW() - INTERVAL '320 days', NOW() - INTERVAL '20 days',
 'LEVEE', 'DOC_GAR_BE_006.pdf',
 NOW() - INTERVAL '20 days', 'DOC_MAINLEVEE_BE_006.pdf',
 NOW() - INTERVAL '320 days', NOW() - INTERVAL '20 days');

-- ============================================================
-- 7) CLÔTURES (CLOS uniquement)
-- ============================================================
INSERT INTO mp_cloture
  (id, operation_id, reception_prov, reception_def, decomptes,
   montant_total_paye, montant_marche_total, ecart_montant,
   mainlevees, synthese_finale, clos_at, created_at, updated_at)
VALUES
-- 006 CLOS
('00000000-0000-0006-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 jsonb_build_object('date', (NOW() - INTERVAL '45 days')::date,
                    'pv', 'DOC_PV_PROVISOIRE_006.pdf',
                    'reserves', 'Aucune réserve'),
 jsonb_build_object('date', (NOW() - INTERVAL '15 days')::date,
                    'pv', 'DOC_PV_DEFINITIF_006.pdf'),
 '[]'::jsonb,
 1180000000, 1200000000, 20000000,
 jsonb_build_array('00000000-0000-0005-0006-190000000006'),
 'Marché exécuté conformément aux spécifications du CCAP. Réception définitive prononcée sans réserve. Mainlevée de garantie de bonne exécution effectuée.',
 NOW() - INTERVAL '15 days',
 NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days');

-- ============================================================
-- 8) RESILIATION (RESILIE uniquement)
-- ============================================================
INSERT INTO mp_resiliation
  (id, operation_id, date_resiliation, motif_ref, motif_autre, document_ref,
   created_at, updated_at)
VALUES
-- 007 RESILIE
('00000000-0000-0007-0007-190000000007'::uuid,
 '00000000-0000-0000-0000-190000000007'::uuid,
 NOW() - INTERVAL '10 days', 'TORTS_TITULAIRE',
 'Non-respect réitéré des cahiers de charges (qualité prestations, retards systématiques). Mises en demeure restées sans effet.',
 'DOC_RESILIATION_007.pdf',
 NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

COMMIT;

-- ============================================
-- Vérification post-migration
-- ============================================
SELECT
  op.etat,
  SUBSTRING(op.objet, 1, 35) AS objet,
  CASE WHEN p.id IS NOT NULL  THEN '✓' ELSE '·' END AS procedure,
  CASE WHEN a.id IS NOT NULL  THEN '✓' ELSE '·' END AS attribution,
  CASE WHEN v.id IS NOT NULL  THEN '✓' ELSE '·' END AS visa_cf,
  CASE WHEN os.id IS NOT NULL THEN '✓' ELSE '·' END AS ordre_service,
  CASE WHEN g.id IS NOT NULL  THEN '✓' ELSE '·' END AS garantie,
  CASE WHEN c.id IS NOT NULL  THEN '✓' ELSE '·' END AS cloture,
  CASE WHEN r.id IS NOT NULL  THEN '✓' ELSE '·' END AS resiliation
FROM mp_operation op
LEFT JOIN mp_procedure     p  ON p.operation_id  = op.id
LEFT JOIN mp_attribution   a  ON a.operation_id  = op.id
LEFT JOIN mp_visa_cf       v  ON v.operation_id  = op.id
LEFT JOIN mp_ordre_service os ON os.operation_id = op.id
LEFT JOIN mp_garantie      g  ON g.operation_id  = op.id
LEFT JOIN mp_cloture       c  ON c.operation_id  = op.id
LEFT JOIN mp_resiliation   r  ON r.operation_id  = op.id
WHERE op.id::text LIKE '00000000-0000-0000-0000-1900%'
ORDER BY array_position(
  ARRAY['PLANIFIE','EN_PROC','ATTRIBUE','VISE','EN_EXEC','CLOS','RESILIE']::text[],
  op.etat
);
