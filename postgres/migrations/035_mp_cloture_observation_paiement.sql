-- ============================================================
-- 035 — Clôture : commentaire/observation sur la situation de paiement
-- ============================================================
-- Doc clôture 24/06 (Lot 1) — À la clôture, croiser montant total du marché et
-- cumul des décomptes, ressortir l'écart (les colonnes montant_marche_total /
-- montant_total_paye / ecart_montant existent déjà) et permettre un COMMENTAIRE
-- (marché soldé ou non). Seul ce commentaire manque en base.
--
-- Convention camelToSnake du Worker : observationPaiement -> observation_paiement
-- ============================================================

BEGIN;

ALTER TABLE mp_cloture ADD COLUMN IF NOT EXISTS observation_paiement TEXT;

COMMIT;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'mp_cloture'
  AND column_name = 'observation_paiement';
