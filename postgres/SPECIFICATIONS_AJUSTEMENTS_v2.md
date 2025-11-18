# 📋 SIDCF Portal - Spécifications Techniques des Ajustements v2.0

**Date**: 2025-11-17
**Version**: 2.0 - Ajustements Post-Tests
**Architecture**: PostgreSQL + Cloudflare R2

---

## 🎯 RÉSUMÉ EXÉCUTIF

Ce document détaille les ajustements nécessaires suite aux retours de tests utilisateurs pour assurer la conformité complète avec le Code des Marchés Publics de Côte d'Ivoire et les pratiques DCF/DGMP.

### Principaux Ajustements

1. **Séparation Marché de Base / Avenants** - Distinction claire des données
2. **Gestion des Lots** - Support des lots multiples avec soumissionnaires
3. **Soumissionnaires Optionnels** - Priorité à la documentation
4. **Nouveaux Champs Métier** - 25+ champs additionnels identifiés
5. **Coordonnées Géographiques** - Jusqu'au niveau village
6. **Seuils Officiels** - Validation conforme Code des Marchés CI

---

## 📐 ARCHITECTURE PostgreSQL ÉTENDUE

### 🆕 NOUVELLES TABLES

#### 1. TABLE `LOT` - Lots de Marchés

```sql
CREATE TABLE IF NOT EXISTS lot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    objet TEXT NOT NULL,

    -- Montants prévisionnels
    montant_previsionnel_ht DECIMAL(15,2) DEFAULT 0,
    montant_previsionnel_ttc DECIMAL(15,2) DEFAULT 0,

    -- Livrables attendus
    livrables_attendus JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{type, libelle, quantite, unite}]

    -- Entreprises soumissionnaires sur le lot
    soumissionnaires JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{entreprise_id, montant_offre_ht, montant_offre_ttc, rang}]

    -- Attributaire du lot (si alloti)
    attributaire_id UUID REFERENCES entreprise(id) ON DELETE SET NULL,
    montant_attribution_ht DECIMAL(15,2) DEFAULT 0,
    montant_attribution_ttc DECIMAL(15,2) DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lot_operation_id ON lot(operation_id);
CREATE INDEX idx_lot_attributaire_id ON lot(attributaire_id);

COMMENT ON TABLE lot IS 'Lots de marchés pour procédures allotis (PSC, PSL, PSO, AOO, PI)';
```

#### 2. TABLE `SOUMISSIONNAIRE` - Soumissionnaires (Optionnel)

```sql
CREATE TABLE IF NOT EXISTS soumissionnaire (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operation(id) ON DELETE CASCADE,
    lot_id UUID REFERENCES lot(id) ON DELETE SET NULL,

    entreprise_id UUID REFERENCES entreprise(id) ON DELETE SET NULL,
    groupement_id UUID REFERENCES groupement(id) ON DELETE SET NULL,

    -- Offre
    montant_offre_ht DECIMAL(15,2) DEFAULT 0,
    montant_offre_ttc DECIMAL(15,2) DEFAULT 0,
    delai_propose INTEGER, -- en jours

    -- Évaluation
    rang INTEGER, -- classement après analyse
    note_technique DECIMAL(5,2),
    note_financiere DECIMAL(5,2),
    note_finale DECIMAL(5,2),

    -- Statut
    conforme BOOLEAN DEFAULT TRUE,
    retenu BOOLEAN DEFAULT FALSE,
    statut_sanctionne BOOLEAN DEFAULT FALSE, -- Liste noire
    motif_non_conformite TEXT,

    -- Documents
    documents JSONB DEFAULT '[]'::jsonb,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT check_entreprise_or_groupement CHECK (
        (entreprise_id IS NOT NULL AND groupement_id IS NULL) OR
        (entreprise_id IS NULL AND groupement_id IS NOT NULL)
    )
);

CREATE INDEX idx_soumissionnaire_operation_id ON soumissionnaire(operation_id);
CREATE INDEX idx_soumissionnaire_lot_id ON soumissionnaire(lot_id);
CREATE INDEX idx_soumissionnaire_entreprise_id ON soumissionnaire(entreprise_id);
CREATE INDEX idx_soumissionnaire_groupement_id ON soumissionnaire(groupement_id);
CREATE INDEX idx_soumissionnaire_retenu ON soumissionnaire(retenu);

COMMENT ON TABLE soumissionnaire IS 'Soumissionnaires (OPTIONNEL - privilégier upload documentation)';
```

---

### 🔄 TABLES À MODIFIER

#### 1. TABLE `operation` - Ajouts Planification

```sql
ALTER TABLE operation ADD COLUMN IF NOT EXISTS unite_operationnelle VARCHAR(255);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS activite_code VARCHAR(50);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS activite_lib TEXT;
ALTER TABLE operation ADD COLUMN IF NOT EXISTS type_operation VARCHAR(50)
    CHECK (type_operation IN ('MARCHE_100M_PLUS', 'CONTRAT_MOINS_100M'));

-- Coordonnées géographiques
ALTER TABLE operation ADD COLUMN IF NOT EXISTS coordonnees_geo JSONB DEFAULT '{}'::jsonb;
-- Structure: {
--   "region": "Abidjan",
--   "departement": "Yopougon",
--   "sous_prefecture": "Yopougon",
--   "village": "Village X",
--   "latitude": 5.3599517,
--   "longitude": -4.0082563
-- }

-- Seuils et conformité
ALTER TABLE operation ADD COLUMN IF NOT EXISTS seuil_montant_min DECIMAL(15,2);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS seuil_montant_max DECIMAL(15,2);
ALTER TABLE operation ADD COLUMN IF NOT EXISTS conforme_seuils BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN operation.unite_operationnelle IS 'Unité Opérationnelle (distinct de UA budgétaire)';
COMMENT ON COLUMN operation.coordonnees_geo IS 'Localisation géographique précise (jusqu\'au village)';
COMMENT ON COLUMN operation.type_operation IS 'Classification selon montant: Marché 100M+ ou Contrat <100M';
```

