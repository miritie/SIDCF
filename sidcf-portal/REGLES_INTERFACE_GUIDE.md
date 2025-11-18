# Guide d'utilisation - Interface Règles & Procédures V2

## Date : 2025-01-18

## Accès à l'interface

**URL :** `http://localhost:7001/#/admin/regles-v2`

**Navigation :** Administration > Règles & Procédures

---

## Vue d'ensemble

L'écran **Règles & Procédures V2** affiche toutes les règles métier actuellement utilisées par l'application SIDCF Portal. Ces règles proviennent actuellement du fichier `js/config/rules-config.json` et seront bientôt migrées vers PostgreSQL.

---

## Structure de l'écran

### En-tête
- **Titre :** ⚖️ Règles & Procédures
- **Bouton :** 🔄 Recharger (pour recharger les règles depuis la source)
- **Alert info :** Explique que les règles sont stockées en base de données

### Onglets (6 au total)

L'écran contient **6 onglets** :

#### 1. **Seuils & Limites** (5 règles)
Affiche les seuils réglementaires éditables :

| Code | Description | Valeur | Unité | Sévérité |
|------|-------------|--------|-------|----------|
| SEUIL_CUMUL_AVENANTS | Cumul maximum d'avenants autorisé | 30 | % | BLOQUANT |
| SEUIL_ALERTE_AVENANTS | Seuil d'alerte pour les avenants | 25 | % | ALERTE |
| TAUX_MAX_AVANCE | Taux maximum d'avance de démarrage | 15 | % | BLOQUANT |
| DELAI_MAX_OS_APRES_VISA | Délai max pour émettre l'OS après visa | 30 | jours | ALERTE |
| DELAI_MAINLEVEE_GARANTIE | Délai après réception définitive | 365 | jours | ALERTE |

**Fonctionnalités :**
- ✅ Édition en ligne des valeurs (input numérique)
- ✅ Sauvegarde automatique après 2 secondes
- ✅ Bouton "📜 Historique" pour voir les modifications passées

#### 2. **Validations** (5 validations)
Affiche les validations métier avec toggle ON/OFF :

- ✅ VALIDATION_MONTANT_MARCHE - Vérifier cohérence avec PPM - **BLOQUANT**
- ✅ VALIDATION_DATE_OS - Date OS postérieure à attribution - **BLOQUANT**
- ✅ VALIDATION_CUMUL_AVENANTS - Cumul avenants ≤ seuil - **BLOQUANT**
- ✅ VALIDATION_GARANTIE_AVANCE - Garantie requise si avance > 0 - **BLOQUANT**
- ✅ VALIDATION_NCC_ATTRIBUTAIRE - NCC de l'attributaire valide - **ALERTE**

**Fonctionnalités :**
- ✅ Toggle switch pour activer/désactiver
- ✅ Badge de sévérité (BLOQUANT/ALERTE)
- ✅ Description de chaque validation

#### 3. **Délais** (3 règles)
Affiche les délais réglementaires :

| Code | Description | Valeur | Unité |
|------|-------------|--------|-------|
| DELAI_RECOURS | Délai de recours après attribution | 10 | jours |
| DELAI_PUBLICATION_ANO | Délai de publication ANO | 15 | jours |
| DELAI_GARANTIE | Délai de garantie après réception | 365 | jours |

#### 4. **Garanties** (Réglementaire - Non éditable)
Affiche les garanties bancaires définies par le Code des Marchés Publics :

- **GARANTIE BONNE EXECUTION** : 3% - 5%
- **GARANTIE AVANCE** : Selon taux d'avance
- **RETENUE DE GARANTIE** : 10%

**Note :** Ces valeurs sont fixées par la réglementation et ne sont pas modifiables.

#### 5. **Matrices Procédures** (Réglementaire)
Affiche les procédures applicables selon les seuils de montant :

**Administration Centrale :**

| Mode | Procédure | Seuils |
|------|-----------|--------|
| **PSD** | Procédure Simplifiée d'Entente Directe | 0M → 10M XOF |
| **PSC** | Procédure Simplifiée de Cotation | 10M → 30M XOF |
| **PSL** | Procédure Simplifiée à Compétition Limitée | 30M → 50M XOF |
| **PSO** | Procédure Simplifiée à Compétition Ouverte | 50M → 100M XOF |
| **AOO** | Appel d'Offres Ouvert | 100M+ XOF |
| **PI** | Prestations Intellectuelles | Variable |

**Affichage :**
- Cards avec badge du mode
- Plages de montant formatées
- Description de chaque procédure

#### 6. **ANO (Avis de Non-Objection)** (Réglementaire)
Affiche la configuration ANO :

**Description :** Certains marchés requièrent un ANO du bailleur avant attribution

**Modes requérant ANO :**
- AOO
- PSO
- PSL
- PI

**Bailleurs requérant ANO :**
- BAD (Banque Africaine de Développement)
- BM (Banque Mondiale)
- AFD (Agence Française de Développement)
- UE (Union Européenne)

