# SIDCF — Architecture des modules

Doc opérationnelle : comprendre, masquer, renommer ou ajouter un module.
Tout se pilote depuis **un seul fichier de config** : `sidcf-portal/js/config/app-config.json`.

---

## 1. Modules existants

| Module | Code interne | Préfixe routes | Entités datastore | Tables Postgres | Statut |
|---|---|---|---|---|---|
| **Marché** | `marche` | `/ppm-list`, `/fiche-marche`, `/dashboard`, … | `OPERATION`, `PROCEDURE`, `AVENANT`, … (21 entités) | `operation`, `procedure`, `avenant`, … | Stable |
| **Marché+** | `marche-plus` | `/mp/ppm-list`, `/mp/fiche-marche`, `/mp/dashboard`, … | `MP_OPERATION`, `MP_PROCEDURE`, `MP_AVENANT`, … (21 entités) | `mp_operation`, `mp_procedure`, `mp_avenant`, … | Évolutif (clone indépendant) |
| **Investissement** | `investissement` | `/investissement/...` | `INV_*` (30 entités) | `inv_*` | Actif |
| **Matière** | `matiere` | `/matiere/home` | — | — | Placeholder (désactivé) |

**Important** : Marché et Marché+ ont chacun leurs **propres entités** et **propres tables**. Modifier une opération dans Marché+ (`MP_OPERATION` / `mp_operation`) **n'affecte pas** Marché (`OPERATION` / `operation`).

---

## 2. Architecture technique

```
┌─────────────────────────────────────────────────┐
│  Frontend (Vanilla JS, ES modules)              │
│  sidcf-portal/                                  │
│  • js/main.js (boot, router)                    │
│  • js/modules/marche/         (15 écrans)       │
│  • js/modules/marche-plus/    (15 écrans)       │
│  • js/modules/investissement/ (11 écrans)       │
│  • js/datastore/data-service.js (façade)        │
└──────────────────┬──────────────────────────────┘
                   │ fetch HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│  Cloudflare Worker (API REST)                   │
│  https://sidcf-portal-api.sidcf.workers.dev     │
│  postgres/worker/src/index.js                   │
│  • GET/POST/PUT/DELETE /api/entities/:type/:id  │
│  • POST /api/files/upload (R2)                  │
│  • ENTITY_TABLE_MAP : MP_X → mp_x               │
└────────┬───────────────────────────┬────────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────────┐
│  Neon PostgreSQL │        │  Cloudflare R2       │
│  (Serverless)    │        │  Bucket "sidcf"      │
│  • operation     │        │  • <fichier>         │
│  • mp_operation  │        │  • mp/<fichier>      │
│  • inv_project   │        │                      │
│  • …             │        │                      │
└──────────────────┘        └──────────────────────┘
```

**Données persistées sur Neon** (PostgreSQL distant). Le frontend interroge le Worker en HTTPS, qui exécute les requêtes SQL.

**Documents (PDF, images)** : uploadés sur Cloudflare R2 via le Worker. Marché+ utilise un **préfixe `mp/`** dans le bucket, pour séparation visuelle.

**Mode de secours** : si le Worker est inaccessible, le `data-service.js` bascule automatiquement sur localStorage (clé `sidcf:db:v1`). C'est utile en dev mais l'app affiche un warning.

---

## 3. Feature flags

Fichier : `sidcf-portal/js/config/app-config.json` → bloc `features`.

```json
{
  "dataProvider": "postgres",
  "features": {
    "moduleMarche": true,
    "moduleMarchePlus": true,
    "moduleInvestissement": true,
    "moduleMatiere": false,
    "adminAccess": true,
    "diagnostics": true
  }
}
```

| Flag | Effet quand `false` |
|---|---|
| `moduleMarche` | Carte « Module Marché » disparaît du portail, section sidebar masquée, routes `/ppm-list`, `/fiche-marche` non enregistrées (les **données restent** en base) |
| `moduleMarchePlus` | Idem pour Marché+ : carte/sidebar/routes `/mp/*` masquées (les **tables `mp_*` restent**) |
| `moduleInvestissement` | Idem pour Investissement |
| `moduleMatiere` | Idem pour Matière |
| `adminAccess` | Section « Administration » de la sidebar masquée |
| `diagnostics` | Lien `/diagnostics/health` masqué |

