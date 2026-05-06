-- ============================================
-- Migration 015 : Marché+ — Entreprises sanctionnées (liste indicative)
-- ============================================
-- Crée la table mp_entreprise_sanction et la peuple avec un seed plausible.
-- IDEMPOTENT : ré-exécutable sans erreur (CREATE TABLE IF NOT EXISTS + INSERT
--              avec ON CONFLICT DO NOTHING sur l'id).
-- Réversible : DROP TABLE mp_entreprise_sanction;
-- ============================================

BEGIN;

CREATE TABLE IF NOT EXISTS mp_entreprise_sanction (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raison_sociale       TEXT NOT NULL,
  ncc                  TEXT,
  rccm                 TEXT,
  type_sanction        TEXT NOT NULL DEFAULT 'BLACKLIST',  -- BLACKLIST | SUSPENSION | AVERTISSEMENT
  gravite              TEXT NOT NULL DEFAULT 'BLOQUANTE',  -- BLOQUANTE | AVERTISSEMENT
  motif                TEXT,
  source               TEXT,                                -- DGMP | BAD | BANQUE_MONDIALE | UE | AFD | INTERNE
  decision_ref         TEXT,
  decision_url         TEXT,
  date_debut           DATE,
  date_fin             DATE,                                -- NULL = sans terme
  pays_applicable      TEXT DEFAULT 'CI',
  secteurs_applicables JSONB DEFAULT '[]'::jsonb,
  actif                BOOLEAN NOT NULL DEFAULT TRUE,
  commentaire          TEXT,
  created_by           TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches par identifiant fiscal et par nom
CREATE INDEX IF NOT EXISTS idx_mp_sanction_ncc ON mp_entreprise_sanction (ncc) WHERE ncc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mp_sanction_rccm ON mp_entreprise_sanction (rccm) WHERE rccm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mp_sanction_raison_sociale ON mp_entreprise_sanction (LOWER(raison_sociale));
CREATE INDEX IF NOT EXISTS idx_mp_sanction_actif ON mp_entreprise_sanction (actif) WHERE actif = TRUE;

-- Seed initial : 8 entreprises avec différents profils (bailleur, type, gravité)
INSERT INTO mp_entreprise_sanction
  (id, raison_sociale, ncc, rccm, type_sanction, gravite, motif, source, decision_ref, date_debut, date_fin, pays_applicable, actif, commentaire)
VALUES
  ('11111111-1111-1111-1111-aa0000000001',
   'GLOBAL TRADERS SARL',
   'CI-ABJ-2019-A-001234',
   'CI-ABJ-2019-B-005678',
   'BLACKLIST',
   'BLOQUANTE',
   'Production de faux documents de qualification (attestations fiscales falsifiées) lors de l''appel d''offres AOO/2024/MIN-INFRA/045',
   'DGMP',
   'Arrêté n°2024-0451/MEF/DGMP du 12/03/2024',
   '2024-03-15',
   '2027-03-14',
   'CI',
   TRUE,
   'Sanction de 3 ans confirmée après recours rejeté par la Commission de Régulation'),

  ('22222222-2222-2222-2222-aa0000000002',
   'CONSTRUCTIONS FAST AFRIQUE SA',
   'CI-ABJ-2015-A-007890',
   NULL,
   'SUSPENSION',
   'BLOQUANTE',
   'Conflit d''intérêts non déclaré : un des associés siège à la commission technique du marché PRJ-EAU-2024-012',
   'BAD',
   'Décision DGMP/AOC/2025/008',
   '2025-01-20',
   '2026-07-19',
   'CI',
   TRUE,
   'Suspension de 18 mois sur les marchés financés par la BAD'),

  ('33333333-3333-3333-3333-aa0000000003',
   'BUREAU CONSEIL EXCELLENCE',
   'CI-ABJ-2020-A-009876',
   'CI-ABJ-2020-B-001122',
   'BLACKLIST',
   'BLOQUANTE',
   'Pratiques frauduleuses avérées : surfacturation systématique sur 3 contrats consécutifs (Banque Mondiale)',
   'BANQUE_MONDIALE',
   'World Bank Sanctions List 2024-WB-CI-017',
   '2024-09-01',
   NULL,
   'CI',
   TRUE,
   'Inscription sur la liste des sanctions de la Banque Mondiale (durée indéterminée)'),

  ('44444444-4444-4444-4444-aa0000000004',
   'TRANSPORTS RAPIDES CI',
   'CI-ABJ-2018-A-003344',
   NULL,
   'AVERTISSEMENT',
   'AVERTISSEMENT',
   'Retards répétés dans la livraison (3 marchés en 2 ans), pénalités appliquées',
   'INTERNE',
   'Note interne DCF/2025/N-088',
   '2025-04-10',
   '2026-04-09',
   'CI',
   TRUE,
   'Avertissement formel — vigilance renforcée pour 12 mois'),

  ('55555555-5555-5555-5555-aa0000000005',
   'IMPORT EXPORT BUSINESS GROUP',
   NULL,
   'CI-ABJ-2017-B-007788',
   'BLACKLIST',
   'BLOQUANTE',
   'Faux en écriture, manœuvres frauduleuses lors de l''attribution du marché FOURNITURES/2023/MIN-EDU/078',
   'DGMP',
   'Arrêté n°2023-0987/MEF/DGMP',
   '2023-11-15',
   '2028-11-14',
   'CI',
   TRUE,
   'Inscription pour 5 ans (sanction maximale)'),

  ('66666666-6666-6666-6666-aa0000000006',
   'ENGINEERING & SERVICES PLUS',
   'CI-ABJ-2016-A-005566',
   'CI-ABJ-2016-B-003311',
   'SUSPENSION',
   'BLOQUANTE',
   'Non-exécution caractérisée du marché travaux PRJ-ROUTE-2024-005 (résiliation aux torts)',
   'INTERNE',
   'PV de résiliation DCF/2025/R-012',
   '2025-02-05',
   '2027-02-04',
   'CI',
   TRUE,
   'Suspension 24 mois suite à résiliation pour faute grave'),

  ('77777777-7777-7777-7777-aa0000000007',
   'CABINET AUDIT PREMIER',
   'CI-ABJ-2021-A-002211',
   NULL,
   'BLACKLIST',
   'BLOQUANTE',
   'Conflit d''intérêts dissimulé : audit complaisant pour une entreprise dirigée par un proche',
   'AFD',
   'AFD-CI-2024-SANCT-005',
   '2024-08-22',
   '2027-08-21',
   'CI',
   TRUE,
   'Sanction AFD applicable sur tous les projets cofinancés'),

  ('88888888-8888-8888-8888-aa0000000008',
   'BÂTIMENTS MODERNES SARL',
   'CI-ABJ-2014-A-008899',
   'CI-ABJ-2014-B-006677',
   'AVERTISSEMENT',
   'AVERTISSEMENT',
   'Documentation administrative incomplète (attestations CNPS/IF non à jour) lors de 2 appels récents',
   'INTERNE',
   NULL,
   '2025-03-01',
   '2025-12-31',
   'CI',
   TRUE,
   'Avertissement temporaire — à régulariser avant fin 2025')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Vérification
SELECT
  type_sanction,
  gravite,
  source,
  COUNT(*) AS nb
FROM mp_entreprise_sanction
GROUP BY type_sanction, gravite, source
ORDER BY type_sanction, source;
