-- ============================================
-- Migration 007: Fix source_financement and type_financement
-- ============================================
-- Mise à jour des opérations existantes avec les valeurs de source_financement et type_financement

-- Update based on existing data patterns
UPDATE operation SET
  type_financement = 'ETAT',
  source_financement = 'TRESOR'
WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'; -- DGI Siège

UPDATE operation SET
  type_financement = 'ETAT',
  source_financement = 'TRESOR'
WHERE id = '88888888-8888-8888-8888-888888888888'; -- Climatisation DGMP

UPDATE operation SET
  type_financement = 'ETAT',
  source_financement = 'TRESOR'
WHERE id = '77777777-7777-7777-7777-777777777777'; -- Mobilier bureau

UPDATE operation SET
  type_financement = 'ETAT',
  source_financement = 'TRESOR'
WHERE id = '66666666-6666-6666-6666-666666666666'; -- Maintenance automobile

UPDATE operation SET
  type_financement = 'ETAT',
  source_financement = 'TRESOR'
WHERE id = '55555555-5555-5555-5555-555555555555'; -- Véhicules 4x4

-- Pour les autres opérations, mettre une valeur par défaut
UPDATE operation SET
  type_financement = COALESCE(type_financement, 'ETAT'),
  source_financement = COALESCE(source_financement, 'TRESOR')
WHERE type_financement IS NULL OR source_financement IS NULL;

-- Vérification
SELECT id, objet, type_financement, source_financement
FROM operation
LIMIT 10;
