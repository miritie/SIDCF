-- ============================================
-- Migration 015 : Aligner mp_budget_line sur ua-activites.json (Marché+)
-- ============================================
-- Le seed mp_budget_line utilise des codes activité de l'ancien format
-- (ex: 520-03-005) qui ne matchent pas le nouveau référentiel
-- sidcf-portal/js/config/ua-activites.json (ex: ACT_13001_001).
--
-- Cette migration :
--   1. Supprime les lignes avec l'ancien format (codes ne commençant pas par "ACT_")
--   2. Insère 17 lignes alignées sur le référentiel ua-activites.json
--   3. Couvre les 11 activités (UA 13001 et 13030) avec un mix
--      ETAT/EMPRUNT/DON pour permettre de tester le multi-financement
--      et un dépassement (ACT_13001_005 = AE volontairement faible).
--
-- IDEMPOTENT : ré-exécutable. Le DELETE retire toujours l'ancien format,
-- l'INSERT vérifie l'absence de l'ID via ON CONFLICT.
--
-- Réversible :
--   DELETE FROM mp_budget_line WHERE activite_code LIKE 'ACT_%';
-- ============================================

BEGIN;

-- 1) Nettoyage : virer les lignes avec l'ancien format de code activité
DELETE FROM mp_budget_line
WHERE activite_code IS NULL
   OR activite_code NOT LIKE 'ACT_%';

-- 2) Insertion des lignes alignées (idempotent via ON CONFLICT sur ligne_code)
-- Pour rester idempotent, on supprime d'abord les ACT_ existants pour les codes ciblés
DELETE FROM mp_budget_line WHERE activite_code IN (
  'ACT_13001_001','ACT_13001_002','ACT_13001_003','ACT_13001_004','ACT_13001_005',
  'ACT_13030_001','ACT_13030_002','ACT_13030_003','ACT_13030_004','ACT_13030_005','ACT_13030_006'
);

INSERT INTO mp_budget_line
  (id, section, section_lib, programme, programme_lib, grande_nature,
   ua_code, ua_lib, zone_code, zone_lib, action_code, action_lib,
   activite_code, activite_lib, type_financement, source_financement,
   ligne_code, ligne_lib, ae, cp, created_at, updated_at)
