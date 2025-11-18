# Migration PostgreSQL + Cloudflare R2 - SIDCF Portal

## 📋 Vue d'ensemble

Cette branche `postgres` contient la migration complète du SIDCF Portal vers une architecture cloud moderne :

- **Base de données** : PostgreSQL (Neon Database)
- **Stockage fichiers** : Cloudflare R2 (S3-compatible)
- **API** : Cloudflare Workers (serverless)
- **Frontend** : Adapter pattern (compatible avec l'existant)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Frontend (Browser)                         │
│  - PostgresAdapter (postgres-adapter.js)             │
│  - R2Storage Service (r2-storage.js)                 │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/REST
         ┌───────▼──────────────────────┐
         │   Cloudflare Worker          │
         │  (serverless API)            │
         │  - CRUD operations           │
         │  - File upload/download      │
         └───────┬──────────┬───────────┘
                 │          │
      ┌──────────▼─┐    ┌───▼───────────┐
      │ PostgreSQL │    │ Cloudflare R2 │
      │   (Neon)   │    │   (Storage)   │
      └────────────┘    └───────────────┘
```

## 📁 Structure des fichiers

```
postgres/
├── migrations/
│   ├── 001_create_schema.sql       # Schéma PostgreSQL complet (21 tables)
│   ├── run-migration.js            # Script d'exécution de la migration
│   ├── seed-data.js                # Données seed cohérentes
│   ├── reset-database.js           # Script de reset (à créer si besoin)
│   └── package.json                # Dépendances Node.js (pg)
│
├── worker/
│   ├── src/
│   │   └── index.js                # Cloudflare Worker (API principale)
│   ├── wrangler.toml               # Configuration Cloudflare
│   └── package.json                # Dépendances Worker
│
└── README.md                       # Ce fichier

sidcf-portal/
├── js/
│   ├── datastore/
│   │   ├── adapters/
│   │   │   └── postgres-adapter.js # Adapter PostgreSQL pour le frontend
│   │   └── data-service.js         # Mis à jour avec support PostgreSQL
│   │
│   ├── lib/
│   │   └── r2-storage.js           # Service de stockage R2
│   │
│   └── config/
│       └── app-config.json         # Configuration mise à jour (dataProvider: postgres)
```

## 🚀 Installation et Déploiement

### Étape 1 : Migration du schéma PostgreSQL

```bash
cd postgres/migrations

# Installer les dépendances
npm install

# Exécuter la migration (crée les 21 tables)
npm run migrate
```

**Résultat attendu :**
- 21 tables créées
- Triggers `updated_at` configurés
- 2 vues SQL (v_operations_full, v_stats_global)
- Indexes optimisés

### Étape 2 : Charger les données seed (optionnel)

```bash
# Charger un jeu de données cohérent
npm run seed
```

**Données seed créées :**
- 3 entreprises
- 1 plan PPM (2024)
- 2 lignes budgétaires
- 2 opérations (marchés)
- 1 procédure complète
- 1 attribution

### Étape 3 : Déployer le Cloudflare Worker

```bash
cd ../worker

# Installer les dépendances
npm install

# Tester en local (port 8787)
npm run dev

# Déployer en production (nécessite compte Cloudflare)
npm run deploy
```

**Configuration requise dans Cloudflare :**
1. Créer un Worker dans le dashboard Cloudflare
2. Lier le bucket R2 `sidcf` au Worker
3. Configurer les variables d'environnement :
   - `DATABASE_URL` : Connection string PostgreSQL
   - `R2_BUCKET_NAME` : `sidcf`

### Étape 4 : Tester l'API

```bash
# Health check
curl http://localhost:8787/health

# Lister les opérations
curl http://localhost:8787/api/entities/OPERATION

# Statistiques
curl http://localhost:8787/api/stats
```

### Étape 5 : Lancer le frontend

```bash
cd ../../sidcf-portal

# Ouvrir dans le navigateur (avec live server ou équivalent)
open index.html
```

Le frontend détectera automatiquement la configuration `dataProvider: postgres` et utilisera le PostgresAdapter.

## 🔧 Configuration

### Configuration PostgreSQL ([app-config.json](../sidcf-portal/js/config/app-config.json))

```json
{
  "dataProvider": "postgres",
  "postgres": {
    "enabled": true,
    "apiUrl": "http://localhost:8787",
    "connectionString": "postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  }
}
```

### Configuration Cloudflare R2

```json
{
  "r2": {
    "enabled": true,
    "bucketName": "sidcf",
    "endpoint": "https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com",
    "publicUrl": "https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com/sidcf"
  }
}
```

**Credentials R2 (déjà configurés dans le Worker) :**
- Access Key ID : `d508cf1caa97484a4dca02b300d3f891`
- Secret Access Key : `dadd484fb1d960ac8b66543be18eda446755df83f4d36223b9d7249b50bad317`

## 📊 Schéma de base de données

### Tables principales (21 au total)

| Table | Description | Relations |
|-------|-------------|-----------|
| `ppm_plan` | Plans de Passation des Marchés | - |
| `operation` | Marchés publics | → `ppm_plan`, `budget_line` |
| `budget_line` | Lignes budgétaires | - |
| `livrable` | Livrables attendus | → `operation` |
| `entreprise` | Entreprises soumissionnaires | - |
| `groupement` | Groupements d'entreprises | → `entreprise` (mandataire) |
| `procedure` | Procédures de passation | → `operation` |
| `recours` | Recours gracieux/contentieux | → `operation` |
| `attribution` | Attributions de marchés | → `operation` |
| `ano` | Avis de Non-Objection | → `operation` |
| `echeancier` | Échéanciers de paiement | → `operation` |
| `cle_repartition` | Clés de répartition multi-bailleurs | → `operation` |
| `visa_cf` | Visas Contrôleur Financier | → `operation`, `attribution` |
| `ordre_service` | Ordres de service | → `operation` |
| `avenant` | Avenants de marchés | → `operation` |
| `resiliation` | Résiliations | → `operation` |
| `garantie` | Garanties bancaires | → `operation` |
| `cloture` | Clôtures de marchés | → `operation` |
| `document` | Documents (URLs R2) | → `operation` |
| `decompte` | Décomptes de paiement | → `operation`, `ordre_service` |
| `difficulte` | Difficultés d'exécution | → `operation` |

### Vues SQL

- **`v_operations_full`** : Opérations avec statistiques agrégées
- **`v_stats_global`** : Statistiques globales (dashboard)

### Champs JSONB

Les structures complexes sont stockées en JSONB pour flexibilité :
- `chaine_budgetaire` (operation)
- `localisation` (operation, livrable)
- `attributaire` (attribution)
- `montants` (attribution)
- `garanties` (attribution)
- `dates` (attribution, procedure)
- `pv` (procedure)
- Etc.

## 🔌 API Endpoints

### Entities CRUD

```
GET    /api/entities/:entityType              # Liste toutes les entités
GET    /api/entities/:entityType/:id          # Récupère une entité
POST   /api/entities/:entityType              # Crée une entité
PUT    /api/entities/:entityType/:id          # Met à jour une entité
DELETE /api/entities/:entityType/:id          # Supprime une entité
```

**Entity Types disponibles :**
- `PPM_PLAN`, `OPERATION`, `BUDGET_LINE`, `LIVRABLE`, `ENTREPRISE`, `GROUPEMENT`
- `PROCEDURE`, `RECOURS`, `ATTRIBUTION`, `ANO`, `ECHEANCIER`, `CLE_REPARTITION`
- `VISA_CF`, `ORDRE_SERVICE`, `AVENANT`, `RESILIATION`, `GARANTIE`, `CLOTURE`
- `DOCUMENT`, `DECOMPTE`, `DIFFICULTE`

### File Operations (R2)

```
POST   /api/files/upload                      # Upload un fichier
GET    /api/files/download/:fileName          # Télécharge un fichier (signed URL)
DELETE /api/files/:fileName                   # Supprime un fichier
GET    /api/files/metadata/:fileName          # Métadonnées d'un fichier
```

### Statistics

```
GET    /api/stats                             # Statistiques globales
GET    /api/operations/full                   # Opérations avec détails complets
```

## 🧪 Tests

### Test de connexion PostgreSQL

```javascript
// Dans la console navigateur
const testResult = await dataService.adapter.testConnection();
console.log(testResult);
// { success: true, message: 'Connection successful', data: {...} }
```

### Test d'upload fichier

```javascript
// Dans la console navigateur
const file = document.querySelector('input[type="file"]').files[0];
const result = await dataService.adapter.uploadFile(file);
console.log(result);
// { success: true, url: 'https://...', fileName: '...', size: ... }
```

### Test CRUD opération

```javascript
// Créer une opération
const operation = await dataService.add('OPERATION', {
  objet: 'Test marché',
  unite: 'DCF',
  exercice: 2024,
  typeMarche: 'TRAVAUX',
  montantPrevisionnel: 1000000
});

// Récupérer
const retrieved = await dataService.get('OPERATION', operation.id);

// Modifier
await dataService.update('OPERATION', operation.id, {
  montantPrevisionnel: 1500000
});

// Supprimer
await dataService.remove('OPERATION', operation.id);
```

## 🔄 Revenir en arrière (localStorage)

Si vous voulez revenir à localStorage :

### Option 1 : Via configuration

```json
// sidcf-portal/js/config/app-config.json
{
  "dataProvider": "localStorage"
}
```

### Option 2 : Via Git

```bash
# Revenir sur la branche main
git checkout main

# Ou créer une nouvelle branche depuis main
git checkout -b fallback-localStorage main
```

## 📈 Avantages de cette architecture

### PostgreSQL (Neon)

✅ **Scalabilité** : Supporte des milliers de marchés sans ralentissement
✅ **Fiabilité** : Données persistantes, backups automatiques
✅ **Requêtes complexes** : Joins, agrégations, vues SQL
✅ **Transactions ACID** : Intégrité des données garantie
✅ **Multi-utilisateurs** : Plusieurs personnes en simultané

### Cloudflare R2

✅ **Stockage illimité** : Plus de limite 5MB localStorage
✅ **Fichiers volumineux** : Jusqu'à plusieurs GB par fichier
✅ **URLs persistantes** : Liens directs vers les documents
✅ **Bande passante gratuite** : Pas de coûts de sortie (egress)
✅ **CDN intégré** : Téléchargements rapides partout dans le monde

### Cloudflare Workers

✅ **Serverless** : Pas de serveur à gérer
✅ **Latence faible** : Workers déployés dans 200+ datacenters
✅ **Auto-scaling** : S'adapte automatiquement à la charge
✅ **Coût optimisé** : Paiement à l'usage (100k requêtes/jour gratuites)

## 🔐 Sécurité

### Recommandations

1. **Secrets** : Ne jamais commit les credentials en production
   - Utiliser Cloudflare Secrets : `wrangler secret put R2_ACCESS_KEY_ID`
   - Variables d'environnement pour la connexion PostgreSQL

2. **CORS** : Configurer les origines autorisées en production

3. **Authentification** : Ajouter un système d'auth (JWT, OAuth2) pour l'API

4. **Validation** : Valider toutes les entrées côté serveur (Worker)

5. **SQL Injection** : Utiliser des prepared statements (à améliorer dans le Worker)

## 🐛 Troubleshooting

### Le Worker ne se connecte pas à PostgreSQL

```bash
# Vérifier la connexion depuis la ligne de commande
psql "postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Les fichiers ne s'uploadent pas sur R2

```bash
# Tester l'accès R2 avec AWS CLI
aws s3 ls s3://sidcf --endpoint-url https://a406a344d14de27baff112ae126d7144.r2.cloudflarestorage.com
```

### Le frontend ne se connecte pas à l'API

1. Vérifier que le Worker est démarré : `npm run dev`
2. Vérifier l'URL dans `app-config.json` : `"apiUrl": "http://localhost:8787"`
3. Vérifier la console navigateur pour les erreurs CORS

### Erreur "Entity not found"

1. Vérifier que les données seed sont chargées : `npm run seed`
2. Vérifier les tables PostgreSQL : `SELECT COUNT(*) FROM operation;`

## 📚 Documentation supplémentaire

- [Neon Database Documentation](https://neon.tech/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## 🤝 Contribution

Pour signaler un bug ou proposer une amélioration :
1. Créer une issue sur le repo
2. Décrire le problème avec logs et captures d'écran
3. Proposer une solution si possible

## 📝 Changelog

### v2.0.0 - Migration PostgreSQL + R2 (2024-11-17)

- ✅ Schéma PostgreSQL complet (21 tables)
- ✅ Cloudflare Worker API (CRUD + Files)
- ✅ PostgresAdapter frontend
- ✅ R2Storage service
- ✅ Données seed cohérentes
- ✅ Documentation complète

---

**Auteur** : SIDCF Portal Team
**Date** : 17 novembre 2024
**Version** : 2.0.0
