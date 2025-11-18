#!/bin/bash

# ============================================
# Mise à jour de Wrangler vers la version 4.x
# ============================================

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      📦 Mise à jour Wrangler → v4.x           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que le répertoire existe
if [ ! -d "postgres/worker" ]; then
    echo -e "${RED}❌ Répertoire postgres/worker/ non trouvé${NC}"
    exit 1
fi

cd postgres/worker

echo -e "${YELLOW}📋 Version actuelle de Wrangler:${NC}"
npm list wrangler 2>/dev/null || echo "Wrangler non installé"
echo ""

echo -e "${YELLOW}🔄 Mise à jour vers Wrangler v4.x...${NC}"
npm install --save-dev wrangler@4

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Wrangler mis à jour avec succès${NC}"
    echo ""
    echo -e "${YELLOW}📋 Nouvelle version:${NC}"
    npm list wrangler
    echo ""
    echo -e "${GREEN}💡 Vous pouvez maintenant lancer le projet avec:${NC}"
    echo -e "   ${BLUE}./lancer.sh${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors de la mise à jour${NC}"
    exit 1
fi
