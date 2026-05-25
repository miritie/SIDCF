-- ============================================
-- Migration 025 : Combler les lacunes data identifiées par l'audit Vague 1
-- ============================================
-- Audit a relevé les opérations TEST-* avec des entités manquantes vs leur état :
--   - 003 ATTRIBUE  : manque clé de répartition
--   - 101 ATTRIBUE  : manque clé de répartition + échéancier
--   - 102 VISE      : manque clé de répartition + échéancier
--   - 103 EN_EXEC   : manque OS + clé + échéancier + garanties (avance + BE) + décomptes
--   - 007 RESILIE   : manque échéancier (le marché a passé EN_EXEC avant résiliation)
--   - 104 PLANIFIE  : procDerogation.docId = NULL (justificatif manquant)
--
-- Convention UUID : suffix de l'entité existante (cf. migrations 020, 022) :
--   echeancier   00000000-0000-0008-XXXX
--   cle_repart   00000000-0000-0009-XXXX
--   decompte     00000000-0000-0010-NNXX
--   garantie     00000000-0000-0011-XXXX
--   OS           00000000-0000-0004-XXXX
--
-- IDEMPOTENT : DELETE par UUID préfixé puis INSERT.
-- ============================================

BEGIN;

-- ============================================================
-- 1) NETTOYAGE des entités déjà créées par cette migration
-- ============================================================
DELETE FROM mp_decompte        WHERE id::text LIKE '00000000-0000-0010-%-190000000103';
DELETE FROM mp_garantie        WHERE id::text LIKE '00000000-0000-0011-%-190000000103';
DELETE FROM mp_ordre_service   WHERE id::text LIKE '00000000-0000-0004-%-190000000103';
DELETE FROM mp_echeancier      WHERE id IN (
  '00000000-0000-0008-0101-190000000101'::uuid,
  '00000000-0000-0008-0102-190000000102'::uuid,
  '00000000-0000-0008-0007-190000000007'::uuid,
  '00000000-0000-0008-0103-190000000103'::uuid
);
DELETE FROM mp_cle_repartition WHERE id IN (
  '00000000-0000-0009-0003-190000000003'::uuid,
  '00000000-0000-0009-0101-190000000101'::uuid,
  '00000000-0000-0009-0102-190000000102'::uuid,
  '00000000-0000-0009-0103-190000000103'::uuid
);

-- ============================================================
-- 2) CLÉS DE RÉPARTITION manquantes
-- ============================================================
-- 003 ATTRIBUE (35M) : mono-bailleur Trésor
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0003-190000000003'::uuid,
  '00000000-0000-0000-0000-190000000003'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2026, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '232', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 29661017, 'saisieMode', 'MONTANT', 'pourcentage', 100, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 5338983, 'montantTVAEtat', 5338983, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  35000000, 100,
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
);

-- 101 ATTRIBUE (4.5M PSD) : mono-bailleur Trésor
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0101-190000000101'::uuid,
  '00000000-0000-0000-0000-190000000101'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2026, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '221', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 3813559, 'saisieMode', 'MONTANT', 'pourcentage', 100, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 686441, 'montantTVAEtat', 686441, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  4500000, 100,
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
);

-- 102 VISE (22M PSC) : mono-bailleur Trésor
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0102-190000000102'::uuid,
  '00000000-0000-0000-0000-190000000102'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2026, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 18644068, 'saisieMode', 'MONTANT', 'pourcentage', 100, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 3355932, 'montantTVAEtat', 3355932, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  22000000, 100,
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'
);

-- 103 EN_EXEC (2.5G AOO-MULTI) : tri-bailleurs (BAD + BOAD + TRESOR + TVA État)
INSERT INTO mp_cle_repartition (id, operation_id, lignes, total, sum_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0009-0103-190000000103'::uuid,
  '00000000-0000-0000-0000-190000000103'::uuid,
  jsonb_build_array(
    jsonb_build_object('annee', 2026, 'bailleur', 'BAD', 'typeFinancement', 'EMPRUNT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 1059322034, 'saisieMode', 'MONTANT', 'pourcentage', 50, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'BOAD', 'typeFinancement', 'EMPRUNT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 635593220, 'saisieMode', 'MONTANT', 'pourcentage', 30, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'TRESOR', 'typeFinancement', 'ETAT',
      'natureEco', '231', 'baseCalc', 'HT', 'etatSupporteTVA', false,
      'montant', 423728814, 'saisieMode', 'MONTANT', 'pourcentage', 20, 'isTVAEtat', false),
    jsonb_build_object('annee', 2026, 'bailleur', 'ETAT_CI', 'typeFinancement', 'ETAT',
      'natureEco', 'TVA', 'baseCalc', 'TTC', 'etatSupporteTVA', true,
      'montant', 381355932, 'montantTVAEtat', 381355932, 'saisieMode', 'MONTANT',
      'pourcentage', 18, 'isTVAEtat', true)
  ),
  2500000000, 100,
  NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'
);

