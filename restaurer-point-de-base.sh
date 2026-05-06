#!/bin/bash

# ============================================
# SIDCF - Restauration au "POINT DE BASE"
# ============================================
# Ramène le projet à l'état du tag git "point-de-base".
# Toutes les modifications non commitées seront PERDUES.
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

cd "$(dirname "$0")"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🔄 SIDCF - Restauration au POINT DE BASE    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que le tag existe
if ! git rev-parse --verify --quiet "refs/tags/point-de-base" > /dev/null; then
    echo -e "${RED}❌ Le tag 'point-de-base' n'existe pas dans ce dépôt.${NC}"
    echo -e "${YELLOW}   Créez-le avec : git tag -a point-de-base -m \"Point de base\"${NC}"
    exit 1
fi

TAG_COMMIT=$(git rev-parse --short point-de-base)
CURRENT_COMMIT=$(git rev-parse --short HEAD)

echo -e "📌 Commit actuel       : ${YELLOW}${CURRENT_COMMIT}${NC}"
echo -e "📌 Cible (point-de-base): ${GREEN}${TAG_COMMIT}${NC}"
echo ""

# Détecter modifications non commitées
DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
    echo -e "${YELLOW}⚠️  Modifications non commitées détectées :${NC}"
    git status --short
    echo ""
fi

# Détecter fichiers non suivis
UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$UNTRACKED" ]; then
    echo -e "${YELLOW}⚠️  Fichiers non suivis (seront supprimés si vous confirmez le clean) :${NC}"
    echo "$UNTRACKED" | sed 's/^/   /'
    echo ""
fi

echo -e "${RED}⚠️  ATTENTION : cette opération est DESTRUCTIVE.${NC}"
echo -e "${RED}   Toutes les modifications locales non commitées seront PERDUES.${NC}"
echo ""
read -p "Continuer la restauration ? (tapez 'OUI' pour confirmer) : " CONFIRM

if [ "$CONFIRM" != "OUI" ]; then
    echo -e "${YELLOW}↪ Annulé. Aucune modification effectuée.${NC}"
    exit 0
fi

# Sauvegarde de sécurité (stash) au cas où
if [ -n "$DIRTY" ]; then
    STASH_NAME="auto-backup-avant-restauration-$(date +%Y%m%d-%H%M%S)"
    echo ""
    echo -e "${BLUE}💾 Sauvegarde des modifications dans un stash : ${STASH_NAME}${NC}"
    git stash push -u -m "$STASH_NAME" || true
    echo -e "${GREEN}   (Récupération possible avec : git stash list ; git stash apply <stash>)${NC}"
fi

echo ""
echo -e "${BLUE}🔄 Réinitialisation HEAD vers point-de-base...${NC}"
git reset --hard point-de-base

# Proposer un nettoyage des fichiers non suivis restants
REMAINING_UNTRACKED=$(git ls-files --others --exclude-standard)
if [ -n "$REMAINING_UNTRACKED" ]; then
    echo ""
    echo -e "${YELLOW}Des fichiers non suivis subsistent :${NC}"
    echo "$REMAINING_UNTRACKED" | sed 's/^/   /'
    echo ""
    read -p "Les supprimer aussi ? (tapez 'OUI' pour confirmer) : " CLEAN_CONFIRM
    if [ "$CLEAN_CONFIRM" = "OUI" ]; then
        git clean -fd
        echo -e "${GREEN}✓ Fichiers non suivis supprimés${NC}"
    else
        echo -e "${YELLOW}↪ Fichiers non suivis conservés${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Projet restauré au POINT DE BASE          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📌 Commit courant : ${GREEN}$(git rev-parse --short HEAD)${NC}"
echo -e "📌 Branche        : ${GREEN}$(git rev-parse --abbrev-ref HEAD)${NC}"
echo ""
