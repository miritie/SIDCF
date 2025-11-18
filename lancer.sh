#!/bin/bash

# ============================================
# SIDCF Portal - Lanceur Unifié
# ============================================
# Lance simultanément:
# - Frontend (Python HTTP Server sur port 7001)
# - Worker Cloudflare (Wrangler Dev)
# ============================================

# Couleurs pour l'affichage
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      🚀 SIDCF Portal - Lanceur Unifié         ║${NC}"
echo -e "${GREEN}║      PostgreSQL + Cloudflare Architecture     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Vérification des dépendances
echo -e "${YELLOW}🔍 Vérification des dépendances...${NC}"

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 non trouvé. Veuillez installer Python 3.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 détecté${NC}"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non trouvé. Veuillez installer Node.js.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js détecté ($(node -v))${NC}"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm non trouvé. Veuillez installer npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm détecté ($(npm -v))${NC}"

# Vérifier wrangler dans le worker
if [ ! -d "postgres/worker/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances du worker...${NC}"
    cd postgres/worker && npm install && cd ../..
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Dépendances installées${NC}"
fi

echo ""
echo -e "${GREEN}✓ Toutes les dépendances sont satisfaites${NC}"
echo ""

# Fonction pour tuer les processus sur un port
kill_port() {
    local PORT=$1
    local SERVICE_NAME=$2

    echo -e "${YELLOW}🔍 Vérification du port ${PORT} (${SERVICE_NAME})...${NC}"

    # Chercher les processus utilisant le port
    local PIDS=$(lsof -ti:${PORT} 2>/dev/null)

    if [ ! -z "$PIDS" ]; then
        echo -e "${YELLOW}⚠️  Processus existant détecté sur le port ${PORT}${NC}"
        echo -e "${YELLOW}   Arrêt forcé des processus: ${PIDS}${NC}"

        # Tuer les processus
        kill -9 $PIDS 2>/dev/null
        sleep 1

        # Vérifier que le port est bien libéré
        local CHECK=$(lsof -ti:${PORT} 2>/dev/null)
        if [ -z "$CHECK" ]; then
            echo -e "${GREEN}✓ Port ${PORT} libéré${NC}"
        else
            echo -e "${RED}❌ Impossible de libérer le port ${PORT}${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Port ${PORT} disponible${NC}"
    fi
}

# Fonction pour nettoyer les processus en arrière-plan
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des services...${NC}"

    # Tuer les processus enregistrés
    if [ ! -z "$FRONT_PID" ]; then
        kill -9 $FRONT_PID 2>/dev/null
        echo -e "${GREEN}✓ Frontend arrêté (PID: $FRONT_PID)${NC}"
    fi

    if [ ! -z "$WORKER_PID" ]; then
        kill -9 $WORKER_PID 2>/dev/null
        echo -e "${GREEN}✓ Worker arrêté (PID: $WORKER_PID)${NC}"
    fi

    # Forcer l'arrêt des ports (sécurité)
    lsof -ti:7001 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -ti:8787 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -ti:9229 2>/dev/null | xargs kill -9 2>/dev/null

    echo -e "${GREEN}✓ Tous les services arrêtés${NC}"
    exit 0
}

# Capturer CTRL+C
trap cleanup SIGINT SIGTERM

# Nettoyer les ports avant démarrage
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}🧹 Nettoyage des ports...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
kill_port 7001 "Frontend"
kill_port 8787 "Worker"
kill_port 9229 "Node Inspector"
echo ""

# Lancer le Frontend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 FRONTEND - Python HTTP Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📂 Répertoire: sidcf-portal/"
echo -e "🌍 URL: ${GREEN}http://localhost:7001${NC}"
echo ""

# Vérifier que le répertoire existe
if [ ! -d "sidcf-portal" ]; then
    echo -e "${RED}❌ Répertoire sidcf-portal/ non trouvé${NC}"
    exit 1
fi

# Démarrer le serveur Python depuis le bon répertoire
(cd sidcf-portal && python3 -m http.server 7001) > /tmp/sidcf-front.log 2>&1 &
FRONT_PID=$!

# Attendre que le serveur démarre
sleep 2

if ps -p $FRONT_PID > /dev/null; then
    echo -e "${GREEN}✓ Frontend démarré (PID: $FRONT_PID)${NC}"
else
    echo -e "${RED}❌ Échec du démarrage du frontend${NC}"
    echo -e "${YELLOW}Logs: /tmp/sidcf-front.log${NC}"
    cat /tmp/sidcf-front.log
    exit 1
fi

echo ""

# Lancer le Worker
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}⚙️  WORKER - Cloudflare Wrangler Dev${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📂 Répertoire: postgres/worker/"
echo -e "🔗 API: ${GREEN}http://localhost:8787${NC} (par défaut)"
echo ""

# Vérifier que le répertoire existe
if [ ! -d "postgres/worker" ]; then
    echo -e "${RED}❌ Répertoire postgres/worker/ non trouvé${NC}"
    kill $FRONT_PID 2>/dev/null
    exit 1
fi

# Démarrer le worker (désactiver l'inspecteur Node.js pour éviter les conflits de port)
(cd postgres/worker && NODE_OPTIONS="--inspect=0" npm run dev) > /tmp/sidcf-worker.log 2>&1 &
WORKER_PID=$!

# Attendre que le worker démarre
sleep 3

if ps -p $WORKER_PID > /dev/null; then
    echo -e "${GREEN}✓ Worker démarré (PID: $WORKER_PID)${NC}"
else
    echo -e "${RED}❌ Échec du démarrage du worker${NC}"
    echo -e "${YELLOW}Logs: /tmp/sidcf-worker.log${NC}"
    cat /tmp/sidcf-worker.log
    kill $FRONT_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ TOUS LES SERVICES LANCÉS          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📌 ${BLUE}Frontend:${NC} http://localhost:7001"
echo -e "📌 ${MAGENTA}Worker API:${NC} http://localhost:8787"
echo ""
echo -e "${YELLOW}💡 Appuyez sur CTRL+C pour arrêter tous les services${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Suivre les logs du worker (optionnel)
echo -e "${YELLOW}📋 Logs du Worker (CTRL+C pour quitter):${NC}"
echo ""
cd postgres/worker && NODE_OPTIONS="--inspect=0" npm run dev
