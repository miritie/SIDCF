-- ============================================
-- Migration 029 : Couverture exhaustive : modes manquants + multi-lots
-- ============================================
-- Constat de l'audit (11 op TEST-* existantes) :
--   ✓ PSD/PSC/PSL/PSO/AOO couverts
--   ✗ AOO_PREQUALIF / AOO_2ETAPES / AOR / PI / ENTENTE_DIRECTE manquent
--   ✗ Aucune opération multi-lots
--
-- Cette migration :
--   1. Ajoute la colonne `lots` JSONB à mp_procedure (manquante en DB)
--   2. Crée 6 opérations supplémentaires : 5 modes manquants + 1 multi-lots
--
-- UUIDs : 00000000-0000-0000-0000-19000000020X (série 200)
-- ============================================

BEGIN;

-- ============================================================
-- 1) Colonne lots sur mp_procedure (lue par lot-data.js / getLotsFromProcedure)
-- ============================================================
ALTER TABLE mp_procedure
  ADD COLUMN IF NOT EXISTS lots JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- 2) Nettoyage idempotent
-- ============================================================
DELETE FROM mp_ano             WHERE id::text LIKE '00000000-0000-0012-%-1900000002%';
DELETE FROM mp_garantie        WHERE id::text LIKE '00000000-0000-0011-%-1900000002%';
DELETE FROM mp_decompte        WHERE id::text LIKE '00000000-0000-0010-%-1900000002%';
DELETE FROM mp_cle_repartition WHERE id::text LIKE '00000000-0000-0009-%-1900000002%';
DELETE FROM mp_echeancier      WHERE id::text LIKE '00000000-0000-0008-%-1900000002%';
DELETE FROM mp_resiliation     WHERE id::text LIKE '00000000-0000-0007-%-1900000002%';
DELETE FROM mp_cloture         WHERE id::text LIKE '00000000-0000-0006-%-1900000002%';
DELETE FROM mp_ordre_service   WHERE id::text LIKE '00000000-0000-0004-%-1900000002%';
DELETE FROM mp_visa_cf         WHERE id::text LIKE '00000000-0000-0003-%-1900000002%';
DELETE FROM mp_attribution     WHERE id::text LIKE '00000000-0000-0002-%-1900000002%';
DELETE FROM mp_procedure       WHERE id::text LIKE '00000000-0000-0001-%-1900000002%';
DELETE FROM mp_entreprise      WHERE id::text LIKE '00000000-0000-0099-%-1900000002%';
DELETE FROM mp_operation       WHERE id::text LIKE '00000000-0000-0000-0000-1900000002%';

-- ============================================================
-- 3) 6 nouvelles opérations couvrant les modes manquants
-- ============================================================
INSERT INTO mp_operation (
  id, exercice, unite, objet,
  type_marche, mode_passation, revue, nature_prix,
  montant_previsionnel, montant_actuel, devise,
  type_financement, source_financement,
  chaine_budgetaire, delai_execution, duree_previsionnelle,
  categorie_prestation, beneficiaire, livrables, localisation,
  timeline, etat, proc_derogation, created_at, updated_at
) VALUES

