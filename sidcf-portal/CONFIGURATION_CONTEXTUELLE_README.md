# Configuration Contextuelle des Étapes et Champs - SIDCF Portal

## Vue d'ensemble

Le système de configuration contextuelle permet de personnaliser complètement les étapes du cycle de vie des marchés et les champs requis selon le type de procédure (PSD, PSC, PSL, PSO, AOO, PI).

## Architecture

### 1. Base de données PostgreSQL

Deux tables principales ont été créées :

#### Table `phase_config`
Stocke la configuration des étapes pour chaque procédure :
- Libellés (titre, sous-titre)
- Icône et couleur
- Ordre d'affichage
- État (active/requise)

#### Table `field_config`
Stocke la configuration des champs pour chaque phase de chaque procédure :
- Libellés et aide contextuelle
- Type de champ (text, number, date, select, file, etc.)
- Règles de validation (JSON)
- Options pour les sélecteurs
- Visibilité et état (visible/requis/readonly)
- Conditions d'affichage

### 2. Migrations SQL

#### `003_configuration_contextuelle.sql`
- Crée les tables `phase_config` et `field_config`
- Insère les configurations par défaut pour les 6 types de procédures
- Configure les étapes de PLANIFICATION et PROCÉDURE

#### `004_configuration_attribution_execution.sql`
- Configure les champs pour les phases ATTRIBUTION, EXÉCUTION et CLÔTURE
- Différencie les champs selon les procédures (ex: PSD vs AOO)

### 3. Interface d'administration

#### Écran: Configuration des Étapes
**URL:** `#/admin/config-etapes`

**Fonctionnalités:**
- ✅ Sélection du type de procédure
- ✅ Modification des libellés (titre/sous-titre)
- ✅ Changement d'icône (emoji)
- ✅ Choix de couleur
- ✅ Réorganisation de l'ordre des étapes (⬆️⬇️)
- ✅ Activation/désactivation d'étapes
- ✅ Ajout de nouvelles étapes
- ✅ Suppression d'étapes
- ✅ Export de la configuration (JSON)

## Configuration par défaut

### Étapes communes à toutes les procédures

1. **Planification** 📋
   - Inscription au PPM
   - Estimation prévisionnelle
   - Programmation budgétaire

2. **Clôture** 🏁
   - Réception provisoire
   - Réception définitive
   - PV de réception

### Configurations spécifiques

#### PSD (Procédure Simplifiée d'Entente Directe)
**Seuil:** < 10 000 000 FCFA

**Étapes:**
1. Planification 📋
2. Contractualisation 📝 (Sélection directe)
3. Attribution ✅ (Bon de commande)
4. Exécution ⚙️
5. Clôture 🏁

**Particularités:**
- Pas de COJO
- Pas de visa CF obligatoire
- Documentation simplifiée

#### PSC (Procédure Simplifiée de Cotation)
**Seuil:** 10 000 000 - 30 000 000 FCFA

**Étapes:**
1. Planification 📋
2. Procédure 📝 (3 fournisseurs minimum)
3. Attribution ✅
4. Exécution ⚙️
5. Clôture 🏁

**Particularités:**
- Formulaire de sélection obligatoire
- PV d'ouverture
- Pas de visa CF systématique

#### PSL (Procédure Simplifiée à Compétition Limitée)
**Seuil:** 30 000 000 - 50 000 000 FCFA

**Étapes:**
1. Planification 📋
2. Procédure 📝 (Validation DGMP + COJO)
3. Attribution ✅
4. Visa CF 🔍
5. Exécution ⚙️
6. Clôture 🏁

**Particularités:**
- Validation DGMP obligatoire
- Commission COJO
- Visa CF requis

#### PSO (Procédure Simplifiée à Compétition Ouverte)
**Seuil:** 50 000 000 - 100 000 000 FCFA

**Étapes:** Identiques à PSL

**Particularités:**
- Même processus que PSL mais seuil supérieur
- Publication obligatoire

#### AOO (Appel d'Offres Ouvert)
**Seuil:** ≥ 100 000 000 FCFA

**Étapes:**
1. Planification 📋
2. Procédure 📝 (DAO validé DGMP + COJO)
3. Attribution ✅ (Garanties complètes)
4. Visa CF 🔍
5. Exécution ⚙️
6. Clôture 🏁

**Particularités:**
- DAO obligatoire
- Garantie de bonne exécution (3-5%)
- Avance possible (15% forfaitaire/facultatif)
- Publication obligatoire

#### PI (Prestations Intellectuelles)
**Seuil:** Variable

**Étapes:**
1. Planification 📋
2. Procédure 📝 (AMI/DP)
3. Attribution ✅
4. Visa CF 🔍
5. Exécution ⚙️
6. Clôture 🏁

**Particularités:**
- Pas de garantie d'avance
- Sélection technique
- Contrat de prestation

## Champs configurables

### Phase PLANIFICATION (Commune)
**Groupe Programmation:**
- Section, Programme, Action
- Nature de dépense
- Activité

**Groupe Identification:**
- Type de marché/contrat
- Objet du marché
- Mode de passation

