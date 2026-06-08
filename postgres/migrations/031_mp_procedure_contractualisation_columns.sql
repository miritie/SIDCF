-- ============================================================
-- 031 — Colonnes de contractualisation manquantes sur mp_procedure
-- ============================================================
-- Contexte : le Worker Cloudflare (postgres/worker/src/index.js) écrit chaque
-- entité COLONNE PAR COLONNE (camelToSnake), sans colonne JSONB fourre-tout, et
-- renvoie une erreur 500 sur toute colonne inconnue (l'adaptateur la propage,
-- sans fallback). Or les écrans de contractualisation (modifs #105 → #150)
-- écrivent dans MP_PROCEDURE de nombreux champs qui n'avaient jamais reçu de
-- colonne en base — la sauvegarde de la contractualisation échouait donc en
-- mode postgres (constat #150). Cette migration crée toutes les colonnes
-- attendues, de façon idempotente (ADD COLUMN IF NOT EXISTS).
--
-- IMPORTANT — convention de nommage : camelToSnake du Worker insère un « _ »
-- AVANT CHAQUE majuscule. Donc sansCF → sans_c_f, numBC → num_b_c,
-- reserveCF → reserve_c_f, sousProcedurePI → sous_procedure_p_i, etc.
-- Les noms ci-dessous DOIVENT correspondre exactement à cette transformation,
-- sinon l'UPDATE échouera toujours.
-- ============================================================

-- Organisation du marché (#105)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS allotissement TEXT;             -- allotissement
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS numero_dossier_appel TEXT;       -- numeroDossierAppel

-- Sans CF (#108) et réserves CF déplacées en contractualisation (#122)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS sans_c_f BOOLEAN;                -- sansCF
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS reserve_c_f JSONB;              -- reserveCF

-- Attribution pressentie en contractualisation (#109/#114)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS attribution JSONB;              -- attribution

-- Pièces à joindre (#113)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS pieces_jointes JSONB;           -- piecesJointes

-- Prestations intellectuelles (#111) : sous-procédure + liste restreinte
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS sous_procedure_p_i TEXT;         -- sousProcedurePI
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS liste_restreinte JSONB;          -- listeRestreinte

-- Reconduction (#110) : contrôle DGMP
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS reconduction_control JSONB;      -- reconductionControl

-- Soumissionnaires (widget)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS soumissionnaires JSONB;          -- soumissionnaires

-- PSD — validation du devis / facture proforma + bon de commande (#79)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS fournisseur_nom TEXT;            -- fournisseurNom
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS ref_devis TEXT;                  -- refDevis
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS date_devis TEXT;                 -- dateDevis
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS doc_devis TEXT;                  -- docDevis
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS num_b_c TEXT;                    -- numBC
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS date_b_c TEXT;                   -- dateBC
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS doc_b_c TEXT;                    -- docBC

-- PSC — comparaison de devis / formulaire de sélection (#79/#109)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS nb_fournisseurs_consultes INTEGER; -- nbFournisseursConsultes
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS date_comparaison TEXT;           -- dateComparaison
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS fournisseur_retenu TEXT;         -- fournisseurRetenu
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS motif_selection TEXT;            -- motifSelection
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS note_selection TEXT;             -- noteSelection
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS nb_devis_recus INTEGER;          -- nbDevisRecus
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS tableau_comparatif TEXT;         -- tableauComparatif

-- Refonte contractualisation (#151 / V2) — cases « EXISTANT » PSD (non bloquant DB)
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS devis_existant BOOLEAN;          -- devisExistant
ALTER TABLE mp_procedure ADD COLUMN IF NOT EXISTS bc_existant BOOLEAN;             -- bcExistant
