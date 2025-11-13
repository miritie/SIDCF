# 🚀 CHANGELOG - Module Marchés : Livrables & Procédure Enrichis

**Date** : 2025-11-12
**Version** : 2.6
**Statut** : ✅ COMPLÉTÉ

---

## 📦 PARTIE 1 : LIVRABLES

### 1.1 Schéma LIVRABLE enrichi

**Fichier** : `js/datastore/schema.js`

Nouveau schéma avec :
- ✅ `type` : Code du type de livrable (INFRASTRUCTURE, BATIMENT, etc.)
- ✅ `libelle` : Description textuelle du livrable
- ✅ `localisation` : Localisation en cascade complète
  - Région → District/Département → Commune → Sous-préfecture → Localité
  - Support des codes ET des libellés
  - Coordonnées GPS (latitude, longitude)
  - Flag `coordsOK` pour valider la présence de coordonnées

### 1.2 Widget de gestion des livrables

**Fichier** : `js/ui/widgets/livrable-manager.js`

Widget réutilisable permettant :
- ✅ Ajouter un livrable (modal avec formulaire complet)
- ✅ Modifier un livrable existant
- ✅ Supprimer un livrable (avec confirmation)
- ✅ Affichage en tableau structuré
- ✅ Localisation en cascade (Région → Département → Sous-préf → Localité)
- ✅ Saisie des coordonnées GPS
- ✅ Callback `onChange` pour notifier le composant parent

### 1.3 Intégration dans ECR01D (Création ligne PPM)

**Fichier** : `js/modules/marche/screens/ecr01d-ppm-create-line.js`

✅ Import du widget `livrable-manager`
✅ Remplacement du champ simple "livrable" par le widget complet
✅ Section dédiée "📦 Livrables" dans le formulaire
✅ Gestion de la liste des livrables dans le state
✅ Sauvegarde des livrables dans l'opération

### 1.4 Affichage dans ECR01C (Fiche marché)

**Fichier** : `js/modules/marche/screens/ecr01c-fiche-marche.js`

✅ Affichage en tableau des livrables
✅ Colonnes : Type | Libellé | Localisation | Coordonnées
✅ Formatage de la localisation en cascade
✅ Affichage des coordonnées GPS si disponibles

---

## 🔗 PARTIE 2 : ACTIVITÉS LIÉES AUX UNITÉS ADMINISTRATIVES

### 2.1 Configuration UA → Activités

**Fichier** : `js/config/ua-activites.json`

✅ Fichier JSON configurable
✅ Structure : `{ "UA_CODE": [ { code, libelle, categorie } ] }`
✅ Entrées par défaut pour UA `13001` et `13030`
✅ Fallback `_DEFAULT` pour les UA non configurées

### 2.2 Cascade UA → Activités dans ECR01D

**Fichier** : `js/modules/marche/screens/ecr01d-ppm-create-line.js`

✅ Chargement de la config `ua-activites.json`
✅ Fonction `setupActiviteCascade()` : sélection UA → populate Activités
✅ Champ "Activité" transformé en `<select>` dépendant de l'UA
✅ Affichage : `Libellé (Catégorie)`
✅ Sauvegarde du code ET du libellé de l'activité

---

## ⚖️ PARTIE 3 : PROCÉDURE ENRICHIE

### 3.1 Schéma PROCEDURE enrichi

**Fichier** : `js/datastore/schema.js`