#### 2. TABLE `procedure` - Ajouts Contractualisation

```sql
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS date_selection TIMESTAMPTZ;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS formulaire_selection_doc TEXT; -- URL R2

-- Pour PSD
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS bon_commande_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS facture_proforma_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS prestataire_sanctionne BOOLEAN DEFAULT FALSE;

-- Pour PSC/PSL/PSO/AOO
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS dossier_concurrence_doc TEXT; -- URL R2 vers archive ZIP
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS courrier_invitation_doc TEXT;
ALTER TABLE procedure ADD COLUMN IF NOT EXISTS mandat_representation_doc TEXT;

COMMENT ON COLUMN procedure.date_selection IS 'Date de sélection finale du prestataire (PSD/PSC)';
COMMENT ON COLUMN procedure.prestataire_sanctionne IS 'Prestataire sur liste noire (vérification obligatoire)';
COMMENT ON COLUMN procedure.dossier_concurrence_doc IS 'Archive complète du dossier de concurrence';
```

#### 3. TABLE `attribution` - Distinction PSD/PSC + Marché de Base

```sql
-- Restructuration des champs JSONB en colonnes pour meilleure requêtabilité
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS numero_bon_commande VARCHAR(50);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS numero_lettre_marche VARCHAR(50);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS numero_facture_definitive VARCHAR(50);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS date_visa_cf TIMESTAMPTZ;

-- Marché de base - Fichiers
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS marche_signe_doc TEXT; -- URL R2
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS lettre_marche_doc TEXT; -- URL R2
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS facture_definitive_doc TEXT; -- URL R2

-- Garanties détaillées (extraction du JSONB)
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS avance_demarrage_taux DECIMAL(5,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS avance_demarrage_montant DECIMAL(15,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_avance_doc TEXT;
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_bonne_execution_taux DECIMAL(5,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_bonne_execution_montant DECIMAL(15,2);
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_bonne_execution_doc TEXT;
ALTER TABLE attribution ADD COLUMN IF NOT EXISTS garantie_duree_jours INTEGER;

COMMENT ON COLUMN attribution.numero_bon_commande IS 'Numéro bon de commande (PSD)';
COMMENT ON COLUMN attribution.numero_lettre_marche IS 'Numéro lettre de marché (PSC)';
COMMENT ON COLUMN attribution.marche_signe_doc IS 'Fichier du marché de base signé et approuvé';
```

#### 4. TABLE `avenant` - Séparation Claire Marché/Avenant

```sql
-- Types d'avenant détaillés
ALTER TABLE avenant DROP CONSTRAINT IF EXISTS avenant_type_check;
ALTER TABLE avenant ADD CONSTRAINT avenant_type_check CHECK (
    type IN (
        'AVEC_INCIDENCE_FINANCIERE',
        'SANS_INCIDENCE_FINANCIERE',
        'PORTANT_SUR_DUREE',
        'PORTANT_SUR_LIBELLE',
        'PORTANT_SUR_NATURE_ECO',
        'MIXTE'
    )
);

-- Fichiers avenant distincts du marché de base
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS avenant_signe_doc TEXT; -- URL R2 - Fichier avenant
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS justificatif_avenant_doc TEXT; -- URL R2 - Pièces justificatives

-- Traçabilité état marché avant/après
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS montant_avant DECIMAL(15,2);
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS montant_apres DECIMAL(15,2);
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS duree_avant INTEGER;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS duree_apres INTEGER;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS objet_avant TEXT;
ALTER TABLE avenant ADD COLUMN IF NOT EXISTS objet_apres TEXT;

COMMENT ON COLUMN avenant.avenant_signe_doc IS 'Fichier de l\'avenant signé (DISTINCT du marché de base)';
COMMENT ON COLUMN avenant.justificatif_avenant_doc IS 'Pièces justificatives de l\'avenant';
```

#### 5. TABLE `ordre_service` - Champs Exécution

```sql
ALTER TABLE ordre_service ADD COLUMN IF NOT EXISTS duree_execution_prevue INTEGER; -- en jours
ALTER TABLE ordre_service ADD COLUMN IF NOT EXISTS date_fin_previsionnelle TIMESTAMPTZ;

COMMENT ON COLUMN ordre_service.duree_execution_prevue IS 'Durée d\'exécution prévue à partir de l\'OS DEMARRAGE';
```

#### 6. TABLE `cloture` - Ajouts Date Fin Réelle + Satisfaction

```sql
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS date_fin_reelle TIMESTAMPTZ;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS date_dernier_decompte TIMESTAMPTZ;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS satisfaction_beneficiaires TEXT;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS livrables_conformes BOOLEAN DEFAULT TRUE;
ALTER TABLE cloture ADD COLUMN IF NOT EXISTS observations_finales TEXT;

COMMENT ON COLUMN cloture.date_fin_reelle IS 'Date de fin réelle du marché (date du dernier décompte)';
COMMENT ON COLUMN cloture.satisfaction_beneficiaires IS 'Feedback des bénéficiaires sur les livrables';
```

#### 7. TABLE `entreprise` - Ajout Statut Sanctionné

