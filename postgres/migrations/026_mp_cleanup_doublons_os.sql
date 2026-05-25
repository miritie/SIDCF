-- ============================================
-- Migration 026 : Nettoyage des doublons d'OS sur mp_ordre_service
-- ============================================
-- Cause : ancien bug ecr04a-execution-os.js — le bouton « Enregistrer l'OS »
-- ne se désactivait pas après clic, et le check `result.success` était trop
-- strict (renvoyait undefined sur certains formats Worker). L'utilisateur a
-- pu cliquer plusieurs fois, créant N doublons (cf. opération SYSCOHADA avec
-- 11 OS identiques).
--
-- Stratégie de dédoublonnage :
--   Pour chaque (operation_id, numero, date_emission), garder uniquement
--   l'OS le plus ancien (par created_at) et supprimer les autres.
--   Les OS de la migration 020/023 (préfixe UUID 00000000-0000-0004-%-19%)
--   sont préservés tels quels.
--
-- IDEMPOTENT : ne supprime que les vrais doublons identifiés par le WITH.
-- Réversible : non automatique (pas de backup avant DELETE), mais les
-- doublons supprimés étaient identiques à l'original conservé.
-- ============================================

BEGIN;

-- Identifier les doublons (groupes ≥ 2) et supprimer tous sauf le plus ancien
WITH ranked AS (
  SELECT
    id,
    operation_id,
    numero,
    date_emission,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY operation_id, COALESCE(numero, ''), COALESCE(date_emission::text, '')
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM mp_ordre_service
)
DELETE FROM mp_ordre_service
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

COMMIT;

-- ============================================
-- Vérification
-- ============================================
SELECT
  operation_id,
  COUNT(*) AS nb_os,
  STRING_AGG(numero, ', ' ORDER BY date_emission) AS numeros
FROM mp_ordre_service
GROUP BY operation_id
HAVING COUNT(*) > 1
ORDER BY nb_os DESC
LIMIT 20;

-- Si la table est vide ci-dessus, c'est que le nettoyage est complet.
SELECT 'Total OS restants :' AS info, COUNT(*) AS total FROM mp_ordre_service;
