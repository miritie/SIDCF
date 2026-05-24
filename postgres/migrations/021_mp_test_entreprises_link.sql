-- ============================================
-- Migration 021 : Référentiel entreprises pour les attributions de test +
--                 mise à jour des attributions pour les référencer par entrepriseId
-- ============================================
-- Suite à la migration 020, les attributions des opérations TEST-* contenaient
-- des entreprises uniquement via leur raisonSociale/NCC. Or le picker entreprise
-- (Modif #43) lit `entrepriseId` pour afficher la fiche — sans cet ID, l'écran
-- d'attribution reste vide même si la donnée est en base.
--
-- Cette migration :
--   1. Crée 7 fiches mp_entreprise (validées, avec coordonnées bancaires)
--      correspondant aux titulaires injectés dans la migration 020.
--   2. Met à jour mp_attribution.attributaire->'entreprises'[*]->'entrepriseId'
--      pour pointer vers ces fiches.
--
-- Convention UUID entreprise : 00000000-0000-0099-XXXX-190000000NNN
--   où NNN = numéro de l'opération (003..007) ou 005b pour le cotitulaire.
--
-- IDEMPOTENT : DELETE par UUID puis INSERT, et UPDATE déterministe.
-- ============================================

BEGIN;

-- ============================================================
-- 1) Nettoyage des fiches test
-- ============================================================
DELETE FROM mp_entreprise WHERE id::text LIKE '00000000-0000-0099-%-19%';

-- ============================================================
-- 2) Insertion des fiches entreprises de test (validées)
-- ============================================================
INSERT INTO mp_entreprise
  (id, ncc, rccm, raison_sociale, sigle, adresse, telephone, email,
   banque, compte, actif, validation_status, validation_by, validation_date,
   created_at, updated_at)