```sql
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS sanctionne BOOLEAN DEFAULT FALSE;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS date_sanction TIMESTAMPTZ;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS motif_sanction TEXT;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS fin_sanction TIMESTAMPTZ;
ALTER TABLE entreprise ADD COLUMN IF NOT EXISTS statut_juridique VARCHAR(100);

CREATE INDEX idx_entreprise_sanctionne ON entreprise(sanctionne);

COMMENT ON COLUMN entreprise.sanctionne IS 'Entreprise sur liste noire (interdiction de soumissionner)';
```

---

### 📊 VUES MÉTIER ENRICHIES

#### Vue: Opérations avec Géolocalisation

```sql
CREATE OR REPLACE VIEW v_operations_geo AS
SELECT
    o.id,
    o.objet,
    o.unite,
    o.exercice,
    o.mode_passation,
    o.montant_actuel,
    o.etat,
    o.coordonnees_geo->>'region' as region,
    o.coordonnees_geo->>'departement' as departement,
    o.coordonnees_geo->>'sous_prefecture' as sous_prefecture,
    o.coordonnees_geo->>'village' as village,
    CAST(o.coordonnees_geo->>'latitude' AS FLOAT) as latitude,
    CAST(o.coordonnees_geo->>'longitude' AS FLOAT) as longitude
FROM operation o
WHERE o.coordonnees_geo IS NOT NULL
AND o.coordonnees_geo->>'latitude' IS NOT NULL;

COMMENT ON VIEW v_operations_geo IS 'Opérations avec coordonnées géographiques pour mapping';
```

#### Vue: Marchés avec Avenants Cumulés

```sql
CREATE OR REPLACE VIEW v_marches_avenants_cumul AS
SELECT
    o.id as operation_id,
    o.objet,
    o.montant_previsionnel as montant_initial,
    o.montant_actuel as montant_avec_avenants,
    COUNT(av.id) as nb_avenants,
    SUM(av.variation_montant) as total_variation_montant,
    MAX(av.cumul_pourcent) as cumul_pourcent_max,
    CASE
        WHEN MAX(av.cumul_pourcent) >= 30 THEN 'CRITIQUE'
        WHEN MAX(av.cumul_pourcent) >= 25 THEN 'ALERTE'
        ELSE 'NORMAL'
    END as statut_avenants
FROM operation o
LEFT JOIN avenant av ON av.operation_id = o.id
WHERE o.etat IN ('EN_EXEC', 'CLOTURE')
GROUP BY o.id;

COMMENT ON VIEW v_marches_avenants_cumul IS 'Suivi des avenants cumulés avec alertes 25/30%';
```

#### Vue: Statistiques par Mode de Passation

```sql
CREATE OR REPLACE VIEW v_stats_mode_passation AS
SELECT
    mode_passation,
    COUNT(*) as nb_marches,
    SUM(montant_actuel) as montant_total,
    AVG(montant_actuel) as montant_moyen,
    COUNT(DISTINCT CASE WHEN etat = 'CLOTURE' THEN id END) as nb_clotures,
    COUNT(DISTINCT CASE WHEN conforme_seuils = FALSE THEN id END) as nb_derogations
FROM operation
WHERE mode_passation IS NOT NULL
GROUP BY mode_passation
ORDER BY nb_marches DESC;

COMMENT ON VIEW v_stats_mode_passation IS 'Statistiques par mode de passation';
```

---

## 🔧 RÈGLES MÉTIER À IMPLÉMENTER

### 1. Seuils Officiels par Mode (Code des Marchés CI)

```json
{
  "seuils_officiels": {
    "PSD": {
      "min": 0,
      "max": 10000000,
      "description": "Procédure Simplifiée D'entente Directe"
    },
    "PSC": {
      "min": 10000000,
      "max": 30000000,
      "description": "Procédure Simplifiée de demande de Cotation"
    },
    "PSL": {
      "min": 30000000,
      "max": 50000000,
      "description": "Procédure Simplifiée à Compétition Limitée"
    },
    "PSO": {
      "min": 50000000,
      "max": 100000000,
      "description": "Procédure Simplifiée à Compétition Ouverte"
    },
    "AOO": {
      "min": 100000000,
      "max": null,
      "description": "Appel d'Offres Ouvert"
    },
    "PI": {
      "min": 0,
      "max": null,
      "description": "Prestations Intellectuelles (pas de seuil fixe)"
    }
  }
}
```

### 2. Règles de Validation par Phase

#### PLANIFICATION

```sql
-- Validation: Champs obligatoires
CREATE OR REPLACE FUNCTION validate_planification(op_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.objet IS NOT NULL
        AND o.type_marche IS NOT NULL
        AND o.mode_passation IS NOT NULL
        AND o.montant_previsionnel > 0
        AND o.coordonnees_geo IS NOT NULL
        AS valid,
        CASE
            WHEN o.objet IS NULL THEN 'Objet obligatoire'
            WHEN o.type_marche IS NULL THEN 'Type de marché obligatoire'
            WHEN o.mode_passation IS NULL THEN 'Mode de passation obligatoire'
            WHEN o.montant_previsionnel <= 0 THEN 'Montant prévisionnel invalide'
            WHEN o.coordonnees_geo IS NULL THEN 'Coordonnées géographiques obligatoires'
            ELSE 'Validation OK'
        END AS message
    FROM operation o
    WHERE o.id = op_id;
END;
$$ LANGUAGE plpgsql;
```

#### CONTRACTUALISATION (PSD)

