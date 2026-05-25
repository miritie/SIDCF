-- ============================================
-- Migration 022 : Enrichissement des opérations TEST-* (échéancier, clé répartition,
-- décomptes, garantie d'avance, ANO)
-- ============================================
-- Pour rendre les écrans Marché+ pleinement testables / démontrables :
--   - mp_echeancier : plan de paiement pour les opérations ATTRIBUE+
--   - mp_cle_repartition : multi-bailleurs pour VISE+ (et notamment EN_EXEC
--     qui est un GROUPEMENT multi-bailleurs)
--   - mp_decompte : OP/Mandats pour EN_EXEC et CLOS (avec décompositions
--     Acompte HTVA + Avance + Garantie + Pénalité + Net HTVA/TTC)
--   - mp_garantie (avance) en complément de la garantie BE déjà existante
--   - mp_ano : avis de non-objection DGMP pour les opérations AOO
--
-- Convention UUID :
--   echeancier   : 00000000-0000-0008-XXXX-19000000000Y
--   cle_repart   : 00000000-0000-0009-XXXX-19000000000Y
--   decompte     : 00000000-0000-0010-NNXX-19000000000Y  (NN=numéro décompte)
--   garantie av. : 00000000-0000-0011-XXXX-19000000000Y
--   ano          : 00000000-0000-0012-XXXX-19000000000Y
-- ============================================

BEGIN;

-- ============================================================
-- 1) Nettoyage
-- ============================================================
DELETE FROM mp_ano             WHERE id::text LIKE '00000000-0000-0012-%-19%';
DELETE FROM mp_garantie        WHERE id::text LIKE '00000000-0000-0011-%-19%';
DELETE FROM mp_decompte        WHERE id::text LIKE '00000000-0000-0010-%-19%';
DELETE FROM mp_cle_repartition WHERE id::text LIKE '00000000-0000-0009-%-19%';
DELETE FROM mp_echeancier      WHERE id::text LIKE '00000000-0000-0008-%-19%';

-- ============================================================
-- 2) ÉCHÉANCIERS (ATTRIBUE et au-delà)
-- ============================================================
-- TEST-ATTRIBUE (003) : marché 35M, 3 échéances trimestrielles
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0003-190000000003'::uuid,
  '00000000-0000-0000-0000-190000000003'::uuid,
  'TRIMESTRIEL', 90,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() + INTERVAL '30 days')::date,
      'montant', 14000000, 'baseCalc', 'TTC', 'pourcentage', 40, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() + INTERVAL '120 days')::date,
      'montant', 14000000, 'baseCalc', 'TTC', 'pourcentage', 40, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() + INTERVAL '210 days')::date,
      'montant', 7000000, 'baseCalc', 'TTC', 'pourcentage', 20, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  35000000, 100,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
);

-- TEST-VISE (004) : marché 75M, 4 échéances trimestrielles
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0004-190000000004'::uuid,
  '00000000-0000-0000-0000-190000000004'::uuid,
  'TRIMESTRIEL', 90,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() + INTERVAL '15 days')::date,
      'montant', 18750000, 'baseCalc', 'TTC', 'pourcentage', 25, 'typeEcheance', 'AVANCE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() + INTERVAL '105 days')::date,
      'montant', 18750000, 'baseCalc', 'TTC', 'pourcentage', 25, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() + INTERVAL '195 days')::date,
      'montant', 26250000, 'baseCalc', 'TTC', 'pourcentage', 35, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 4, 'datePrevisionnelle', (NOW() + INTERVAL '285 days')::date,
      'montant', 11250000, 'baseCalc', 'TTC', 'pourcentage', 15, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  75000000, 100,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
);