Nouveaux champs :
- ✅ `commission` : COJO | COPE (avec note sur le lien avec type d'UA)
- ✅ `categorie` : NATIONALE | INTERNATIONALE
- ✅ `typeDossierAppel` : DAO | AMI | DPI | DC | AONO | etc.
- ✅ `dossierAppelDoc` : Document uploadé
- ✅ `nbOffresRecues` : Nombre d'offres reçues (saisie manuelle)
- ✅ `dates.ouverture` : Date ouverture des plis
- ✅ `dates.analyse` : Date analyse des offres
- ✅ `dates.jugement` : Date jugement
- ✅ `pv.ouverture` : PV d'ouverture (document)
- ✅ `pv.analyse` : PV d'analyse (document)
- ✅ `pv.jugement` : PV de jugement (document)

### 3.2 Types de dossiers d'appel

**Fichier** : `js/config/registries.json`

✅ Nouveau registry `TYPE_DOSSIER_APPEL` :
  - DAO (Dossier d'Appel d'Offres)
  - AMI (Avis à Manifestation d'Intérêt)
  - DPI (Demande de Prix)
  - DC (Demande de Cotation)
  - DPS (Dossier de Procédure Spécialisée)
  - AONO (Avis d'Offres Négociées)
  - Autre

✅ Chaque type lié aux modes de passation compatibles

### 3.3 Écran ECR02A mis à jour

**Fichier** : `js/modules/marche/screens/ecr02a-procedure-pv.js`

✅ Nouvelle fonction `renderProcedureDetailsForm()` avec tous les champs :
  - Type de commission (COJO/COPE)
  - Catégorie (Nationale/Internationale)
  - Type de dossier d'appel (DAO, AMI, etc.)
  - Upload du dossier d'appel
  - Nombre d'offres reçues et classées
  - Dates chronologiques (ouverture → analyse → jugement)
  - Upload des 3 PV (ouverture, analyse, jugement)

✅ **Validation chronologique des dates** :
  - Date analyse ≥ Date ouverture
  - Date jugement ≥ Date analyse
  - Messages d'erreur bloquants si non respecté

✅ Fonction `handleSave()` enrichie :
  - Validation chronologique des dates
  - Upload simulé des documents (dossier + 3 PV)
  - Création ou mise à jour de l'entité PROCEDURE
  - Préservation des documents existants si non remplacés

---

## 📊 RÉCAPITULATIF DES FICHIERS MODIFIÉS

| Fichier | Type | Modifications |
|---------|------|---------------|
| `js/datastore/schema.js` | 🔧 Modifié | Schémas LIVRABLE et PROCEDURE enrichis |
| `js/config/registries.json` | 🔧 Modifié | Ajout TYPE_DOSSIER_APPEL |
| `js/config/ua-activites.json` | ✨ Créé | Configuration UA → Activités |
| `js/ui/widgets/livrable-manager.js` | ✨ Créé | Widget CRUD livrables |
| `js/modules/marche/screens/ecr01d-ppm-create-line.js` | 🔧 Modifié | Livrables + Activités en cascade |
| `js/modules/marche/screens/ecr01c-fiche-marche.js` | 🔧 Modifié | Affichage livrables enrichi |
| `js/modules/marche/screens/ecr02a-procedure-pv.js` | 🔧 Modifié | Formulaire procédure complet + validation |

---

## ✅ FONCTIONNALITÉS LIVRÉES

### Planification (PLANIF)
1. ✅ Gestion complète des livrables lors de la création d'une ligne PPM
2. ✅ Sélection d'activité basée sur l'UA
3. ✅ Localisation en cascade (Région → Département → Sous-préf → Localité)
4. ✅ Coordonnées GPS optionnelles

### Procédure (PROC)
1. ✅ Choix du type de commission (COJO/COPE)
2. ✅ Choix de la catégorie (Nationale/Internationale)
3. ✅ Sélection du type de dossier d'appel (DAO, AMI, etc.)
4. ✅ Upload du dossier d'appel à candidature
5. ✅ Saisie du nombre d'offres reçues
6. ✅ Dates chronologiques avec validation stricte
7. ✅ Upload des 3 PV (ouverture, analyse, jugement)

---

## 🧪 TESTS À EFFECTUER

### Tests Livrables
- [ ] Créer une ligne PPM avec 0 livrable
- [ ] Créer une ligne PPM avec 3 livrables
- [ ] Modifier un livrable existant
- [ ] Supprimer un livrable
- [ ] Vérifier la cascade de localisation
- [ ] Vérifier l'affichage dans la fiche marché

### Tests Activités
- [ ] Sélectionner une UA et vérifier la liste d'activités
- [ ] Vérifier le fallback `_DEFAULT` pour une UA non configurée
- [ ] Vérifier la sauvegarde de l'activité sélectionnée

### Tests Procédure
- [ ] Renseigner tous les champs de la procédure
- [ ] Tester la validation chronologique (date analyse < date ouverture → erreur)
- [ ] Tester la validation chronologique (date jugement < date analyse → erreur)
- [ ] Uploader les documents (dossier + 3 PV)
- [ ] Vérifier la préservation des documents existants
- [ ] Modifier une procédure existante

---

## 🎯 CONFORMITÉ

✅ **Code des Marchés Publics CI** : Respect des étapes chronologiques
✅ **Pratiques DCF/DGMP** : Commissions COJO/COPE selon le type d'UA
✅ **Traçabilité** : Tous les documents (dossiers + PV) sont uploadables et traçables
✅ **Validation** : Contraintes chronologiques strictes sur les dates

---

## 🔜 PROCHAINES ÉTAPES POSSIBLES

1. ⚡ Implémenter le vrai upload de fichiers (actuellement simulé)
2. ⚡ Ajouter un viewer de documents dans l'interface
3. ⚡ Enrichir la config UA → Activités avec toutes les UAs
4. ⚡ Ajouter des alertes automatiques si dates incohérentes
5. ⚡ Export des livrables en format Excel/PDF

---

**FIN DU CHANGELOG**