```sql
CREATE OR REPLACE FUNCTION validate_procedure_psd(proc_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.bon_commande_doc IS NOT NULL
        OR p.facture_proforma_doc IS NOT NULL
        AS valid,
        CASE
            WHEN p.bon_commande_doc IS NULL AND p.facture_proforma_doc IS NULL
                THEN 'Bon de commande ou Facture proforma obligatoire (PSD)'
            WHEN p.prestataire_sanctionne = TRUE
                THEN 'ALERTE: Prestataire sanctionné détecté'
            ELSE 'Validation OK'
        END AS message
    FROM procedure p
    WHERE p.id = proc_id;
END;
$$ LANGUAGE plpgsql;
```

#### CONTRACTUALISATION (PSC)

```sql
CREATE OR REPLACE FUNCTION validate_procedure_psc(proc_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.dossier_concurrence_doc IS NOT NULL
        AND p.formulaire_selection_doc IS NOT NULL
        AND p.dates->>'date_ouverture' IS NOT NULL
        AND p.dates->>'date_selection' IS NOT NULL
        AS valid,
        CASE
            WHEN p.dossier_concurrence_doc IS NULL
                THEN 'Dossier de concurrence obligatoire (PSC)'
            WHEN p.formulaire_selection_doc IS NULL
                THEN 'Formulaire de sélection obligatoire (PSC)'
            WHEN p.dates->>'date_ouverture' IS NULL
                THEN 'Date d\'ouverture obligatoire'
            WHEN p.dates->>'date_selection' IS NULL
                THEN 'Date de sélection obligatoire'
            ELSE 'Validation OK'
        END AS message
    FROM procedure p
    WHERE p.id = proc_id;
END;
$$ LANGUAGE plpgsql;
```

#### ATTRIBUTION

```sql
CREATE OR REPLACE FUNCTION validate_attribution(attr_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
DECLARE
    v_mode VARCHAR;
BEGIN
    SELECT o.mode_passation INTO v_mode
    FROM attribution a
    JOIN operation o ON a.operation_id = o.id
    WHERE a.id = attr_id;

    RETURN QUERY
    SELECT
        CASE
            -- PSD: Bon de commande OU Facture définitive
            WHEN v_mode = 'PSD' THEN
                a.numero_bon_commande IS NOT NULL OR a.numero_facture_definitive IS NOT NULL
            -- PSC: Lettre de marché
            WHEN v_mode = 'PSC' THEN
                a.numero_lettre_marche IS NOT NULL
            -- Autres modes: Marché signé
            ELSE
                a.marche_signe_doc IS NOT NULL
        END AS valid,
        CASE
            WHEN v_mode = 'PSD' AND a.numero_bon_commande IS NULL AND a.numero_facture_definitive IS NULL
                THEN 'Bon de commande ou Facture définitive obligatoire (PSD)'
            WHEN v_mode = 'PSC' AND a.numero_lettre_marche IS NULL
                THEN 'Numéro de lettre de marché obligatoire (PSC)'
            WHEN v_mode NOT IN ('PSD', 'PSC') AND a.marche_signe_doc IS NULL
                THEN 'Marché signé obligatoire'
            ELSE 'Validation OK'
        END AS message
    FROM attribution a
    WHERE a.id = attr_id;
END;
$$ LANGUAGE plpgsql;
```

#### EXÉCUTION - Avenant

```sql
CREATE OR REPLACE FUNCTION validate_avenant(av_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        av.avenant_signe_doc IS NOT NULL
        AND (
            av.cumul_pourcent < 30
            OR (av.cumul_pourcent >= 30 AND av.justificatif_avenant_doc IS NOT NULL)
        ) AS valid,
        CASE
            WHEN av.avenant_signe_doc IS NULL
                THEN 'Fichier d\'avenant signé obligatoire'
            WHEN av.cumul_pourcent >= 30 AND av.justificatif_avenant_doc IS NULL
                THEN 'Justificatif obligatoire pour avenant ≥30%'
            WHEN av.cumul_pourcent >= 30
                THEN 'ALERTE: Seuil 30% dépassé - Autorisation requise'
            WHEN av.cumul_pourcent >= 25
                THEN 'ATTENTION: Seuil 25% dépassé'
            ELSE 'Validation OK'
        END AS message
    FROM avenant av
    WHERE av.id = av_id;
END;
$$ LANGUAGE plpgsql;
```

#### CLÔTURE