-- TEST-EN_EXEC (005) : marché 850M, étalement annuel sur 4 trimestres
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0005-190000000005'::uuid,
  '00000000-0000-0000-0000-190000000005'::uuid,
  'TRIMESTRIEL', 90,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() - INTERVAL '60 days')::date,
      'montant', 170000000, 'baseCalc', 'TTC', 'pourcentage', 20, 'typeEcheance', 'AVANCE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() + INTERVAL '30 days')::date,
      'montant', 255000000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() + INTERVAL '120 days')::date,
      'montant', 255000000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 4, 'datePrevisionnelle', (NOW() + INTERVAL '210 days')::date,
      'montant', 170000000, 'baseCalc', 'TTC', 'pourcentage', 20, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  850000000, 100,
  NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'
);

-- TEST-CLOS (006) : marché 1200M, 4 échéances totalement payées
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0006-190000000006'::uuid,
  '00000000-0000-0000-0000-190000000006'::uuid,
  'TRIMESTRIEL', 90,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() - INTERVAL '300 days')::date,
      'montant', 300000000, 'baseCalc', 'TTC', 'pourcentage', 25, 'typeEcheance', 'AVANCE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() - INTERVAL '210 days')::date,
      'montant', 360000000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() - INTERVAL '120 days')::date,
      'montant', 360000000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 4, 'datePrevisionnelle', (NOW() - INTERVAL '30 days')::date,
      'montant', 180000000, 'baseCalc', 'TTC', 'pourcentage', 15, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  1200000000, 100,
  NOW() - INTERVAL '330 days', NOW() - INTERVAL '30 days'
);

-- ============================================================
-- 3) CLÉS DE RÉPARTITION
-- ============================================================
-- TEST-VISE (004) : mono-bailleur Trésor (75M HT)
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0004-190000000004'::uuid,
  '00000000-0000-0000-0000-190000000004'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2026, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '233', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 63559322, 'saisieMode', 'MONTANT', 'pourcentage', 100, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 11440678, 'montantTVAEtat', 11440678, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  75000000, 100,
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'
);

-- TEST-EN_EXEC (005) : multi-bailleur (Trésor + BOAD, État supporte TVA)
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0005-190000000005'::uuid,
  '00000000-0000-0000-0000-190000000005'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2026, 'bailleur', 'BOAD', 'typeFinancement', 'EMPRUNT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 504237288, 'saisieMode', 'MONTANT', 'pourcentage', 70, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 216101695, 'saisieMode', 'MONTANT', 'pourcentage', 30, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 129661017, 'montantTVAEtat', 129661017, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  850000000, 100,
  NOW() - INTERVAL '110 days', NOW() - INTERVAL '110 days'
);

-- TEST-CLOS (006) : tri-bailleur (Trésor + BM don + BAD emprunt + TVA État)
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0006-190000000006'::uuid,
  '00000000-0000-0000-0000-190000000006'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2025, 'bailleur', 'BM', 'typeFinancement', 'DON',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 508474576, 'saisieMode', 'MONTANT', 'pourcentage', 50, 'isTVAEtat', false),
    jsonb_build_object('annee', 2025, 'bailleur', 'BAD', 'typeFinancement', 'EMPRUNT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 304964407, 'saisieMode', 'MONTANT', 'pourcentage', 30, 'isTVAEtat', false),
    jsonb_build_object('annee', 2025, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 203510170, 'saisieMode', 'MONTANT', 'pourcentage', 20, 'isTVAEtat', false),
    jsonb_build_object('annee', 2025, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 183050847, 'montantTVAEtat', 183050847, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  1200000000, 100,
  NOW() - INTERVAL '350 days', NOW() - INTERVAL '350 days'
);

-- ============================================================
-- 4) DÉCOMPTES (EN_EXEC + CLOS)
-- ============================================================
-- TEST-EN_EXEC (005) : 1 décompte payé + 1 visé en cours
INSERT INTO mp_decompte
  (id, operation_id, numero, type_op, numero_op, date_decompte,
   acompte_htva, avance, garantie, penalite, net_htva, net_ttc,
   etat, bailleur, decision, taux_execution, document_ref,
   created_at, updated_at)