Après modification de `app-config.json`, **un simple F5** suffit (la config est rechargée à chaque boot).

---

## 4. Recettes pratiques

### 4.1 Masquer le module Marché (n'afficher que Marché+)

Édite `app-config.json` :
```json
"moduleMarche": false,
"moduleMarchePlus": true,
```
F5 → seul Marché+ est visible. Les tables `operation`, `procedure`, … restent intactes en base, prêtes à être réactivées.

### 4.2 Renommer Marché+ (par exemple en « Marché v2 »)

Trois fichiers à modifier :

**a) `sidcf-portal/js/portal/portal-home.js`** — la carte du portail :
```js
{
  id: 'marche-plus',
  title: 'Module Marché v2',          // ← nouveau nom
  ...
}
```

**b) `sidcf-portal/js/ui/sidebar.js`** — la section sidebar :
```js
el('div', { className: 'sidebar-section-title' }, 'Module Marché v2'),
```

**c) `sidcf-portal/js/modules/marche-plus/index.js`** (cosmétique) — les logs :
```js
logger.info('[Marché v2] Registering routes...');
```

Le **préfixe de route** `/mp/` peut rester ou être renommé en `/v2/`. Si tu changes, il faudra aussi mettre à jour les `router.navigate('/mp/...')` dans les écrans (find-replace simple).

Le **préfixe d'entités** `MP_` peut aussi être renommé (ex: `V2_`). Plus lourd : il faut modifier `schema.js`, `data-service.js` (`getMpOperationFull`, `ensureMarchePlusSeed`), tous les `ENTITIES.MP_X` dans les écrans, **les tables Postgres** (`ALTER TABLE mp_x RENAME TO v2_x`) et le Worker (`ENTITY_TABLE_MAP`). À éviter sauf nécessité forte.

### 4.3 Promouvoir Marché+ comme module principal et archiver Marché

Approche progressive :
1. **Étape 1 (caché)** : `"moduleMarche": false` dans `app-config.json` → Marché disparaît de l'UI mais reste en code et en base.
2. **Étape 2 (rebadge)** : renommer Marché+ en « Marché » dans portal-home.js et sidebar.js.
3. **Étape 3 (suppression définitive — uniquement quand certain)** :
   - Supprimer `sidcf-portal/js/modules/marche/`
   - Retirer l'import `registerMarcheRoutes` dans `main.js`
   - Retirer la carte `id: 'marche'` dans `portal-home.js`
   - Retirer la section `if (features.moduleMarche)` dans `sidebar.js`
   - Retirer les entités non-MP de `schema.js` et les mappings du Worker
   - **Optionnel — DB** : `DROP TABLE operation, procedure, …` (irréversible, faire un backup `pg_dump` avant)

### 4.4 Ajouter un nouveau module (ex: « RH »)

1. Créer `sidcf-portal/js/modules/rh/index.js` avec une fonction `registerRHRoutes()` qui appelle `router.register(...)`.
2. Dans `main.js` : importer `registerRHRoutes` et l'appeler conditionnellement sur `features.moduleRH`.
3. Dans `portal-home.js` : ajouter une carte avec `enabled: features.moduleRH`.
4. Dans `sidebar.js` : ajouter une section gardée par `if (features.moduleRH)`.
5. Dans `app-config.json` : ajouter `"moduleRH": true` dans `features`.
6. Dans `schema.js` : déclarer les entités `RH_*`.
7. **Côté DB** : créer une migration SQL `015_rh_schema.sql` avec les tables `rh_*`.
8. **Côté Worker** : ajouter les mappings `RH_X` → `rh_x` dans `ENTITY_TABLE_MAP`, redéployer (`wrangler deploy`).

### 4.5 Cloner un module (comme Marché → Marché+)