-- 201 : AOO_PREQUALIF — VISE
('00000000-0000-0000-0000-190000000201'::uuid, 2026,
 'Assemblée N 3 Investissements',
 'TEST-AOO-PREQ — Construction barrage hydroélectrique (AOO avec préqualification, visé)',
 'TRAVAUX', 'AOO_PREQUALIF', 'A_PRIORI', 'UNITAIRE',
 3500000000, 3500000000, 'XOF', 'EMPRUNT', 'BAD',
 jsonb_build_object(
   'section', 'Sénat', 'sectionCode', '13030016',
   'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
   'activite', 'Construction de bâtiments administratifs', 'activiteCode', 'ACT_13030_001',
   'nature', '231 - Constructions', 'natureCode', '231',
   'ligneBudgetaire', 'ACT_13030_001231',
   'bailleurs', jsonb_build_array('BAD', 'TRESOR'),
   'financements', jsonb_build_array(
     jsonb_build_object('montant', 0, 'typeFinancement', 'EMPRUNT', 'bailleur', 'BAD'),
     jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 450, 450, 'INFRASTRUCTURE', 'Société d''électricité',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'departement', 'Cocody'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE"]'::jsonb, 'VISE', NULL,
 NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 days'),

-- 202 : AOO_2ETAPES — EN_EXEC — MULTI-LOTS (3 lots distincts)
('00000000-0000-0000-0000-190000000202'::uuid, 2026,
 'Assemblée N 3 Investissements',
 'TEST-MULTI-LOTS — Réseau distribution eau Sud (AOO 2 étapes, 3 lots)',
 'TRAVAUX', 'AOO_2ETAPES', 'A_PRIORI', 'UNITAIRE',
 5800000000, 5800000000, 'XOF', 'EMPRUNT', 'BOAD',
 jsonb_build_object(
   'section', 'Sénat', 'sectionCode', '13030016',
   'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
   'activite', 'Construction de bâtiments administratifs', 'activiteCode', 'ACT_13030_001',
   'nature', '231 - Constructions', 'natureCode', '231',
   'ligneBudgetaire', 'ACT_13030_001231',
   'bailleurs', jsonb_build_array('BOAD', 'TRESOR'),
   'financements', jsonb_build_array(
     jsonb_build_object('montant', 0, 'typeFinancement', 'EMPRUNT', 'bailleur', 'BOAD'),
     jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 540, 540, 'INFRASTRUCTURE', 'Société des eaux',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'departement', 'Marcory'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC"]'::jsonb, 'EN_EXEC', NULL,
 NOW() - INTERVAL '250 days', NOW() - INTERVAL '2 days'),

-- 203 : AOR — ATTRIBUE (dérogatoire défense/sécurité)
('00000000-0000-0000-0000-190000000203'::uuid, 2026,
 'Assemblée N 3 Investissements',
 'TEST-AOR — Équipements de sécurité spécialisés (Appel d''Offres Restreint, art. 58)',
 'FOURNITURES', 'AOR', 'A_PRIORI', 'FORFAIT',
 180000000, 180000000, 'XOF', 'ETAT', 'TRESOR',
 jsonb_build_object(
   'section', 'Sénat', 'sectionCode', '13030016',
   'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
   'activite', 'Acquisition de véhicules administratifs', 'activiteCode', 'ACT_13030_004',
   'nature', '233 - Mobilier matériel et instruments', 'natureCode', '233',
   'ligneBudgetaire', 'ACT_13030_004233',
   'bailleurs', jsonb_build_array('TRESOR'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 120, 120, 'EQUIPEMENT', 'Cabinet et sécurité',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'departement', 'Plateau'),
 '["PLANIF","EN_PROC","ATTRIBUE"]'::jsonb, 'ATTRIBUE',
 jsonb_build_object('isDerogation', true, 'docId', 'DOC_AOR_DEROG_203.pdf',
   'comment', 'AOR justifié par exigences de sécurité (art. 58 Décret 2009-259). Validation DGMP fournie.',
   'validatedAt', NULL, 'sourceEtape', 'PROCEDURE'),
 NOW() - INTERVAL '85 days', NOW() - INTERVAL '6 days'),

-- 204 : PI — EN_EXEC (Prestations Intellectuelles)
('00000000-0000-0000-0000-190000000204'::uuid, 2026,
 'Assemblée N 2 Biens et services',
 'TEST-PI — Étude stratégique réforme administrative (Prestations Intellectuelles)',
 'SERVICES_INTELLECTUELS', 'PI', 'A_PRIORI', 'FORFAIT',
 25000000, 25000000, 'XOF', 'DON', 'BM',
 jsonb_build_object(
   'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
   'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
   'activite', 'Études et audits', 'activiteCode', 'ACT_13001_005',
   'nature', '222 - Achats de biens', 'natureCode', '222',
   'ligneBudgetaire', 'ACT_13001_005222',
   'bailleurs', jsonb_build_array('BM'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'DON', 'bailleur', 'BM'))),
 180, 180, 'ETUDE', 'Direction administrative',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'departement', 'Plateau'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC"]'::jsonb, 'EN_EXEC', NULL,
 NOW() - INTERVAL '150 days', NOW() - INTERVAL '3 days'),

-- 205 : ENTENTE_DIRECTE — VISE (gré à gré exceptionnel)
('00000000-0000-0000-0000-190000000205'::uuid, 2026,
 'Assemblée N 1 Personnel',
 'TEST-GRE-A-GRE — Maintenance ascenseurs (gré à gré, art. 67 — monopole technique)',
 'SERVICES_COURANTS', 'ENTENTE_DIRECTE', 'A_PRIORI', 'FORFAIT',
 12000000, 12000000, 'XOF', 'ETAT', 'TRESOR',
 jsonb_build_object(
   'section', 'Direction de zone 780 102', 'sectionCode', '31990001',
   'programme', 'Sous-préfecture 1300101', 'programmeCode', '780102',
   'activite', 'Prestations de services courants', 'activiteCode', 'ACT_13001_004',
   'nature', '222 - Achats de biens', 'natureCode', '222',
   'ligneBudgetaire', 'ACT_13001_004222',
   'bailleurs', jsonb_build_array('TRESOR'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 365, 365, 'SERVICE', 'Direction administrative',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'departement', 'Plateau'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE"]'::jsonb, 'VISE',
 jsonb_build_object('isDerogation', true, 'docId', 'DOC_ED_DEROG_205.pdf',
   'comment', 'Gré à gré justifié par monopole technique du constructeur (Art. 67 Décret 2009-259). DGMP approuvé.',
   'validatedAt', NULL, 'sourceEtape', 'PROCEDURE'),
 NOW() - INTERVAL '95 days', NOW() - INTERVAL '4 days'),

-- 206 : AOO multi-lots EN_EXEC (2 lots distincts)
('00000000-0000-0000-0000-190000000206'::uuid, 2026,
 'Assemblée N 3 Investissements',
 'TEST-2LOTS — Équipement parc informatique (AOO, 2 lots géographiques)',
 'FOURNITURES', 'AOO', 'A_PRIORI', 'UNITAIRE',
 320000000, 320000000, 'XOF', 'ETAT', 'TRESOR',
 jsonb_build_object(
   'section', 'Sénat', 'sectionCode', '13030016',
   'programme', 'Sous-préfecture 1303001', 'programmeCode', '110101',
   'activite', 'Équipement des salles de réunion', 'activiteCode', 'ACT_13030_002',
   'nature', '232 - Matériel et outillage technique', 'natureCode', '232',
   'ligneBudgetaire', 'ACT_13030_002232',
   'bailleurs', jsonb_build_array('TRESOR'),
   'financements', jsonb_build_array(jsonb_build_object('montant', 0, 'typeFinancement', 'ETAT', 'bailleur', 'TRESOR'))),
 180, 180, 'EQUIPEMENT', 'Sénat — services techniques',
 '[]'::jsonb,
 jsonb_build_object('region', 'Abidjan Autonome', 'departement', 'Plateau'),
 '["PLANIF","EN_PROC","ATTRIBUE","VISE","EN_EXEC"]'::jsonb, 'EN_EXEC', NULL,
 NOW() - INTERVAL '200 days', NOW() - INTERVAL '1 days');

-- ============================================================
-- 4) Entreprises pour les nouvelles attributions
-- ============================================================
INSERT INTO mp_entreprise
  (id, ncc, rccm, raison_sociale, sigle, adresse, telephone, email,
   banque, compte, actif, validation_status, validation_by, validation_date,
   created_at, updated_at)
VALUES
-- 201 mandataire
('00000000-0000-0099-0201-190000000201'::uuid, 'CI-HYDRO-2012-2200', 'CI-ABJ-2012-B-22002',
 'HydroPower Africa SA', 'HPA', 'Cocody Riviera, Abidjan', '+225 27 22 47 58 69',
 'contact@hydropower-africa.test',
 jsonb_build_object('code', 'BACI', 'nom', 'Banque Atlantique CI', 'agence', 'Riviera'),
 jsonb_build_object('rib', 'CI93 BACI 02201 00012200200022 12'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '500 days', NOW() - INTERVAL '500 days', NOW() - INTERVAL '500 days'),
-- 202 mandataire (multi-lots 3 lots — c'est le mandataire global)
('00000000-0000-0099-0202-190000000202'::uuid, 'CI-WATER-2014-2300', 'CI-ABJ-2014-B-23003',
 'Water Network Constructeurs', 'WNC', 'Marcory Zone 4, Abidjan', '+225 27 22 48 59 70',
 'admin@water-network.test',
 jsonb_build_object('code', 'SGCI', 'nom', 'Société Générale CI', 'agence', 'Marcory'),
 jsonb_build_object('rib', 'CI93 SGCI 02202 00012300300033 34'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '600 days', NOW() - INTERVAL '600 days', NOW() - INTERVAL '600 days'),
-- 202 mandataire LOT 2
('00000000-0000-0099-1202-190000000202'::uuid, 'CI-PIPES-2016-2400', 'CI-ABJ-2016-B-24004',
 'Pipes & Connections CI', 'PCC', 'Yopougon Industriel, Abidjan', '+225 27 23 49 60 71',
 'siege@pipes-ci.test',
 jsonb_build_object('code', 'NSIA', 'nom', 'NSIA Banque CI', 'agence', 'Yopougon'),
 jsonb_build_object('rib', 'CI93 NSIA 02203 00012400400044 56'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '450 days', NOW() - INTERVAL '450 days', NOW() - INTERVAL '450 days'),
-- 202 mandataire LOT 3
('00000000-0000-0099-2202-190000000202'::uuid, 'CI-CIVIL-2013-2500', 'CI-ABJ-2013-B-25005',
 'Civil Engineering Solutions', 'CES', 'Plateau Tour B, Abidjan', '+225 27 21 50 61 72',
 'projets@civil-eng.test',
 jsonb_build_object('code', 'ECOBANK', 'nom', 'Ecobank CI', 'agence', 'Plateau'),
 jsonb_build_object('rib', 'CI93 ECOB 02204 00012500500055 78'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '550 days', NOW() - INTERVAL '550 days', NOW() - INTERVAL '550 days'),
-- 203 AOR
('00000000-0000-0099-0203-190000000203'::uuid, 'CI-SECUR-2018-2600', 'CI-ABJ-2018-B-26006',
 'SecurEquip Côte d''Ivoire', 'SECI', 'Cocody Vallons, Abidjan', '+225 27 22 51 62 73',
 'contact@securequip-ci.test',
 jsonb_build_object('code', 'BICICI', 'nom', 'BICICI', 'agence', 'Cocody'),
 jsonb_build_object('rib', 'CI93 BICI 02205 00012600600066 90'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '350 days', NOW() - INTERVAL '350 days', NOW() - INTERVAL '350 days'),
-- 204 PI
('00000000-0000-0099-0204-190000000204'::uuid, 'CI-CONSEIL-2017-2700', 'CI-ABJ-2017-B-27007',
 'Conseil & Stratégie Afrique', 'CSA', 'Plateau Centre, Abidjan', '+225 27 20 30 41 52',
 'cabinet@conseil-strategie.test',
 jsonb_build_object('code', 'UBA', 'nom', 'UBA CI', 'agence', 'Plateau'),
 jsonb_build_object('rib', 'CI93 UBAC 02206 00012700700077 12'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '400 days', NOW() - INTERVAL '400 days', NOW() - INTERVAL '400 days'),
-- 205 Entente directe
('00000000-0000-0099-0205-190000000205'::uuid, 'CI-LIFT-2010-2800', 'CI-ABJ-2010-B-28008',
 'AscenseurLift Services CI', 'ALS', 'Plateau, Abidjan', '+225 27 21 31 42 53',
 'maintenance@ascenseurlift.test',
 jsonb_build_object('code', 'BACI', 'nom', 'Banque Atlantique CI', 'agence', 'Plateau'),
 jsonb_build_object('rib', 'CI93 BACI 02207 00012800800088 34'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '800 days', NOW() - INTERVAL '800 days', NOW() - INTERVAL '800 days'),
-- 206 LOT 1
('00000000-0000-0099-0206-190000000206'::uuid, 'CI-ITNORD-2019-2900', 'CI-ABJ-2019-B-29009',
 'IT Nord Distribution', 'ITND', 'Bouaké Centre, Bouaké', '+225 27 31 25 36 47',
 'sales@itnord.test',
 jsonb_build_object('code', 'SGCI', 'nom', 'Société Générale CI', 'agence', 'Bouaké'),
 jsonb_build_object('rib', 'CI93 SGCI 02208 00012900900099 56'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '300 days', NOW() - INTERVAL '300 days', NOW() - INTERVAL '300 days'),
-- 206 LOT 2
('00000000-0000-0099-1206-190000000206'::uuid, 'CI-ITSUD-2018-3000', 'CI-ABJ-2018-B-30000',
 'IT Sud Solutions', 'ITSS', 'Abidjan Treichville, Abidjan', '+225 27 21 26 37 48',
 'contact@itsud.test',
 jsonb_build_object('code', 'NSIA', 'nom', 'NSIA Banque CI', 'agence', 'Treichville'),
 jsonb_build_object('rib', 'CI93 NSIA 02209 00013000000111 78'), TRUE, 'VALIDATED', 'SEED',
 NOW() - INTERVAL '300 days', NOW() - INTERVAL '300 days', NOW() - INTERVAL '300 days');

-- ============================================================
-- 5) PROCEDURES (avec lots[] pour 202 et 206)
-- ============================================================
INSERT INTO mp_procedure
  (id, operation_id, commission, mode_passation, categorie, type_dossier_appel,
   dates, nb_offres_recues, nb_offres_classees, pv, rapport_analyse_doc, decision_attribution_ref,
   lots, created_at, updated_at)
VALUES
-- 201 AOO_PREQUALIF mono-lot
('00000000-0000-0001-0201-190000000201'::uuid, '00000000-0000-0000-0000-190000000201'::uuid,
 'COJO', 'AOO_PREQUALIF', 'INTERNATIONALE', 'DAO',
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '120 days')::date,
   'dateRemiseOffres', (NOW() - INTERVAL '80 days')::date,
   'dateAttribution', (NOW() - INTERVAL '30 days')::date),
 8, 5, jsonb_build_object('numero', 'PV-2026-201'), 'DOC_RAPPORT_201.pdf', 'DOC_DECISION_201.pdf',
 '[]'::jsonb, NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 days'),

-- 202 AOO_2ETAPES MULTI-LOTS (3 lots distincts)
('00000000-0000-0001-0202-190000000202'::uuid, '00000000-0000-0000-0000-190000000202'::uuid,
 'COJO', 'AOO_2ETAPES', 'INTERNATIONALE', 'DAO',
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '250 days')::date,
   'dateRemiseOffres', (NOW() - INTERVAL '200 days')::date,
   'dateAttribution', (NOW() - INTERVAL '150 days')::date),
 12, 9, jsonb_build_object('numero', 'PV-2026-202'), 'DOC_RAPPORT_202.pdf', 'DOC_DECISION_202.pdf',
 jsonb_build_array(
   jsonb_build_object('id', 'LOT-202-A', 'libelle', 'Lot A — Réseau primaire (Marcory/Treichville)', 'montantEstime', 2400000000),
   jsonb_build_object('id', 'LOT-202-B', 'libelle', 'Lot B — Réseau secondaire (Yopougon/Abobo)', 'montantEstime', 1900000000),
   jsonb_build_object('id', 'LOT-202-C', 'libelle', 'Lot C — Raccordements et compteurs', 'montantEstime', 1500000000)),
 NOW() - INTERVAL '250 days', NOW() - INTERVAL '2 days'),

-- 203 AOR
('00000000-0000-0001-0203-190000000203'::uuid, '00000000-0000-0000-0000-190000000203'::uuid,
 'COJO', 'AOR', 'NATIONALE', 'DAO',
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '85 days')::date,
   'dateRemiseOffres', (NOW() - INTERVAL '55 days')::date,
   'dateAttribution', (NOW() - INTERVAL '15 days')::date),
 3, 2, jsonb_build_object('numero', 'PV-2026-203'), 'DOC_RAPPORT_203.pdf', 'DOC_DECISION_203.pdf',
 '[]'::jsonb, NOW() - INTERVAL '85 days', NOW() - INTERVAL '6 days'),

-- 204 PI
('00000000-0000-0001-0204-190000000204'::uuid, '00000000-0000-0000-0000-190000000204'::uuid,
 'COJO', 'PI', 'NATIONALE', 'DTAO_PI',
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '150 days')::date,
   'dateRemiseOffres', (NOW() - INTERVAL '110 days')::date,
   'dateAttribution', (NOW() - INTERVAL '60 days')::date),
 5, 3, jsonb_build_object('numero', 'PV-2026-204'), 'DOC_RAPPORT_204.pdf', 'DOC_DECISION_204.pdf',
 '[]'::jsonb, NOW() - INTERVAL '150 days', NOW() - INTERVAL '3 days'),

-- 205 ENTENTE_DIRECTE
('00000000-0000-0001-0205-190000000205'::uuid, '00000000-0000-0000-0000-190000000205'::uuid,
 'COJO', 'ENTENTE_DIRECTE', 'NATIONALE', 'LETTRE_GAG',
 jsonb_build_object('dateAttribution', (NOW() - INTERVAL '45 days')::date),
 1, 1, jsonb_build_object('numero', 'PV-2026-205'), NULL, 'DOC_LETTRE_205.pdf',
 '[]'::jsonb, NOW() - INTERVAL '95 days', NOW() - INTERVAL '4 days'),

-- 206 AOO MULTI-LOTS (2 lots géographiques)
('00000000-0000-0001-0206-190000000206'::uuid, '00000000-0000-0000-0000-190000000206'::uuid,
 'COJO', 'AOO', 'NATIONALE', 'DAO',
 jsonb_build_object('dateOuvertureDAO', (NOW() - INTERVAL '200 days')::date,
   'dateRemiseOffres', (NOW() - INTERVAL '160 days')::date,
   'dateAttribution', (NOW() - INTERVAL '110 days')::date),
 7, 5, jsonb_build_object('numero', 'PV-2026-206'), 'DOC_RAPPORT_206.pdf', 'DOC_DECISION_206.pdf',
 jsonb_build_array(
   jsonb_build_object('id', 'LOT-206-NORD', 'libelle', 'Lot Nord — Bouaké et environs', 'montantEstime', 180000000),
   jsonb_build_object('id', 'LOT-206-SUD',  'libelle', 'Lot Sud — Abidjan métropole', 'montantEstime', 140000000)),
 NOW() - INTERVAL '200 days', NOW() - INTERVAL '1 days');

-- ============================================================
-- 6) ATTRIBUTIONS (mono pour 201/203/204/205, multi parLot pour 202/206)
-- ============================================================
INSERT INTO mp_attribution (id, operation_id, attributaire, montants, garanties, dates, decision_cf, created_at, updated_at)
VALUES
-- 201 SIMPLE
('00000000-0000-0002-0201-190000000201'::uuid, '00000000-0000-0000-0000-190000000201'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-0201-190000000201',
     'raisonSociale', 'HydroPower Africa SA', 'ncc', 'CI-HYDRO-2012-2200',
     'adresse', 'Cocody Riviera, Abidjan', 'telephone', '+225 27 22 47 58 69'))),
 jsonb_build_object('ht', 2966101694, 'ttc', 3500000000, 'attribue', 3500000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '30 days')::date,
   'approbation', (NOW() - INTERVAL '5 days')::date),
 '{}'::jsonb, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- 202 MULTI-LOTS — chaque lot a son attributaire dans parLot[lotId]
('00000000-0000-0002-0202-190000000202'::uuid, '00000000-0000-0000-0000-190000000202'::uuid,
 '{}'::jsonb,
 jsonb_build_object('ht', 4915254237, 'ttc', 5800000000, 'attribue', 5800000000),
 '{}'::jsonb, jsonb_build_object(), '{}'::jsonb,
 NOW() - INTERVAL '150 days', NOW() - INTERVAL '2 days');

-- 202 : injecter parLot via jsonb_set (3 lots avec attributaires distincts)
UPDATE mp_attribution
SET attributaire = jsonb_build_object(
  'parLot', jsonb_build_object(
    'LOT-202-A', jsonb_build_object(
      'singleOrGroup', 'SIMPLE',
      'entreprises', jsonb_build_array(jsonb_build_object(
        'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-0202-190000000202',
        'raisonSociale', 'Water Network Constructeurs', 'ncc', 'CI-WATER-2014-2300',
        'adresse', 'Marcory Zone 4, Abidjan')),
      'montants', jsonb_build_object('ht', 2033898305, 'ttc', 2400000000, 'attribue', 2400000000)
    ),
    'LOT-202-B', jsonb_build_object(
      'singleOrGroup', 'SIMPLE',
      'entreprises', jsonb_build_array(jsonb_build_object(
        'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-1202-190000000202',
        'raisonSociale', 'Pipes & Connections CI', 'ncc', 'CI-PIPES-2016-2400',
        'adresse', 'Yopougon Industriel, Abidjan')),
      'montants', jsonb_build_object('ht', 1610169491, 'ttc', 1900000000, 'attribue', 1900000000)
    ),
    'LOT-202-C', jsonb_build_object(
      'singleOrGroup', 'SIMPLE',
      'entreprises', jsonb_build_array(jsonb_build_object(
        'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-2202-190000000202',
        'raisonSociale', 'Civil Engineering Solutions', 'ncc', 'CI-CIVIL-2013-2500',
        'adresse', 'Plateau Tour B, Abidjan')),
      'montants', jsonb_build_object('ht', 1271186441, 'ttc', 1500000000, 'attribue', 1500000000)
    )
  )
)
WHERE id = '00000000-0000-0002-0202-190000000202'::uuid;

-- 203 SIMPLE (AOR)
INSERT INTO mp_attribution (id, operation_id, attributaire, montants, garanties, dates, decision_cf, created_at, updated_at)
VALUES
('00000000-0000-0002-0203-190000000203'::uuid, '00000000-0000-0000-0000-190000000203'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-0203-190000000203',
     'raisonSociale', 'SecurEquip Côte d''Ivoire', 'ncc', 'CI-SECUR-2018-2600',
     'adresse', 'Cocody Vallons, Abidjan'))),
 jsonb_build_object('ht', 152542373, 'ttc', 180000000, 'attribue', 180000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '15 days')::date),
 '{}'::jsonb, NOW() - INTERVAL '15 days', NOW() - INTERVAL '6 days'),