VALUES
('00000000-0000-0010-0105-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'DEC-2026-005-01', 'OP', 'OP-2026-1234', NOW() - INTERVAL '55 days',
 168389831, -16838983, -8419492, 0, 143131356, 168894995,
 'PAYE', 'BOAD', 'APPROUVE', 19.87, 'DOC_DEC_005_01.pdf',
 NOW() - INTERVAL '60 days', NOW() - INTERVAL '50 days'),

('00000000-0000-0010-0205-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'DEC-2026-005-02', 'OP', NULL, NOW() - INTERVAL '7 days',
 252754237, 0, -12637712, 0, 240116525, 283337500,
 'SOUMIS', 'BOAD', 'EN_ATTENTE', 33.33, 'DOC_DEC_005_02.pdf',
 NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days');

-- TEST-CLOS (006) : 4 décomptes tous payés
INSERT INTO mp_decompte
  (id, operation_id, numero, type_op, numero_op, date_decompte,
   acompte_htva, avance, garantie, penalite, net_htva, net_ttc,
   etat, bailleur, decision, taux_execution, document_ref,
   created_at, updated_at)
VALUES
('00000000-0000-0010-0106-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'DEC-2025-006-01', 'OP', 'OP-2025-9001', NOW() - INTERVAL '295 days',
 254237288, -25423729, -12711864, 0, 216101695, 255000000,
 'PAYE', 'BM', 'APPROUVE', 21.25, 'DOC_DEC_006_01.pdf',
 NOW() - INTERVAL '300 days', NOW() - INTERVAL '295 days'),
('00000000-0000-0010-0206-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'DEC-2025-006-02', 'OP', 'OP-2025-9002', NOW() - INTERVAL '205 days',
 305084746, 0, -15254237, 0, 289830509, 341999998,
 'PAYE', 'BAD', 'APPROUVE', 49.75, 'DOC_DEC_006_02.pdf',
 NOW() - INTERVAL '210 days', NOW() - INTERVAL '205 days'),
('00000000-0000-0010-0306-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'DEC-2025-006-03', 'OP', 'OP-2025-9003', NOW() - INTERVAL '115 days',
 305084746, 0, -15254237, -500000, 289330509, 341410000,
 'PAYE', 'TRESOR', 'APPROUVE', 78.20, 'DOC_DEC_006_03.pdf',
 NOW() - INTERVAL '120 days', NOW() - INTERVAL '115 days'),
('00000000-0000-0010-0406-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'DEC-2025-006-04', 'OP', 'OP-2025-9004', NOW() - INTERVAL '25 days',
 152542373, 0, -45762712, 0, 106779661, 126000000,
 'PAYE', 'TRESOR', 'APPROUVE', 98.33, 'DOC_DEC_006_04.pdf',
 NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days');

-- ============================================================
-- 5) GARANTIE D'AVANCE (en plus de la BE de migration 020)
-- ============================================================
-- TEST-EN_EXEC (005) : garantie d'avance active (15% du marché)
INSERT INTO mp_garantie (id, operation_id, type, montant, taux,
   date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc,
   created_at, updated_at)
VALUES
('00000000-0000-0011-0005-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'AVANCE', 127500000, 15,
 NOW() - INTERVAL '80 days', NOW() + INTERVAL '285 days',
 'ACTIVE', 'DOC_GAR_AV_005.pdf', NULL, NULL,
 NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),

-- TEST-EN_EXEC (005) : garantie de bonne exécution active
('00000000-0000-0011-1005-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'BONNE_EXEC', 42500000, 5,
 NOW() - INTERVAL '80 days', NOW() + INTERVAL '365 days',
 'ACTIVE', 'DOC_GAR_BE_005.pdf', NULL, NULL,
 NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),

-- TEST-CLOS (006) : garantie d'avance levée
('00000000-0000-0011-0006-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'AVANCE', 180000000, 15,
 NOW() - INTERVAL '320 days', NOW() - INTERVAL '120 days',
 'LEVEE', 'DOC_GAR_AV_006.pdf',
 NOW() - INTERVAL '125 days', 'DOC_MAINLEVEE_AV_006.pdf',
 NOW() - INTERVAL '320 days', NOW() - INTERVAL '120 days');

-- ============================================================
-- 6) ANO (Avis de Non-Objection) pour les marchés AOO
-- ============================================================
-- TEST-EN_EXEC (005) — AOO/BOAD : ANO DGMP + ANO BOAD favorables
INSERT INTO mp_ano
  (id, operation_id, type, organisme, organisme_detail,
   date_demande, date_reponse, decision, document_demande, document_reponse,
   created_at, updated_at)