```sql
CREATE OR REPLACE FUNCTION validate_cloture(clot_id UUID)
RETURNS TABLE(valid BOOLEAN, message TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.reception_prov->>'date' IS NOT NULL
        AND c.reception_prov->>'pv_doc' IS NOT NULL
        AND c.date_dernier_decompte IS NOT NULL
        AS valid,
        CASE
            WHEN c.reception_prov->>'date' IS NULL
                THEN 'Date de réception provisoire obligatoire'
            WHEN c.reception_prov->>'pv_doc' IS NULL
                THEN 'PV de réception provisoire obligatoire'
            WHEN c.date_dernier_decompte IS NULL
                THEN 'Date du dernier décompte obligatoire'
            ELSE 'Validation OK'
        END AS message
    FROM cloture c
    WHERE c.id = clot_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 🗂️ MATRICE DOCUMENTAIRE COMPLÈTE

### Documents par Phase et Mode

| Phase | Document | PSD | PSC | PSL | PSO | AOO | PI | Obligatoire |
|-------|----------|-----|-----|-----|-----|-----|----|----|
| **PLANIFICATION** | | | | | | | | |
| | Fiche PPM | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Étude de faisabilité | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | Conditionnel |
| **CONTRACTUALISATION** | | | | | | | | |
| PSD | Bon de commande | ✅ | - | - | - | - | - | ✅ |
| PSD | Facture proforma | ✅ | - | - | - | - | - | ✅ |
| PSC | Dossier de concurrence | - | ✅ | - | - | - | - | ✅ |
| PSC | Formulaire de sélection | - | ✅ | - | - | - | - | ✅ |
| PSC | PV d'ouverture | - | ✅ | - | - | - | - | ⚠️ |
| PSC | Rapport d'analyse | - | ✅ | - | - | - | - | ⚠️ |
| PSL/PSO/AOO | Courrier d'invitation | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| PSL/PSO/AOO | Mandat de représentation | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| PSL/PSO/AOO | DAO complet | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| PSL/PSO/AOO | PV d'ouverture | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| PSL/PSO/AOO | Rapport d'analyse | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| PSL/PSO/AOO | PV de jugement | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | Dossier de recours | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Si recours |
| **ATTRIBUTION** | | | | | | | | |
| PSD | Facture définitive | ✅ | - | - | - | - | - | ⚠️ |
| PSC | Lettre de marché | - | ✅ | - | - | - | - | ✅ |
| PSL/PSO/AOO/PI | Marché signé et approuvé | - | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | Garantie d'avance | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | - | Si avance |
| Tous | Garantie de bonne exécution | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | - | PSL+ |
| **VISA CF** | | | | | | | | |
| PSD/PSC | Visa CF (sur acte de dépense) | ✅ | ✅ | - | - | - | - | ✅ |
| Tous | Contrat visé | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | PSL+ |
| **EXÉCUTION** | | | | | | | | |
| Tous | OS de démarrage | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | OS complémentaires | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Si nécessaire |
| Tous | Avenant signé | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Si avenant |
| Tous | Justificatifs avenant | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | Si ≥30% |
| Tous | Rapports d'avancement | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | PSO+ |
| Tous | Factures et décomptes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CLÔTURE** | | | | | | | | |
| Tous | PV de réception provisoire | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | PV de réception définitive | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | Mainlevées de garanties | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | - | Si garanties |
| Tous | Décompte général définitif | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | Quitus / Certificat de solde | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tous | Rapport final de synthèse | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | PSO+ |

**Légende**:
- ✅ = Obligatoire
- ⚠️ = Optionnel / Conditionnel
- \- = Non applicable

---

## 🎨 INTERFACES UTILISATEUR

### Écran PLANIFICATION - Ajouts

```html
<!-- Coordonnées Géographiques -->
<div class="form-section">
    <h3>📍 Localisation Géographique</h3>

    <div class="form-row">
        <div class="form-field">
            <label>Région *</label>
            <select id="region" required>
                <option value="">-- Sélectionner --</option>
                <!-- Chargement dynamique depuis référentiel -->
            </select>
        </div>

        <div class="form-field">
            <label>Département *</label>
            <select id="departement" required>
                <option value="">-- Sélectionner --</option>
            </select>
        </div>
    </div>

    <div class="form-row">
        <div class="form-field">
            <label>Sous-Préfecture *</label>
            <select id="sous_prefecture" required>
                <option value="">-- Sélectionner --</option>
            </select>
        </div>

        <div class="form-field">
            <label>Village</label>
            <input type="text" id="village" placeholder="Nom du village">
        </div>
    </div>

    <div class="form-row">
        <div class="form-field">
            <label>Latitude</label>
            <input type="number" step="0.000001" id="latitude" placeholder="5.3599517">
        </div>

        <div class="form-field">
            <label>Longitude</label>
            <input type="number" step="0.000001" id="longitude" placeholder="-4.0082563">
        </div>
    </div>

    <!-- Optionnel: Carte interactive -->
    <div id="map-container" style="height: 300px; margin-top: 16px;">
        <!-- Intégration OpenStreetMap / Google Maps -->
    </div>
</div>

<!-- Type d'Opération -->
<div class="form-field">
    <label>Type d'Opération *</label>
    <select id="type_operation" required>
        <option value="">-- Sélectionner --</option>
        <option value="MARCHE_100M_PLUS">Marché (≥ 100 Millions XOF)</option>
        <option value="CONTRAT_MOINS_100M">Contrat (< 100 Millions XOF)</option>
    </select>
    <small>Classification selon le montant prévisionnel</small>