-- 204 PI
('00000000-0000-0002-0204-190000000204'::uuid, '00000000-0000-0000-0000-190000000204'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-0204-190000000204',
     'raisonSociale', 'Conseil & Stratégie Afrique', 'ncc', 'CI-CONSEIL-2017-2700',
     'adresse', 'Plateau Centre, Abidjan'))),
 jsonb_build_object('ht', 21186440, 'ttc', 25000000, 'attribue', 25000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '60 days')::date,
   'approbation', (NOW() - INTERVAL '40 days')::date),
 '{}'::jsonb, NOW() - INTERVAL '60 days', NOW() - INTERVAL '3 days'),

-- 205 ENTENTE_DIRECTE
('00000000-0000-0002-0205-190000000205'::uuid, '00000000-0000-0000-0000-190000000205'::uuid,
 jsonb_build_object('singleOrGroup', 'SIMPLE',
   'entreprises', jsonb_build_array(jsonb_build_object(
     'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-0205-190000000205',
     'raisonSociale', 'AscenseurLift Services CI', 'ncc', 'CI-LIFT-2010-2800',
     'adresse', 'Plateau, Abidjan'))),
 jsonb_build_object('ht', 10169491, 'ttc', 12000000, 'attribue', 12000000),
 '{}'::jsonb,
 jsonb_build_object('signatureTitulaire', (NOW() - INTERVAL '45 days')::date,
   'approbation', (NOW() - INTERVAL '4 days')::date),
 '{}'::jsonb, NOW() - INTERVAL '45 days', NOW() - INTERVAL '4 days'),

