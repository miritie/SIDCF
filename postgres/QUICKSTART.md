# 🚀 Guide de Démarrage Rapide - PostgreSQL + R2

## Temps estimé : 10 minutes

Ce guide vous permettra de tester rapidement la nouvelle architecture PostgreSQL + Cloudflare R2.

---

## ✅ Prérequis

Assurez-vous d'avoir installé :
- **Node.js** (v18 ou supérieur) - [Télécharger](https://nodejs.org/)
- **Git** - Pour gérer les branches
- **Un navigateur moderne** (Chrome, Firefox, Safari, Edge)

---

## 📋 Étapes

### 1️⃣ Migrer la base de données (2 min)

```bash
# Se positionner dans le dossier migrations
cd postgres/migrations

# Installer les dépendances
npm install

# Exécuter la migration (crée les 21 tables)
npm run migrate

# Charger les données de test
npm run seed
```

**Résultat attendu :**
```
✅ Connecté avec succès !
✅ Migration exécutée avec succès !
📊 Tables créées : 21
✅ 3 entreprises créées
✅ 2 opérations créées
🎉 Seed data créées avec succès !
```

---

### 2️⃣ Démarrer le Worker API (1 min)

```bash
# Aller dans le dossier worker
cd ../worker

# Installer les dépendances
npm install

# Démarrer le serveur local
npm run dev
```

**Résultat attendu :**
```
⛅️ wrangler 3.22.1
-------------------
⬣ Listening on http://localhost:8787
```

**⚠️ Laissez ce terminal ouvert** - Le Worker doit rester actif.

---

### 3️⃣ Ouvrir la page de test (1 min)

Dans un **nouveau terminal** :

```bash
# Retour à la racine
cd ../..

# Démarrer un serveur HTTP simple (Python)
# Option 1: Python 3
python3 -m http.server 8080

# Option 2: Python 2
python -m SimpleHTTPServer 8080

# Option 3: Node.js (si http-server installé)
npx http-server -p 8080
```

Puis ouvrez votre navigateur :

👉 **http://localhost:8080/sidcf-portal/test-postgres.html**

---

### 4️⃣ Lancer les tests (5 min)

Dans la page web ouverte :

1. **Cliquez sur "▶️ Lancer tous les tests"**
2. Observez les logs en temps réel
3. Tous les tests doivent passer au vert ✅

**Tests exécutés :**
- ✅ Connexion API Worker
- ✅ Connexion PostgreSQL
- ✅ CRUD Opérations (Create, Read, Update, Delete)
- ✅ Statistiques globales
- ✅ DataService Integration

**Pour tester l'upload de fichiers :**
1. Cliquez sur "Choisir un fichier"
2. Sélectionnez un fichier (PDF, image, etc.)
3. Cliquez sur "Upload fichier"
4. Vérifiez que l'URL R2 s'affiche ✅

---

## 🎯 Test rapide en ligne de commande

Si vous préférez tester directement avec `curl` :

```bash
# Health check
curl http://localhost:8787/health

# Lister les opérations
curl http://localhost:8787/api/entities/OPERATION

# Statistiques
curl http://localhost:8787/api/stats

# Créer une opération
curl -X POST http://localhost:8787/api/entities/OPERATION \
  -H "Content-Type: application/json" \
  -d '{
    "unite": "DCF",
    "exercice": 2024,
    "objet": "Test CLI",
    "typeMarche": "TRAVAUX",
    "montantPrevisionnel": 1000000,
    "etat": "PLANIFIE"
  }'
```

---

## 🧪 Tester avec le frontend complet

```bash
# Ouvrir l'application principale
open http://localhost:8080/sidcf-portal/index.html
```

L'application détectera automatiquement `dataProvider: postgres` dans la config et utilisera PostgreSQL.

---

## 🔍 Vérifier la base de données

Pour inspecter directement PostgreSQL :

```bash
# Se connecter avec psql
psql "postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Commandes utiles
\dt                          # Lister les tables
SELECT COUNT(*) FROM operation;
SELECT * FROM v_stats_global;
\q                           # Quitter
```

---

## 🔄 Revenir à localStorage

Si vous voulez tester avec l'ancienne architecture :

### Option 1 : Modifier la config

```json
// sidcf-portal/js/config/app-config.json
{
  "dataProvider": "localStorage"
}
```

Rechargez la page, le système basculera automatiquement.

### Option 2 : Changer de branche Git

```bash
git checkout main
```

---

## 🐛 Problèmes courants

### ❌ "Failed to connect to API"

**Solution :**
- Vérifiez que le Worker est démarré : `npm run dev` dans `postgres/worker/`
- Vérifiez l'URL : `http://localhost:8787/health`

### ❌ "Database connection failed"

**Solution :**
- Vérifiez la connexion PostgreSQL avec `psql`
- Vérifiez que la migration a bien été exécutée : `npm run migrate`

### ❌ "CORS error"

**Solution :**
- Assurez-vous d'utiliser un serveur HTTP (pas `file://`)
- Vérifiez que le Worker autorise `localhost` dans les CORS

### ❌ "No data found"

**Solution :**
- Chargez les données seed : `npm run seed`

---

## 📊 Résultats attendus

Après avoir suivi ce guide, vous devriez avoir :

✅ **PostgreSQL** : 21 tables créées avec données de test
✅ **Cloudflare Worker** : API REST fonctionnelle sur port 8787
✅ **Frontend** : Application connectée à PostgreSQL
✅ **Tests** : Tous les tests passent au vert
✅ **R2** : Upload/download de fichiers fonctionnel

---

## 🎓 Prochaines étapes

### Développement
1. Ajoutez vos propres données dans PostgreSQL
2. Testez les écrans de l'application (PPM, Procédure, etc.)
3. Uploadez des documents réels

### Déploiement
1. Déployez le Worker sur Cloudflare : `npm run deploy`
2. Mettez à jour `apiUrl` dans `app-config.json` avec l'URL de production
3. Configurez les secrets Cloudflare pour la sécurité

---

## 📞 Besoin d'aide ?

- 📖 Documentation complète : [postgres/README.md](./README.md)
- 🐛 Problème technique : Créer une issue GitHub
- 💬 Questions : Consultez les logs de la console navigateur (F12)

---

**Bon test ! 🚀**
