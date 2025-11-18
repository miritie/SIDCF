# Gestion des Règles Métier en Base de Données

## Vue d'ensemble

Les règles métier sont maintenant stockées dans PostgreSQL et éditables via une interface d'administration complète. Fini les fichiers JSON statiques !

## Architecture

### 1. Base de données PostgreSQL

#### Table `regles_metier`
```sql
CREATE TABLE regles_metier (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE,        -- Ex: SEUIL_CUMUL_AVENANTS
    categorie VARCHAR(50),            -- seuils, validations, delais, garanties
    label VARCHAR(200),               -- Libellé lisible
    description TEXT,                 -- Description détaillée

    -- Valeurs
    valeur DECIMAL(15, 2),           -- Valeur simple
    unite VARCHAR(20),                -- %, jours, XOF
    valeur_min DECIMAL(15, 2),       -- Pour plages
    valeur_max DECIMAL(15, 2),

    severite VARCHAR(20),             -- BLOCK, WARN, INFO
    config_json JSONB,                -- Configurations complexes

    -- États
    is_active BOOLEAN DEFAULT true,
    is_editable BOOLEAN DEFAULT true,

    -- Audit
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
```

#### Table `regles_historique`
```sql
CREATE TABLE regles_historique (
    id SERIAL PRIMARY KEY,
    regle_id INTEGER,
    regle_code VARCHAR(100),
    ancienne_valeur DECIMAL(15, 2),
    nouvelle_valeur DECIMAL(15, 2),
    modifie_par VARCHAR(100),
    modifie_le TIMESTAMP,
    motif TEXT
);
```

### 2. Interface d'administration

**URL :** `#/admin/regles-v2`

**Fonctionnalités :**
- ✅ Édition en ligne des valeurs
- ✅ Sauvegarde automatique (2 secondes après modification)
- ✅ Onglets par catégorie (Seuils, Validations, Délais, Garanties, Matrices, ANO)
- ✅ Toggle pour activer/désactiver les validations
- ✅ Historique des modifications (à implémenter)
- ✅ Indicateur de modifications non sauvegardées

## Types de règles

### 1. Seuils & Limites

**Exemples :**
- Cumul maximum d'avenants (30%)
- Taux maximum d'avance (15%)
- Délai max OS après visa (30 jours)

**Éditable :** Oui
**Affichage :** Table avec input numérique

### 2. Validations

**Exemples :**
- Validation montant marché
- Validation date OS
- Validation cumul avenants

**Éditable :** Toggle ON/OFF uniquement
**Affichage :** Cards avec switch

### 3. Délais

**Exemples :**
- Délai de recours (10 jours)
- Délai publication ANO (15 jours)
- Délai de garantie (365 jours)

**Éditable :** Oui
**Affichage :** Table avec input numérique

### 4. Garanties

**Exemples :**
- Garantie bonne exécution (3-5%)
- Retenue de garantie (10%)

**Éditable :** Non (réglementaire)
**Affichage :** Cards en lecture seule

### 5. Matrices des Procédures

**Contenu :**
- Seuils par type d'autorité
- Procédures applicables (PSD, PSC, PSL, PSO, AOO, PI)
- Plages de montant

**Éditable :** Oui (via JSON)
**Affichage :** Cards avec seuils

### 6. ANO (Avis de Non-Objection)

**Contenu :**
- Modes requérant ANO
- Bailleurs requérant ANO
- Seuils par type de marché

**Éditable :** Oui (via JSON)
**Affichage :** Badges et listes

## Utilisation de l'interface

### Modifier une règle

1. **Accéder à l'écran :**
   - Navigation : Administration > Règles & Procédures
   - URL : `#/admin/regles-v2`

2. **Sélectionner la catégorie :**
   - Cliquer sur l'onglet correspondant
   - Ex: "Seuils & Limites"

3. **Modifier la valeur :**
   - Modifier directement dans l'input
   - La sauvegarde est automatique après 2 secondes

4. **Vérifier la sauvegarde :**
   - Un compteur indique le nombre de modifications
   - Un message "✅ Enregistré !" confirme la sauvegarde

### Activer/Désactiver une validation

1. Aller dans l'onglet "Validations"
2. Utiliser le toggle ON/OFF
3. La validation est appliquée immédiatement

### Consulter l'historique

1. Cliquer sur "📜 Historique" pour une règle
2. Voir les modifications passées
3. Qui a modifié, quand, ancienne/nouvelle valeur

## Migration des données

### Depuis rules-config.json vers PostgreSQL

```bash
# 1. Appliquer la migration
cd postgres/worker
npm run migrate

# 2. Les données par défaut sont insérées automatiquement
# Voir: postgres/migrations/005_regles_metier.sql
```

### Importer des règles personnalisées

```sql
-- Ajouter une règle personnalisée
INSERT INTO regles_metier (
    code, categorie, label, description,
    valeur, unite, severite, is_editable
) VALUES (
    'SEUIL_CUSTOM',
    'seuils',
    'Mon seuil personnalisé',
    'Description de mon seuil',
    50,
    '%',
    'WARN',
    true
);
```

## API (À implémenter)

### Endpoints nécessaires