VALUES
('00000000-0000-0012-0105-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'PROCEDURE', 'DGMP', 'Direction Générale des Marchés Publics',
 NOW() - INTERVAL '160 days', NOW() - INTERVAL '150 days',
 'FAVORABLE', 'DOC_DEM_ANO_DGMP_005.pdf', 'DOC_REP_ANO_DGMP_005.pdf',
 NOW() - INTERVAL '160 days', NOW() - INTERVAL '150 days'),

('00000000-0000-0012-0205-190000000005'::uuid,
 '00000000-0000-0000-0000-190000000005'::uuid,
 'PROCEDURE', 'BOAD', 'Banque Ouest-Africaine de Développement',
 NOW() - INTERVAL '155 days', NOW() - INTERVAL '140 days',
 'FAVORABLE', 'DOC_DEM_ANO_BOAD_005.pdf', 'DOC_REP_ANO_BOAD_005.pdf',
 NOW() - INTERVAL '155 days', NOW() - INTERVAL '140 days'),

-- TEST-CLOS (006) — AOO/BM/BAD : 3 ANO bailleurs favorables
('00000000-0000-0012-0106-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'PROCEDURE', 'DGMP', 'Direction Générale des Marchés Publics',
 NOW() - INTERVAL '395 days', NOW() - INTERVAL '385 days',
 'FAVORABLE', 'DOC_DEM_ANO_DGMP_006.pdf', 'DOC_REP_ANO_DGMP_006.pdf',
 NOW() - INTERVAL '395 days', NOW() - INTERVAL '385 days'),
('00000000-0000-0012-0206-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'PROCEDURE', 'BM', 'Banque Mondiale',
 NOW() - INTERVAL '390 days', NOW() - INTERVAL '375 days',
 'FAVORABLE', 'DOC_DEM_ANO_BM_006.pdf', 'DOC_REP_ANO_BM_006.pdf',
 NOW() - INTERVAL '390 days', NOW() - INTERVAL '375 days'),
('00000000-0000-0012-0306-190000000006'::uuid,
 '00000000-0000-0000-0000-190000000006'::uuid,
 'PROCEDURE', 'BAD', 'Banque Africaine de Développement',
 NOW() - INTERVAL '388 days', NOW() - INTERVAL '372 days',
 'FAVORABLE', 'DOC_DEM_ANO_BAD_006.pdf', 'DOC_REP_ANO_BAD_006.pdf',
 NOW() - INTERVAL '388 days', NOW() - INTERVAL '372 days');

COMMIT;

-- ============================================
-- Vérification
-- ============================================
SELECT
  op.etat,
  SUBSTRING(op.objet, 1, 30) AS objet,
  COALESCE((SELECT COUNT(*) FROM mp_echeancier      WHERE operation_id = op.id), 0) AS ech,
  COALESCE((SELECT COUNT(*) FROM mp_cle_repartition WHERE operation_id = op.id), 0) AS cle,
  COALESCE((SELECT COUNT(*) FROM mp_decompte        WHERE operation_id = op.id), 0) AS dec,
  COALESCE((SELECT COUNT(*) FROM mp_garantie        WHERE operation_id = op.id), 0) AS gar,
  COALESCE((SELECT COUNT(*) FROM mp_ano             WHERE operation_id = op.id), 0) AS ano
FROM mp_operation op
WHERE op.id::text LIKE '00000000-0000-0000-0000-1900%'
ORDER BY array_position(ARRAY['PLANIFIE','EN_PROC','ATTRIBUE','VISE','EN_EXEC','CLOS','RESILIE']::text[], op.etat);