-- 206 MULTI-LOTS via parLot (2 lots)
('00000000-0000-0002-0206-190000000206'::uuid, '00000000-0000-0000-0000-190000000206'::uuid,
 jsonb_build_object(
   'parLot', jsonb_build_object(
     'LOT-206-NORD', jsonb_build_object(
       'singleOrGroup', 'SIMPLE',
       'entreprises', jsonb_build_array(jsonb_build_object(
         'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-0206-190000000206',
         'raisonSociale', 'IT Nord Distribution', 'ncc', 'CI-ITNORD-2019-2900',
         'adresse', 'Bouaké Centre, Bouaké')),
       'montants', jsonb_build_object('ht', 152542373, 'ttc', 180000000, 'attribue', 180000000)
     ),
     'LOT-206-SUD', jsonb_build_object(
       'singleOrGroup', 'SIMPLE',
       'entreprises', jsonb_build_array(jsonb_build_object(
         'role', 'TITULAIRE', 'entrepriseId', '00000000-0000-0099-1206-190000000206',
         'raisonSociale', 'IT Sud Solutions', 'ncc', 'CI-ITSUD-2018-3000',
         'adresse', 'Abidjan Treichville, Abidjan')),
       'montants', jsonb_build_object('ht', 118644068, 'ttc', 140000000, 'attribue', 140000000)
     )
   )
 ),
 jsonb_build_object('ht', 271186441, 'ttc', 320000000, 'attribue', 320000000),
 '{}'::jsonb, jsonb_build_object(), '{}'::jsonb,
 NOW() - INTERVAL '110 days', NOW() - INTERVAL '1 days');