-- ============================================================
-- 3) ÉCHÉANCIERS manquants
-- ============================================================
-- 101 ATTRIBUE (4.5M) : 2 échéances semestrielles
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0101-190000000101'::uuid,
  '00000000-0000-0000-0000-190000000101'::uuid,
  'SEMESTRIEL', 180,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() + INTERVAL '30 days')::date,
      'montant', 2250000, 'baseCalc', 'TTC', 'pourcentage', 50, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() + INTERVAL '120 days')::date,
      'montant', 2250000, 'baseCalc', 'TTC', 'pourcentage', 50, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  4500000, 100,
  NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
);

-- 102 VISE (22M) : 3 échéances trimestrielles
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0102-190000000102'::uuid,
  '00000000-0000-0000-0000-190000000102'::uuid,
  'TRIMESTRIEL', 90,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() + INTERVAL '15 days')::date,
      'montant', 6600000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'AVANCE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() + INTERVAL '105 days')::date,
      'montant', 11000000, 'baseCalc', 'TTC', 'pourcentage', 50, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() + INTERVAL '195 days')::date,
      'montant', 4400000, 'baseCalc', 'TTC', 'pourcentage', 20, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  22000000, 100,
  NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'
);

-- 103 EN_EXEC (2.5G) : 4 échéances annuelles
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0103-190000000103'::uuid,
  '00000000-0000-0000-0000-190000000103'::uuid,
  'TRIMESTRIEL', 90,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() - INTERVAL '130 days')::date,
      'montant', 500000000, 'baseCalc', 'TTC', 'pourcentage', 20, 'typeEcheance', 'AVANCE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() - INTERVAL '40 days')::date,
      'montant', 750000000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() + INTERVAL '50 days')::date,
      'montant', 750000000, 'baseCalc', 'TTC', 'pourcentage', 30, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 4, 'datePrevisionnelle', (NOW() + INTERVAL '140 days')::date,
      'montant', 500000000, 'baseCalc', 'TTC', 'pourcentage', 20, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  2500000000, 100,
  NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'
);

-- 007 RESILIE (60M) : échéancier établi avant résiliation
INSERT INTO mp_echeancier (id, operation_id, periodicite, periodicite_jours, items, total, total_pourcent, created_at, updated_at)
VALUES (
  '00000000-0000-0008-0007-190000000007'::uuid,
  '00000000-0000-0000-0000-190000000007'::uuid,
  'MENSUEL', 30,
  jsonb_build_array(
    jsonb_build_object('num', 1, 'datePrevisionnelle', (NOW() - INTERVAL '35 days')::date,
      'montant', 10000000, 'baseCalc', 'TTC', 'pourcentage', 16.67, 'typeEcheance', 'AVANCE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 2, 'datePrevisionnelle', (NOW() - INTERVAL '5 days')::date,
      'montant', 10000000, 'baseCalc', 'TTC', 'pourcentage', 16.67, 'typeEcheance', 'ACOMPTE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object()),
    jsonb_build_object('num', 3, 'datePrevisionnelle', (NOW() + INTERVAL '25 days')::date,
      'montant', 40000000, 'baseCalc', 'TTC', 'pourcentage', 66.66, 'typeEcheance', 'SOLDE',
      'livrablesCibles', jsonb_build_array(), 'statutsLivrables', jsonb_build_object())
  ),
  60000000, 100,
  NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days'
);

-- ============================================================
-- 4) OS pour 103 EN_EXEC + GARANTIES (avance + BE) + DÉCOMPTES
-- ============================================================
INSERT INTO mp_ordre_service
  (id, operation_id, numero, date_emission, objet, doc_ref,
   bureau_controle, bureau_etudes, created_at, updated_at)