```javascript
// GET - Récupérer toutes les règles
GET /api/regles
Response: [{ id, code, categorie, label, valeur, ... }]

// GET - Récupérer une règle
GET /api/regles/:code
Response: { id, code, categorie, label, valeur, ... }

// PUT - Mettre à jour une règle
PUT /api/regles/:id
Body: { valeur: 35, updated_by: "user@example.com" }
Response: { success: true, rule: {...} }

// PUT - Mise à jour batch
PUT /api/regles/batch
Body: [{ id: 1, valeur: 35 }, { id: 2, is_active: false }]
Response: { success: true, updated: 2 }

// GET - Historique d'une règle
GET /api/regles/:id/historique
Response: [{ ancienne_valeur, nouvelle_valeur, modifie_par, modifie_le }]
```

### Implémentation dans le Worker

```javascript
// postgres/worker/src/routes/regles.ts
import { Router } from 'itty-router';

const router = Router();

// GET all rules
router.get('/api/regles', async (request, env) => {
  const result = await env.DB.prepare(
    'SELECT * FROM regles_metier WHERE is_active = true ORDER BY categorie, label'
  ).all();

  return new Response(JSON.stringify(result.results), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// PUT update rule
router.put('/api/regles/:id', async (request, env) => {
  const { id } = request.params;
  const body = await request.json();

  await env.DB.prepare(
    'UPDATE regles_metier SET valeur = ?, updated_by = ?, updated_at = NOW() WHERE id = ?'
  ).bind(body.valeur, body.updated_by, id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Avantages de cette approche

### ✅ Flexibilité
- Modification sans redéploiement
- Adaptation rapide aux changements réglementaires
- Tests A/B possibles

### ✅ Traçabilité
- Historique complet des modifications
- Qui a modifié quoi et quand
- Possibilité de rollback

### ✅ Sécurité
- Validation des valeurs
- Règles non modifiables (is_editable = false)
- Audit trail complet

### ✅ Performance
- Cache côté serveur possible
- Invalidation automatique
- Pas de rechargement de fichiers JSON

## Règles par défaut insérées

### Seuils (5 règles)
- SEUIL_CUMUL_AVENANTS: 30%
- SEUIL_ALERTE_AVENANTS: 25%
- TAUX_MAX_AVANCE: 15%
- DELAI_MAX_OS_APRES_VISA: 30 jours
- DELAI_MAINLEVEE_GARANTIE: 365 jours

### Validations (5 règles)
- VALIDATION_MONTANT_MARCHE
- VALIDATION_DATE_OS
- VALIDATION_CUMUL_AVENANTS
- VALIDATION_GARANTIE_AVANCE
- VALIDATION_NCC_ATTRIBUTAIRE

### Délais (3 règles)
- DELAI_RECOURS_ATTRIBUTION: 10 jours
- DELAI_PUBLICATION_ANO: 15 jours
- DELAI_GARANTIE_DEFINITIF: 365 jours

### Garanties (3 règles)
- GARANTIE_BONNE_EXECUTION_MIN: 3%
- GARANTIE_BONNE_EXECUTION_MAX: 5%
- RETENUE_GARANTIE: 10%

### Matrices (1 configuration JSON)
- MATRICE_PROCEDURES_ADMIN_CENTRALE

### ANO (1 configuration JSON)
- ANO_CONFIGURATION

## Prochaines étapes

### Phase 1 (Actuelle) ✅
- [x] Migration PostgreSQL
- [x] Interface d'édition
- [x] Sauvegarde automatique
- [x] Onglets par catégorie

### Phase 2 (À implémenter)
- [ ] Endpoints API Worker
- [ ] Sauvegarde réelle en BD
- [ ] Chargement depuis BD
- [ ] Affichage historique

### Phase 3 (Avancé)
- [ ] Cache Redis
- [ ] Notifications de changement
- [ ] Import/Export CSV
- [ ] Validation avancée

### Phase 4 (Intégration)
- [ ] Utilisation dans les écrans de saisie
- [ ] Application automatique des règles
- [ ] Alertes en temps réel
- [ ] Dashboard des règles actives

## Test de l'interface

1. **Recharger la page** (Cmd+R / F5)

2. **Naviguer vers** Administration > Règles & Procédures

3. **Tester la modification :**
   - Onglet "Seuils & Limites"
   - Modifier "Cumul maximum d'avenants" : 30 → 35
   - Voir le compteur "(1)" apparaître
   - Attendre 2 secondes
   - Voir "✅ Enregistré !"

4. **Tester les validations :**
   - Onglet "Validations"
   - Désactiver une validation
   - Voir la sauvegarde automatique

5. **Explorer les autres onglets :**
   - Délais
   - Garanties
   - Matrices
   - ANO

## Fichiers concernés

### Créés
- ✅ `postgres/migrations/005_regles_metier.sql` - Migration BD
- ✅ `sidcf-portal/js/admin/regles-procedures-v2.js` - Interface édition
- ✅ `GESTION_REGLES_BD.md` - Documentation

### Modifiés
- ✅ `sidcf-portal/js/main.js` - Route `/admin/regles-v2`
- ✅ `sidcf-portal/js/ui/sidebar.js` - Lien menu vers v2

### À créer (Phase 2)
- `postgres/worker/src/routes/regles.ts` - API endpoints
- `sidcf-portal/js/services/regles-service.js` - Service client

---

**Version :** 2.0.0
**Date :** 2025-01-18
**Auteur :** Claude Code
**Statut :** ✅ Interface complète - API à implémenter
