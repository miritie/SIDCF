# 🚀 Guide de Lancement - SIDCF Portal

## Méthode Simple: Script Bash (Recommandé)

### Depuis la racine du projet:

```bash
./lancer.sh
```

C'est tout! Le script va:
- ✅ Vérifier les dépendances (Python 3, Node.js, npm)
- ✅ Installer automatiquement les dépendances du worker si nécessaire
- ✅ Lancer le frontend (port 7001)
- ✅ Lancer le worker API (port 8787)
- ✅ Afficher des logs colorés et organisés

### Arrêt

Appuyez sur `CTRL+C` pour arrêter tous les services proprement.

---

## Méthode Alternative: npm (si vous avez installé concurrently)

### 1. Installer concurrently (une seule fois)

```bash
npm install
```

### 2. Lancer

```bash
npm run lancer
# ou
npm run dev
```

---

## Méthode Manuelle (si vous préférez)

### Terminal 1: Frontend

```bash
cd sidcf-portal
python3 -m http.server 7001
```

### Terminal 2: Worker

```bash
cd postgres/worker
npm run dev
```

---

## URLs d'Accès

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:7001 | Interface utilisateur SIDCF Portal |
| **Worker API** | http://localhost:8787 | API Cloudflare Worker (PostgreSQL + R2) |

---

## Vérifications

### Frontend OK?
Ouvrir http://localhost:7001 dans le navigateur
- Vous devriez voir la page d'accueil SIDCF Portal

### Worker OK?
```bash
curl http://localhost:8787/health
```
Réponse attendue:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "database": "connected",
  "storage": "configured"
}
```

---

## Dépannage

### ❌ Erreur "Permission denied"

```bash
chmod +x lancer.sh
```

### ❌ Erreur "Python 3 non trouvé"

Installer Python 3:
- macOS: `brew install python3`
- Ubuntu: `sudo apt install python3`
- Windows: Télécharger depuis https://python.org

### ❌ Erreur "Node.js non trouvé"

Installer Node.js:
- Télécharger depuis https://nodejs.org (LTS recommandé)
- Ou via nvm: `nvm install --lts`

### ❌ Port 7001 ou 8787 déjà utilisé

Trouver et tuer le processus:
```bash
# Port 7001
lsof -ti:7001 | xargs kill -9

# Port 8787
lsof -ti:8787 | xargs kill -9
```

Puis relancer `./lancer.sh`

### ❌ Worker ne démarre pas

Vérifier les variables d'environnement dans `postgres/worker/wrangler.toml`:
```toml
[vars]
DATABASE_URL = "postgresql://..."
R2_BUCKET_NAME = "sidcf-documents"
```

Relancer:
```bash
cd postgres/worker
npm install
npm run dev
```

---

## Commandes Utiles

| Commande | Description |
|----------|-------------|
| `./lancer.sh` | Lancer frontend + worker |
| `npm run lancer` | Même chose via npm |
| `npm run install:all` | Installer dépendances worker |
| `npm run deploy:worker` | Déployer le worker en production |

---

## Architecture

```
SIDCF/
├── lancer.sh              ← Script de lancement unifié
├── package.json           ← Configuration workspace
├── sidcf-portal/          ← Frontend (vanilla JS)
│   └── index.html
└── postgres/
    └── worker/            ← Backend Cloudflare Worker
        ├── src/
        ├── wrangler.toml
        └── package.json
```

---

## Logs

Le script `lancer.sh` affiche les logs du worker en temps réel.

Pour voir uniquement les logs du worker:
```bash
cd postgres/worker
npm run tail
```

---

**Version**: 2.0
**Dernière mise à jour**: 2025-11-17