VALUES
('00000000-0000-0004-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'OS-2026-103-01', NOW() - INTERVAL '130 days',
 'Ordre de service de démarrage des travaux de construction du siège régional',
 'DOC_OS_103.pdf',
 jsonb_build_object('type', 'ENTREPRISE', 'uaId', NULL, 'entrepriseId', '00000000-0000-0099-0103-190000000103', 'nom', 'MegaConstruct Africa SA'),
 jsonb_build_object('type', 'ENTREPRISE', 'uaId', NULL, 'entrepriseId', '00000000-0000-0099-2103-190000000103', 'nom', 'Ingénierie Générale & Travaux'),
 NOW() - INTERVAL '130 days', NOW() - INTERVAL '130 days');

-- Garantie d'avance (15% du marché)
INSERT INTO mp_garantie (id, operation_id, type, montant, taux,
   date_emission, date_echeance, etat, doc, mainlevee_date, mainlevee_doc,
   created_at, updated_at)
VALUES
('00000000-0000-0011-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'AVANCE', 375000000, 15,
 NOW() - INTERVAL '135 days', NOW() + INTERVAL '420 days',
 'ACTIVE', 'DOC_GAR_AV_103.pdf', NULL, NULL,
 NOW() - INTERVAL '135 days', NOW() - INTERVAL '135 days'),

-- Garantie de bonne exécution (5% du marché)
('00000000-0000-0011-1103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'BONNE_EXEC', 125000000, 5,
 NOW() - INTERVAL '135 days', NOW() + INTERVAL '540 days',
 'ACTIVE', 'DOC_GAR_BE_103.pdf', NULL, NULL,
 NOW() - INTERVAL '135 days', NOW() - INTERVAL '135 days');

-- 2 décomptes pour 103
INSERT INTO mp_decompte
  (id, operation_id, numero, type_op, numero_op, date_decompte,
   acompte_htva, avance, garantie, penalite, net_htva, net_ttc,
   etat, bailleur, decision, taux_execution, document_ref,
   created_at, updated_at)
VALUES
('00000000-0000-0010-0103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'DEC-2026-103-01', 'OP', 'OP-2026-7001', NOW() - INTERVAL '100 days',
 423728814, -42372881, -21186440, 0, 360169493, 425000002,
 'PAYE', 'BAD', 'APPROUVE', 17.00, 'DOC_DEC_103_01.pdf',
 NOW() - INTERVAL '105 days', NOW() - INTERVAL '100 days'),
('00000000-0000-0010-1103-190000000103'::uuid,
 '00000000-0000-0000-0000-190000000103'::uuid,
 'DEC-2026-103-02', 'OP', NULL, NOW() - INTERVAL '15 days',
 635593220, 0, -31779661, 0, 603813559, 712499999,
 'SOUMIS', 'BAD', 'EN_ATTENTE', 41.50, 'DOC_DEC_103_02.pdf',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days');

-- ============================================================
-- 5) DEROGATION DOC pour 104 (placeholder doc id)
-- ============================================================
UPDATE mp_operation
SET proc_derogation = proc_derogation || jsonb_build_object(
  'docId', 'DOC_DEROG_PLANIF_104.pdf'
)
WHERE id = '00000000-0000-0000-0000-190000000104'::uuid;

COMMIT;

-- ============================================
-- Vérification complète
-- ============================================
SELECT
  SUBSTRING(op.id::text FROM 30) AS id,
  op.etat,
  (SELECT COUNT(*) FROM mp_procedure      WHERE operation_id = op.id) AS pr,
  (SELECT COUNT(*) FROM mp_attribution    WHERE operation_id = op.id) AS at,
  (SELECT COUNT(*) FROM mp_visa_cf        WHERE operation_id = op.id) AS vi,
  (SELECT COUNT(*) FROM mp_ordre_service  WHERE operation_id = op.id) AS os,
  (SELECT COUNT(*) FROM mp_garantie       WHERE operation_id = op.id) AS ga,
  (SELECT COUNT(*) FROM mp_echeancier     WHERE operation_id = op.id) AS ec,
  (SELECT COUNT(*) FROM mp_cle_repartition WHERE operation_id = op.id) AS cl,
  (SELECT COUNT(*) FROM mp_decompte       WHERE operation_id = op.id) AS dc,
  (SELECT COUNT(*) FROM mp_ano            WHERE operation_id = op.id) AS an,
  (SELECT COUNT(*) FROM mp_cloture        WHERE operation_id = op.id) AS cl2,
  (SELECT COUNT(*) FROM mp_resiliation    WHERE operation_id = op.id) AS rs
FROM mp_operation op
WHERE op.id::text LIKE '00000000-0000-0000-0000-1900%'
ORDER BY op.id;