**Seuils de montant par type :**
- TRAVAUX : 100M XOF
- FOURNITURES : 50M XOF
- SERVICES : 30M XOF
- PRESTATIONS_INTELLECTUELLES : 20M XOF

---

## Ce que vous devriez voir

### Au chargement de la page :
1. ✅ En-tête avec titre et boutons
2. ✅ Alert info bleue avec description
3. ✅ **6 onglets horizontaux** avec le premier actif (souligné en bleu)
4. ✅ Contenu du premier onglet "Seuils & Limites" avec **table de 5 règles**
5. ✅ Bouton "← Retour au portail" en bas

### Lorsque vous cliquez sur un onglet :
1. ✅ L'onglet devient actif (souligné en bleu)
2. ✅ Le contenu change pour afficher les règles de cette catégorie
3. ✅ Les autres onglets deviennent inactifs (gris)

---

## Fonctionnalités implémentées

### ✅ Chargement des règles
- Chargement depuis `rules-config.json` via `dataService.getRulesConfig()`
- Conversion en tableau de règles avec `convertJsonToRules()`
- Log dans la console : `[ReglesV2] Loaded rules: X`

### ✅ Affichage par catégorie
- Filtrage des règles par catégorie (seuils, validations, délais, garanties)
- Affichage des matrices et ANO depuis le JSON original
- Compteur de règles affiché dans chaque en-tête de card

### ✅ Édition en ligne (Préparé)
- Inputs numériques pour les valeurs éditables
- Toggles pour activer/désactiver les validations
- Auto-save après 2 secondes
- Bouton de sauvegarde avec compteur de modifications

### ✅ Formatage
- Montants formatés (ex: 10M XOF, 30M XOF)
- Badges colorés pour la sévérité (rouge = BLOQUANT, jaune = ALERTE)
- Cards et tables responsive

---

## Vérification du bon fonctionnement

### 1. Ouvrir la console du navigateur (F12)
Vous devriez voir :
```
[ReglesV2] Rendering rules management screen
[ReglesV2] Loaded rules: 18
```

### 2. Inspecter le nombre de règles par catégorie
- **Seuils :** 5 règles
- **Validations :** 5 validations
- **Délais :** 3 règles
- **Garanties :** 3 règles
- **Matrices :** 1 configuration (ADMIN_CENTRALE avec 6 procédures)
- **ANO :** 1 configuration

### 3. Tester l'interaction
- ✅ Cliquer sur chaque onglet → Le contenu change
- ✅ Modifier une valeur dans "Seuils" → Le compteur "(1)" apparaît
- ✅ Attendre 2 secondes → Message "✅ Enregistré !"
- ✅ Cliquer sur "📜 Historique" → Alert "(À implémenter)"

---

## Dépannage

### Problème : "Les onglets ne s'affichent pas"
**Solution :** Vérifier que le CSS des onglets a été ajouté à `components.css`
```bash
grep "\.tabs" sidcf-portal/css/components.css
```

### Problème : "Le contenu est vide"
**Solution :** Vérifier dans la console :
1. Y a-t-il des erreurs JavaScript ?
2. Le fichier `rules-config.json` est-il chargé ?
```bash
curl http://localhost:7001/js/config/rules-config.json | head -50
```

### Problème : "Les règles ne se sauvent pas"
**Réponse :** C'est normal ! L'API PostgreSQL n'est pas encore implémentée. Actuellement, la sauvegarde est simulée (ligne 601 de `regles-procedures-v2.js`).

---

## Prochaines étapes

### Phase 2 : API Backend
1. Implémenter les endpoints Cloudflare Worker :
   - `GET /api/regles` - Liste des règles
   - `PUT /api/regles/:id` - Mise à jour d'une règle
   - `PUT /api/regles/batch` - Mise à jour batch
   - `GET /api/regles/:id/historique` - Historique des modifications

2. Connecter l'interface aux endpoints réels
3. Remplacer la sauvegarde simulée par de vrais appels API

### Phase 3 : Migration PostgreSQL
1. Appliquer la migration `005_regles_metier.sql`
2. Importer les règles depuis `rules-config.json` vers PostgreSQL
3. Basculer le chargement depuis la BD au lieu du JSON

---

## Fichiers concernés

### Frontend
- `sidcf-portal/js/admin/regles-procedures-v2.js` - Interface complète
- `sidcf-portal/css/components.css` - CSS des onglets et composants
- `sidcf-portal/js/config/rules-config.json` - Source actuelle des règles

### Backend (À créer)
- `postgres/worker/src/routes/regles.ts` - API endpoints
- `postgres/migrations/005_regles_metier.sql` - Structure BD (✅ Créé)

### Documentation
- `GESTION_REGLES_BD.md` - Documentation complète du système
- `REGLES_INTERFACE_GUIDE.md` - Ce document

---

**Dernière mise à jour :** 2025-01-18
**Auteur :** Claude Code
**Statut :** ✅ Interface complète - CSS ajouté - Prêt à tester