VALUES
-- 003 ATTRIBUE — AudioVision CI SARL
('00000000-0000-0099-0003-190000000003'::uuid,
 'CI-AVS-2018-0123', 'CI-ABJ-2018-B-15234', 'AudioVision CI SARL', 'AVS',
 'Plateau, Boulevard de la République, Abidjan', '+225 27 20 30 40 50',
 'contact@audiovision-ci.test',
 jsonb_build_object('code', 'BACI', 'nom', 'Banque Atlantique CI', 'agence', 'Plateau Principal'),
 jsonb_build_object('rib', 'CI93 BACI 01001 0000123456789 78'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '60 days',
 NOW() - INTERVAL '180 days', NOW() - INTERVAL '60 days'),

-- 004 VISE — AutoMobile Service CI
('00000000-0000-0099-0004-190000000004'::uuid,
 'CI-AMS-2019-0456', 'CI-ABJ-2019-B-23456', 'AutoMobile Service CI', 'AMS',
 'Cocody, Riviera Golf, Abidjan', '+225 27 22 33 44 55',
 'commercial@ams-ci.test',
 jsonb_build_object('code', 'SGCI', 'nom', 'Société Générale CI', 'agence', 'Cocody Riviera'),
 jsonb_build_object('rib', 'CI93 SGCI 01002 0000456789012 34'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '120 days',
 NOW() - INTERVAL '200 days', NOW() - INTERVAL '120 days'),

-- 005 EN_EXEC — BTP Constructions SA (mandataire)
('00000000-0000-0099-0005-190000000005'::uuid,
 'CI-BTP-2015-0789', 'CI-ABJ-2015-B-78901', 'BTP Constructions SA', 'BTPCSA',
 'Marcory Zone 4, Abidjan', '+225 27 21 35 45 55',
 'siege@btp-constructions.test',
 jsonb_build_object('code', 'NSIA', 'nom', 'NSIA Banque CI', 'agence', 'Marcory'),
 jsonb_build_object('rib', 'CI93 NSIA 01003 0000789012345 67'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '300 days',
 NOW() - INTERVAL '900 days', NOW() - INTERVAL '300 days'),

-- 005b EN_EXEC — Ivoire Béton Industrie (cotitulaire)
('00000000-0000-0099-1005-190000000005'::uuid,
 'CI-IBI-2017-0234', 'CI-ABJ-2017-B-23401', 'Ivoire Béton Industrie', 'IBI',
 'Yopougon Andokoi, Abidjan', '+225 27 23 46 57 68',
 'admin@ibi-betons.test',
 jsonb_build_object('code', 'BICICI', 'nom', 'BICICI', 'agence', 'Yopougon'),
 jsonb_build_object('rib', 'CI93 BICI 01004 0000234567890 12'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '300 days',
 NOW() - INTERVAL '700 days', NOW() - INTERVAL '300 days'),

-- 006 CLOS — Réhab Pro Côte d'Ivoire
('00000000-0000-0099-0006-190000000006'::uuid,
 'CI-RPCI-2014-0567', 'CI-ABJ-2014-B-56789', 'Réhab Pro Côte d''Ivoire', 'RPCI',
 'Treichville Avenue 16, Abidjan', '+225 27 21 24 35 46',
 'contact@rehabpro-ci.test',
 jsonb_build_object('code', 'ECOBANK', 'nom', 'Ecobank CI', 'agence', 'Treichville Centre'),
 jsonb_build_object('rib', 'CI93 ECOB 01005 0000567890123 45'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '500 days',
 NOW() - INTERVAL '1500 days', NOW() - INTERVAL '500 days'),

-- 007 RESILIE — NetClean Services
('00000000-0000-0099-0007-190000000007'::uuid,
 'CI-NCS-2020-0890', 'CI-ABJ-2020-B-89012', 'NetClean Services', 'NCS',
 'Adjamé Forum, Abidjan', '+225 07 08 09 10 11',
 'admin@netclean-services.test',
 jsonb_build_object('code', 'UBA', 'nom', 'UBA CI', 'agence', 'Adjamé'),
 jsonb_build_object('rib', 'CI93 UBAC 01006 0000890123456 78'),
 TRUE, 'VALIDATED', 'SEED', NOW() - INTERVAL '90 days',
 NOW() - INTERVAL '400 days', NOW() - INTERVAL '90 days');

-- ============================================================
-- 3) Mise à jour des attributions pour référencer les fiches entreprise
-- ============================================================
-- Pour chaque attribution test, on reconstruit le JSONB `attributaire`
-- en injectant `entrepriseId` dans chaque entreprise.

-- 003 ATTRIBUE (entreprise simple)
UPDATE mp_attribution SET attributaire = jsonb_set(
  attributaire,
  '{entreprises,0,entrepriseId}',
  to_jsonb('00000000-0000-0099-0003-190000000003'::text)
)
WHERE id = '00000000-0000-0002-0003-190000000003'::uuid;

-- 004 VISE (entreprise simple)
UPDATE mp_attribution SET attributaire = jsonb_set(
  attributaire,
  '{entreprises,0,entrepriseId}',
  to_jsonb('00000000-0000-0099-0004-190000000004'::text)
)
WHERE id = '00000000-0000-0002-0004-190000000004'::uuid;

-- 005 EN_EXEC (mandataire + cotitulaire)
UPDATE mp_attribution SET attributaire = jsonb_set(
  jsonb_set(
    attributaire,
    '{entreprises,0,entrepriseId}',
    to_jsonb('00000000-0000-0099-0005-190000000005'::text)
  ),
  '{entreprises,1,entrepriseId}',
  to_jsonb('00000000-0000-0099-1005-190000000005'::text)
)
WHERE id = '00000000-0000-0002-0005-190000000005'::uuid;

-- 006 CLOS (entreprise simple)
UPDATE mp_attribution SET attributaire = jsonb_set(
  attributaire,
  '{entreprises,0,entrepriseId}',
  to_jsonb('00000000-0000-0099-0006-190000000006'::text)
)
WHERE id = '00000000-0000-0002-0006-190000000006'::uuid;

-- 007 RESILIE (entreprise simple)
UPDATE mp_attribution SET attributaire = jsonb_set(
  attributaire,
  '{entreprises,0,entrepriseId}',
  to_jsonb('00000000-0000-0099-0007-190000000007'::text)
)
WHERE id = '00000000-0000-0002-0007-190000000007'::uuid;

COMMIT;

-- ============================================
-- Vérification post-migration
-- ============================================
SELECT
  op.etat,
  SUBSTRING(op.objet, 1, 35) AS objet,
  COALESCE(a.attributaire->>'singleOrGroup', '—') AS forme,
  COALESCE(jsonb_array_length(a.attributaire->'entreprises'), 0) AS nb_ent,
  a.attributaire->'entreprises'->0->>'raisonSociale' AS mandataire,
  CASE WHEN a.attributaire->'entreprises'->0->>'entrepriseId' IS NOT NULL
       THEN '✓ Liée' ELSE '✗' END AS lien_ref
FROM mp_operation op
LEFT JOIN mp_attribution a ON a.operation_id = op.id
WHERE op.id::text LIKE '00000000-0000-0000-0000-1900%'
ORDER BY array_position(
  ARRAY['PLANIFIE','EN_PROC','ATTRIBUE','VISE','EN_EXEC','CLOS','RESILIE']::text[],
  op.etat
);