</div>
```

### Écran CONTRACTUALISATION - Formulaires Dynamiques

```javascript
// Affichage conditionnel selon le mode
function renderFormulaireProcedure(modePassation) {
    const container = document.getElementById('form-procedure');

    if (modePassation === 'PSD') {
        container.innerHTML = `
            <h3>📄 Documents PSD</h3>
            <div class="form-field">
                <label>Bon de Commande *</label>
                <input type="file" id="bon_commande" accept=".pdf,.jpg,.png">
            </div>
            <div class="form-field">
                <label>Facture Proforma *</label>
                <input type="file" id="facture_proforma" accept=".pdf,.jpg,.png">
            </div>
            <div class="form-field">
                <label>
                    <input type="checkbox" id="prestataire_sanctionne">
                    Prestataire sanctionné (liste noire)
                </label>
            </div>
        `;
    } else if (modePassation === 'PSC') {
        container.innerHTML = `
            <h3>📄 Documents PSC</h3>
            <div class="form-field">
                <label>Dossier de Concurrence (ZIP) *</label>
                <input type="file" id="dossier_concurrence" accept=".zip">
                <small>Archive contenant: demandes de cotation, factures proforma, devis</small>
            </div>
            <div class="form-field">
                <label>Formulaire de Sélection *</label>
                <input type="file" id="formulaire_selection" accept=".pdf">
            </div>
            <div class="form-row">
                <div class="form-field">
                    <label>Date d'Ouverture des Plis *</label>
                    <input type="date" id="date_ouverture" required>
                </div>
                <div class="form-field">
                    <label>Date de Sélection *</label>
                    <input type="date" id="date_selection" required>
                </div>
            </div>
            <div class="form-field">
                <label>PV d'Ouverture</label>
                <input type="file" id="pv_ouverture" accept=".pdf">
            </div>
            <div class="form-field">
                <label>Rapport d'Analyse</label>
                <input type="file" id="rapport_analyse" accept=".pdf">
            </div>
        `;
    } else if (['PSL', 'PSO', 'AOO', 'PI'].includes(modePassation)) {
        container.innerHTML = `
            <h3>📄 Documents ${modePassation}</h3>
            <div class="form-field">
                <label>Courrier d'Invitation *</label>
                <input type="file" id="courrier_invitation" accept=".pdf">
            </div>
            <div class="form-field">
                <label>Mandat de Représentation *</label>
                <input type="file" id="mandat_representation" accept=".pdf">
            </div>
            <div class="form-field">
                <label>DAO Complet *</label>
                <input type="file" id="dao_complet" accept=".pdf,.zip">
            </div>
            <div class="form-field">
                <label>PV d'Ouverture *</label>
                <input type="file" id="pv_ouverture" accept=".pdf">
            </div>
            <div class="form-field">
                <label>Rapport d'Analyse *</label>
                <input type="file" id="rapport_analyse" accept=".pdf">
            </div>
            <div class="form-field">
                <label>PV de Jugement *</label>
                <input type="file" id="pv_jugement" accept=".pdf">
            </div>

            <!-- Section Lots (si alloti) -->
            <div class="form-section">
                <h4>📦 Gestion des Lots</h4>
                <button type="button" class="btn-secondary" onclick="addLot()">+ Ajouter un Lot</button>
                <div id="lots-container"></div>
            </div>
        `;
    }
}
```

### Écran ATTRIBUTION - Distinction PSD/PSC

```javascript
function renderFormulaireAttribution(modePassation) {
    const container = document.getElementById('form-attribution');

    let html = `
        <div class="form-row">
            <div class="form-field">
                <label>NCC Attributaire *</label>
                <input type="text" id="ncc" required>
                <button type="button" onclick="searchEntreprise()">🔍 Rechercher</button>
            </div>
            <div class="form-field">
                <label>Raison Sociale *</label>
                <input type="text" id="raison_sociale" required readonly>
            </div>
        </div>
    `;

    if (modePassation === 'PSD') {
        html += `
            <div class="form-field">
                <label>Numéro Bon de Commande / Facture Définitive *</label>
                <input type="text" id="numero_bon_commande" required>
            </div>
            <div class="form-field">
                <label>Date de Visa CF (sur acte de dépense)</label>
                <input type="date" id="date_visa_cf">
            </div>
        `;
    } else if (modePassation === 'PSC') {
        html += `
            <div class="form-field">
                <label>Numéro de Lettre de Marché *</label>
                <input type="text" id="numero_lettre_marche" required>
            </div>
            <div class="form-field">
                <label>Numéro de Facture Définitive</label>
                <input type="text" id="numero_facture_definitive">
            </div>
            <div class="form-field">
                <label>Lettre de Marché (Document) *</label>
                <input type="file" id="lettre_marche_doc" accept=".pdf">
            </div>
            <div class="form-field">
                <label>Date de Visa CF (sur acte de dépense)</label>
                <input type="date" id="date_visa_cf">
            </div>
        `;
    } else {
        html += `
            <div class="form-field">
                <label>Numéro de Marché *</label>
                <input type="text" id="numero_marche" required>
            </div>
            <div class="form-field">
                <label>Marché Signé et Approuvé *</label>
                <input type="file" id="marche_signe_doc" accept=".pdf">
            </div>
        `;
    }

    html += `
        <div class="form-row">
            <div class="form-field">
                <label>Montant d'Attribution HT *</label>
                <input type="number" step="0.01" id="montant_ht" required>
            </div>
            <div class="form-field">
                <label>Montant TTC *</label>
                <input type="number" step="0.01" id="montant_ttc" required readonly>
            </div>
        </div>

        <!-- Garanties -->
        <div class="form-section">
            <h4>🔐 Garanties</h4>
            <div class="form-row">
                <div class="form-field">
                    <label>Avance de Démarrage (%)</label>
                    <input type="number" step="0.01" max="15" id="avance_taux">
                </div>
                <div class="form-field">
                    <label>Montant Avance (XOF)</label>
                    <input type="number" step="0.01" id="avance_montant" readonly>
                </div>
            </div>
            <div class="form-field">
                <label>Garantie d'Avance (Document)</label>
                <input type="file" id="garantie_avance_doc" accept=".pdf">
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label>Garantie de Bonne Exécution (%) *</label>
                    <input type="number" step="0.01" min="3" max="10" id="garantie_bonne_exec_taux" required>
                    <small>Entre 3% et 10% selon Code des Marchés CI</small>
                </div>
                <div class="form-field">
                    <label>Montant Garantie (XOF)</label>
                    <input type="number" step="0.01" id="garantie_bonne_exec_montant" readonly>
                </div>
            </div>
            <div class="form-field">
                <label>Garantie de Bonne Exécution (Document) *</label>
                <input type="file" id="garantie_bonne_exec_doc" accept=".pdf" required>
            </div>
        </div>
    `;

    container.innerHTML = html;
}
```

### Écran EXÉCUTION - Séparation Marché/Avenant

```html
<!-- Section OS (Marché de Base) -->
<div class="form-section">
    <h3>📋 Ordre de Service de Démarrage</h3>
    <div class="form-row">
        <div class="form-field">
            <label>Numéro OS *</label>
            <input type="text" id="os_numero" required>
        </div>
        <div class="form-field">
            <label>Date Émission *</label>
            <input type="date" id="os_date" required>
        </div>
    </div>
    <div class="form-row">
        <div class="form-field">
            <label>Durée d'Exécution (jours) *</label>
            <input type="number" id="duree_execution" required>
        </div>
        <div class="form-field">
            <label>Date de Fin Prévisionnelle</label>
            <input type="date" id="date_fin_previsionnelle" readonly>
        </div>
    </div>