VALUES
  -- ============================================================
  -- UA 13001 — Section 31990001 / Programme 780102
  -- ============================================================

  -- ACT_13001_001 — Réhabilitation des infrastructures (INFRASTRUCTURE) → 3 lignes (ETAT + DON + EMPRUNT)
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
   '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-INF', 'Réhabilitation',
   'ACT_13001_001', 'Réhabilitation des infrastructures administratives', 'ETAT', 'TRESOR',
   'ACT_13001_001-ETAT', 'Réhabilitation infrastructures (Trésor)', 3000000000, 1500000000, NOW(), NOW()),
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
   '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-INF', 'Réhabilitation',
   'ACT_13001_001', 'Réhabilitation des infrastructures administratives', 'DON', 'BM',
   'ACT_13001_001-DON-BM', 'Réhabilitation infrastructures (BM)', 2000000000, 1200000000, NOW(), NOW()),
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
   '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-INF', 'Réhabilitation',
   'ACT_13001_001', 'Réhabilitation des infrastructures administratives', 'EMPRUNT', 'BAD',
   'ACT_13001_001-EMP-BAD', 'Réhabilitation infrastructures (BAD)', 1500000000, 800000000, NOW(), NOW()),

  -- ACT_13001_002 — Acquisition équipements bureautiques (EQUIPEMENT) → 2 lignes
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
   '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-EQP', 'Équipement',
   'ACT_13001_002', 'Acquisition d''équipements bureautiques', 'ETAT', 'TRESOR',
   'ACT_13001_002-ETAT', 'Équipements bureautiques (Trésor)', 500000000, 350000000, NOW(), NOW()),
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '4',
   '13001', 'Assemblée N 1 Investissements', '01', 'Zone Centre', '780102-EQP', 'Équipement',
   'ACT_13001_002', 'Acquisition d''équipements bureautiques', 'DON', 'AFD',
   'ACT_13001_002-DON-AFD', 'Équipements bureautiques (AFD)', 300000000, 200000000, NOW(), NOW()),

  -- ACT_13001_003 — Formation du personnel (FORMATION) → 1 ligne ETAT
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
   '13001', 'Assemblée N 1 Personnel', '01', 'Zone Centre', '780102-FOR', 'Formation',
   'ACT_13001_003', 'Formation du personnel administratif', 'ETAT', 'TRESOR',
   'ACT_13001_003-ETAT', 'Formation personnel (Trésor)', 100000000, 80000000, NOW(), NOW()),

  -- ACT_13001_004 — Prestations services courants (SERVICE) → 1 ligne ETAT
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
   '13001', 'Assemblée N 2 Biens et services', '01', 'Zone Centre', '780102-SVC', 'Services',
   'ACT_13001_004', 'Prestations de services courants', 'ETAT', 'TRESOR',
   'ACT_13001_004-ETAT', 'Services courants (Trésor)', 200000000, 150000000, NOW(), NOW()),

  -- ACT_13001_005 — Études et audits (ETUDE) → 2 lignes (AE petits pour TESTER LE DÉPASSEMENT)
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
   '13001', 'Assemblée N 2 Biens et services', '01', 'Zone Centre', '780102-ETD', 'Études',
   'ACT_13001_005', 'Études et audits', 'ETAT', 'TRESOR',
   'ACT_13001_005-ETAT', 'Études et audits (Trésor)', 50000000, 30000000, NOW(), NOW()),
  (gen_random_uuid(), '31990001', 'Direction de zone 780 102', '780102', 'Sous-préfecture 1300101', '2',
   '13001', 'Assemblée N 2 Biens et services', '01', 'Zone Centre', '780102-ETD', 'Études',
   'ACT_13001_005', 'Études et audits', 'DON', 'BM',
   'ACT_13001_005-DON-BM', 'Études et audits (BM)', 80000000, 50000000, NOW(), NOW()),

  -- ============================================================
  -- UA 13030 — Section 13030016 (Sénat) / Programme 110101
  -- ============================================================

  -- ACT_13030_001 — Construction bâtiments administratifs (INFRASTRUCTURE) → 2 lignes
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
   '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-INF', 'Construction',
   'ACT_13030_001', 'Construction de bâtiments administratifs', 'ETAT', 'TRESOR',
   'ACT_13030_001-ETAT', 'Construction bâtiments (Trésor)', 4000000000, 2500000000, NOW(), NOW()),
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
   '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-INF', 'Construction',
   'ACT_13030_001', 'Construction de bâtiments administratifs', 'EMPRUNT', 'BOAD',
   'ACT_13030_001-EMP-BOAD', 'Construction bâtiments (BOAD)', 2500000000, 1500000000, NOW(), NOW()),

  -- ACT_13030_002 — Équipement salles de réunion (EQUIPEMENT) → 1 ligne
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
   '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-EQP', 'Équipement',
   'ACT_13030_002', 'Équipement des salles de réunion', 'ETAT', 'TRESOR',
   'ACT_13030_002-ETAT', 'Équipement salles (Trésor)', 600000000, 400000000, NOW(), NOW()),

  -- ACT_13030_003 — Services entretien et maintenance (SERVICE) → 1 ligne
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
   '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-MNT', 'Maintenance',
   'ACT_13030_003', 'Services d''entretien et maintenance', 'ETAT', 'TRESOR',
   'ACT_13030_003-ETAT', 'Entretien et maintenance (Trésor)', 300000000, 200000000, NOW(), NOW()),

  -- ACT_13030_004 — Acquisition véhicules (EQUIPEMENT) → 1 ligne
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '4',
   '13030', 'Assemblée N 3 Investissements', '02', 'Zone Sud', '110101-VEH', 'Véhicules',
   'ACT_13030_004', 'Acquisition de véhicules administratifs', 'ETAT', 'TRESOR',
   'ACT_13030_004-ETAT', 'Véhicules administratifs (Trésor)', 800000000, 500000000, NOW(), NOW()),

  -- ACT_13030_005 — Fournitures de bureau (FOURNITURE) → 1 ligne
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
   '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-FRN', 'Fournitures',
   'ACT_13030_005', 'Fournitures de bureau', 'ETAT', 'TRESOR',
   'ACT_13030_005-ETAT', 'Fournitures de bureau (Trésor)', 100000000, 75000000, NOW(), NOW()),

  -- ACT_13030_006 — Prestations intellectuelles et conseil (ETUDE) → 2 lignes
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
   '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-INT', 'Études et conseil',
   'ACT_13030_006', 'Prestations intellectuelles et conseil', 'ETAT', 'TRESOR',
   'ACT_13030_006-ETAT', 'Études et conseil (Trésor)', 250000000, 180000000, NOW(), NOW()),
  (gen_random_uuid(), '13030016', 'Sénat', '110101', 'Sous-préfecture 1303001', '2',
   '13030', 'Assemblée N 3 Biens et services', '02', 'Zone Sud', '110101-INT', 'Études et conseil',
   'ACT_13030_006', 'Prestations intellectuelles et conseil', 'DON', 'UE',
   'ACT_13030_006-DON-UE', 'Études et conseil (UE)', 400000000, 250000000, NOW(), NOW());

COMMIT;

-- ============================================
-- Vérification post-migration
-- ============================================
SELECT
  activite_code,
  COUNT(*) AS nb_lignes,
  STRING_AGG(type_financement || '/' || source_financement, ', ' ORDER BY type_financement) AS triplets,
  SUM(ae)::BIGINT AS total_ae
FROM mp_budget_line
WHERE activite_code LIKE 'ACT_%'
GROUP BY activite_code
ORDER BY activite_code;