-- ============================================================
-- 7) VISA CF pour 201/202/204/205/206
-- ============================================================
INSERT INTO mp_visa_cf (id, operation_id, attribution_id, decision, date_decision,
   contrat_doc, organe_approbateur, date_approbation, document_approbation, created_at, updated_at)
VALUES
('00000000-0000-0003-0201-190000000201'::uuid, '00000000-0000-0000-0000-190000000201'::uuid,
 '00000000-0000-0002-0201-190000000201'::uuid, 'FAVORABLE', NOW() - INTERVAL '5 days',
 'DOC_CONTRAT_201.pdf', 'PRESIDENT_REPUBLIQUE', (NOW() - INTERVAL '5 days')::date,
 'DOC_APPROBATION_201.pdf', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('00000000-0000-0003-0202-190000000202'::uuid, '00000000-0000-0000-0000-190000000202'::uuid,
 '00000000-0000-0002-0202-190000000202'::uuid, 'FAVORABLE', NOW() - INTERVAL '120 days',
 'DOC_CONTRAT_202.pdf', 'PRESIDENT_REPUBLIQUE', (NOW() - INTERVAL '120 days')::date,
 'DOC_APPROBATION_202.pdf', NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'),
('00000000-0000-0003-0204-190000000204'::uuid, '00000000-0000-0000-0000-190000000204'::uuid,
 '00000000-0000-0002-0204-190000000204'::uuid, 'FAVORABLE', NOW() - INTERVAL '40 days',
 'DOC_CONTRAT_204.pdf', 'CF', (NOW() - INTERVAL '40 days')::date,
 'DOC_APPROBATION_204.pdf', NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
('00000000-0000-0003-0205-190000000205'::uuid, '00000000-0000-0000-0000-190000000205'::uuid,
 '00000000-0000-0002-0205-190000000205'::uuid, 'FAVORABLE', NOW() - INTERVAL '4 days',
 'DOC_CONTRAT_205.pdf', 'CF', (NOW() - INTERVAL '4 days')::date,
 'DOC_APPROBATION_205.pdf', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('00000000-0000-0003-0206-190000000206'::uuid, '00000000-0000-0000-0000-190000000206'::uuid,
 '00000000-0000-0002-0206-190000000206'::uuid, 'FAVORABLE', NOW() - INTERVAL '90 days',
 'DOC_CONTRAT_206.pdf', 'PRESIDENT_REPUBLIQUE', (NOW() - INTERVAL '90 days')::date,
 'DOC_APPROBATION_206.pdf', NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days');

-- ============================================================
-- 8) ORDRE DE SERVICE pour 202/204/206 (EN_EXEC)
-- ============================================================
INSERT INTO mp_ordre_service (id, operation_id, numero, date_emission, objet, doc_ref,
   bureau_controle, bureau_etudes, created_at, updated_at)
VALUES
('00000000-0000-0004-0202-190000000202'::uuid, '00000000-0000-0000-0000-190000000202'::uuid,
 'OS-2026-202-01', NOW() - INTERVAL '100 days',
 'OS de démarrage — réseau distribution eau (3 lots)', 'DOC_OS_202.pdf',
 '{}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days'),
('00000000-0000-0004-0204-190000000204'::uuid, '00000000-0000-0000-0000-190000000204'::uuid,
 'OS-2026-204-01', NOW() - INTERVAL '35 days',
 'OS de démarrage — étude stratégique réforme administrative', 'DOC_OS_204.pdf',
 '{}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
('00000000-0000-0004-0206-190000000206'::uuid, '00000000-0000-0000-0000-190000000206'::uuid,
 'OS-2026-206-01', NOW() - INTERVAL '85 days',
 'OS de démarrage — équipement parc informatique (2 lots Nord/Sud)', 'DOC_OS_206.pdf',
 '{}'::jsonb, '{}'::jsonb, NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days');

COMMIT;

-- ============================================
-- Vérification : nouvelles opérations + lots
-- ============================================
SELECT
  SUBSTRING(op.id::text FROM 30) AS id,
  op.etat,
  op.mode_passation AS mode,
  (op.montant_previsionnel/1000000)::int AS m_xof,
  COALESCE(jsonb_array_length(p.lots), 0) AS nb_lots,
  SUBSTRING(op.objet, 1, 50) AS objet
FROM mp_operation op
LEFT JOIN mp_procedure p ON p.operation_id = op.id
WHERE op.id::text LIKE '00000000-0000-0000-0000-1900%'
ORDER BY op.id;