</div>

<!-- Section Avenants (Distinct) -->
<div class="form-section">
    <h3>📝 Avenants</h3>
    <button type="button" class="btn-primary" onclick="openAvenantModal()">+ Ajouter un Avenant</button>

    <div id="avenants-list">
        <!-- Liste des avenants -->
        <div class="avenant-item" data-id="av-1">
            <div class="avenant-header">
                <h4>Avenant N°1 - AVEC_INCIDENCE_FINANCIERE</h4>
                <span class="badge badge-warning">Cumul: 12%</span>
            </div>
            <div class="avenant-body">
                <p><strong>Variation:</strong> +12 000 000 XOF</p>
                <p><strong>Nouveau Montant:</strong> 112 000 000 XOF</p>
                <p><strong>Fichier Avenant:</strong> <a href="#">avenant_01.pdf</a></p>
            </div>
            <div class="avenant-actions">
                <button class="btn-secondary" onclick="editAvenant('av-1')">✏️ Modifier</button>
                <button class="btn-danger" onclick="deleteAvenant('av-1')">🗑️ Supprimer</button>
            </div>
        </div>
    </div>
</div>

<!-- Modal Avenant -->
<div id="modal-avenant" class="modal">
    <div class="modal-content">
        <h3>📝 Nouvel Avenant</h3>

        <div class="form-field">
            <label>Type d'Avenant *</label>
            <select id="type_avenant" required>
                <option value="">-- Sélectionner --</option>
                <option value="AVEC_INCIDENCE_FINANCIERE">Avec Incidence Financière</option>
                <option value="SANS_INCIDENCE_FINANCIERE">Sans Incidence Financière</option>
                <option value="PORTANT_SUR_DUREE">Portant sur la Durée</option>
                <option value="PORTANT_SUR_LIBELLE">Portant sur le Libellé</option>
                <option value="PORTANT_SUR_NATURE_ECO">Portant sur la Nature Économique</option>
                <option value="MIXTE">Mixte</option>
            </select>
        </div>

        <!-- Champs conditionnels selon le type -->
        <div id="champs-financiers" style="display:none;">
            <div class="alert alert-info">
                <strong>Montant Initial Marché:</strong> 100 000 000 XOF
            </div>
            <div class="form-field">
                <label>Variation Montant (XOF) *</label>
                <input type="number" step="0.01" id="variation_montant" required>
                <small>Positif pour augmentation, négatif pour réduction</small>
            </div>
            <div class="form-field">
                <label>Nouveau Montant Total (XOF)</label>
                <input type="number" step="0.01" id="nouveau_montant" readonly>
            </div>
            <div class="form-field">
                <label>% par rapport au montant initial</label>
                <input type="number" step="0.01" id="pourcent_variation" readonly>
            </div>
            <div class="form-field">
                <label>Cumul % (tous avenants)</label>
                <input type="number" step="0.01" id="cumul_pourcent" readonly>
                <div id="alerte-seuil"></div>
            </div>
        </div>

        <div class="form-field">
            <label>Motif de l'Avenant *</label>
            <textarea id="motif_avenant" rows="3" required></textarea>
        </div>

        <div class="form-field">
            <label>Date de Signature *</label>
            <input type="date" id="date_signature_avenant" required>
        </div>

        <div class="form-field">
            <label>Fichier Avenant Signé *</label>
            <input type="file" id="avenant_signe_doc" accept=".pdf" required>
            <small><strong>Important:</strong> Fichier distinct du marché de base</small>
        </div>

        <div id="champs-justificatif" style="display:none;">
            <div class="alert alert-error">
                <strong>⚠️ SEUIL 30% DÉPASSÉ</strong><br>
                Pièce justificative obligatoire (autorisation)
            </div>
            <div class="form-field">
                <label>Justificatif (Autorisation) *</label>
                <input type="file" id="justificatif_avenant_doc" accept=".pdf" required>
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn-primary" onclick="saveAvenant()">💾 Enregistrer</button>
            <button class="btn-secondary" onclick="closeAvenantModal()">❌ Annuler</button>
        </div>
    </div>