**Groupe Montants:**
- Dotation
- Montant prévisionnel HT/TTC

**Groupe Livrable:**
- Type de livrable
- Livrable attendu

**Groupe Localisation:**
- Localité
- Coordonnées géographiques

**Groupe Dates:**
- Date début/fin prévisionnelle
- Durée prévisionnelle

### Phase PROCÉDURE (Variable selon procédure)

#### PSD
- Bon de commande
- Facture proforma
- NCC prestataire
- Statut sanctionné

#### PSC
- Dossier de concurrence
- Formulaire de sélection
- PV d'ouverture
- Dates (ouverture, sélection)

#### PSL/PSO/AOO/PI
- Courrier invitation COJO
- Mandat de représentation
- Dossier d'appel à concurrence
- PV ouverture/jugement
- Rapport d'analyse
- Type de commission
- Nombre d'offres reçues/classées

### Phase ATTRIBUTION (Variable selon procédure)

#### Tous les marchés
- Identification (numéro marché/BC)
- Montant d'attribution
- NCC attributaire
- Raison sociale
- Informations bancaires

#### PSL/PSO/AOO (+ garanties)
- Avance de démarrage (15%)
- Garantie d'avance
- Garantie de bonne exécution (3-5%)
- Durée de garantie

#### PI (sans garantie d'avance)
- Pas d'avance de démarrage
- Focus sur les livrables

### Phase EXÉCUTION (Commune)
- Numéro OS / Notification
- Dates et durée
- Bureaux de contrôle/étude
- Gestion des avenants
- Résiliation (si applicable)

### Phase CLÔTURE (Commune)
- Date réception provisoire
- PV réception provisoire
- Période de garantie
- Date réception définitive
- PV réception définitive

## Utilisation

### 1. Configuration initiale

Les migrations SQL créent automatiquement la configuration par défaut. Pour l'appliquer :

```bash
# Dans le répertoire postgres/worker
npm run migrate
```

### 2. Personnalisation via l'interface

1. Se connecter au portail SIDCF
2. Accéder à **Administration > Configuration Étapes**
3. Sélectionner le type de procédure
4. Modifier les libellés, icônes, couleurs
5. Réorganiser l'ordre si nécessaire
6. Enregistrer les modifications

### 3. Export/Import

Pour sauvegarder ou partager une configuration :
1. Cliquer sur **Exporter**
2. Le fichier JSON sera téléchargé
3. Pour importer : utiliser l'API (à venir)

## Intégration dans les écrans de saisie

### Étape 1: Récupérer la configuration
```javascript
import { getContextualConfig } from '../lib/procedure-context.js';

const config = getContextualConfig('AOO', 'ATTRIBUTION');
```

### Étape 2: Générer les champs dynamiquement
```javascript
const fields = config.champs_requis.concat(config.champs_optionnels);
fields.forEach(fieldConfig => {
  // Créer le champ selon fieldConfig.type
  // Appliquer les règles de validation
  // Gérer la visibilité selon show_if
});
```

### Étape 3: Validation
```javascript
function validateForm(data, config) {
  const errors = [];
  config.champs_requis.forEach(field => {
    if (!data[field.key] && field.is_required) {
      errors.push(`${field.label} est requis`);
    }
  });
  return errors;
}
```

## Roadmap

### Phase 1 (Actuelle) ✅
- [x] Schéma de base de données
- [x] Migrations avec données par défaut
- [x] Écran d'administration des étapes
- [x] Export JSON

### Phase 2 (À venir)
- [ ] Écran d'administration des champs
- [ ] API backend pour CRUD
- [ ] Import de configuration JSON
- [ ] Historique des modifications

### Phase 3 (À venir)
- [ ] Intégration dans les écrans de saisie
- [ ] Validation dynamique selon config
- [ ] Gestion des conditions d'affichage
- [ ] Preview en temps réel

### Phase 4 (À venir)
- [ ] Templates de configuration
- [ ] Duplication de configurations
- [ ] Versioning des configurations
- [ ] Tests automatisés

## Conformité réglementaire

La configuration par défaut respecte :
- ✅ Code des Marchés Publics de Côte d'Ivoire
- ✅ Pratiques DCF/DGMP
- ✅ Seuils réglementaires
- ✅ Documents obligatoires par procédure

## Support

Pour toute question ou problème :
1. Consulter la documentation technique dans `/postgres/migrations/`
2. Vérifier les logs du navigateur (F12)
3. Contacter l'équipe de développement

## Fichiers concernés

### Backend (PostgreSQL)
- `postgres/migrations/003_configuration_contextuelle.sql`
- `postgres/migrations/004_configuration_attribution_execution.sql`

### Frontend
- `sidcf-portal/js/admin/config-etapes.js` - Interface d'admin
- `sidcf-portal/js/lib/procedure-context.js` - Helper de contextualisation
- `sidcf-portal/js/datastore/data-service.js` - Service de données
- `sidcf-portal/js/main.js` - Routes
- `sidcf-portal/js/ui/sidebar.js` - Navigation

---

**Version:** 1.0.0
**Date:** 2025-01-18
**Auteur:** Claude Code