Le travail-type :
- `cp -r sidcf-portal/js/modules/X sidcf-portal/js/modules/X-clone`
- Préfixer toutes les routes (`router.register` + `router.navigate`)
- Préfixer toutes les `ENTITIES.X` → `ENTITIES.PREFIX_X`
- Cloner les entités/schémas dans `schema.js`
- Ajouter une méthode équivalente à `getOperationFull` (ex: `getXCloneOperationFull`)
- Migration SQL `CREATE TABLE prefix_x (LIKE x INCLUDING ALL); INSERT INTO prefix_x SELECT * FROM x;` (cf. `014_marche_plus_schema.sql`)
- Mappings `PREFIX_X` → `prefix_x` dans le Worker
- Si le module gère des fichiers : créer un `r2-storage-prefix.js` avec un préfixe R2
- Flag, carte portail, section sidebar
- Déployer le Worker (`wrangler deploy`)

---

## 5. Persistance, sauvegarde, backup

### Backup base Neon
Depuis le dashboard Neon ou via `pg_dump` (pour ça il faut le driver Neon HTTP — voir `postgres/migrations/run-any.js`).

### Backup R2
Via dashboard Cloudflare ou avec `aws s3 sync` configuré pour l'endpoint R2.

### Backup git du **code**
Un tag `point-de-base` existe sur le commit initial. Pour y revenir :
```bash
./restaurer-point-de-base.sh
```

### Reset des données Marché+ uniquement (re-cloner depuis Marché)
```sql
-- Dans Neon (via run-any.js avec un fichier reset-mp.sql) :
TRUNCATE mp_operation, mp_procedure, mp_attribution, mp_avenant, mp_garantie,
  mp_visa_cf, mp_echeancier, mp_cloture, mp_ppm_plan, mp_budget_line,
  mp_recours, mp_cle_repartition, mp_ordre_service, mp_resiliation,
  mp_entreprise, mp_groupement, mp_ano, mp_document, mp_decompte,
  mp_difficulte, mp_livrable;
INSERT INTO mp_operation SELECT * FROM operation;
-- ...
```

---

## 6. Démarrage en local

### Méthode standard (frontend + worker dev)
```bash
cd /Users/iritiemaxence/Documents/SIDCF
./lancer.sh
```
- Frontend Python sur http://localhost:7001
- Worker Cloudflare en mode dev sur http://localhost:8787

### Frontend seul (utilise le Worker en prod)
```bash
cd /Users/iritiemaxence/Documents/SIDCF/sidcf-portal
python3 -m http.server 7001
```
L'app interrogera directement `https://sidcf-portal-api.sidcf.workers.dev`.

---

## 7. Déploiements

### Côté DB (Neon) — exécuter une migration SQL
```bash
cd /Users/iritiemaxence/Documents/SIDCF/postgres/migrations
node run-any.js <fichier.sql>
```
Ce runner utilise `@neondatabase/serverless` (HTTP/fetch) — fiable en dehors du réseau d'AWS qui peut bloquer le port 5432.

### Côté Worker — déployer la nouvelle version
```bash
cd /Users/iritiemaxence/Documents/SIDCF/postgres/worker
npx wrangler login   # une fois, choisir le compte Miritie@yahoo.fr (Continue with GitHub)
npx wrangler deploy
```
URL prod : `https://sidcf-portal-api.sidcf.workers.dev`

### Côté Frontend — pas de déploiement nécessaire
Les fichiers JS/CSS sont servis statiquement (Vercel ou autre static host).

---

## 8. Diagnostics

| URL | Usage |
|---|---|
| `#/diagnostics/health` | Vérifie boot, DataService, conteneurs DOM, stats DB |
| Console F12 | Tous les logs préfixés `[Boot]`, `[DataService]`, `[Marché]`, `[Marché+]`, `[Router]` |
| `https://sidcf-portal-api.sidcf.workers.dev/api/entities/MP_OPERATION` | Tester l'API live |

En cas d'écran blanc → F12 → console. Le boot timeout après 10s affiche un panneau d'erreur.

### Logs du Worker en live
```bash
cd postgres/worker && npx wrangler tail
```