</div>
```

### Écran CLÔTURE - Ajouts

```html
<div class="form-section">
    <h3>🏁 Clôture du Marché</h3>

    <!-- Réception Provisoire -->
    <div class="subsection">
        <h4>📅 Réception Provisoire</h4>
        <div class="form-row">
            <div class="form-field">
                <label>Date de Réception Provisoire *</label>
                <input type="date" id="date_reception_prov" required>
            </div>
            <div class="form-field">
                <label>Période de Garantie (jours) *</label>
                <input type="number" id="periode_garantie" required value="365">
            </div>
        </div>
        <div class="form-field">
            <label>PV de Réception Provisoire *</label>
            <input type="file" id="pv_reception_prov" accept=".pdf" required>
        </div>
    </div>

    <!-- Date Fin Réelle -->
    <div class="subsection">
        <h4>📆 Fin Réelle du Marché</h4>
        <div class="form-field">
            <label>Date du Dernier Décompte *</label>
            <input type="date" id="date_dernier_decompte" required>
            <small>Marque la fin effective du marché</small>
        </div>
    </div>

    <!-- Réception Définitive -->
    <div class="subsection">
        <h4>✅ Réception Définitive</h4>
        <div class="form-row">
            <div class="form-field">
                <label>Date de Réception Définitive Prévisionnelle</label>
                <input type="date" id="date_reception_def_prev" readonly>
                <small>Calculée: Réception Prov + Période Garantie</small>
            </div>
            <div class="form-field">
                <label>Date de Réception Définitive Réelle (CF)</label>
                <input type="date" id="date_reception_def_reelle">
            </div>
        </div>
        <div class="form-field">
            <label>PV de Réception Définitive *</label>
            <input type="file" id="pv_reception_def" accept=".pdf" required>
        </div>
    </div>

    <!-- Satisfaction Bénéficiaires -->
    <div class="subsection">
        <h4>⭐ Satisfaction des Bénéficiaires</h4>
        <div class="form-field">
            <label>Livrables Conformes?</label>
            <div class="radio-group">
                <label><input type="radio" name="livrables_conformes" value="true"> ✅ Oui</label>
                <label><input type="radio" name="livrables_conformes" value="false"> ❌ Non</label>
            </div>
        </div>
        <div class="form-field">
            <label>Commentaires / Feedback Bénéficiaires</label>
            <textarea id="satisfaction_beneficiaires" rows="4" placeholder="Retour d'expérience des bénéficiaires..."></textarea>
        </div>
    </div>

    <!-- Mainlevées -->
    <div class="subsection">
        <h4>🔓 Mainlevées de Garanties</h4>
        <div id="mainlevees-list">
            <!-- Liste dynamique des garanties à lever -->
        </div>
    </div>

    <!-- Synthèse Finale -->
    <div class="subsection">
        <h4>📊 Synthèse Finale</h4>
        <div class="form-field">
            <label>Observations Finales</label>
            <textarea id="observations_finales" rows="4" placeholder="Synthèse complète du marché..."></textarea>
        </div>
        <div class="form-field">
            <label>Quitus / Certificat de Solde *</label>
            <input type="file" id="quitus_doc" accept=".pdf" required>
        </div>
    </div>
</div>

<div class="form-actions">
    <button type="button" class="btn-danger" onclick="cloturerMarche()">🔒 CLÔTURER LE MARCHÉ</button>
    <small class="text-warning">⚠️ Action irréversible - Le marché ne pourra plus être modifié</small>
</div>
```

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1: Schéma PostgreSQL (2-3 jours)

1. ✅ Créer les nouvelles tables (LOT, SOUMISSIONNAIRE)
2. ✅ Ajouter les colonnes manquantes aux tables existantes
3. ✅ Créer les fonctions de validation
4. ✅ Créer les vues métier enrichies
5. ✅ Tests de migration et intégrité

### Phase 2: Backend Cloudflare Worker (2-3 jours)

1. Adapter les API endpoints pour les nouveaux champs
2. Implémenter les règles de validation
3. Gérer l'upload de documents sur R2 (multi-fichiers)
4. Créer les endpoints pour les lots et soumissionnaires
5. Tests end-to-end

### Phase 3: Frontend (4-5 jours)

1. Formulaires conditionnels par mode de passation
2. Interface de saisie des coordonnées géographiques
3. Gestion des lots (CRUD)
4. Séparation visuelle Marché de Base / Avenants
5. Checklist documentaire enrichie
6. Tests utilisateurs

### Phase 4: Intégration & Tests (2 jours)

1. Tests des workflows complets (PSD, PSC, PSL, PSO, AOO, PI)
2. Validation de la conformité Code des Marchés CI
3. Tests de performance
4. Documentation utilisateur

**DURÉE TOTALE ESTIMÉE: 10-13 jours**

---

## ✅ CHECKLIST DE VALIDATION

### Conformité Métier

- [ ] Tous les modes de passation supportés (PSD, PSC, PSL, PSO, AOO, PI)
- [ ] Seuils officiels conformes Code des Marchés CI
- [ ] Champs spécifiques par mode implémentés
- [ ] Distinction claire Marché de Base / Avenants
- [ ] Gestion des lots pour PSC+
- [ ] Soumissionnaires optionnels avec priorité documentation
- [ ] Coordonnées géographiques jusqu'au village
- [ ] Date de fin réelle = date dernier décompte
- [ ] Satisfaction bénéficiaires captée

### Technique

- [ ] Schéma PostgreSQL complet
- [ ] Migrations sans perte de données
- [ ] APIs Cloudflare Worker conformes
- [ ] Upload multi-fichiers R2 fonctionnel
- [ ] Formulaires conditionnels dynamiques
- [ ] Validations côté client et serveur
- [ ] Performances optimales (<2s page load)
- [ ] Tests end-to-end passés

### Documentation

- [ ] Schéma de données documenté
- [ ] Guide utilisateur par mode
- [ ] Documentation technique développeurs
- [ ] Matrice documentaire complète
- [ ] Règles métier explicites

---

## 📞 CONTACTS & SUPPORT

**Équipe DCF**: [Contact DCF]
**Équipe DGMP**: [Contact DGMP]
**Support Technique**: [Email support]

---

**Version**: 2.0 - Ajustements Post-Tests
**Date**: 2025-11-17
**Auteur**: Claude Code AI Assistant
**Statut**: 📋 **SPÉCIFICATIONS COMPLÈTES - PRÊT POUR IMPLÉMENTATION**
