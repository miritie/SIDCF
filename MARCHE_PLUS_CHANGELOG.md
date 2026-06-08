# Journal des modifications — Module Marché+

Suivi chronologique des modifications apportées au module Marché+. Une entrée = un commit.

Format :
- **Date** — `<hash court>` — **Titre court**
  - Description fonctionnelle (le « quoi » et le « pourquoi »)
  - Fichiers touchés
  - Impact (UI / Worker / DB / R2)
  - Action de déploiement éventuelle (`wrangler deploy`, migration SQL, …)

---

<!-- Les nouvelles entrées s'ajoutent en haut. -->

## 2026-06-08 — Contractualisation : PSD — cases « EXISTANT » bloquantes, retrait des uploads et du N° BC + fix getByField/migration 032 (ECR02A)

> **Modif #151 (V2 de la refonte CONTRACTUALISATION).** Zone PSD « 📋 Validation du devis / facture proforma » : (1) **Fournisseur = attributaire**, en **sélection assistée** (datalist des entreprises) ; (2) **dates conservées** (date devis/facture proforma — désormais requise ; date émission BC) ; (3) **cases « EXISTANT dans la liasse »** pour le devis/facture proforma ET le bon de commande — la pièce est dans le dossier imputé, on coche simplement sa présence — **bloquantes au passage de phase** ; (4) **retraits** : upload devis, upload BC, **N° bon de commande** ; (5) « Contractualisation avec/sans CF » conservée, **sans PV d'ouverture** quel que soit le choix (déjà le cas pour PSD). La référence devis devient facultative.
>
> **Deux correctifs d'infrastructure indispensables découverts en testant le save :**
> - **`dataService.getByField` n'existait pas** (seul `query` existe) alors que `handleSave` (ecr02a marché+ ET marché) l'appelle en tout début → `getByField is not a function` faisait **planter toute sauvegarde de contractualisation avant même la persistance**. Méthode ajoutée à `DataService` (filtre backend + re-filtre strict côté client).
> - **`mp_operation` n'avait pas la colonne `contractualisation_warnings`** → l'UPDATE de l'opération échouait (500) après la sauvegarde de la procédure. **Migration 032** (idempotente).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` : bloc PSD réécrit (fournisseur datalist, cases `proc-devis-existant`/`proc-bc-existant`, suppression `proc-doc-devis`/`proc-num-bc`/`proc-doc-bc`) ; `handleSave` PSD (validation bloquante des cases, écrit `devisExistant`/`bcExistant`, retire docDevis/numBC/docBC).
- `sidcf-portal/js/datastore/data-service.js` : nouvelle méthode `getByField(entityType, field, value)`.
- `postgres/migrations/032_mp_operation_contractualisation_warnings.sql` (**nouveau**, exécuté sur Neon).

### Impact / Anti-régression

- **Vérifié bout en bout** (Chrome headless + Neon) : UI PSD conforme (datalist, 2 cases, uploads/N° BC absents, pas de PV) ; save sans cases → **blocage** « confirmez la présence… » ; save avec cases → **« ✅ Procédure enregistrée »**, persistance confirmée (`fournisseur_nom`, `devis_existant=true`, `bc_existant=true`, `date_devis`), puis **seed restauré** (etat=ATTRIBUE) ; **0 erreur console**.
- `getByField` corrige aussi la sauvegarde de contractualisation pour TOUS les modes (le crash était antérieur à la phase mode-spécifique).

### Déploiement

- Migration 032 appliquée sur Neon. Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-08 — Migration 031 : colonnes de contractualisation manquantes sur mp_procedure (correctif systémique)

> **Correctif d'infrastructure (détecté par revue adversariale du #150).** Le Worker Cloudflare écrit chaque entité **colonne par colonne** (`camelToSnake`), sans colonne JSONB fourre-tout, et renvoie **500 sur colonne inconnue** (l'adaptateur propage, sans fallback par appel). Or les écrans de contractualisation (#105→#150) écrivaient dans `MP_PROCEDURE` une vingtaine de champs **sans colonne en base** → en mode postgres (cas prod/Vercel, Worker UP), **la sauvegarde de la contractualisation échouait entièrement** (la validation client avait eu lieu en localStorage). La migration **031** crée toutes ces colonnes (idempotent, `ADD COLUMN IF NOT EXISTS`).

### Fichiers touchés

- `postgres/migrations/031_mp_procedure_contractualisation_columns.sql` (**nouveau**) : 26 colonnes ajoutées à `mp_procedure` (allotissement, numero_dossier_appel, sans_c_f, reserve_c_f, attribution, pieces_jointes, sous_procedure_p_i, liste_restreinte, reconduction_control, soumissionnaires, fournisseur_nom, ref_devis, date_devis, doc_devis, num_b_c, date_b_c, doc_b_c, nb_fournisseurs_consultes, date_comparaison, fournisseur_retenu, motif_selection, note_selection, nb_devis_recus, tableau_comparatif, + devis_existant/bc_existant pour la V2 à venir).

### Point d'attention — nommage

- `camelToSnake` du Worker insère un `_` **avant chaque majuscule** : `sansCF`→`sans_c_f`, `numBC`→`num_b_c`, `reserveCF`→`reserve_c_f`, `sousProcedurePI`→`sous_procedure_p_i`. Les noms de colonnes respectent exactement cette transformation.

### Impact / Anti-régression

- **Exécutée sur Neon** (`run-any.js`) : `mp_procedure` passe de 16 à **42 colonnes**, 0 manquante.
- **Round-trip réel vérifié** via l'API Worker en production (PUT MP_PROCEDURE avec sansCF/fournisseurNom/devisExistant/attribution… → **HTTP 200**, valeurs persistées), puis **état seed restauré** (colonnes de test remises à NULL).
- Non destructif (ajout de colonnes nullable uniquement). Les futures écritures de contractualisation persistent désormais en postgres.

### Déploiement

- Migration appliquée sur Neon. Aucun redéploiement Worker (le code Worker était déjà générique). Front inchangé.

---

## 2026-06-08 — Contractualisation : PV d'ouverture transverse (conditionnel CF en PSC) + préfixe « LOT n : » (ECR02A)

> **Modif #150** — Première vague de la refonte CONTRACTUALISATION (CR client). Deux points : (1) **PV d'ouverture transverse** — « le PV d'ouverture est valable pour tous les lots d'un même processus, quel que soit le processus y compris PSC avec participation CF » : le PV d'ouverture sort du per-lot et passe au **niveau procédure** (un seul upload). Pour **PSC**, il n'apparaît **que si le CF est impliqué** (masqué quand « sans CF » est coché). Pour **PSD**, aucun PV (pas de bloc lots). (2) **Préfixe « LOT n : xxx »** sur tous les libellés de lot (sélecteurs aval, convention client).

### Fichiers touchés

- `sidcf-portal/js/lib/lot-data.js` : nouveau helper `formatLotLabel(lot, {allotissement})` → « LOT n : libellé » (libellé seul si lot unique ou `numero` absent — repli gracieux).
- `sidcf-portal/js/ui/widgets/lot-selector.js` : options du sélecteur de lot via `formatLotLabel` (remplace « Lot n — … », évite « Lot undefined » sur données héritées).
- `sidcf-portal/js/ui/widgets/lots-procedure-mp.js` : retrait du PV d'ouverture du bloc PV **par lot** (désormais transverse).
- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - Carte « 📄 PV d'ouverture (transverse) » sous les lots (`#pv-ouverture-transverse-container`, input `#proc-pv-ouverture`) ; repli legacy lecture `pvOuverture` → `lots[0].pv.ouverture` → `pv.ouverture`.
  - `applySansCFVisibility()` masque aussi le PV transverse (effet PSC sans CF).
  - Sauvegarde `procedureData.pvOuverture` (préservé si non ré-uploadé) ; warnings : PV d'ouverture vérifié une seule fois (transverse) au lieu de par lot.

### Impact / Anti-régression

- **DB** : `pvOuverture` ajouté à `MP_PROCEDURE` (champ libre, pas de migration) ; les anciens PV par lot restent lisibles via le repli.
- **Vérifié** (Chrome headless, données réelles) : AOO multi-lots → PV transverse présent/visible, plus aucun PV d'ouverture par lot ; PSC → PV visible par défaut, masqué après « sans CF » ; PSD → aucune carte PV ; `formatLotLabel` → « LOT 1 : … / LOT 2 : … » quand numéro présent, libellé seul sinon ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-07 — Import PPM : unité administrative pré-remplie + alerte de champ manquant explicite (ECR01A)

> **Modif #149** — Retour utilisateur après #148 : en testant la simulation avec le modèle de référence, l'écran bloquait sur « Veuillez remplir tous les champs obligatoires » — le champ **Unité administrative** était vide et l'alerte ne désignait pas le champ en cause. Deux corrections : (1) **Unité administrative pré-remplie** avec l'institution de l'app-config (« Direction du Contrôle Financier ») — en simulation, il ne reste qu'à choisir le fichier (champ toujours modifiable) ; (2) l'alerte liste désormais **précisément le(s) champ(s) manquant(s)** et y ramène le focus.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01a-import-ppm.js` :
  - Champ `unite` : `value: dataService.getConfig()?.institution?.name` (import `dataService` rétabli).
  - `handleImport()` : liste des champs manquants par libellé (« Fichier Excel PPM », « Unité administrative », « Exercice budgétaire ») + `focus()` sur le premier.

### Impact / Anti-régression

- Aucune migration, aucun changement Worker/DB.
- **Vérifié** (Chrome headless) : unité pré-remplie « Direction du Contrôle Financier » ; lancement sans fichier → « ⚠️ Champ(s) obligatoire(s) manquant(s) : • Fichier Excel PPM » ; avec le modèle de référence → simulation complète ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-07 — Import PPM : le modèle de référence « MODEL DE PPM SIDCF » remplace le modèle généré (ECR01A)

> **Modif #148** — Le client fournit le **modèle PPM de référence officiel** (`MODEL DE PPM SIDCF (1).xlsx`, Documentation/retours-meets-parcours-maquette/). Il remplace le modèle généré (#146/#147). Structure : **23 colonnes** (SECTION, UNITE_OPERATIONNELLE, OBJET_MARCHE, TYPE_FINANCEMENT, SOURCE_FINANCEMENT, ACTIVITE, LIGNE_BUDGETAIRE, TYPE_MARCHE, MODE_PASSATION, REVUE, NATURE_PRIX, MONTANT_PREVISIONNEL, LIVRABLE, BENEFICIAIRE, LONGITUDE, LATITUDE, DELAI_EXECUTION, INFRASTRUCTURE, DISTRICT, REGION, DEPARTEMENT, SOUS_PREFECTURE, LOCALITE) + 1 ligne d'exemple. Convention : dans les **15 colonnes codifiées**, la cellule porte « **CODE LIBELLÉ** » avec **séparateur espace** (ex. « 1 Trésor », « PSD procedure simplifié », « 23 Kabadougou ») — le code ramène toujours au référentiel en base.

### Fichiers touchés

- `sidcf-portal/assets/MODELE_PPM_SIDCF.xlsx` (**nouveau**) : copie conforme du modèle client (hash identique), servie en asset statique.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01a-import-ppm.js` :
  - Bouton « 📥 Télécharger le modèle (Excel) » → sert l'asset tel quel (lien `download`), au lieu de générer un classeur.
  - **Suppression du générateur .xlsx** (#146 : CRC-32, ZIP « stored », `buildSheetXml`, exemples #147) devenu inutile (−130 lignes).
  - `TEMPLATE_COLUMNS` = les 23 entêtes du modèle ; nouveau `TEMPLATE_CODED_COLUMNS` (15 colonnes codifiées) ; encart « Format attendu » décrit la convention « CODE LIBELLÉ » à séparateur espace.

### Impact / Anti-régression

- Conformité (signatures binaires / entêtes CSV — les mots-clés `objet`/`mode`/`montant` couvrent les nouveaux noms techniques), simulation, récap, soutenabilité et rapport d'erreurs **inchangés**.
- **Vérifié** (Chrome headless) : le fichier téléchargé est **byte-à-byte identique** au modèle client (sha1 `aa012edd…`) ; réinjection → simulation complète (10 lignes, 2 écarts) ; encart mis à jour (23 colonnes, convention espace) ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-06 — Import PPM : modèle type enrichi — tous les champs de « Créer ligne PPM », codes + libellés (ECR01A)

> **Modif #147** — Retour client sur #146 : « le document type proposé est trop pauvre. Le tableau doit alimenter l'écran Créer ligne PPM. Il faut donc bien plus d'informations, et à chaque fois les codes et les libellés dans deux colonnes différentes — les codes ramènent toujours à des informations en base. » Le modèle passe de **9 à 37 colonnes**, organisées comme les blocs de l'écran ECR01D : **chaîne programmatique** (exercice, section, programme, UA, activité, nature éco), **identification du marché** (objet, type, mode, revue, nature des prix), **financements** (montant, types de financement et bailleurs multiples séparés par « ; »), **technique** (délai, catégorie de prestation, bénéficiaire), **localisation** (région, département, sous-préfecture, localité, GPS) et **livrables**. Chaque champ référentiel = **2 colonnes (code + libellé)** ; l'imputation budgétaire est exclue (calculée par l'écran à partir de la chaîne).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01a-import-ppm.js` :
  - `TEMPLATE_COLUMNS` : 37 colonnes (cf. ci-dessus).
  - `TEMPLATE_EXAMPLE_ROWS` : 2 lignes d'exemple dont **chaque code existe réellement en base** — chaîne `13030016 (Sénat) → 110101 → UA 13030 → ACT_13030_005/001` (registries.json + ua-activites.json), modes `PSC`/`AOO`, revues `A_POSTERIORI`/`A_PRIORI`, financements `ETAT;EMPRUNT` → bailleurs `TRESOR;BAD`, régions `ABIDJAN`/`GBEKE` (mp-regions-ci.json).
  - Encart « Format attendu » : décrit les 37 colonnes, la convention code/libellé et le lien avec l'écran « Créer ligne PPM ».

### Impact / Anti-régression

- Contrôle de conformité, simulation, récap, soutenabilité et rapport d'erreurs **inchangés** (#146).
- **Vérifié** (Chrome headless) : modèle régénéré = 37 colonnes × 3 lignes (intégrité ZIP OK, paires code/libellé contrôlées par échantillon), réinjection du modèle → simulation complète OK ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-05 — Import PPM : modèle téléchargeable + simulation complète du chargement (ECR01A)

> **Modif #146** — Demande client « CHARGEMENT DES PPM » : (a) récap des éléments chargés après import ; (b) mise en évidence des **écarts de soutenabilité budgétaire** ; (c) **rapport d'erreurs non bloquant**. Cadrage : l'écran fonctionne en **simulation** (le modèle réel évoluera sous peu) — d'abord **télécharger un fichier modèle**, puis si le fichier chargé est **conforme au document type**, générer un **contenu cohérent à l'image du tableau PPM** (ECR01B). **Aucune écriture en base** (choix validé).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01a-import-ppm.js` (refonte complète, ~560 lignes) :
  - **Modèle Excel** : génération d'un vrai `.xlsx` **sans dépendance** (ZIP « stored » écrit à la main : CRC-32 + en-têtes locaux/centraux ; feuille `inlineStr`) — 9 colonnes alignées sur le tableau PPM + 2 lignes d'exemple. Bouton « 📥 Télécharger le modèle (Excel) » dans l'encart Format attendu.
  - **Conformité** : `.xlsx` par signature ZIP (`PK\x03\x04`), `.xls` par signature OLE2 (`D0 CF 11 E0`), `.csv` par entêtes (≥ 3 colonnes du modèle). Non conforme → alerte explicite, on reste sur l'étape 1.
  - **Simulation** : 10 lignes cohérentes (activités, objets, types, natures éco, modes, montants réalistes CI). Étape 2 : bandeau « Fichier conforme », 4 KPI (lignes / montant total / modes / alertes), récap par mode et par type, carte **écarts de soutenabilité** (2 lignes en dépassement, écart par ligne + dépassement cumulé), **aperçu à l'image du tableau PPM** (lignes en écart surlignées rouge, badge alertes), carte **rapport d'erreurs non bloquant** (4 alertes : 2 soutenabilité MAJEURE, 1 hors barème PSD, 1 nature éco manquante) avec **export CSV**.
  - Bandeau « 🧪 Mode simulation » à l'étape 1 ; bouton « Terminer la simulation » → message « aucune donnée enregistrée » → retour liste PPM ; bouton « Recommencer ».

### Impact / Anti-régression

- **Aucune écriture en base** (`dataService.importPPM` n'est plus appelé), aucun changement Worker/DB/R2.
- **Vérifié** (Chrome headless, bout en bout) : modèle téléchargé puis **réinjecté comme fichier d'import** → conforme, 10 lignes d'aperçu, écarts (2), rapport (4), CSV téléchargé ; faux `.xlsx` (texte) → alerte « non conforme », on reste sur l'étape 1 ; le `.xlsx` généré passe `zipfile.testzip()` (intégrité OK) et la feuille contient bien 3 lignes ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-05 — Liste PPM : champ de filtre en place du libellé de colonne (ECR01B)

> **Modif #145** — Retour client sur #143 (« c'est le même effet visuel ») : le champ de recherche ne doit pas être visible en permanence. Désormais, **cliquer sur l'en-tête de colonne fait apparaître le champ de saisie à la place du libellé** (focus immédiat). Comportement : saisie → filtrage immédiat ; **blur avec saisie vide** → le libellé revient ; **filtre actif** → le champ reste affiché (le critère demeure visible) ; **Échap** → efface le filtre et referme le champ. Le **tri**, qui occupait le clic sur le titre (#101/P-2), passe sur une **icône ⇅ dédiée** à côté du libellé (▲/▼ une fois actif), sans conflit avec l'ouverture du filtre.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - `renderSimpleTable()` : en-tête à deux états (libellé ↔ input) par colonne, bascule au clic / blur / Échap ; tri déplacé du titre vers l'icône `⇅` (stopPropagation) ; logique `applyTableView`/`tableSort`/`tableColSearch` inchangée.

### Impact / Anti-régression

- **Aucune migration, aucun changement Worker/DB** — purement affichage.
- Au re-render, une colonne avec filtre actif ré-affiche directement le champ (état persisté `tableColSearch`).
- **Vérifié** (Chrome headless, données réelles) : libellé par défaut ; clic → input focus à la place du libellé ; filtre « planif » 33→1 ; blur avec valeur → champ conservé ; vidage + blur → libellé revenu, 33 lignes ; tri ⇅ → ▲ premier montant 4,50 sans ouvrir le filtre ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-05 — Liste PPM : retrait du filtre « Statut du marché » du panneau Filtres (ECR01B)

> **Modif #144** — Suite de #142 (retrait des cartes par phase et de la colonne statut) : le **multi-sélecteur « Statut du marché »** du panneau Filtres est lui aussi retiré, à la demande du client. Le statut reste visible dans le **modal Détails** et la **fiche de vie** ; l'export **CSV** le conserve.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - Panneau Filtres : retrait du `renderMultiSelectFilter('etat', …)` (#76 lot 1, 1.c).
  - `applyFilters()` : retrait du test `_matchMulti(activeFilters.etat, op.etat)`.
  - Chips des filtres actifs : retrait du chip `Statut (n)`.
  - `activeFilters` (déclaration + `resetFilters()`) : clé `etat` supprimée.

### Impact / Anti-régression

- **Aucune migration, aucun changement Worker/DB** — purement affichage.
- **Vérifié** (Chrome headless, données réelles) : panneau Filtres déplié sans « Statut du marché », les 7 autres filtres présents (Activité, Type de marché, Mode de passation, Type financement, Source de financement, Nature économique, Région), 33 lignes, **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-05 — Liste PPM : recherche par colonne intégrée dans l'en-tête (ECR01B)

> **Modif #143** — Demande client : la 2e rangée d'en-tête dédiée à la recherche par colonne (#101, P-2/P-3) « prend trop d'espace ». Les champs « 🔎 filtrer » sont désormais **intégrés directement dans la cellule d'en-tête**, sous le titre de la colonne (rangée d'en-tête unique). Le **tri** reste au clic sur le **titre** ; un clic dans le champ de recherche ne déclenche pas le tri (stopPropagation + onclick déplacé du `<th>` vers le span du titre).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - `renderSimpleTable()` : suppression de la rangée `headSearch` ; chaque `<th>` contient le titre cliquable (tri) + l'input de recherche (sauf colonne Actions). Logique tri/filtre (`applyTableView`, `tableSort`, `tableColSearch`) inchangée.

### Impact / Anti-régression

- **Aucune migration, aucun changement Worker/DB** — purement affichage.
- **Vérifié** (Chrome headless, données réelles) : 1 rangée d'en-tête, 6 inputs ; filtre « planif » sur Objet → 33→1→33 lignes ; clic input → pas de tri ; clic titre Montant → tri ▲ (premier montant 4,50) ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-05 — Liste PPM : retrait des cartes de statut et de la colonne « Statut du marché » (ECR01B)

> **Modif #142** — Demande client (capture du 05/06/2026) sur l'écran **« PPM & Marchés et contrats »** (ECR01B) : (1) **retirer la rangée des 6 cartes KPI par phase** (« En Planification » → « Résilié », introduites en #97/P-1) sous les deux cartes de totaux ; (2) **retirer la colonne « Statut du marché »** (badge, 2.f) du tableau des résultats. Les deux cartes de totaux (« Total marché planifié », « Montant total prévisionnel ») sont conservées. Le statut reste consultable via le **filtre « Statut du marché »** du panneau Filtres (inchangé), le **modal Détails** et la **fiche de vie** ; l'export **CSV** conserve la colonne (export de données, pas d'affichage).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - Suppression de la constante `PHASES` (#97) et du calcul `stats.parPhase` ; retrait de la rangée `PHASES.map(renderKPI)` du rendu.
  - `renderSimpleTable()` : colonne « Statut du marché » retirée de `cols` ; ses 9 % redistribués (Objet 19→22 %, Nature éco 13→16 %, Actions 12→15 %).
  - `renderSimpleRow()` : cellule badge statut retirée ; lookup `ETAT_MARCHE` devenu inutile supprimé.

### Impact / Anti-régression

- **Aucune migration, aucun changement Worker/DB** — purement affichage.
- Le tri/recherche par colonne (#101) suit l'ordre des colonnes restantes (index recalculés au rendu).
- **Vérifié** (Chrome headless + serveur local, données réelles) : 33 lignes rendues, 7 en-têtes sans « Statut du marché », cartes de phase absentes, cartes de totaux présentes, **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-04 — Ordonnancement prévu : récap dérivé de la clé de répartition, non saisissable (E-21)

> **Modif #141** — Retour client (01/06/2026) sur la section **« Ordonnancement prévu (CP par année) »** de l'enregistrement (E-21) : *« ce n'est pas un élément de saisie, c'est une forme de récap de la clé de répartition »*. La section, jusque-là **éditable** (inputs Trésor/Dons/Emprunts par année + bouton « Ajouter une année », #128), devient un **récapitulatif en lecture seule** calculé automatiquement à partir de la **clé de répartition** : chaque ligne de la clé est ventilée par **année** et par **source de financement** (`typeFinancement` : `ETAT` → Trésor (CI), `DON` → Dons, `EMPRUNT` → Emprunts), avec une ligne de total. Le récap se **resynchronise** à chaque modification de la clé (onChange) et au montage. À l'enregistrement, le champ `ordonnancement` persisté devient un **snapshot dérivé** de la clé (même structure `{annee, tresor, dons, emprunts}` qu'avant — consommateurs en aval inchangés).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` :
  - `renderOrdonnancementSection()` : ne rend plus qu'un conteneur `#ord-container` + texte d'aide (« Non saisissable : reflète automatiquement la clé »). Signature simplifiée (plus de `existingAttr`/`operation`).
  - Nouveau `computeOrdonnancementFromCle(cleList)` : agrège la clé par année × source (helper partagé rendu + save).
  - Nouveau `renderOrdonnancementRecap()` : (re)génère le tableau lecture seule dans `#ord-container` ; message d'invite si la clé est vide.
  - `initializeWidgets()` : appel de `renderOrdonnancementRecap()` au montage de la clé **et** dans le `onChange` du widget clé de répartition.
  - Save : `ordonnancement` calculé via `computeOrdonnancementFromCle(cleRepartitionList)` au lieu de lire les anciens inputs `#ord-tbody`.

### Impact / Anti-régression

- **DB** : aucune migration — structure de `ordonnancement[]` inchangée (`annee/tresor/dons/emprunts`) ; les enregistrements existants restent valides (le récap les recalcule depuis la clé, qui est la source de vérité).
- **UI** : plus de double saisie (clé + ordonnancement) → suppression d'une source d'incohérence. La TVA État (ligne `typeFinancement: 'ETAT'`) est comptée dans la colonne Trésor (CI), cohérent avec « prise en charge par l'État ».
- **Vérifié** : `node --check` OK ; aucune référence orpheline aux anciens IDs (`#ord-tbody`, `.ord-annee`, etc.).

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Aucun déploiement Worker ni migration requis.

---

## 2026-06-04 — Difficultés du marché : pièce jointe de l'acte + autorité décisionnelle (E-4)

> **Modif #140** — Point **E-4** sur la modale « Nouvelle difficulté ». Trois demandes du retour traitées : (1) **chargement du fichier** = l'acte qui rend la décision (résiliation, suspension…) — ajout d'un **vrai upload** (champ `type=file`, envoi R2 à l'enregistrement, lien 📎 dans le tableau) ; (2) **Autorité décisionnelle** — le champ texte devient une **sélection assistée** (`datalist` de 8 autorités courantes, saisie libre conservée) ; (3) **Référence / N° de l'acte** — champ texte déjà présent, conservé. La modale est aussi **réalignée** : tous les couples label/champ passent par la classe `.form-field` (les `<div>` nus empêchaient l'empilement vertical et la pleine largeur — d'où le décalage visuel).

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js` :
  - Import `uploadDocument` (R2 — variante Marché+) ; référentiel `AUTORITES_DECISIONNELLES` ; constante `ACTE_ACCEPT`.
  - Draft : champs `acteDocumentId`, `acteUrl`, `acteNom`.
  - Modale : tous les wrappers de champ reçoivent `className: 'form-field'` (alignement) ; « Autorité décisionnelle » devient un input + `<datalist>` ; nouveau bloc **« Acte de décision (pièce jointe) »** (input file + aperçu du fichier déjà attaché en édition).
  - Save : si un fichier est choisi → `uploadDocument(file, {entityType:'DIFFICULTE', entityId, operationId, typeDocument:'ACTE_DECISION'})`, puis stockage de `acteDocumentId`/`acteUrl`/`acteNom` ; bouton en état « ⏳ Envoi de l'acte… » + gestion d'erreur (pas de persistance si l'upload échoue).
  - Tableau : colonne « Décision » affiche un lien 📎 vers l'acte quand `acteUrl` est présent.
- `sidcf-portal/js/datastore/schema.js` : `MP_DIFFICULTE` — ajout de `acteDocumentId`, `acteUrl`, `acteNom` (et commentaires clarifiant `nomDecideur` = autorité, `fichier` = référence texte).

### Impact / Anti-régression

- **DB** : champs additifs sur `MP_DIFFICULTE` (NoSQL/JSON) → **aucune migration** ; les difficultés existantes (sans pièce) restent valides (`acteUrl` null = pas de lien 📎).
- **R2** : réutilise le pipeline existant `uploadDocument` (entité `MP_DOCUMENT`, préfixe `mp/`, max 50 Mo) — aucune nouvelle infra. L'acte est aussi tracé comme `MP_DOCUMENT` (`entityType: 'DIFFICULTE'`).
- **UI** : `.form-field` (flex column + stretch) corrige le décalage label/champ visible sur la maquette. `datalist` = saisie libre préservée (rétro-compatible avec les valeurs déjà saisies dans `nomDecideur`).
- **Vérifié** : `node --check` OK sur les 2 fichiers JS modifiés.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). L'upload R2 passe par l'adapter `dataService` déjà en place — pas de déploiement Worker spécifique requis.

---

## 2026-06-04 — Modes de passation : alignement sur la liste de référence (familles)

> **Modif #139** — Mise en conformité du référentiel **MODE_PASSATION** avec la **liste de référence des modes de passation** (classification par famille, CR DCF — liste 01/06/2026). Quatre familles : **Appel d'offres**, **Procédures simplifiées**, **Prestations intellectuelles**, **Procédures dérogatoires**. Changements : (1) ajout d'**« Appel d'offres avec concours »** (`AOO_CONCOURS`) ; (2) éclatement des **Prestations intellectuelles** en 6 sous-procédures (`PI_CV`, `PI_AMI_SMC`, `PI_AMI_SCBD`, `PI_AMI_SFQC`, `PI_AMI_SFQ`, `PI_AMI_SQC`) **tout en conservant le code générique `PI`** (zéro migration, rétro-compat des marchés et de la logique existante) ; (3) reclassement de **CFN** parmi les procédures dérogatoires ; (4) **retrait** de « Lettre de commande valant marché » (`LETTRE_COMMANDE_MARCHE`), absente de la liste. Le référentiel passe de 14 à **20 modes**.

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : `MODE_PASSATION` réordonné par famille ; +`AOO_CONCOURS` ; +6 sous-types `PI_*` (avec `parent: "PI"`) ; `CFN` → `famille: "DEROGATOIRE"` (`seuil: false`) ; suppression de `LETTRE_COMMANDE_MARCHE`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : `MODE_PASSATION_FAMILLES` (groupement du filtre) mis à l'image de la liste de référence (ordre + membres).
- `sidcf-portal/js/lib/procedure-context.js` : helpers exportés `isPrestationIntellectuelle()` et `resolveBaseMode()` ; `getContextualConfig()` se replie sur le mode de base quand un sous-type n'a pas de config dédiée ; les règles PI (garanties masquées, validation DGMP/publication/garanties) couvrent désormais les sous-types.
- `sidcf-portal/js/lib/phase-helper-mp.js` + `phase-helper.js` : repli de la **frise** sur le mode de base (`PI_*`→`PI`, `AOO_*`→`AOO`) — évite une frise vide pour les nouveaux sous-types.
- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` / `ecr04a-execution-os.js` / `ecr02a-procedure-pv.js` : les tests `=== 'PI'` / `=== 'AOO'` (alerte contextuelle, garanties, visa CF requis, sélecteur de sous-procédure PI) deviennent **famille-conscients** via `isPrestationIntellectuelle()` / `resolveBaseMode()`.

### Impact / Anti-régression

- **Métadonnées seulement pour `famille`/`seuil`** : aucune logique ne lit ces champs ; la dérogation reste pilotée par l'écart au **barème** (`getSuggestedProcedures`), inchangé. Le barème (`rules-config.json`) ne référence que AOO/PSC/PSD/PSL/PSO — les nouveaux modes restent hors barème (comportement identique aux dérogatoires existants).
- **DB** : `mode_passation VARCHAR(100)` sans contrainte CHECK → les nouveaux codes sont acceptés à la sauvegarde. **Aucune migration.**
- **`PI` générique conservé** : les 2 marchés seed en `PI` et toute la logique référençant `'PI'` continuent de fonctionner ; les sous-types héritent du comportement PI par détection de famille.
- **`LETTRE_COMMANDE_MARCHE`** : aucun marché ne l'utilisait ; références résiduelles nettoyées (`MODES_CONTRAT_DIRECT` et branche d'attribution directe dans `ecr02a`).
- **Vérifié** : `node --check` OK sur tous les fichiers JS modifiés ; `registries.json` valide (20 modes) ; aucune référence résiduelle à `LETTRE_COMMANDE_MARCHE`. Le filtre « Mode de passation » affichera 20 modes + 4 entêtes de famille (= « 24 valeurs »).

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). `registries.json` est un asset statique : pris en compte au prochain chargement (le navigateur lit le fichier ; pas de copie figée en localStorage — le compteur « 18 valeurs » correspondait à 14 modes + 4 entêtes).

---

## 2026-06-04 — Sous-traitance : compte bancaire du sous-traitant (E-18)

> **Modif #138** — Point **E-18** (« Ressortir son compte bancaire le cas échéant »). Ajout au gestionnaire des sous-traitants de deux champs **Banque** et **N° de compte (RIB / IBAN)**, optionnels, pré-remplis depuis la fiche entreprise du sous-traitant (via le picker) mais éditables. Une colonne **« Compte bancaire »** apparaît dans le tableau des sous-traitants. (Raison sociale, NCC et part du marché étaient déjà présents.)

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/sous-traitants-manager-mp.js` :
  - Draft : champs `banque` + `numeroCompte`.
  - Modale : nouvelle ligne « Banque » / « N° de compte » (`st-banque`, `st-compte`) ; auto-remplissage depuis le picker entreprise (`onChange`).
  - Sauvegarde : persistance de `banque` + `numeroCompte` (dans `MP_ATTRIBUTION.sousTraitants`).
  - Table : colonne « Compte bancaire » (Banque — N°) ; colspan de la ligne d'alerte sanction ajusté (6→7).

### Impact / Anti-régression

- **UI** : deux champs facultatifs + une colonne en plus ; aucun champ existant modifié. Pas de blocage si vides.
- **DB / Worker** : `banque`/`numeroCompte` stockés dans le tableau `sousTraitants` (JSONB — aucune migration).
- **Vérifié (CDP)** : modale « Nouveau sous-traitant » → champs « Banque » + « N° de compte (facultatif) » présents ; **0 erreur console**. (La colonne table s'affiche dès qu'un sous-traitant est déclaré.)

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-04 — Enregistrement : sélection du compte parmi les comptes du titulaire (E-13 b)

> **Modif #137** — Point **E-13, volet (b)**. « Sélection du compte bancaire : tous les comptes du titulaire s'afficheront dans la liste déroulante, le chargé d'études sélectionnera simplement le compte qui figure dans le marché approuvé. » Ajout d'un sélecteur **« Compte bancaire du titulaire »** en tête de la section Coordonnées bancaires : il liste les comptes de l'entreprise sélectionnée ; le choix renseigne automatiquement Banque / N° / agence / intitulé / SWIFT (champs persistés par `handleSave`). Le volet (a) — simplification d'affichage — était déjà fait (#119).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` :
  - Helpers `_getComptesOfEntreprise` / `_normalizeCompteEntry` / `_applyCompteSelection` / `_populateComptesSelect`.
  - `renderCoordonneesBancairesSection` : nouveau `<select>` `${prefix}-compte-select` (auto-sélection du 1ᵉʳ compte, remplissage des champs au `change`).
  - `_prefillBanqueSection` appelle `_populateComptesSelect` à chaque sélection d'entreprise ; `quickPickEntreprise` propage `comptes` au pickerValue.

### Modèle de données

- Le sélecteur lit **`entreprise.comptes[]`** quand la base entreprises est enrichie (multi-comptes) ; **à défaut, repli sur le compte legacy unique** (`banque{}` + `compte{}`). Aucune migration : `comptes[]` est un champ JSONB facultatif. Tant que la base ne porte qu'un compte par entreprise, une seule entrée apparaît (comportement correct) ; dès qu'une entreprise reçoit plusieurs comptes, ils s'affichent tous.

### Impact / Anti-régression

- **UI** : un sélecteur en plus ; les champs Banque/N°/détails restent éditables (correction manuelle possible). Aucune logique de persistance modifiée — `handleSave` lit les mêmes ids.
- **Vérifié (CDP)** : à la sélection d'une entreprise, le menu « Compte bancaire du titulaire » se remplit (ex. « SGCI — … ») et la banque se renseigne ; **0 erreur console**. (Aucune donnée réelle modifiée — pas de sauvegarde déclenchée.)

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-04 — Exécution : onglet « Taux d'exécution physique » (historique) (X-3)

> **Modif #136** — Section D (Exécution), lot D4, point **OBS-X3**. Nouveau bloc « 📐 Taux d'exécution physique » dans la fiche, en pendant de la situation d'exécution financière. Contenu retenu (validé) : un **historique d'avancement** — chaque relevé = date + taux (%) + commentaire ; le dernier relevé (date la plus récente) donne le **taux courant** (affiché en tête avec barre de progression). Ajout/suppression de relevés, colonne « Évolution » (Δ en points vs relevé précédent), garde-fou si saisie d'un taux inférieur au précédent.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/avancement-physique-mp.js` *(nouveau)* : widget `renderAvancementPhysique({ operation, onSaved })` — bandeau taux courant + barre, formulaire d'ajout, table d'historique (tri date décroissante, Δ en points), suppression. Gating état exécution (EN_EXEC/EXECUTION/RESILIE/CLOS) sinon placeholder.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` : import + section carte `renderSituationExecutionPhysique(operation)` montée juste après la situation d'exécution financière.

### Impact / Anti-régression

- **UI** : un bloc en plus dans la fiche, visible seulement en exécution. Aucune section existante modifiée.
- **DB / Worker** : historique stocké dans `MP_OPERATION.avancementPhysique` (tableau JSONB — **aucune migration**). Persistance via `dataService.update(MP_OPERATION, …)` (même schéma que les autres champs JSONB).
- **Vérifié (CDP)** : (1) section + formulaire + état vide présents sur un marché EN_EXEC ; (2) logique isolée — taux courant = dernier relevé, lignes triées, Δ +/− en points corrects ; (3) gating — placeholder si non en exécution ; **0 erreur console**. (Persistance non exercée en live pour ne pas muter de données réelles ; chemin identique au cockpit OP/mandats.)

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-04 — Exécution : expliciter le chaînage des marchés (X-4)

> **Modif #135** — Section D (Exécution), lot D3, point **OBS-X4**. Le client ne comprenait pas la table « Aucun marché antérieur / Aucun marché postérieur » du bandeau « Liens entre marchés ». On explicite la notion de **chaînage dans le temps** : phrase d'aide + libellés et états vides reformulés avec exemples (amont = étude préalable, marché d'origine en reconduction… ; aval = reconduction, marché suivant, contrôle…).

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/related-operations-mp.js` :
  - Phrase d'aide sous l'en-tête expliquant le chaînage amont/aval.
  - États vides reformulés : « Aucun marché en amont (étude préalable, marché d'origine…) » / « Aucun marché en aval (reconduction, marché suivant, contrôle…) ».
  - Libellés de colonnes : « Antérieurs · en amont » / « Postérieurs · en aval ».

### Impact / Anti-régression

- **UI** : purement textuel/explicatif. Aucune logique de liens modifiée (calcul `computeLinks`, gestion via « Gérer les liens » inchangés).
- **DB / Worker** : aucun.
- **Vérifié (CDP)** : phrase d'aide présente, libellés amont/aval présents, ancienne formulation « Aucun marché antérieur/postérieur » absente, **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-04 — Exécution : N° de mandat sur les décomptes (anti-doublon) (X-1)

> **Modif #134** — Section D (Exécution), lot D2, point **OBS-X1**. En complément du **N° d'OP**, ajout d'un champ **N° de mandat** sur chaque décompte/OP. Il rattache le décompte à la facture/au mandat de paiement et sert de garde anti-doublon : si un autre décompte porte déjà le même N° de mandat, une confirmation alerte sur le risque de doublon de paiement.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/op-mandat-manager-mp.js` :
  - Modale éditeur : nouveau champ « Numéro de mandat » (`dec-numeroMandat`) dans la section Identification, avec aide contextuelle.
  - Sauvegarde : persistance de `numeroMandat` + contrôle anti-doublon (confirm si N° mandat déjà utilisé sur un autre décompte).
  - Table des décomptes : nouvelle colonne « N° Mandat » (après N° d'OP) ; colspans des lignes de synthèse CUMULS/%CUMULS ajustés (4→5).

### Impact / Anti-régression

- **UI** : un champ et une colonne en plus ; aucun champ existant modifié. Le N° de mandat est facultatif (pas de blocage si vide).
- **DB / Worker** : `numeroMandat` stocké dans l'entité `MP_DECOMPTE` (JSONB — aucune migration).
- **Vérifié (CDP)** : colonne « N° Mandat » présente dans la table ; champ « Numéro de mandat » présent dans la modale (libellé + placeholder corrects) ; **0 erreur console**. (Anti-doublon non exercé en live pour ne pas créer de décompte réel.)

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-04 — Exécution : montant global (base + avenants) visible pour EN_EXEC (X-2)

> **Modif #133** — Section D (Exécution), lot D1, point **OBS-X2**. Le « **Montant global du marché** » est déjà calculé **base + avenants** (formule correcte). Le vrai défaut : le **cockpit OP/mandats** (qui porte ce KPI, la table des décomptes et le suivi d'exécution financière) ne s'affichait **que pour l'état legacy `EXECUTION`**, jamais pour l'état **canonique `EN_EXEC`** — un simple placeholder « pas en exécution » s'affichait à la place. Du coup, pour un marché normalement en cours, aucun montant global n'était visible. Correctif : inclure `EN_EXEC` dans le déclenchement du cockpit.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/op-mandat-manager-mp.js` :
  - `isMarcheEnExecution()` accepte désormais `EN_EXEC` (en plus de `EXECUTION`/`RESILIE`/`CLOS`).
  - `computeExecutionFinanciere()` : heuristique de santé étendue à `EN_EXEC` (cohérence ; helper exporté).

### Impact / Anti-régression

- **UI** : un marché `EN_EXEC` affiche le cockpit complet (KPIs dont « Montant global du marché » = base + avenants, table des décomptes/OP) au lieu d'un placeholder. Aucun changement pour `EXECUTION`/`RESILIE`/`CLOS`.
- **DB / Worker** : aucun (front uniquement, pas de schéma).
- **Vérifié (CDP)** : marché `EN_EXEC` (TEST-EN_EXEC) → cockpit visible, « MONTANT GLOBAL DU MARCHÉ » présent, plus de placeholder, table décomptes rendue, **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`).

---

## 2026-06-04 — Fusion étapes 3 & 4 : redirection Visa CF + frise (E-1/E-9, 2b)

> **Modif #132** — Section C, lot 10, points **E-1/E-9**, commit 2b (final). La fusion est **complète côté navigation et frise** : l'ancienne URL/étape « Visa CF » rend désormais l'**écran d'enregistrement** (l'approbation y est contenue), et un marché à l'état **VISE** se positionne sur l'étape « **Enregistrement de marché** » dans la frise (et non « Exécution »).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/index.js` : route `/mp/visa-cf` enregistrée sur `renderAttribution` (au lieu de `renderVisaCF`).
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : `getRouteForEtape` — `VISE` (et `ATTRIBUE`) renvoient vers `/mp/attribution` (l'action « Voir » d'un marché approuvé ouvre l'enregistrement).
- `sidcf-portal/js/ui/widgets/steps-mp.js` : `ETAT_TO_PHASE.VISE = 'ATTRIBUTION'` (au lieu de `'VISA_CF'`, étape qui n'existe plus dans la frise rendue).

### Impact / Anti-régression

- **Workflow** : plus aucune étape « Visa CF » distincte — ni écran, ni route, ni jalon de frise. `renderVisaCF` (ecr03c) reste importé mais n'est plus routé (aucune régression ; suppression possible ultérieurement).
- **DB / Worker** : aucun changement (front uniquement).
- **Vérifié (CDP)** : `/mp/visa-cf?idOperation=…` rend bien l'écran d'enregistrement (bloc « Origine de l'approbation » présent) ; la frise d'un marché **VISE** affiche « Enregistrement de marché » comme étape courante (✅, pas « Exécution ») ; **0 erreur console**.

### Déploiement

- Front statique (Vercel auto-deploy sur push `main`). Vider le cache localStorage `sidcf_registries` non requis (pas de changement de référentiel).

---

## 2026-06-04 — Fusion étapes 3 & 4 : enregistrement → Approuvé directement (E-1/E-9, 2a)

> **Modif #131** — Section C, lot 10, points **E-1/E-9**, commit 2a. La fusion devient effective : l'écran d'**enregistrement** fait passer le marché **directement à l'état VISE (Attribué/Approuvé)** à la sauvegarde (l'approbation est contenue dans l'enregistrement). Le **bouton orange « Passer à Approbation »** (transition ATTRIBUE→VISE) est **supprimé**.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : à la sauvegarde, `etat → VISE` (depuis EN_PROC/ATTRIBUE/EN_ATTR ; timeline += ATTR, VISE).
- `sidcf-portal/js/ui/widgets/next-phase-button-mp.js` : transition `ATTRIBUE` mise à `null` (plus de bouton « Approbation » ; le `null` est déjà géré comme un état terminal).

### Impact / Anti-régression

- **Workflow** : une étape de moins ; l'enregistrement produit un marché approuvé. La transition `VISE → Exécution` reste inchangée.
- **DB / Worker** : mise à jour de `etat`/`timeline` (pas de schéma).
- **Vérifié (CDP)** : bouton « Passer à Approbation » absent ; bloc origine + bouton « Enregistrer » présents ; 0 erreur console. (Le passage effectif à VISE n'a pas été exécuté en test pour ne pas muter une opération réelle.)
- *Commit 2b (à venir)* : redirection de l'écran Visa CF vers l'enregistrement + fusion de l'étape « Visa CF » dans la timeline.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Enregistrement : bloc « Origine de l'approbation » (E-1/E-9, 1/2)

> **Modif #130** — Section C, **lot 10** (structurant), points **E-1/E-9**, **commit 1/2** (additif). Conformément aux instructions du client (« l'étape d'approbation est **contenue dans l'enregistrement** ; même onglet ; champ pour désigner l'autorité approbatrice »), ajout sur l'écran d'enregistrement d'un bloc **« Origine de l'approbation »** : choix **Marché/Contrat visé CF** / **Approuvé autre que CF**. Le choix ouvre les champs : *Visé CF* → N° + date du visa ; *Autre* → **autorité approbatrice** (référentiel des organes, **CF exclu**) + N° + date de l'acte.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : import `getAllOrganes` ; `renderApprobationOrigineSection(existingAttr)` (rendue après les infos marché) ; persistance `attribution.approbation = { origine, visaNum, visaDate, organe, acteNum, acteDate }`.

### Impact / Anti-régression

- **UI** : nouvelle section ; **aucun changement de workflow pour l'instant** (commit additif).
- **Données** : `approbation` ajouté à `MP_ATTRIBUTION` (JSONB — pas de migration).
- **Vérifié (CDP)** : choix présent, bascule Visé CF ↔ Approuvé autre, 27 organes (CF exclu : DGMP, DGBF…) ; 0 erreur console.
- *Commit 2/2 (à venir)* : transition directe vers Approuvé/Visé à l'enregistrement, retrait du bouton orange « Passer à Approbation », redirection de l'écran Visa CF, fusion timeline.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — En-tête : distinguer « état effectif » et « étape consultée » (E-10)

> **Modif #129** — Section C, **lot 9**, point **E-10**. La subtilité signalée : confusion entre **l'état réel du marché** (invariant, ex. « Achevé ») et **l'étape/écran consulté**. L'en-tête affichait déjà les deux (badge = `operation.etat`, breadcrumb = étape) mais sans les distinguer clairement. Reformulé : badge **« État effectif du marché : … »** et breadcrumb **« Vous consultez l'étape : … »**. Aucune logique modifiée — le badge reste basé sur `operation.etat`.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/page-header-mp.js` : libellés du badge d'état et du breadcrumb (en-tête partagé par tous les écrans Marché+).

### Impact / Anti-régression

- **UI** : wording plus clair sur tous les écrans MP ; aucun changement de logique/donnée.
- **Vérifié (CDP)** : « État effectif du marché : Attribué » + « Vous consultez l'étape : Enregistrement de marché » ; pas de régression.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Enregistrement : ordonnancement prévu (CP par année) — E-21

> **Modif #128** — Section C, **lot 8**, point **E-21**. Ajout d'une section **« 🗓️ Ordonnancement prévu (CP par année) »** sur l'écran d'enregistrement : un tableau **années × sources de financement** (Trésor (CI) / Dons / Emprunts) avec **montants saisissables**, **totaux par ligne et généraux**, et **ajout/suppression d'années**. Vue annuelle / pluriannuelle de la prise en charge, **complémentaire à la clé de répartition** (conforme à l'extrait « page de garde » transmis).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : `renderOrdonnancementSection(existingAttr, operation)` (rendue après la clé de répartition) ; persistance `ordonnancement = [{ annee, tresor, dons, emprunts }]` dans `lotFields`.

### Impact / Anti-régression

- **UI** : une section de plus à l'enregistrement ; totaux recalculés à la saisie.
- **Données** : `ordonnancement` ajouté à `MP_ATTRIBUTION` (JSONB — pas de migration).
- **Vérifié (CDP)** : tableau présent, total ligne/général « 3 000 000 000 XOF » correct, ajout d'année OK ; 0 erreur console.
- *Suite (« à terme »)* : pré-remplissage depuis les sources/clé de répartition + lien pluriannualité.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Difficultés : bloc OUI/NON sur toutes les étapes (E-2/E-22)

> **Modif #127** — Section C, lot 7, étape finale, points **E-2 et E-22**. Le bloc « difficultés » devient un **composant réutilisable encadré OUI/NON** (`renderDifficultesGatedBloc`) et est **posé sur toutes les étapes** : contractualisation, enregistrement, exécution, clôture (en plus de la fiche de vie). « Oui » déploie le gestionnaire (chargé à la demande), « Non » le replie ; il s'ouvre **automatiquement** si des difficultés existent déjà.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js` : export `renderDifficultesGatedBloc({ operationId, registries, lots })`.
- `ecr02a-procedure-pv.js`, `ecr03a-attribution.js`, `ecr04a-execution-os.js`, `ecr05-cloture.js` : import + `page.appendChild(renderDifficultesGatedBloc(...))` avant le bouton d'étape.

### Impact / Anti-régression

- **UI** : un bloc OUI/NON identique à chaque étape ; le gestionnaire complet (table + modal + actions) reste celui de la fiche de vie.
- **Données / Worker** : ❌ aucun changement (lecture `MP_DIFFICULTE`).
- **Vérifié (CDP)** : bloc présent + « Oui » déploie le gestionnaire sur Contractualisation, Enregistrement et Exécution ; 0 erreur console. (Clôture : code identique, non testé live.)

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Difficultés : action « Appliquer au marché » (état effectif)

> **Modif #126** — Section C, lot 7, étape 3, points **E-3/E-10** (décision actée : changement d'état **via action explicite**). Pour une difficulté de statut **Suspendu** ou **Résilié**, un bouton **« ↪ Appliquer au marché »** met à jour l'**état effectif** du marché (`operation.etat → SUSPENDU/RESILIE`) — seulement sur clic + confirmation. La déclaration de la difficulté et le changement d'état restent ainsi **distincts** (cohérent avec E-10 : état effectif ≠ étape).

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js` : bouton conditionnel (Suspendu/Résilié) + `applyStatutMarche(d)` (`dataService.update(MP_OPERATION, …, { etat })` + confirmation + rechargement).

### Impact / Anti-régression

- **Workflow** : l'état du marché ne change **jamais automatiquement** ; uniquement sur action explicite. Abandonné / En cours : pas de bouton (pas d'état correspondant).
- **DB / Worker** : mise à jour de `etat` sur action (pas de schéma).
- **Vérifié** : manager rendu sans erreur console ; logique d'application revue (non exécutée en test pour ne pas muter une opération réelle de la base de démo).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Difficultés : statut du marché En cours/Suspendu/Abandonné/Résilié (E-3)

> **Modif #125** — Section C, lot 7, étape 2, point **E-3**. Ajout d'un **statut du marché en difficulté** (En cours / Suspendu / Abandonné / Résilié), **axe distinct** du « statut de traitement » (En cours / Résolu / Abandonné) — ce dernier sert au calcul de santé et reste inchangé. Le nouveau statut apparaît dans le formulaire et dans une colonne « Statut marché » du tableau.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js` : constante `STATUT_MARCHE_DIFFICULTE` ; champ `statutMarche` (formulaire + défaut + persistance) ; colonne + badge dans le tableau.

### Impact / Anti-régression

- **UI** : un select + une colonne de plus ; `statutTraitement` (santé) intact.
- **Données** : champ `statutMarche` ajouté à `MP_DIFFICULTE` (JSONB — pas de migration).
- **Vérifié (CDP)** : select présent avec les 4 valeurs ; 0 erreur console.
- *Suite* : action « Appliquer au marché » (met `operation.etat` à jour, décision actée) puis pose du bloc sur toutes les étapes (E-2/E-22).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Difficultés : « Autorité décisionnelle » + « Réf./N° de l'acte » (E-4/E-6)

> **Modif #124** — Section C, **lot 7** (bloc difficultés), étape 1, points **E-4 et E-6**. Le bloc « difficultés » existe déjà (`difficultes-manager-mp.js` + `MP_DIFFICULTE`). Renommages dans le formulaire : **« Nom du décideur » → « Autorité décisionnelle »** (E-4) et **« Référence document » → « Référence / N° de l'acte »** (E-6). *(Décisions actées pour la suite : changement d'état du marché via action explicite ; bloc sur toutes les étapes ; acte optionnel.)*

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js` : libellés du formulaire (champs `nomDecideur`, `fichier` inchangés en donnée).

### Impact / Anti-régression

- **UI** : libellés uniquement. Aucun changement de logique/persistance.
- **DB / Worker** : ❌ aucun.
- **Vérifié (CDP)** : modal d'ajout → « Autorité décisionnelle » + « Référence / N° de l'acte » ; ancien « Nom du décideur » absent ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Livrables : types configurables + « Autre » (E-20)

> **Modif #123** — Section C, **lot 6**, point **E-20**. Le référentiel des livrables des géographes n'étant pas disponible, on s'appuie sur la **configuration** : les types de livrables proviennent du référentiel `TYPE_LIVRABLE` (modifiable), et on ajoute un type **« Autre (à préciser) »** pour saisir tout livrable hors liste (type + libellé libre). Un **repère** indique que la liste est configurable et s'enrichira du référentiel géographes une fois fourni. Le manager permet déjà d'ajouter/modifier les livrables (Générer / Ajouter + champs éditables).

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : `TYPE_LIVRABLE` += `AUTRE`.
- `sidcf-portal/js/ui/widgets/livrable-manager-mp.js` : repère « Types configurables… ».

### Impact / Anti-régression

- **UI** : option « Autre » + note ; comportement d'ajout/édition inchangé.
- **Données / Worker** : ❌ aucun (référentiel statique ; cache `localStorage` à vider si présent).
- **Vérifié (CDP)** : « Autre (à préciser) » dans le select des types ; repère affiché ; 0 erreur console.
- *Suite* : le référentiel des livrables géographes s'ajoutera par simple enrichissement de `TYPE_LIVRABLE`.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Réserves du CF déplacées vers la Contractualisation (E-19, 2/2)

> **Modif #122** — Section C, lot 5, point **E-19 (volet réserve CF)**. La case **« Réserves du Contrôleur Financier »** quitte l'enregistrement pour la **contractualisation** (« à toutes les contractualisations », C-11 §2). Elle est désormais **masquée par l'option « sans CF »** (PSD/PSC). À l'enregistrement, le bloc n'apparaît plus (il n'y était d'ailleurs pas persisté).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` : conteneur `#reserve-cf-container` + `renderReserveCFBlock()` + `TYPES_RESERVE_CF` ; persistance `procedureData.reserveCF = { aReserves, typeReserve, commentaire }`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : appel `renderReservesCFSection(...)` retiré (fonction conservée non appelée).
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` : affichage des réserves lu depuis `procedure.reserveCF` (fallback `attribution.decisionCF`).

### Impact / Anti-régression

- **UI** : réserve CF saisie à la contractualisation (masquée si « sans CF ») ; absente de l'enregistrement.
- **Données** : nouveau `procedure.reserveCF` (JSONB — pas de migration) ; l'ancien `attribution.decisionCF` reste lu en fallback par la fiche.
- **Vérifié (CDP)** : présente (AOO) avec détails au clic ; masquée par « sans CF » (PSC) ; absente de l'enregistrement ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-04 — Enregistrement : retrait du bloc « TVA supportée par l'État » (E-19, 1/2)

> **Modif #121** — Section C, lot 5, point **E-19 (volet TVA)**. Analyse demandée : le bloc **« TVA supportée par l'État »** de l'enregistrement était **orphelin** (aucune persistance — ses champs n'étaient jamais sauvegardés) et **redondant** avec la **clé de répartition**, qui gère sa propre ligne « TVA État » via un **toggle dédié** (`addTVAEtatLine`/`removeTVAEtatLine`). Le bloc est donc **retiré** sans perte de fonctionnalité ni risque pour la clé.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : appel `renderTVASection(...)` retiré de `renderAttributionForm`. La fonction `renderTVASection` reste définie mais **non appelée** (à supprimer ultérieurement).

### Impact / Anti-régression

- **UI** : un bloc en moins à l'enregistrement ; la déclaration « État supporte la TVA » reste possible dans la **clé de répartition**.
- **Données** : ❌ aucune (le bloc ne persistait rien).
- **Vérifié (CDP)** : bloc TVA absent, réserve CF toujours présente, clé de répartition intacte (toggle TVA conservé) ; 0 erreur console.
- *Suite (E-19, 2/2)* : déplacement de la **réserve CF** vers la contractualisation.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Enregistrement : Section C lot 4 (avances de démarrage 15/15 ≤ 30 %)

> **Modif #120** — Section C, **lot 4**, point **E-15**. L'avance de démarrage (auparavant une simple case) est refondue en **deux avances** : **forfaitaire** (≤ 15 % du marché de base) + **facultative** (≤ 15 %), avec **calcul des montants** (% × montant TTC), **total** affiché et **alerte non bloquante si le cumul dépasse 30 %**. Le calibrage « Décompte 00 » reste honoré à l'étape Exécution.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` :
  - bloc avance enrichi (case + détail forfaitaire/facultative + total + alerte) ;
  - `updateAvancesDisplay()` (montants, total, plafond 30 %), branchée sur `calculerMontants()` + les saisies ;
  - persistance `avanceDemarrage = { actif, forfaitPct, facultPct }` (rétro-compat avec l'ancien booléen à la lecture).

### Impact / Anti-régression

- **UI** : deux pourcentages + montants + garde-fou 30 %.
- **Données** : `avanceDemarrage` passe de booléen à objet (JSONB — pas de migration ; lecture tolère l'ancien format).
- **Vérifié (CDP)** : défaut 15 %/0 → total « 15,0 % · 1 200 000 XOF » ; 35 % → alerte ⚠️ ; 25 % → pas d'alerte ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Enregistrement : Section C lot 3 (attributaire : NCC + compte simplifié)

> **Modif #119** — Section C, **lot 3** (attributaire), points **E-12 / E-13** :
> - **E-12** : le **NCC** est déjà affiché à côté de la raison sociale par le sélecteur d'entreprise (`entreprise-picker-mp.js`) — confirmé, aucun changement nécessaire.
> - **E-13** : « *juste le compte bancaire suffirait* ». La section bancaire affiche désormais **Banque + N° de compte** (le compte rappelé du titulaire) ; **agence / intitulé / SWIFT** sont **repliés** dans un `<details>` (non nécessaires à l'affichage). Les **identifiants de champs sont conservés** → préremplissage et persistance inchangés. La **sélection parmi PLUSIEURS comptes** du titulaire viendra avec l'enrichissement de la base entreprises (liste détaillée des comptes — « à terme »).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : `renderCoordonneesBancairesSection` restructurée (Banque + N° visibles ; agence/intitulé/SWIFT dans un `<details>` replié). Fonction partagée → cohérent pour entreprise simple, mandataire et co-titulaires.

### Impact / Anti-régression

- **UI** : affichage simplifié au compte ; détails accessibles au besoin (repliés).
- **Données / persistance** : ❌ aucun changement (mêmes id de champs, même `_prefillBanqueSection` / `handleSave`).
- **Vérifié (CDP)** : Banque + N° visibles, agence/intitulé/SWIFT dans un `<details>` fermé par défaut ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Enregistrement : exonération de TVA déplacée au niveau du montant de base

> **Modif #118** — Section C, lot 2, point **E-16**. La case **« Marché exonéré de TVA »** était dans la section « Informations sur le marché approuvé », alors qu'elle pilote le taux/montant. Elle est **déplacée dans la carte « Montant du marché de base »** (juste au-dessus de la grille HT/Taux/TTC), au plus près de ce qu'elle affecte.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : bloc exonération retiré de `renderInfosMarcheSection`, ajouté dans `renderMontantsSection` (mêmes id `attr-exonere-tva` et handler `toggleExonerationTVA`).

### Impact / Anti-régression

- **UI** : exonération au niveau du montant ; comportement inchangé (force le taux à 0, désactive le champ taux).
- **DB / Worker** : ❌ aucun changement (même id, même persistance).
- **Vérifié (CDP)** : case présente dans la carte « Montant du marché de base », absente de « Infos marché » ; coché → taux 0 + désactivé ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Fiche de vie : montant de base « HT null » corrigé (Section C lot 2)

> **Modif #117** — Section C, **lot 2** (montants), points **E-7 / E-8 / E-17**. Sur le récap « Montant du marché de base » (fiche de vie, en haut à droite), le **HT s'affichait à 0 (« null »)** quand seul le TTC était connu — car, contrairement au TTC (qui retombe sur le montant prévisionnel), le HT n'avait **aucun fallback**. Il est désormais **dérivé du TTC** (selon l'exonération) → montant de base cohérent et dynamique. Le séparateur de milliers (E-17) était déjà appliqué par `money()` ; il apparaît dès lors que le HT a une valeur.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` : `montantHT = montants.ht || (montantTTC ? round(montantTTC / (exonéré ? 1 : 1.18)) : 0)`.

### Impact / Anti-régression

- **UI** : le HT du récap reflète toujours une valeur cohérente (HT ≈ TTC/1,18 ou = TTC si exonéré), avec séparateur de milliers.
- **DB / Worker** : ❌ aucun changement (calcul d'affichage).
- **Vérifié (CDP)** : « 6 779 661 XOF HT · 8 000 000 XOF TTC », « 5 084 746 XOF HT · 6 000 000 XOF TTC » ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Enregistrement : Section C lot 1 (libellés)

> **Modif #116** — Section C (Enregistrement, `ecr03a`), **lot 1 — libellés** :
> - **E-11** : titre de l'écran « Attributaire, montant & garanties » → **« Conditions contractuelles du marché »**.
> - **E-14** : section « Informations sur le marché approuvé » → **« Informations sur le Marché/Contrat approuvé »** ; **durée contractuelle par défaut en « Jours »** (sauf valeur déjà enregistrée).
> *(E-4 « Autorité décisionnelle » différé : pas de champ « Nom du décideur » aujourd'hui — il arrivera avec le bloc « difficultés ».)*

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : `titre` du page-header ; titre de `renderInfosMarcheSection` ; fallback `dureeUnite` → `'JOURS'` + ordre des options du select (Jours en tête).

### Impact / Anti-régression

- **UI** : libellés uniquement + unité de durée par défaut « Jours ». Aucun changement de logique/persistance.
- **DB / Worker** : ❌ aucun changement.
- **Vérifié (CDP)** : titre écran, titre section et durée par défaut « Jours » corrects ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : attributaire en recherche simple (autocomplétion)

> **Modif #115** — Retour métier : pour une **entreprise attributaire unique**, on doit pouvoir faire une **recherche simple** / rappeler depuis la base, plutôt que parcourir un long menu déroulant. Le `<select>` d'attributaire (#114) devient un **champ de recherche avec autocomplétion** (`<input list>` + `<datalist>`) sur la base des entreprises. La **saisie filtre** les suggestions ; le **NCC reste auto-déduit**. La source demeure : **liste restreinte** (AMI→DP) sinon **toutes les entreprises** (`MP_ENTREPRISE`).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - `renderAttributionBlock` : `<input id="proc-attr-input" list="proc-attr-list">` + `<datalist>` peuplé (liste restreinte ou `MP_ENTREPRISE`), map `RS→NCC` pour déduire le NCC à la saisie ;
  - persistance `attribution` lue depuis `#proc-attr-input`.

### Impact / Anti-régression

- **UI** : recherche/autocomplétion au lieu d'un long select ; NCC toujours auto.
- **Données** : forme `attribution = { raisonSociale, ncc, montantAttribue }` inchangée.
- **Vérifié (CDP)** : datalist = 33 entreprises, input lié (`list`), saisie d'une entreprise → NCC auto (« CI-AGE-2018-1200 ») ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : attributaire SÉLECTIONNÉ + case « sans CF » relocalisée

> **Modif #114** — Retour métier (2 points) :
> - **Attribution** : l'attributaire n'est **jamais saisi**, il est **SÉLECTIONNÉ**. Les champs libres « raison sociale » + « NCC » sont remplacés par un **sélecteur d'entreprise** ; le **NCC est déduit** automatiquement. Source : la **liste restreinte** si une procédure d'AMI l'a définie en amont (cas DP) ; **sinon toutes les entreprises** de la base (`MP_ENTREPRISE`). Le montant attribué est conservé (contrôlé à l'enregistrement). L'enregistrement réutilisera cette désignation.
> - **« Pièces à joindre » / PSD-PSC** : la case **« Contractualisation sans CF »** est déplacée **dans le formulaire du mode** (à côté du bon de commande / devis), et le bloc « Pièces à joindre » **ne s'affiche plus pour PSD/PSC** (il n'avait pas de pièce → trompeur : « comment charger la pièce ? »). Le document se charge via le BC/devis du formulaire.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - `renderAttributionBlock(existingProc, candidates)` — `<select>` d'entreprises (liste restreinte ou `MP_ENTREPRISE` chargé async), NCC `readonly` auto-déduit ;
  - call sites mis à jour (DP → liste restreinte ; sinon toutes entreprises) ; persistance `attribution` lue depuis `#proc-attr-select` ;
  - `_sansCFField()` injecté dans les formulaires PSD et PSC ; retiré de `renderPiecesAJoindreBlock` (qui retourne `null` pour PSD/PSC).

### Impact / Anti-régression

- **UI** : attributaire choisi dans une liste (plus de saisie libre) ; NCC non saisissable. PSD/PSC : case sans-CF dans le formulaire, plus de bloc « Pièces à joindre » vide.
- **Données** : `attribution = { raisonSociale, ncc, montantAttribue }` inchangé en forme.
- **Vérifié (CDP)** : AOO → 33 entreprises sélectionnables, NCC auto à la sélection ; PSD/PSC → sans-CF dans le formulaire, pas de bloc pièces ; PI/DP → sélecteur présent ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : refonte du bloc en « Pièces à joindre (facultatif) »

> **Modif #113** — Retour métier sur l'ancien bloc « Pièce d'engagement de l'étape » (#106) : ces pièces **ne sont pas indispensables**, **plusieurs peuvent coexister** (courrier **ET** mandat — pas un choix exclusif), et **le PV d'ouverture est déjà saisi au niveau du lot** (donc retiré d'ici). Le bloc devient **« 📎 Pièces à joindre (facultatif) »**, sobre, avec des **uploads indépendants** :
> - **Concurrentiel** (PSL/PSO/AOO/AOR/PI) : Courrier d'invitation + Mandat de représentation (chacun facultatif). **Plus de PV ici, plus de select unique, plus de champs N°/Date.**
> - **Contrat direct** (Convention/Lettre/Reconduction) : un upload « Document du contrat ».
> - **PSD/PSC** : pas de slot de pièce (leurs documents sont dans le formulaire du mode) ; seule la case **« sans CF »** reste.
> - **Gré à gré simple** (ENTENTE_DIRECTE/GRE) : **plus de bloc du tout**.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - `renderPieceEngagementBlock` + `getPieceEngagementOptions` + `MODES_PIECE_DIRECTE` **supprimés** → `renderPiecesAJoindreBlock(mode, existingProc)` (retourne `null` si rien à afficher) ;
  - point d'appel avec garde `null` ;
  - persistance `procedureData.piecesJointes = { courrierDoc, mandatDoc, contratDoc }` (chaque doc préservé si non ré-uploadé) ; ancien `pieceEngagement` retiré.

### Impact / Anti-régression

- **UI** : bloc allégé et facultatif ; gré à gré sans bloc. La case « sans CF » et le masquage associé restent fonctionnels.
- **Données** : nouveau champ `piecesJointes` (JSONB — pas de migration) ; l'ancien `pieceEngagement` éventuel reste en base sans gêner (non lu).
- **Vérifié (CDP)** : AOO/PI → Courrier + Mandat (2 uploads), pas de PV/select/N°/Date ; PSC/PSD → case sans-CF seule ; ENTENTE_DIRECTE/GRE → aucun bloc ; 0 erreur console.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Liste PPM : « Mode de passation » uniformisé en « CODE — Libellé »

> **Modif #112** — Uniformisation de l'affichage du mode de passation (écart relevé en Section A). Le tableau retirait le code (« Procédure Simplifiée… ») tandis que le filtre affichait « … (PSD) ». Désormais **les deux affichent le même format « CODE — Libellé »** (ex. « PSD — Procédure Simplifiée d'Entente Directe »), **cohérent avec les colonnes Activité et Nature économique** (code en tête). Le « (CODE) » final redondant du libellé est retiré.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - helper `formatModeLabel(modeEntry)` (« CODE — Libellé », retrait du « (CODE) » final) ;
  - colonne « Mode de passation » du tableau + options du filtre groupé consomment `formatModeLabel`.

### Impact / Anti-régression

- **UI** : représentation homogène du mode (tableau ↔ filtre) ; `title` du tableau conserve le libellé d'origine. Recherche interne du filtre porte aussi sur le code.
- **Données / Worker / DB** : ❌ aucun changement.
- **Vérifié (CDP)** : tableau et filtre affichent tous deux « CODE — Libellé » (formats validés).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : C-11 vague 3 + C-9 (sous-procédures PI & liste restreinte)

> **Modif #111** — Section B, point **C-11 (vague 3)** et **C-9**. Pour les **Prestations Intellectuelles (PI)**, ajout d'un **sélecteur de sous-procédure** qui pilote l'issue :
> - **AMI — recrutement de cabinet** → issue = **LISTE RESTREINTE** (entreprises retenues, éditable, raison sociale + NCC), **sans** attributaire/montant. La liste est mémorisée pour la **Demande de Proposition** ultérieure (C-9 : « liste restreinte seule »).
> - **AMI — comparaison de CV** → **attribution** (bloc Attribution : attributaire + NCC + montant).
> - **DP (Demande de Proposition)** → **attribution** + **rappel en lecture seule** de la liste restreinte issue de l'AMI (si elle existe).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - conteneurs `#pi-subproc-container` et `#liste-restreinte-container` ;
  - `renderPISubprocSelector()`, `renderListeRestreinteBlock()`, `_lrRow()` ;
  - logique PI dans `updateContextualSections` (AMI cabinet → liste restreinte ; AMI CV / DP → attribution ; DP → rappel lecture seule) ;
  - persistance `procedureData.sousProcedurePI` + `procedureData.listeRestreinte` (préservée pour la DP).

### Impact / Anti-régression

- **UI / Workflow** : les PI ne passent plus systématiquement par une attribution simple ; l'AMI cabinet conclut par une liste restreinte. La DP (procédure ultérieure distincte) réutilisera la liste — son traitement complet reste à venir (décision C-9).
- **Données** : `sousProcedurePI`, `listeRestreinte` ajoutés à `MP_PROCEDURE` (JSONB — pas de migration).
- **Vérifié (CDP, op PI réelle)** : AMI cabinet → liste restreinte (+ ajout d'entreprise) sans attribution ; AMI CV / DP → attribution ; bascule du sélecteur correcte.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : C-11 vague 2 (AOR + modes à contrat direct)

> **Modif #110** — Section B, point **C-11 (vague 2)**.
> - **AOR** : déjà aligné par la vague 1 (formulaire concurrentiel + PV de jugement par lot + bloc Attribution) — aucun changement nécessaire.
> - **Convention · Lettre de commande valant marché · Reconduction** : traités comme **attributions directes** (la dépense arrive au paiement → prise en charge au module marché). La **pièce d'engagement** devient le **document du contrat** (Convention / Lettre / Contrat de reconduction) ; **pas de lots ni de PV** ; l'attributaire + montant se saisissent dans le bloc « Attribution ».
> - **Reconduction** : bloc dédié avec **contrôle DGMP** (autorisation requise au-delà de 2 ans : nombre d'années + référence + upload).
> - Ajout du mode **RECONDUCTION** au référentiel `MODE_PASSATION` (famille dérogatoire) et au filtre PPM groupé.

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : `MODE_PASSATION` += `RECONDUCTION`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : `RECONDUCTION` ajouté à la famille « Procédures dérogatoires » du filtre.
- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - `MODES_CONTRAT_DIRECT` ; options de pièce d'engagement spécifiques (Convention/Lettre/Contrat de reconduction) + note adaptée ;
  - `shouldShowLots` exclut les modes à contrat direct ;
  - branches `RECONDUCTION` (contrôle DGMP) et `CONVENTION/LETTRE_COMMANDE_MARCHE` (info attribution directe) dans le formulaire ;
  - persistance `procedureData.reconductionControl = { nbAnnees, dgmpRef, dgmpDoc }`.

### Impact / Anti-régression

- **UI** : les 3 modes directs n'affichent plus le formulaire COJO ni les lots ; reconduction a son contrôle DGMP.
- **Données** : `reconductionControl` ajouté à `MP_PROCEDURE` (JSONB — pas de migration) ; `RECONDUCTION` au référentiel statique (cache `localStorage` à vider si présent).
- **Vérifié (CDP)** : RECONDUCTION chargé au référentiel + présent au filtre PPM (dérogatoires). Branches de formulaire des 3 modes directs validées par revue de code (aucune opération de ces modes en base pour un test live).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : C-11 vague 1 (attribution + routage CFN/GRE)

> **Modif #109** — Section B, point **C-11 (vague 1 : PSD, PSC/CFN, PSL/PSO/AOO)**. Alignement sur le référentiel des champs par mode (24/05) :
> - **Bloc « Attribution de la contractualisation »** (attributaire raison sociale + **NCC** + **montant attribué**) ajouté pour tous les modes concluant par une attribution. Le montant attribué alimentera le **contrôle d'écart** à l'enregistrement du marché approuvé. *(Non affiché pour PI/AMI — issue « liste restreinte » traitée en vague 3 / C-9.)*
> - **CFN** suit désormais le **formulaire de sélection** (comme PSC) au lieu du formulaire générique.
> - **GRE** (gré à gré) suit le **formulaire direct** (comme PSD/entente directe), sans lots ni PV.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - branche formulaire `PSC || CFN` ; branche directe `PSD || ENTENTE_DIRECTE || GRE` ;
  - conteneur `#attribution-container` + `renderAttributionBlock(mode, existingProc)` (affiché si `mode !== 'PI'`) ;
  - persistance `procedureData.attribution = { raisonSociale, ncc, montantAttribue }`.

### Impact / Anti-régression

- **UI** : nouveau bloc Attribution (vert) en bas de la contractualisation ; CFN/GRE basculent vers le bon formulaire.
- **Données** : `attribution` ajouté à `MP_PROCEDURE` (JSONB — pas de migration).
- **Vérifié (CDP)** : AOO/PSC/GRE → Attribution présente ; GRE → formulaire direct sans lots ; PSC → formulaire de sélection ; PI → pas d'Attribution. Routage CFN→PSC confirmé par code (aucune op CFN en base).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : gré à gré (attribution directe) + option « sans CF »

> **Modif #108** — Section B, points **C-10 et C-5**.
> - **C-10** : le **gré à gré / entente directe** (codes `ENTENTE_DIRECTE` et `GRE`) est une **attribution directe** — plus de section « Lots & procédure par lot » (donc pas de PV par lot) ; sa pièce d'engagement reste « Bon de commande / Devis ».
> - **C-5** : pour les **PSD/PSC**, une case **« Contractualisation sans CF »** (le Contrôleur Financier n'est pas impliqué) **allège** la saisie : elle masque les soumissionnaires, les lots (et la réserve CF lorsque E-19 la portera à cette étape).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - `shouldShowLots` exclut désormais `PSD`, `ENTENTE_DIRECTE`, `GRE` ;
  - `MODES_PIECE_DIRECTE` += `GRE` ;
  - case `#proc-sans-cf` (PSD/PSC) + `applySansCFVisibility()` (masque soumissionnaires/lots/réserve-CF) appliqué à l'init et au changement ; persistance `procedureData.sansCF`.

### Impact / Anti-régression

- **UI** : gré à gré sans lots ; case « sans CF » pour PSD/PSC pilotant la visibilité des sections lourdes.
- **Données** : `sansCF` (booléen) ajouté à `MP_PROCEDURE` (JSONB — pas de migration).
- **Vérifié (CDP)** : PSC → case présente, cochée masque soumissionnaires+lots, décochée restaure ; ENTENTE_DIRECTE → aucune carte lots.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : action « Déclarer infructueux »

> **Modif #107** — Section B, points **C-4 et C-12**. La contractualisation peut ne pas aboutir à une attribution. Ajout d'un **bouton dédié « 🚫 Déclarer infructueux »** (à côté d'« Enregistrer & Continuer »), avec **confirmation**, qui sauvegarde la procédure puis pose le statut du marché à **INFRUCTUEUX**.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - bouton « Déclarer infructueux » (`btn-warning`) → `handleSave(..., { issue: 'INFRUCTUEUX' })` après `window.confirm` ;
  - `handleSave` reçoit `options` ; si `issue === 'INFRUCTUEUX'`, `updateData.etat = 'INFRUCTUEUX'` ; message de succès adapté.

### Impact / Anti-régression

- **UI / Workflow** : nouvelle issue terminale à la contractualisation ; le statut INFRUCTUEUX (déjà au référentiel + filtre + carte hors-cycle) est désormais **atteignable depuis l'écran**.
- **Garde-fou** : action protégée par confirmation ; le reste du flux (Enregistrer & Continuer → ATTRIBUE via bouton d'étape) est inchangé.
- **DB / Worker** : ❌ aucun changement de schéma (mise à jour de `etat`).
- **Vérifié (CDP)** : bouton présent (`btn-warning`), confirmation refusée → aucune navigation/mutation (la transition réelle n'a pas été exécutée contre la base live).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : bloc « Pièce d'engagement de l'étape »

> **Modif #106** — Section B, points **C-2 et C-3**. Ajout en **tête de l'étape** d'un bloc **« Pièce d'engagement de l'étape »** mis en évidence (bordure bleue). Il marque la pièce qui ouvre la contractualisation, avec **type / référence / date / pièce jointe**. Les types proposés s'adaptent au mode : **Courrier d'invitation · Mandat de représentation · PV d'ouverture** pour les modes concurrentiels (le PV capte la participation du CF au COJO/COPE) ; **Bon de commande · Devis / facture proforma** pour **PSD/PSC/entente directe** (CF non systématique).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - nouveau conteneur `#engagement-container` (en tête, après la dérogation) ;
  - `getPieceEngagementOptions(mode)` + `renderPieceEngagementBlock(mode, existingProc)` ;
  - persistance `procedureData.pieceEngagement = { type, reference, date, doc }` (doc préservé si non ré-uploadé).

### Impact / Anti-régression

- **UI** : bloc proéminent supplémentaire en tête ; les formulaires par mode existants restent inchangés (consolidation fine repoussée à la vague C-11).
- **Données** : champ `pieceEngagement` ajouté à `MP_PROCEDURE` (JSONB — pas de migration).
- **Vérifié (CDP)** : bloc présent et mis en évidence, options concurrentielles (courrier/mandat/PV), champs référence/date/upload.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : N° dossier d'appel + Allotissement (Lot unique / Lots multiples)

> **Modif #105** — Section B, points **C-7 et C-8**. Ajout d'une carte **« Organisation du marché »** (modes hors PSD) avec le **N° du dossier d'appel** et un sélecteur **Allotissement**. Le choix pilote le widget lots : **Lot unique** → saisie directe simplifiée (pas de numérotation « Lot N », pas de contrôle « Nombre de lots ») ; **Lots multiples** → comportement historique (nombre de lots + cartes numérotées, N° de lot devant chaque objet/libellé).

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/lots-procedure-mp.js` : nouvelle option `allotissement` ('UNIQUE'|'MULTIPLES') — masque la numérotation et les contrôles de nombre de lots en mode unique ; libellés/aide adaptés.
- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` : carte « Organisation du marché » (`#proc-num-dossier`, `#proc-allotissement`) + `mountLots()` qui (re)monte le widget selon l'allotissement ; persistance `procedureData.numeroDossierAppel` / `procedureData.allotissement`.

### Impact / Anti-régression

- **UI** : nouvelle carte + bascule. En l'absence de donnée, défaut = **Lot unique** (≥2 lots existants → MULTIPLES auto).
- **Données** : 2 champs ajoutés à `MP_PROCEDURE` (JSONB — pas de migration). Les lots existants restent gérés à l'identique en mode multiples.
- **Vérifié (CDP)** : carte présente, défaut Lot unique (sans contrôle de nombre), bascule Multiples (Nombre de lots + Lot 1), retour unique masque le contrôle.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : types de dossier d'appel « DP/DDP » et « TDR »

> **Modif #104** — Section B, point **C-6**. Complément de la liste « Type de dossier d'appel » : ajout de **« Demande de Proposition (DP / DDP) »** et **« Termes de Référence (TDR) »**, associés aux **Prestations Intellectuelles (PI)**. (« Demande de cotation » = `DC` et « AMI » étaient déjà présents.)

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : `TYPE_DOSSIER_APPEL` += `DP_DDP` et `TDR` (modes `["PI"]`).

### Impact / Anti-régression

- **UI** : 2 options supplémentaires dans le select « Type de dossier d'appel » lorsque le mode est PI (filtrage par mode déjà en place dans `ecr02a`).
- **DB / Worker** : ❌ aucun changement (référentiel statique ; cache `localStorage` à vider si présent).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Contractualisation : libellés d'étape « Procédure » → « Contractualisation »

> **Modif #103** — Section B, point **C-1**. Finalisation du renommage de l'étape : au-delà de la timeline API (#95), il restait des libellés statiques « Procédure ». Corrigés : le **label d'étape** dans la frise statique (`steps-mp.js`), le **titre de l'écran** (« Procédure & Mode de Passation » → « Contractualisation & mode de passation ») et le **titre du formulaire** (« Détails de la procédure » → « Détails de la contractualisation »). Les usages métier légitimes du mot « procédure » (procédure de passation, procédure par lot) sont conservés.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/steps-mp.js` : step `PROCEDURE` label → « Contractualisation ».
- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` : titre d'écran + titre du formulaire défaut + en-tête de fichier.

### Impact / Anti-régression

- **UI** : libellés homogènes « Contractualisation » (timeline statique + API). Codes d'étape (`PROCEDURE`, `EN_PROC`) inchangés → aucune régression de logique/route.
- **DB / Worker** : ❌ aucun changement.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Cohérence « Activité » : filtre aligné sur la colonne (code + libellé)

> **Modif #102** — Prolongement de P-3 (cohérence affichage ↔ filtre). La colonne « Activité » affiche « CODE - Libellé », mais le **filtre multi-select** du haut n'affichait que le **libellé** et, surtout, n'extrayait que `chaineBudgetaire.activiteLib` — **ratant les opérations** dont le libellé est stocké dans `chaineBudgetaire.activite`. Introduction d'une **source unique `activiteOf(op)`** (représentation « CODE - Libellé ») utilisée par **le tableau, le filtre ET le match** → cohérence totale et couverture complète. *(Vérification : la colonne « Nature économique » était déjà cohérente — même registre `NATURE_ECO` (labels « CODE - Libellé ») côté tableau et côté filtre.)*

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - ajout de la fonction `activiteOf(op)` (clé + libellé « CODE - Libellé », normalise `activiteLib`/`activite`) ;
  - options du filtre `activite` construites via `activiteOf` (dédoublonnées, triées) ;
  - `renderSimpleRow` (colonne Activité), recherche texte libre globale et `applyFilters` consomment désormais `activiteOf` → même clé partout.

### Impact / Anti-régression

- **UI** : le filtre « Activité » montre « CODE - Libellé » comme la colonne ; **21 valeurs** au lieu de 14 (les opérations auparavant manquées apparaissent).
- **Filtrage** : la clé de match passe de `activiteLib` à la chaîne « CODE - Libellé » (cohérente entre option et opération) ; les opérations sans code restent listées par libellé (comme le tableau).
- **Données / Worker / DB** : ❌ aucun changement.
- **Vérifié (CDP)** : 33 lignes (pas de régression) ; options Activité avec code (`ACT_13001_001 - …`) ; cohérence confirmée.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Tableau PPM : tri + recherche texte libre par colonne (en-têtes)

> **Modif #101** — CR du 01/06/2026, points **P-2 et P-3**. Le DCF demande des filtres directement sur les en-têtes du tableau. Chaque colonne du tableau PPM (hors « Actions ») dispose désormais : (1) d'un **tri** ascendant/descendant au clic sur le titre (indicateur ▲/▼), et (2) d'un **champ de recherche en texte libre** (2ᵉ rangée d'en-tête). Le filtrage et le tri s'opèrent **côté DOM** (sans re-render de la page) → le focus de saisie est préservé. La recherche s'appuie sur le texte affiché (libellé complet via `title` si tronqué) : la colonne **Activité** montrant « CODE - Libellé », sa recherche porte bien sur le **code-activité** (P-3).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - état module `tableSort` / `tableColSearch` (persistés entre re-renders) ;
  - `renderSimpleTable()` : 2 rangées d'en-tête (titres triables + inputs de recherche), tri numérique pour la colonne Montant via `tr._op` ;
  - `applyTableView()` : applique recherches (ET logique inter-colonnes) + tri sur les `<tr>` ;
  - `resetFilters()` réinitialise aussi tri et recherches par colonne.

### Impact / Anti-régression

- **UI** : en-têtes triables + ligne de recherche ; le clic sur une ligne (→ fiche) et les boutons d'action restent inchangés.
- **Données / Worker / DB** : ❌ aucun changement (tout est client-side).
- **Vérifié (CDP, headless Chrome)** : 33 lignes, 7 inputs de recherche, recherche absurde → 0 ligne / vidée → 33, tri montant ascendant puis descendant corrects.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Filtre « Mode de passation » regroupé par famille

> **Modif #100** — CR du 01/06/2026, point **P-4**. Le filtre « Mode de passation » de la liste PPM présentait les 13 modes à plat. Ils sont désormais **regroupés en 4 familles** (en-têtes de groupe), à l'image de la typologie des types de marché : **Appel d'offres** (AOO, AOO préqualif, AOO 2 étapes) · **Procédures simplifiées** (PSD, PSC, PSL, PSO) · **Prestations intellectuelles** (PI) · **Procédures dérogatoires** (AOR, Gré à gré/Entente directe, CFN, Convention, Lettre de commande valant marché).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : ajout de `MODE_PASSATION_FAMILLES` + `buildGroupedModePassationOptions()` ; le filtre `modePassation` consomme désormais les options groupées.

### Impact / Anti-régression

- **UI** : affichage du filtre structuré en groupes ; tri/sélection inchangés.
- **Codes / barème / contractualisation** : **aucun changement** — on ne modifie pas le référentiel `MODE_PASSATION`, seulement la présentation dans le filtre. Tout mode non classé reste accessible sous « Autres ».
- *NB* : les sous-types détaillés évoqués au 01/06 (AO avec concours, 6 méthodes PI : SMC/SCBD/SFQC/SFQ/SQC, Reconduction) ne sont **pas encore dans le référentiel** — leur ajout touche le barème/la contractualisation et sera traité avec le référentiel des champs par mode (point C-11).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Statut « Suspendu » ajouté au référentiel des états

> **Modif #99** — CR du 01/06/2026, point **P-7** (et préparation de P-6). Ajout du statut **« Suspendu »** au référentiel des états du marché : il apparaît désormais dans le **filtre « Statut du marché »** de la liste PPM et dispose de son **libellé Marché+**. L'action « Voir » route un marché suspendu vers sa **fiche de vie** (consultation/édition — point P-6). Le positionnement effectif du statut SUSPENDU sera câblé avec le bloc « difficultés » (points E-2/E-3, section C).

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : `ETAT_MARCHE` += `{ "code": "SUSPENDU", "label": "Suspendu", "color": "warning" }`.
- `sidcf-portal/js/modules/marche-plus/etat-labels-mp.js` : `ETAT_LABEL_MP.SUSPENDU = 'Suspendu'`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : `getRouteForEtape('SUSPENDU')` → fiche de vie.

### Impact / Anti-régression

- **UI** : un état de plus dans le filtre « Statut du marché » ; libellé homogène partout.
- **Cache** : les référentiels sont lus depuis `registries.json` à chaque session (le cache `localStorage` `sidcf_registries` n'est écrit que par une action admin `updateRegistry`, absente en usage normal). Si un poste a un cache obsolète, vider `sidcf_registries`.
- **DB / Worker** : ❌ aucun changement.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Statut du marché : « Approuvé » → « Attribué/Approuvé »

> **Modif #98** — CR du 01/06/2026, point **P-5**. Le client rejette le statut « Approuvé » seul : un marché enregistré est **d'office attribué ET approuvé / visé CF**. Le libellé de l'état `VISE` passe donc de **« Approuvé »** à **« Attribué/Approuvé »**.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/etat-labels-mp.js` : `ETAT_LABEL_MP.VISE = 'Attribué/Approuvé'` (source unique de vérité, utilisée par badges, modal détail, liste, fiche de vie — 26 points d'usage).

### Impact / Anti-régression

- **UI** : tous les affichages de l'état `VISE` montrent désormais « Attribué/Approuvé ».
- **Code / DB** : le **code d'état `VISE` est inchangé** en base et dans la logique → aucune régression fonctionnelle, seul le libellé évolue.
- *NB* : le statut `APPROUVE` du widget OP/mandat (`op-mandat-manager-mp.js`) relève du workflow d'engagement (OP), **non concerné**, laissé tel quel.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-06-03 — Liste PPM : 6e carte KPI « Résilié »

> **Modif #97** — CR « OBSERVATIONS SUR LES ECRANS » du 01/06/2026, point **P-1**. Le total planifié affiché (33) ne correspondait pas à la somme des cartes KPI (7+4+10+7+4 = 32) : les marchés au statut **RESILIE** n'étaient comptés dans aucune carte de phase. Ajout d'une **6e carte « Résilié »** (états `['RESILIE']`) → couverture complète des états « cycle de vie », somme des cartes = total.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : ajout d'une entrée à `PHASES` (`key:'resilie'`, icône ⛔, couleur `#dc3545`).

### Impact / Anti-régression

- **UI** : une carte KPI supplémentaire sur la rangée des phases.
- **Donnée / Worker / DB** : ❌ aucun changement (calcul KPI local).
- *NB* : le statut INFRUCTUEUX reste hors-carte (aucune opération concernée dans le jeu courant) — à rebucketiser si besoin ultérieur.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-05-29 — Bloc dérogation : retrait du « Demandeur » + bailleur en liste déroulante

> **Modif #96** — Écran Procédure (`ecr02a`), bloc « Dérogation au barème » : le champ **« Demandeur de la dérogation » est retiré** (sans objet). On conserve les deux selects **« Source de la dérogation » (État / Bailleur)** et **« Bailleur concerné »**, mais ce dernier devient une **liste déroulante** : les bailleurs **déclarés au PPM sont mis en évidence** (groupe « ★ Bailleurs du marché (planifiés) »), avec extension possible aux autres bailleurs (« Autres bailleurs »). Plus de saisie libre.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - suppression du champ « Demandeur » (UI, état, `derogationState`, persistance `procDerogation.demandeur`) ;
  - « Bailleur concerné » : `<select>` avec `<optgroup>` — déclarés au PPM en tête (mis en évidence), puis les autres bailleurs externes ; sélection posée via `.value` (évite le bug `el()`/attribut `selected`) ;
  - intro reformulée (« indiquez la source »).

### Impact / Anti-régression

- **UI** : un champ en moins (Demandeur) ; bailleur désormais choisi dans une liste (plus de saisie libre).
- **Persistance** : `procDerogation.source.{type,bailleur}` **inchangée** → pas de régression. Le champ `demandeur` n'est plus écrit (la fiche de vie l'affiche de façon conditionnelle : rien pour les nouvelles dérogations, conservé pour les anciennes).
- **Worker / DB** : ❌ aucun changement.
- Vérifié (CDP) : Demandeur absent ; Source État/Bailleur présent ; « Bailleur concerné » = liste (groupe « ★ planifiés » si déclarés, sinon liste complète).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-05-29 — Timeline : étape « Procédure » → « Contractualisation »

> **Modif #95** — Dans la timeline (frise des étapes, ex. écran Procédure), la 2ᵉ étape s'affichait « Procédure » pour PSC/PSL/PSO/AOO/PI, alors que le bandeau, le titre et le badge disent « Contractualisation ». Harmonisé en **« Contractualisation »** pour tous les modes.

### Fichiers touchés

- `sidcf-portal/js/lib/phase-helper-mp.js` :
  - `DEFAULT_PHASE_CONFIG` : `PROCEDURE.titre` « Procédure » → « Contractualisation » (5 modes ; PSD l'était déjà) ;
  - `fetchPhasesFromAPI` : la phase `PROCEDURE` est forcée à « Contractualisation » quel que soit le libellé stocké en base (même mécanisme que VISA_CF → Approbation et ATTRIBUTION → Enregistrement de marché).

### Impact / Anti-régression

- **UI** : timeline cohérente — Planification · **Contractualisation** · Enregistrement de marché · Exécution · Clôture. Sous-titres et codes techniques (`PROCEDURE`) inchangés. *(Le sous-titre de l'étape Enregistrement n'est pas modifié, sur demande.)*
- **Worker / DB** : ❌ aucun changement.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-05-29 — « Voir » sur un dossier EN PLANIFICATION → édition de la ligne PPM

> **Modif #94** — Sur la liste PPM, le bouton « Voir » d'un dossier **EN PLANIFICATION** ouvrait la fiche de vie. Il ouvre désormais l'écran **« Ligne PPM » (ecr01d) en mode édition pré-rempli** : l'utilisateur consulte/modifie les aspects de planification de l'opération et enregistre les modifications.

### Périmètre fonctionnel

| Élément | Application |
|---|---|
| Routage « Voir » (PLANIFIE) | `getRouteForEtape('PLANIFIE')` → `/mp/ppm-create-line` (au lieu de `/mp/fiche-marche`), avec `idOperation`. |
| Mode édition de `ecr01d` | Si `params.idOperation` : chargement de l'opération, **pré-remplissage** de tous les champs (activité + cascade UA/Programme/Section, nature économique, objet, type, mode, montant formaté, bailleurs/financements, durée, catégorie, bénéficiaire, livrables, localisation), titre « Planification — Ligne PPM », bouton unique « 💾 Enregistrer les modifications ». |
| Enregistrement | `handleSave` met à jour l'opération existante (`dataService.update`) en **préservant** id, état (PLANIFIE), timeline et date de création ; re-fige le mode planifié et recalcule la dérogation. |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : `getRouteForEtape('PLANIFIE')` → `/mp/ppm-create-line`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` :
  - détection `isEdit` (chargement de l'op via `params.idOperation`) ;
  - titre / sous-titre / boutons conditionnels ;
  - branche `update` dans `handleSave` ;
  - fonction `prefillEditForm(op)` (post-init des widgets) ;
  - nouvelle API `__setEntries` sur les lignes de financement (reconstruction depuis `financements[]`).

### Impact / Anti-régression

- **UI** : « Voir » sur PLANIFIE = édition de la ligne PPM ; le mode création (sans `idOperation`) est **inchangé**.
- **Worker / DB / R2** : ❌ aucun changement (update sur entité existante).
- Vérifié (CDP) : pré-remplissage complet sur `TEST-PLANIF` (activité, montant, mode, nature, bailleur, etc.).

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ Auto-déploiement Vercel

---

## 2026-05-29 — Lot 6 (6.c) : « Attribution » → « Enregistrement de marché » sur les timelines de la fiche

> **Modif #92** — Complément de la Modif #90 : les deux timelines de la fiche de vie (grande frise + barre de chips « SUIVI DU PROCESSUS ») affichaient encore « Attribution ». Ces libellés viennent de la config de phases (`phase-helper-mp.js` → `/api/config/phases`, table `phase_config`), pas de `steps-mp`. Le libellé est désormais forcé côté UI à « Enregistrement de marché » (même mécanisme que `VISA_CF → Approbation`).

### Fichiers touchés

- `sidcf-portal/js/lib/phase-helper-mp.js` :
  - `fetchPhasesFromAPI` force `ATTRIBUTION → titre « Enregistrement de marché »` / sous-titre « Attributaire & garanties » quel que soit le libellé stocké en base ;
  - `DEFAULT_PHASE_CONFIG` (fallback) mis à jour de même.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` : phrase d'aide multi-lots alignée.

### Impact / Anti-régression

- **UI** : les deux timelines de la fiche affichent « Enregistrement de marché » (vérifié). Codes techniques (`ATTRIBUTION`) inchangés.
- **Worker / DB** : ❌ aucun changement (override UI, pas de migration `phase_config` — cohérent avec le traitement de VISA_CF).

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-05-29 — Liste PPM : toutes les colonnes visibles (sans scroll horizontal)

> **Modif #93** — Le tableau des marchés débordait (colonnes Statut/Actions coupées, défilement horizontal). Refonte en `table-layout: fixed` + largeurs proportionnelles (∑ = 100 %) + en-têtes autorisés à passer sur plusieurs lignes (notamment « Montant prévisionnel (M F CFA) » et « Statut du marché »).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : `renderSimpleTable` — conteneur `width:100%` (plus d'`overflowX`), table `width:100%; table-layout:fixed`, 8 colonnes en pourcentages, en-têtes `white-space:normal` (override du `nowrap` global `.data-table th`).

### Impact / Anti-régression

- **UI** : les 8 colonnes (jusqu'à Statut + Actions) sont visibles sans défilement ; les libellés longs s'affichent sur plusieurs lignes ; le contenu des cellules s'enroule (table-layout fixe).
- **Worker / DB** : ❌ aucun changement.

### Déploiement : ✅ auto-déploiement Vercel

---

## 2026-05-29 — Migration 030 : cohérence des données de démo

> **Migration 030** (`postgres/migrations/030_mp_coherence_donnees_demo.sql`) — Passe de cohérence sur les données Neon pour une démo propre : nature économique alimentée et cohérente, opérations « clones » incohérentes recadrées, et ajout d'un cas de dérogation visible à la Contractualisation.

### Contenu

| # | Action | Détail |
|---|---|---|
| 1 | **Nature économique cohérente** (32→33 ops) | `chaine_budgetaire.natureCode` + `.nature` recalés sur le type de marché : TRAVAUX→231, FOURNITURES→232, SERVICES_INTELLECTUELS/PI→233, SERVICES_COURANTS→221, SERVICES→223 (raffinement maintenance/réparation/nettoyage→222). **Sans impact barème** : pour ADMIN_CENTRALE les seuils sont `['all']` (mode piloté par le montant seul) → scénarios conforme/dérogation préservés. |
| 2 | **Recadrage de 4 clones à cascade incohérente** | 4 opérations dont l'état devançait les données (entités de stades antérieurs manquantes) remises à **PLANIFIE** + suppression des entités aval orphelines (procédure/attribution/visa/OS…). Garantit « toutes les étapes précédentes alimentées ». |
| 3 | **Cas de dérogation à la Contractualisation** | Nouvelle op `…190000000099` — *TEST-EN_PROC-DEROG* (FOURNITURES, 8 M, mode **AOO** alors que le barème recommande **PSD**), état **EN_PROC** + sa procédure. Sur l'écran Procédure, le bloc « Dérogation au barème — justification requise » s'affiche → démontre le parcours dérogation. |

### Lien avec le code

- Complète **Modif #91** (lecture de la nature économique depuis `chaineBudgetaire.natureCode`). Ensemble : la colonne « Nature économique » est désormais renseignée et cohérente pour les 33 opérations.

### Application

- ✅ **Appliquée sur Neon** via `node postgres/migrations/run-any.js 030_mp_coherence_donnees_demo.sql`.
- Donnée live (lue directement par le front) → visible immédiatement, sans redéploiement.
- Vérifié : 33 ops, 0 sans natureCode ; cas dérogation EN_PROC/AOO/8M opérationnel ; 4 clones en PLANIFIE.

---

## 2026-05-29 — Liste PPM : nature économique alimentée (fallback natureCode)

> **Modif #91** — La colonne et le filtre « Nature économique » affichaient « - » : le champ `operation.natureEco` n'est jamais alimenté ; la nature réelle vit dans `operation.chaineBudgetaire.natureCode`. L'affichage et le filtre lisent désormais `natureEco` puis, à défaut, `chaineBudgetaire.natureCode`.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : lecture de la nature économique (affichage `renderSimpleRow` + filtre `applyFilters`) avec fallback sur `chaineBudgetaire.natureCode`.

### Impact / Anti-régression

- **UI** : la colonne « Nature économique » est désormais renseignée pour toutes les opérations disposant d'un `natureCode` (les 17 ops TEST). Le filtre matche sur la même valeur effective.
- **Worker / DB / R2** : ❌ aucun changement (les clones sans `natureCode` seront backfillés par la migration 030).

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ **Auto-déploiement Vercel au push**

---

## 2026-05-29 — Lot 6 (CR 6.c) : renommage de l'étape « Attribution » → « Enregistrement de marché »

> **Modif #90** — Point 6.c du CR 26 mai 2026 : l'étape « Attribution » est renommée **« Enregistrement de marché »**, et l'en-tête de l'écran (auparavant « Attribution — Attribution du marché & Garanties », redondant et trop gros) est allégé. Les **codes techniques** (`ATTRIBUTION`, `ATTRIBUE`, routes `/mp/attribution`) restent inchangés.

### Périmètre fonctionnel

| Emplacement | Avant | Après |
|---|---|---|
| En-tête écran (`ecr03a`) | « ✅ Attribution — Attribution du marché & Garanties » | « ✅ Enregistrement de marché — Attributaire, montant & garanties » |
| Breadcrumb « Vous êtes ici · Étape » | Attribution | Enregistrement de marché |
| Timeline (`steps-mp`) | Attribution | Enregistrement de marché |
| Bouton « passer à l'étape suivante » (`next-phase-button-mp`) | Attribution | Enregistrement de marché |
| Accordéon fiche de vie (`ecr01c`) | « 🤝 3. Attribution » | « 🤝 3. Enregistrement de marché » |
| Titre Mode Spécification | Écran Attribution du marché (étape 3) | Écran Enregistrement de marché (étape 3) |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` (en-tête + spec)
- `sidcf-portal/js/ui/widgets/steps-mp.js` (libellé timeline)
- `sidcf-portal/js/ui/widgets/next-phase-button-mp.js` (libellé transition)
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (titre accordéon)

### Impact / Anti-régression

- **UI** : libellés uniquement. Aucun code technique, route, état ou clé de données modifié → zéro régression fonctionnelle.
- **Worker / DB / R2** : ❌ aucun changement.

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Lot 6-C (CR 6.b) : avance de démarrage (toggle + flag)

> **Modif #89** — Écran d'enregistrement (`ecr03a`) : case « Avance de démarrage prévue » dans la section « Informations sur le marché approuvé ». Conformément à l'arbitrage retenu : **toggle + flag uniquement** ; le calibrage effectif du « Décompte 00 » sera honoré à l'étape Exécution.

### Périmètre fonctionnel

| Élément | Application |
|---|---|
| Avance de démarrage OUI/NON | Case `attr-avance-demarrage`, persistée dans `MP_ATTRIBUTION.avanceDemarrage`. Mention : « le premier décompte sera calibré en Décompte 00 lors de l'exécution ». |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` : case dans `renderInfosMarcheSection`, collecte + persistance dans `handleSave` (`avanceDemarrage`).

### Impact

- **UI** : nouvelle case. **Worker / DB / R2** : ❌ aucun (flag dans JSONB `MP_ATTRIBUTION`).
- **Reste à faire (6-C)** : calibrage « Décompte 00 » côté module Exécution (consommera ce flag).

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Lot 6-A (CR 6.b) : rappel + ajustement des livrables

> **Modif #88** — Écran d'enregistrement (`ecr03a`) : section « Livrables du marché » qui **rappelle** les livrables saisis à la planification (`operation.livrables`) et permet de les **ajuster** (réutilisation du widget `renderLivrableManagerMP` de la création PPM). Conforme à la décision : pas de nouvelle capture géographique, simple rappel + ajustement.

### Périmètre fonctionnel

| Élément | Application |
|---|---|
| Rappel + ajustement des livrables | Nouvelle section, widget pré-rempli avec `operation.livrables`. Les ajustements sont persistés dans `operation.livrables` à l'enregistrement (uniquement si le widget a été initialisé — garde anti-écrasement). |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` :
  - import `renderLivrableManagerMP` ; section `renderLivrablesSection()` ; init dans `initializeWidgets` (états `_livrablesState` / `_livrablesInitialized`) ; persistance dans le patch opération de `handleSave`.

### Correction (anti-régression)

- **Select « durée (unité) »** (Modif #86) : `el()` posait `selected` en attribut sur les deux `<option>` → la dernière (Jours) l'emportait. Sélection désormais via `.value` → défaut **Mois** correct.

### Impact

- **UI** : livrables consultables et ajustables à l'enregistrement.
- **Worker / DB / R2** : ❌ aucun changement (livrables déjà dans `MP_OPERATION.livrables`, JSONB).

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Lot 6-B (CR 6.b) : contrôle d'écart du montant approuvé

> **Modif #87** — Écran d'enregistrement (`ecr03a`) : contrôle entre le **montant du marché approuvé** saisi et le **montant attribué à la contractualisation** (référence = `operation.montantPrevisionnel`). Alerte **non bloquante** affichée en cas d'écart.

### Périmètre fonctionnel

| Élément | Application |
|---|---|
| Contrôle d'écart + alerte | À chaque saisie du montant, comparaison avec la référence. Si écart ≥ 1 XOF : bandeau d'avertissement (montant approuvé vs référence, écart en valeur et en %), couleur rouge si hausse / orange si baisse. **Non bloquant** (le save reste possible). Masqué si les montants coïncident. |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` :
  - `renderMontantsSection` reçoit `montantRef` → conteneur `#montant-ecart-alert` + input caché `#attr-montant-ref` ;
  - `calculerMontants` calcule et affiche l'écart à chaque recalcul.

### Impact / Anti-régression

- **UI** : avertissement live, non bloquant. Aucun impact si pas d'écart.
- **Worker / DB / R2** : ❌ aucun changement.
- *À valider :* la référence retenue est `montantPrevisionnel` (PPM) ; à ajuster si le « montant attribué à la contractualisation » doit provenir d'une autre source.

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Lot 6-A (CR 6.b) : Informations sur le marché approuvé

> **Modif #86** — Premier lot du point 6 (CR 26 mai 2026) sur l'écran d'enregistrement (`ecr03a`). Ajoute la section « Informations sur le marché approuvé » : **N° du marché approuvé**, **exonération de TVA** (pilote le taux TVA) et **durée contractuelle**. (6.c renommage et 6.d COJO/COPE volontairement exclus : 6.d est déjà traité à l'étape Procédure ; 6.c reporté.)

### Périmètre fonctionnel

| Élément | Application |
|---|---|
| **N° du marché approuvé** | Champ texte `attr-numero-marche`, persisté dans `MP_ATTRIBUTION.numeroMarcheApprouve`. |
| **Exonéré OUI/NON → TVA** | Case « Marché exonéré de TVA ». Si cochée → le taux TVA est forcé à **0 %** et le champ verrouillé ; la TVA du montant devient nulle. Persisté dans `MP_ATTRIBUTION.exonereTVA`. |
| **Durée contractuelle** | Saisie valeur + unité (Mois/Jours), persistée dans `MP_ATTRIBUTION.dates.delaiExecution` / `delaiUnite` (auparavant figés à 0/MOIS). Pré-remplissage depuis la durée existante ou `operation.dureePrevisionnelle`. |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` :
  - nouvelle section `renderInfosMarcheSection(existingAttr, operation)` insérée entre Attributaire et Montant ;
  - `toggleExonerationTVA(checked)` (force taux 0 / restaure) ;
  - `renderMontantsSection` reçoit `exonereTVA` (taux initial 0 + verrouillé si exonéré) ;
  - `handleSave` collecte et persiste `numeroMarcheApprouve`, `exonereTVA`, durée (`delaiExecution`/`delaiUnite`) ;
  - synchro post-montage des montants (recalcul avec taux 0 si exonération préchargée).

### Corrections de fond (anti-régression)

- **`calculerMontants`** : `parseFloat(taux) || 18` transformait un taux **0** (exonération) en 18. Remplacé par `Number.isFinite()` pour honorer 0. Comportement inchangé pour taux 18 ou champ vide.
- **Champ taux désactivé** : `el()` fait `setAttribute('disabled', value)` → `disabled:false` désactivait à tort le champ. Le `disabled` est désormais posé **en propriété** (`inp.disabled = exonereTVA`).

### Impact

- **UI** : nouvelle section d'enregistrement ; exonération pilote la TVA en direct.
- **Worker / DB / R2** : ❌ aucun changement. Les nouveaux champs vivent dans les colonnes JSONB de `MP_ATTRIBUTION` — **pas de migration**.

### Action de déploiement

- ❌ Pas de migration SQL · ❌ Pas de `wrangler deploy` · ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Lot : retrait du champ « Nombre d'offres classées »

> **Modif #85** — Retour client (29 mai 2026) : dans la saisie d'un lot (écran Procédure), le champ **« Nombre d'offres classées »** n'est pas utile et doit être retiré. Le champ « Nombre d'offres reçues » est conservé.

### Périmètre fonctionnel

| Demande | Application |
|---|---|
| Retirer « Nombre d'offres classées » de la saisie d'un lot | Champ supprimé de l'UI du widget `lots-procedure-mp`. La donnée `nbOffresClassees` est **préservée en base** : `normalizeLot` spread `rawLot` et conserve la valeur existante dans l'état du lot, donc aucune valeur n'est écrasée. |

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/lots-procedure-mp.js` : retrait du champ de saisie « Nombre d'offres classées » (UI seulement).

### Impact

- **UI** : la carte de lot n'affiche plus que « Nombre d'offres reçues ».
- **Worker / DB / R2** : ❌ aucun changement. `nbOffresClassees` reste dans le modèle et est préservé.

### Anti-régression

- **Donnée préservée** : `normalizeLot` conserve `nbOffresClassees` (lecture toujours possible) ; les lots existants ne perdent pas la valeur.
- **Lecture aval** : aucun écran ne dépend de l'édition de ce champ (vérifié par grep : usages limités au widget et à l'init de `ecr02a`).
- Vérifié par test visuel headless (PSC) : seul « Nombre d'offres reçues » subsiste.

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Lot 5 (CR 26 mai) point 5.c : libellé de lot « Objet / Libellé »

> **Modif #84** — Lot 5 du CR EHOUMAN du 26 mai 2026, point **5.c** (partiel) : alignement du libellé du champ de lot sur **« Objet / Libellé »**, par cohérence avec le renommage de la colonne du tableau PPM (Lot 2, point 2.c). Les points **5.a** (PSD sans lots) sont déjà couverts depuis le 06/05 ; le point **5.b** (champs de lot adaptés au mode de passation) reste à traiter, lié au référentiel par mode (cf. 4.b différé).

### Périmètre fonctionnel

| # CR | Demande | Application |
|---|---|---|
| **5.c** | Définir un libellé de lot pour les marchés multi-lots ; maintenir toutes les variables pour les lots uniques | Le label du champ de lot passe de « Libellé du lot » à **« Objet / Libellé du lot »**. Comportement inchangé : pour un lot unique, le champ prend par défaut le nom du marché ; pour un marché multi-lots, il se définit par lot. Le lot unique conserve l'ensemble des champs (offres, dates, PVs). |

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/lots-procedure-mp.js` : libellé du champ de lot renommé « Objet / Libellé du lot ».

### Impact

- **UI** : libellé du champ de lot harmonisé. Aucun changement de donnée (les clés `libelle` / `objet` du lot sont inchangées).
- **Worker / DB / R2** : ❌ aucun changement.

### Reste à faire (Lot 5)

- **5.b** — Champs de lot adaptés au mode de passation retenu : non implémenté. Le widget affiche un jeu de champs fixe quel que soit le mode et ne reçoit pas le mode en paramètre. Chantier à cadrer avec le référentiel des variables par mode (pendant « lots » du point 4.b différé).

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Source de financement dépendante du Type financement (filtres liste PPM)

> **Modif #83** — Retour client (29 mai 2026) sur la zone de filtres de la liste PPM (`ecr01b`) : le filtre « Source de financement » doit dépendre du « Type financement » sélectionné. Quand on prend **ÉTAT**, la seule source possible devient **TRÉSOR** ; quand on prend **DON** ou **EMPRUNT**, on voit tous les bailleurs **hors TRÉSOR**.

### Périmètre fonctionnel

| Type financement sélectionné | Sources de financement proposées |
|---|---|
| **ÉTAT** | **Trésor Public (CI)** uniquement (bailleur `typeFinancement === 'ETAT'`) |
| **DON** et/ou **EMPRUNT** | Tous les bailleurs externes (`typeFinancement === 'EXTERNE'`), Trésor exclu |
| ÉTAT **+** (DON ou EMPRUNT) | Union : Trésor **et** bailleurs externes |
| Aucun type sélectionné | Toutes les sources (comportement par défaut inchangé) |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - nouveau helper `getSourceFinancementOptions(registries)` : filtre `registries.BAILLEUR` selon `activeFilters.typeFinancement`, en s'appuyant sur le champ `typeFinancement` du référentiel (`'ETAT'` pour le Trésor, `'EXTERNE'` pour les bailleurs),
  - le filtre « Source de financement » utilise désormais ces options dynamiques (au lieu de `registries.BAILLEUR` brut),
  - **élagage** des sources sélectionnées devenues incompatibles, effectué **avant** `applyFilters` (évite un filtre fantôme qui viderait la liste et tout décalage d'un rendu).

### Impact

- **UI** : la liste déroulante « Source de financement » s'adapte au type de financement choisi. Le re-rendu est automatique (l'`onChange` des multi-sélecteurs rappelle `renderPPMList`).
- **Worker / DB / R2** : ❌ aucun changement. Le champ `typeFinancement` du référentiel `BAILLEUR` était déjà présent ; aucune migration.

### Anti-régression

- **Sans type financement sélectionné** : toutes les sources restent proposées (aucune restriction surprise).
- **Sélection incompatible** (ex : Trésor coché puis bascule sur DON) : la source invalide est silencieusement retirée d'`activeFilters.bailleur` avant le filtrage des résultats — pas de liste vide inexpliquée.
- **Clé interne `bailleur`** : inchangée (pas de migration DB ; cohérent avec Modif #76 lot 1, 1.d).
- Vérifié par test CDP (clic réel) : ÉTAT → `["Trésor Public (CI)"]` ; DON → 14 bailleurs externes, sans Trésor.

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Dropdown des filtres rogné par la carte (liste PPM)

> **Modif #82** — Retour client (29 mai 2026) sur la liste PPM (`ecr01b`, zone de filtres) : le panneau déroulant des multi-sélecteurs (Nature économique, Mode de passation…) était **coupé par les limites de la carte** des filtres. Il faut que le dropdown soit entièrement visible.

### Périmètre fonctionnel

| Demande | Application |
|---|---|
| Le dropdown ne doit plus être rogné dans sa zone | La carte des filtres passe en `overflow: visible`. Le panneau (`position:absolute`, `z-index:9999`) peut désormais déborder par-dessus le contenu situé en dessous (tableau Résultats) et s'afficher en entier. |

### Cause racine

- `.card { overflow: hidden }` (global, `css/components.css:10`) clippait le panneau absolu des widgets `multi-select-collapsible-mp`. Le correctif est **ciblé sur la seule carte des filtres** pour ne pas impacter les autres cartes de l'app (où `overflow:hidden` sert à clipper images/tableaux aux coins arrondis).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - `overflow: 'visible'` ajouté au style inline de la carte des filtres,
  - `.card-header` comptant sur l'`overflow:hidden` du parent pour arrondir ses coins hauts, rétablissement explicite de `borderTopLeftRadius` / `borderTopRightRadius: var(--radius-lg)` sur le header (sinon coins carrés).

### Impact

- **UI** : dropdowns de filtres pleinement visibles (débordent au-dessus du tableau). Aucun changement sur les autres cartes.
- **Worker / DB / R2** : ❌ aucun changement.

### Anti-régression

- **Coins arrondis de la carte des filtres** : préservés via le border-radius explicite du header (vérifié visuellement, pas de coin carré).
- **Autres cartes de l'app** : non touchées (`.card` global inchangé).
- Vérifié par test CDP (clic réel : dépli des filtres + ouverture du dropdown « Nature économique » → panneau entier visible par-dessus les résultats).

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Encart de recommandation du mode de passation réservé au Mode Spécification

> **Modif #81** — Retour client (29 mai 2026) sur l'écran de création PPM (`ecr01d`, section « Classification du marché ») : l'encart bleu de recommandation/diagnostic du mode de passation (qui pouvait changer de couleur et « alerter ») n'est **pas utile en mode utilisateur ordinaire**. Il doit rester réservé au **Mode Spécification** (`?spec=1`) destiné aux devs (cf. Modif #49).

### Périmètre fonctionnel

| Demande | Application |
|---|---|
| L'encart ne doit plus sortir en mode ordinaire | L'encart `#mode-passation-rec` est masqué (`display:none`) par défaut. Il n'est rendu visible qu'en Mode Spécification via `isSpecMode()` (`lib/spec-mode-mp.js`). |
| Le garder en mode développeur | En `?spec=1`, l'encart réapparaît normalement (avec ses états 1→4 et le tableau des tranches), aux côtés de la bannière violette « MODE SPÉCIFICATION ACTIF ». |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` :
  - import de `isSpecMode` depuis `lib/spec-mode-mp.js`,
  - `display: isSpecMode() ? 'block' : 'none'` posé dès la création de l'élément `#mode-passation-rec` (évite tout flash du texte par défaut),
  - resynchronisation du `display` en tête de `refreshModePassationRec()` à chaque rafraîchissement.

### Impact

- **UI** : écran de création PPM épuré en mode ordinaire (plus d'encart sous « Mode de passation »). Encart toujours disponible aux devs via `?spec=1`.
- **Worker / DB / R2** : ❌ aucun changement.

### Anti-régression

- **Auto-pré-sélection du mode recommandé** (état 4 de `refreshModePassationRec`) : **préservée** — la fonction continue de calculer la suggestion, seul l'affichage de la box est conditionné.
- **Mode Spécification** : comportement inchangé, l'encart s'affiche comme avant en `?spec=1`.
- Vérifié par test visuel headless (mode ordinaire = encart masqué ; `?spec=1` = encart visible).

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel**

---

## 2026-05-29 — Mode de passation figé à la contractualisation

> **Modif #80** — Retour client (29 mai 2026) sur l'écran Procédure (`ecr02a`) : le mode de passation **ne doit plus être sélectionnable** à la contractualisation. Le mode est figé sur la planification ; la dérogation se déduit désormais de l'écart **barème ↔ planification** (et non plus d'un choix de l'utilisateur, qui n'existe plus à cette étape).

### Périmètre fonctionnel

| Demande | Application |
|---|---|
| Ne plus permettre de sélectionner le mode de passation ici | Suppression de la carte « Mode de passation » et de son dropdown (fonction `createModeSelect` retirée). L'information du mode reste portée par le bandeau **📌 « Mode de passation planifiée »** déjà présent juste au-dessus — pas de doublon. |
| Si incohérence barème / planification → exiger systématiquement les éléments de dérogation | `selectedMode` est désormais figé sur `modePassationPlanifie` (fallback `modePassation` pour les opérations antérieures). L'encart de dérogation se déclenche dès que ce mode n'est pas dans les procédures admissibles : <ul><li>**mode conforme** → encart vert « Mode conforme au barème — aucune action supplémentaire requise »</li><li>**mode hors barème** → bloc orange « Dérogation au barème — justification requise » (demandeur, source, pièce, motif)</li></ul> |

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - `selectedMode` initialisé sur `modePlanifieCode` (mode planifié figé) au lieu de `operation.modePassation`,
  - suppression de la carte « Mode de passation » + dropdown (et de la fonction `createModeSelect`, devenue morte),
  - `updateDerogationAlertLocal` simplifiée : la notion de « changement de mode » (mode retenu ≠ mode planifié) devenant impossible, ses branches d'affichage ont été retirées (encart vert simplifié, alerte « mode planifié → mode retenu » supprimée, texte de l'encart dérogation reformulé pour viser « le mode de passation planifié »).

### Impact

- **UI** : écran Procédure allégé (un encart en moins) ; le mode n'est plus modifiable, la dérogation apparaît automatiquement en cas d'inadéquation.
- **Worker** : ❌ aucun changement.
- **DB Neon** : ❌ aucun changement de schéma.
- **R2** : ❌ aucun changement.

### Anti-régression

- **Opérations sans `modePassationPlanifie`** (antérieures à la Modif #79) : `modePlanifieCode` retombe sur `operation.modePassation` — le mode affiché et la logique de dérogation restent cohérents.
- **`handleSave`** : inchangé ; il reçoit toujours `selectedMode` (désormais = mode planifié) et calcule `isDerogation` sur la même base que l'affichage.
- **Champs de dérogation** (demandeur, source, pièce, motif) et **check sanction REJET (4.i)** : non touchés.
- Vérifié par grep : plus aucune référence à `createModeSelect` ni à `isChanged`. Test visuel headless OK (cas conforme PSC 15M + cas dérogation AOO/PSD).

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel** pour exposer le changement

---

## 2026-05-28 — Lot 4 CR du 26 mai 2026 : Contractualisation (modes, dérogation, devis)

> **Modif #79** — Quatrième lot d'ajustements du CR EHOUMAN du 26 mai 2026, section « 4. Contractualisation ». Traite 11 des 12 retours (le 4.b « variables associées aux modes de passation » est laissé pour une séance dédiée à la demande du client). Touche le référentiel des modes, le moteur de règles, l'écran de contractualisation, la création PPM et la fiche de vie.

### Périmètre fonctionnel

| # CR | Demande | Application |
|---|---|---|
| **4.a** | Ajouter CFN (conforme à une Demande de Cotation), Convention, Lettre de commande valant marché | Trois nouveaux modes dans `registries.MODE_PASSATION` : `CFN` (famille SIMPLIFIEE), `CONVENTION` et `LETTRE_COMMANDE_MARCHE` (famille DEROGATOIRE). Tous avec référence « CR DCF 26 mai 2026 ». |
| **4.b** | Variables/documentation par mode | **Laissé en attente** sur demande du client (« on reparlera de 4b »). À traiter dans une séance dédiée. |
| **4.c** | Types parents/enfants pris en compte | Adaptation de `RulesEngine` (`getSuggestedProcedures` + `checkProcedure`) : matching en cascade **exact → mapping legacy ↔ nouveau → code famille parent (A/B/C)**. Permet de matcher la matrice ADMIN_CENTRALE quel que soit le code stocké sur l'opération. Aucune modification de `rules-config.json` (option B recommandée). |
| **4.d** | Indiquer demandeur + source de dérogation | Nouveaux champs dans le bloc dérogation : <ul><li>**Demandeur** (select : DCF / DGMP / Chargé d'études / Autre — avec champ texte si « Autre »)</li><li>**Source** (select : État / Bailleur)</li><li>**Bailleur concerné** : si Source = Bailleur, dropdown **restreint aux bailleurs déclarés à la création PPM** (lus depuis `operation.financements[].bailleur` ou `operation.bailleurs[]`). Si aucun bailleur n'a été déclaré, on autorise la saisie libre.</li></ul>Persistés dans `operation.procDerogation.demandeur`, `.demandeurAutre`, `.source.{type, bailleur}`. |
| **4.e** | « MODE DE PASSATION PLANIFIÉE » | Persistance d'un nouveau champ `operation.modePassationPlanifie` à la création PPM (`ecr01d`) — figé. Affichage d'un **bandeau bleu d'information** en haut de l'écran procédure (`ecr02a`) avec le code + libellé + mention « simple information ». Fallback sur `operation.modePassation` pour les opérations antérieures à la Modif #79. |
| **4.f** | Mode = planifié sans dérogation → rien ; sinon → exiger justification | Refonte de l'encart dérogation : <ul><li>**Mode conforme** → encart vert « Mode conforme — aucune action supplémentaire requise »</li><li>**Mode conforme mais différent du planifié** → encart vert « Mode confirmé (changement par rapport au planifié) » + détail des 2 codes</li><li>**Mode hors barème** → bloc orange « Dérogation au barème — justification requise » avec rappel du mode planifié si applicable + tous les champs de 4.d</li></ul> |
| **4.g** | Absence de pièce dérogative = warning non bloquant | Le save n'**alerte plus** et ne **bloque plus** quand le doc justificatif manque. Au lieu de ça, on persiste `operation.contractualisationWarnings.derogationPieceManquante = true` (4.h). |
| **4.h** | Notification sur la fiche de vie | Bandeau orange « ⚠️ Pièce justificative de dérogation manquante » en tête de la section « Contractualisation » de la fiche de vie (`ecr01c`) lorsque `contractualisationWarnings.derogationPieceManquante === true` (ou `procDerogation.pieceManquante`). Rappelle le demandeur et la source pour faciliter la régularisation. |
| **4.i** | Sanction sur attributaire = REJET | Dans `handleSave`, **avant** l'enregistrement de la procédure, on appelle `checkSanction({ raisonSociale })` sur le fournisseur (PSD/ENTENTE_DIRECTE) ou le fournisseur retenu (PSC). Si une sanction est trouvée → **alerte rouge « 🚫 REJET »** détaillant le type, le motif, et **save bloqué**. Le bandeau live existant reste affiché en parallèle pour le feedback à la saisie. |
| **4.j** | Renommage « devis » → « devis / facture proforma » | Tous les libellés utilisateur impactés : titre `📋 Validation du devis / facture proforma`, libellé `Référence devis / facture proforma`, `Date du devis / facture proforma`, `Document devis / facture proforma (PDF)`, `📋 Comparaison de devis / facture proforma`, ainsi que le message d'aide PSC et l'alerte de validation. **IDs techniques et noms de champs en base inchangés** (`refDevis`, `docDevis`, `dateDevis`, `proc-ref-devis`…) pour préserver les données existantes. |
| **4.k** | Retirer « Nombre de devis reçus » | Champ supprimé de l'UI PSC. **Donnée préservée en base** : si une procédure existante contient `nbDevisRecus`, la valeur est conservée au save via le merge avec `existingProcedure` (lecture toujours possible). |
| **4.l** | Retirer « Tableau comparatif » | Même traitement que 4.k. Donnée `tableauComparatif` préservée en base si déjà présente. |

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : +3 entrées dans `MODE_PASSATION` (CFN, CONVENTION, LETTRE_COMMANDE_MARCHE).
- `sidcf-portal/js/datastore/rules-engine.js` : constructor pré-calcule `_newToLegacy` et `_typeParent` ; nouvelle méthode `_typeMarcheMatches()` ; les 2 sites de matching `typeMarche` (checkProcedure + getSuggestedProcedures) l'utilisent désormais.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` : ajout `modePassationPlanifie` à la création.
- `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` :
  - lecture de `modePassationPlanifie`, `operationBailleurs` (financements/bailleurs déclarés),
  - état du formulaire dérogation enrichi (demandeur, demandeurAutre, sourceType, sourceBailleur),
  - bandeau « MODE DE PASSATION PLANIFIÉE »,
  - nouvelle closure `updateDerogationAlertLocal(mode)` qui remplace l'ancienne `updateDerogationAlert` externe (supprimée),
  - refonte `handleSave` : signature reçoit `derogationState`, ajout du check sanction REJET sur PSD/ENTENTE_DIRECTE et PSC, gestion non bloquante de la pièce, persistance `procDerogation.{demandeur, source, pieceManquante}` + `operation.contractualisationWarnings`,
  - libellés « devis » → « devis / facture proforma »,
  - retrait des champs PSC « Nb devis reçus » et « Tableau comparatif » (UI seulement).
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` : signature `renderContractualisationContent` reçoit `operation` ; bandeau « pièce justificative manquante » en tête de la section.

### Impact

- **UI** : écran de contractualisation enrichi (mode planifié, demandeur, source) + dédouanage des alertes (mode conforme = vert apaisant, dérogation = orange informatif). Fiche de vie : rappel visible de la pièce manquante.
- **Worker** : ❌ aucun changement.
- **DB Neon** : ❌ aucun changement de schéma. Les nouveaux champs (`modePassationPlanifie`, `procDerogation.*`, `contractualisationWarnings`) vivent dans les colonnes JSON existantes de `mp_operation`. Pas de migration.
- **R2** : ❌ aucun changement (l'upload du doc dérogation reste simulé comme avant).

### Anti-régression

- **Modes legacy** sur opérations existantes : continuent de fonctionner via `_typeMarcheMatches` (cascade exact → legacy → famille).
- **Champ `mode planifié` absent** sur les opérations créées avant Modif #79 : fallback explicite sur `operation.modePassation` (pas de bandeau vide).
- **Pièce dérogative manquante** : ne bloque plus le save (4.g) — comportement intentionnel selon CR. La trace passe par `contractualisationWarnings` + `procDerogation.pieceManquante` → visible sur la fiche de vie (4.h).
- **Champs PSC `nbDevisRecus` / `tableauComparatif`** : disparaissent de l'UI mais sont **préservés en base** via le merge avec `existingProcedure` (utilisation de `undefined` pour ne pas écraser).
- **`handleSave` signature changée** : seul appelant local (le bouton « Enregistrer & Continuer ») mis à jour en cohérence.
- **Fonction externe `updateDerogationAlert` supprimée** : aucune référence restante (vérifié par grep).
- **`renderContractualisationContent`** : signature étendue (paramètre `operation` ajouté) ; un seul appelant interne mis à jour.

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel** pour exposer les changements

### Reste à faire

- **4.b** — Variables/documentation associées à chaque mode : à traiter en séance dédiée (référentiel à construire avec la DCF, large impact sur la contextualité des écrans).
- **Lot 6 / 6.a** — Transition opérationnelle vers `INFRUCTUEUX` depuis l'écran d'enregistrement de marché, accompagnée de la brique transversale « mini-rapport d'étape ».

---

## 2026-05-28 — Lot 3 CR du 26 mai 2026 : création de marché + action Voir contextuelle

> **Modif #78** — Troisième lot d'ajustements du CR EHOUMAN du 26 mai 2026, section « 3. Création du marché ». Traite les 5 retours : neutralisation des alertes mode passation, séparateurs de milliers dans la saisie du montant, libellés mis à jour, action « Voir » contextuelle dans la liste PPM.

### Périmètre fonctionnel (5 retours validés OK ou À clarifier par EHOUMAN)

| # CR | Demande | Application |
|---|---|---|
| **3.a** | « Aucune alerte à ce stade sur l'adéquation du mode de passation ; ne pas signaler d'inadéquation. » | Refonte de `refreshModePassationRec` : les 3 variantes d'alerte (état 2 mode hors barème, état 3 aucune correspondance, état 4b mode divergent) sont remplacées par des encarts **informatifs neutres** (fond bleu pâle, icône 💡). Suppression des ⚠ et des formulations « dérogation nécessairement requise ». La **suggestion automatique** du mode recommandé et l'encart explicatif « pourquoi ce mode » sont **conservés**. Le bouton « Appliquer le mode recommandé » reste disponible (aide, pas obligation). **La logique métier `isDerogationPPM` au save reste inchangée** — la dérogation continue d'être enregistrée silencieusement sur l'opération et sera examinée à l'étape Procédure (cf. lot 4, points 4.d–4.g). |
| **3.b** | « Appliquer le séparateur de milliers dans les zones de saisie. » | Nouveau helper `setupThousandSeparator(input)` dans `lib/format.js` qui formate live au format fr-FR (espaces). Champ `montant-previsionnel` passé de `type="number"` à `type="text" inputmode="numeric"`. Toutes les lectures de cette valeur (handleSave, indicateur de couverture des bailleurs, suggestion mode passation, bandeau plafond ligne budgétaire) utilisent désormais `parseFormattedNumber(input)` qui tolère les séparateurs. Curseur préservé à la saisie. |
| **3.c** | Catégorie de prestation — ajouter « (à préciser : libellé et contenu) » | Label mis à jour. Mention indique au métier que le contenu du référentiel reste à arrêter avec la DCF. |
| **3.d** | « Informations techniques » → « Information technique prévisionnelle » | Titre de la `card-header` renommé. |
| **3.e** | « Ne pas ouvrir directement la fiche de vie ; donner accès à l'ensemble des informations utiles en fonction de l'étape. » | **Option 2 retenue** (navigation contextuelle directe). Le bouton « 👁️ Voir » de la liste PPM (`ecr01b-ppm-unitaire.js`) navigue désormais vers l'écran correspondant à l'étape courante du marché via le helper `getRouteForEtape(etat)` : <ul><li>PLANIFIE → `/mp/fiche-marche`</li><li>EN_PROC → `/mp/procedure`</li><li>ATTRIBUE → `/mp/attribution`</li><li>VISE → `/mp/visa-cf`</li><li>EN_EXEC, EXECUTION (legacy) → `/mp/execution`</li><li>CLOS, CLOTURE (legacy) → `/mp/cloture`</li><li>RESILIE → `/mp/cloture`</li><li>INFRUCTUEUX → `/mp/attribution` (écran d'enregistrement, lot 6)</li><li>fallback → `/mp/fiche-marche`</li></ul>Les boutons « 📋 Fiche de vie » et « ℹ️ Détails » sont conservés (accès direct à la vue globale et au modal résumé). Le clic sur la ligne entière reste sur la fiche de vie pour ne pas surprendre. |

### Fichiers touchés

- `sidcf-portal/js/lib/format.js` : ajout des helpers `setupThousandSeparator()` et `parseFormattedNumber()`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` :
  - import des helpers,
  - `<input id="montant-previsionnel">` passé en `type="text"` + `inputmode="numeric"`,
  - activation de `setupThousandSeparator()` après mount, avant `setupFinancementsMulti` (ordre d'attache),
  - 4 lectures de la valeur converties en `parseFormattedNumber()` (handleSave, refreshAll de l'indicateur, computeModeSuggestion, plafond ligne budgétaire),
  - label « Catégorie de prestation (à préciser : libellé et contenu) »,
  - titre « ⚙️ Information technique prévisionnelle »,
  - refonte des 3 variantes d'alerte de `refreshModePassationRec` (neutres, bleu pâle, sans ⚠ ni « dérogation requise »).
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` : nouvel helper `getRouteForEtape()` et navigation contextuelle du bouton « Voir » dans `renderSimpleRow`.

### Impact

- **UI** : moins d'effet d'alerte visuelle à la création (encarts bleus neutres au lieu de fond rouge). Saisie du montant plus lisible avec séparateurs. Action « Voir » plus utile en fonction du contexte.
- **Worker** : ❌ aucun changement.
- **DB Neon** : ❌ aucun changement. Le champ `montantPrevisionnel` est toujours stocké comme nombre (la conversion se fait à la lecture du DOM).
- **R2** : ❌ aucun changement.

### Anti-régression

- **Donnée stockée inchangée** : le nettoyage des séparateurs est effectué à la lecture du DOM dans toutes les fonctions concernées ; aucune valeur formatée ne part en base.
- **Logique de dérogation** : la fonction `isDerogationPPM` au save est conservée — l'opération continue d'être marquée comme dérogation si le mode choisi diverge du mode recommandé. Seul l'affichage d'alerte est neutralisé.
- **Bouton « Appliquer mode recommandé »** : conservé pour donner à l'utilisateur un moyen rapide de revenir à la recommandation sans le forcer.
- **Action « Voir » avec état inconnu** : fallback sur `/mp/fiche-marche` (vue d'ensemble), pas de 404.
- **Action « Voir » avec états legacy** (`EXECUTION`, `CLOTURE`) : mappés vers leurs écrans respectifs comme les états modernes (`EN_EXEC`, `CLOS`).
- **Position du curseur** : préservée à la saisie du montant (calculée en nombre de chiffres à gauche du curseur, pas en position de caractère brute).

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel** pour exposer les changements UI

---

## 2026-05-28 — Lot 2 CR du 26 mai 2026 : refonte du tableau PPM (colonnes + Nature économique)

> **Modif #77** — Deuxième lot d'ajustements issu du CR EHOUMAN du 26 mai 2026, section « 2. Tableau PPM (liste) ». Traite les 7 retours de cette section : renommages d'entêtes, refonte de la cellule Activité, ajout d'une colonne Nature économique, alignement de l'export CSV.

### Périmètre fonctionnel (7 retours validés OK par EHOUMAN)

| # CR | Demande | Application |
|---|---|---|
| 2.a | Colonne « Activité » → « Code activité » + « Libellé » | **Précision client** : une seule colonne « Activité », contenu reformulé en « *CODE - Libellé* » à l'intérieur de la cellule (lecture `chaineBudgetaire.activiteCode` + `activiteLib`). Largeur min portée à 220px et troncature ajustée à 40 caractères pour rester lisible avec le code en préfixe. |
| 2.b | Ajouter colonne « Nature économique » | Nouvelle colonne entre « Type de marché » et « Mode de passation ». Affiche le `label` du registre `NATURE_ECO` (qui contient déjà « *CODE - Libellé* », ex : « 223 - Achats de biens et services »). |
| 2.c | « Objet » → « Objet / Libellé » | Renommage de l'entête. |
| 2.d | « Type » → « Type de marché » | Renommage de l'entête + **retrait de `toTitleCaseFr()`** sur cette cellule. Avec la nouvelle typologie A/B/C (Modif #76), les libellés sont déjà bien formés (« Marchés de travaux ») ; le Title Case forçait « Marchés De Travaux » — corrigé. |
| 2.e | « Montant » → « Montant prévisionnel (M F CFA) » | Renommage de l'entête (unité conservée entre parenthèses, comme demandé). Format `moneyMillions()` inchangé. |
| 2.f | « Étape » → « Statut du marché » | Renommage de l'entête. Le badge affichait déjà « Infructueux » avec la couleur warning depuis la Modif #76 (lot 1, point 1.b) — pas de changement de logique nécessaire ici. |
| 2.g | Permettre de positionner le statut « Infructueux » | **Option α retenue** : le tableau **affiche** correctement INFRUCTUEUX (badge orange) ; la **transition opérationnelle** (action qui bascule l'état d'un marché vers INFRUCTUEUX) sera implémentée dans le **lot 6 (Enregistrement de marché)** au point 6.a, en cohérence avec la consigne client *« depuis attribution qui devient enregistrement de marché. ça peut être infructueux alors le process fini »*. Cette transition s'accompagnera de la brique transversale « mini-rapport d'étape » annoncée dans la Modif #76. |

### Export CSV

Aligné sur les nouveaux libellés du tableau (les valeurs restent les codes bruts pour l'exploitation en tableur) :

- « Objet » → « Objet / Libellé »
- « Type Marché » → « Type de marché »
- **Ajout « Nature économique »** (valeur = code brut `op.natureEco`)
- « Bailleur » → « Source de financement » (cohérence avec le lot 1)
- « État » → « Statut du marché »

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - `renderSimpleTable()` — refonte des `<th>` (7 entêtes mis à jour, 1 nouvelle entête « Nature économique »).
  - `renderSimpleRow()` — cellule Activité reformulée en « *CODE - Libellé* », nouvelle cellule Nature économique, retrait de `toTitleCaseFr` sur Type de marché, attributs `title` (tooltip) ajoutés pour Type et Nature économique.
  - `exportToCSV()` — entêtes alignés sur le tableau + ajout de la colonne Nature économique en position 5.

### Impact

- **UI** : 8 colonnes au lieu de 7 dans le tableau de la liste PPM. Largeur totale du tableau légèrement augmentée — le wrapper `overflow-x: auto` existant gère le scroll horizontal sans changement.
- **Worker** : ❌ aucun changement.
- **DB Neon** : ❌ aucun changement. Le champ `MP_OPERATION.natureEco` était déjà alimenté en planification.
- **R2** : ❌ aucun changement.

### Anti-régression

- Les opérations sans `chaineBudgetaire.activiteCode` ou sans `activiteLib` n'affichent que la partie disponible (ou `-` si les deux manquent) — pas de tiret orphelin.
- Les opérations sans `natureEco` affichent `-`.
- Les opérations avec un code `natureEco` hors du registre `NATURE_ECO` affichent le code brut (fallback, pas d'écran blanc).
- Le retrait de `toTitleCaseFr` sur la colonne Type ne casse pas l'affichage des anciens codes (TRAVAUX, FOURNITURES, …) car ils résolvent désormais leur nouveau libellé propre (« Marchés de travaux ») via les entrées `legacy` du référentiel (Modif #76).
- L'ordre et le nombre de colonnes du CSV changent — les éventuels scripts/macros externes qui consomment ce CSV doivent être prévenus.

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement frontend Vercel** pour exposer le nouveau tableau

---

## 2026-05-28 — Lot 1 CR du 26 mai 2026 : en-tête & filtres de la liste PPM/marchés

> **Modif #76** — Premier lot d'ajustements issu du CR de séance EHOUMAN du 26 mai 2026 (`Documentation/retours-meets-parcours-maquette/EHOUMAN -- CR_Flash_Marches_26mai2026_v2.docx`). Couvre les 5 retours de la section « 1. En-tête — zone de filtre (liste des PPM et marchés) ». Les lots suivants (2 à 6) traiteront le tableau, la création, la contractualisation, les lots et l'enregistrement de marché.

### Périmètre fonctionnel (5 retours, tous validés « OK » par EHOUMAN)

| # CR | Demande | Application |
|---|---|---|
| 1.a | Mettre en évidence l'ensemble des types de marché dans le filtre | Refonte du référentiel `TYPE_MARCHE` selon la typologie DCF (annexe du CR + fichier `Types Marches.xlsx`) : **3 familles A/B/C × 16 types**. Le widget de filtre affiche désormais une **hiérarchie** avec entêtes A/B/C non sélectionnables et types cochables en dessous. |
| 1.b | Ajouter l'état « Infructueux » | Nouvel état `INFRUCTUEUX` (couleur orange `warning`) dans `ETAT_MARCHE` + dans `etat-labels-mp.js`. Pour ce lot, seule l'**apparition dans le filtre et le référentiel** est livrée — la transition opérationnelle (depuis l'écran « Enregistrement de marché » ex-Attribution) sera traitée avec le lot 6 (point 6.a). |
| 1.c | Renommer « État » en « Statut du marché » | Libellé du filtre uniquement (clé interne `etat` conservée). |
| 1.d | Renommer « Bailleur » en « Source de financement » | Libellé du filtre uniquement (clé interne `bailleur` conservée pour éviter une migration DB). Cohérence avec le module Budget. |
| 1.e | Ajouter « Nature économique » comme critère de filtre | Nouveau multi-select branché sur le référentiel `NATURE_ECO` (déjà collecté en planification sur `MP_OPERATION.natureEco`). |

### Refonte du référentiel TYPE_MARCHE

**Nouveaux codes** (3 familles × 16 types) :

- **A. Marchés classiques** : `MARCHE_TRAVAUX`, `MARCHE_FOURN_EQUIP`, `MARCHE_SERVICES`, `MARCHE_MIXTE`
- **B. Marchés de type particulier** : `MARCHE_DEP_CONTROLEES`, `CONTRAT_GENIS`, `MARCHE_CLES_EN_MAIN`, `CONCEPTION_REALISATION`, `CONCEPTION_REA_EXPLOIT` *(sans sigle CREM — demande explicite EHOUMAN)*, `MARCHE_INNOVATION`, `ACCORD_CADRE`
- **C. Marchés de prestations intellectuelles** *(sous-types des marchés de services)* : `PI_ETUDES`, `PI_ASSISTANCE`, `PI_MOD`, `PI_AMO`, `PI_MOE`

**Compatibilité données existantes** (option B retenue par le client) : aucune migration SQL pour ce lot. Les anciens codes (`TRAVAUX`, `FOURNITURES`, `SERVICES_COURANTS`, `SERVICES_INTELLECTUELS`, `PRESTATIONS_INTELLECTUELLES`, `DELEGATION_SERVICE_PUBLIC`) sont :

1. **Conservés dans `TYPE_MARCHE`** avec un flag `legacy: true` et leur **nouveau libellé**, pour que tout lookup `registries.TYPE_MARCHE.find(t => t.code === op.typeMarche)` continue d'afficher un libellé propre dans tous les écrans (fiche de vie, dashboard, exports, …) — **non régression visuelle**.
2. **Masqués du filtre** (la fonction `buildHierarchicalTypeMarcheOptions` exclut les `legacy: true`).
3. **Normalisés au moment du filtrage** via la table `TYPE_MARCHE_LEGACY_MAP` exposée dans `registries.json` et appliquée par la fonction `normalizeTypeMarche()` dans `ecr01b-ppm-unitaire.js`. Cocher « Marchés de travaux » dans le filtre matche aussi les opérations encore stockées avec `typeMarche: "TRAVAUX"`.

La migration des données (réécriture des anciens codes en base) sera planifiée plus tard, vraisemblablement avec le lot 3 (création de marché).

### À venir — capté du point 5 (clarification utilisateur)

> *« Il y a une notion de petit rapport d'erreur ou de situation qui doit pouvoir être sorti à chaque étape. Il résume ce qui est bon et ce qui ne l'est pas. Il sera imprimé et soumis au décideur pour qu'il donne son avis. »*

C'est une **brique transversale** à concevoir : à chaque étape du cycle de vie (planification, contractualisation, enregistrement de marché, exécution, clôture), produire une **synthèse imprimable** des éléments OK et des éléments en défaut/manquants, destinée au décideur (DCF / CF) — par exemple pour justifier la déclaration d'un marché comme `INFRUCTUEUX`. **Non livré dans le lot 1.** Sera spécifié et livré dans un lot dédié, probablement avec le lot 6 (Enregistrement de marché) qui en a besoin pour le 6.a.

### Fichiers touchés

- `sidcf-portal/js/config/registries.json` : refonte `TYPE_MARCHE` (familles + types + entrées legacy avec nouveaux labels), ajout `TYPE_MARCHE_FAMILLES` et `TYPE_MARCHE_LEGACY_MAP`, ajout `INFRUCTUEUX` dans `ETAT_MARCHE`.
- `sidcf-portal/js/modules/marche-plus/etat-labels-mp.js` : ajout `INFRUCTUEUX → « Infructueux »`.
- `sidcf-portal/js/ui/widgets/multi-select-collapsible-mp.js` : support d'options `{ group: true, label }` rendues comme entêtes de famille non sélectionnables. Le bouton « Tout » ignore les groupes ; les groupes sans enfant visible après recherche sont masqués.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` :
  - ajout des helpers `normalizeTypeMarche()` et `buildHierarchicalTypeMarcheOptions()`,
  - filtre Type de marché alimenté par la liste hiérarchisée,
  - filtre Statut du marché (renommé) avec INFRUCTUEUX,
  - filtre Source de financement (renommé),
  - nouveau filtre Nature économique,
  - normalisation legacy au moment du filtrage,
  - extension de `activeFilters` / `resetFilters` / `renderActiveFilterChips`.

### Impact

- **UI** : la zone de filtre affiche désormais 11 filtres multi-select (+1 par rapport à avant : Nature économique). Le filtre Type de marché est hiérarchisé en 3 familles. Les libellés Statut et Source de financement remplacent État et Bailleur.
- **Worker** : ❌ aucun changement.
- **DB Neon** : ❌ aucun changement. Les anciens codes typeMarche restent en base ; le mapping côté lecture suffit pour le moment.
- **R2** : ❌ aucun changement.

### Anti-régression

- Les écrans tiers (fiche de vie, dashboard, exports CSV, modal de détails) qui font `registries.TYPE_MARCHE.find(t => t.code === op.typeMarche)` continuent de renvoyer une entrée valide grâce aux entrées `legacy` du référentiel, et affichent désormais le **nouveau libellé** (ex: « Marchés de travaux » au lieu de « TRAVAUX »).
- La clé interne `bailleur` n'a pas été renommée : tous les écrans qui lisent ou écrivent sur ce champ continuent de fonctionner identiquement.
- L'extension du widget `multi-select-collapsible-mp` est rétro-compatible : sans option `group: true`, le comportement est identique à l'existant — les autres filtres (Mode passation, Région, Activité, etc.) ne sont pas impactés.

### Action de déploiement

- ❌ Pas de migration SQL
- ❌ Pas de `wrangler deploy` (rien à toucher côté Worker)
- ✅ **Redéploiement frontend Vercel** pour exposer la nouvelle config et l'écran mis à jour

---

## 2026-05-25 — Hotfix démo : crash `g.taux.toFixed` + 404 handler sobre

> **Modif #75** — Bug remonté EN PLEIN MEETING : la fiche d'un marché ayant des garanties faisait planter le rendu avec `TypeError: (g.taux ?? 0).toFixed is not a function`. Le router catchait l'exception et tombait sur le 404 handler, qui affichait **« Page non trouvée »** + une grosse **stack trace rouge** exposée à l'utilisateur. Très laid en démo. Le titre était trompeur (c'était un crash, pas une 404).

### Correctifs

**1. Crash `toFixed` sur valeurs non numériques (`ecr01c-fiche-marche.js`)**

L'opérateur `??` préserve une string non-null (ex : `g.taux = "5.00"` vient ainsi de la DB JSONB). `(g.taux ?? 0).toFixed(2)` plante alors avec `toFixed is not a function`. Fix : remplacement de `(x ?? 0)` par `(Number(x) || 0)` sur 4 occurrences à risque :

- ligne 1626 : `g.taux` dans le tableau des garanties (cause directe du crash)
- ligne 613 : `it.pourcentage` dans `case 'pourcentage'`
- ligne 1441 : `it.pourcentage` (échéancier détaillé)
- ligne 1464 : `l.pourcentage` (clé de répartition détaillée)

Les autres `.toFixed` du fichier (cumulPct calculé localement, etc.) sont déjà numériques par construction.

**2. 404 handler sobre — défense en profondeur (`main.js` + `router.js`)**

Avant : `${error.stack || error.message}` injecté dans un `<pre style="color: red; font-size: 12px;">…</pre>`. Toute erreur attrapée par le router produisait donc une page rouge alarmante avec trace technique.

Maintenant :
- L'erreur est **loggée dans la console** (`logger.error` avec stack) pour le dev — plus rien d'exposé à l'utilisateur final.
- Le message devient sobre : *« Cette page n'est pas accessible. Le lien que vous avez suivi pointe vers un écran qui n'est pas disponible ici. »* (icône 🧭, pas de rouge alarmant).
- **Rebond intelligent** selon le préfixe de la route : `/mp/*` → bouton « Liste des marchés », `/investissement/*` → « Tableau de bord Investissement », `/admin/*` → « Administration », sinon « Retour au portail ». Un second bouton « ← Revenir en arrière » utilise `history.back()`.
- Le fallback `router.js:show404` (sans handler custom) suit la même charte.

Cette défense vaut pour TOUT crash futur qui passerait par le router, pas seulement le bug `toFixed` corrigé ici. L'utilisateur ne verra plus jamais de stack trace exposée en démo.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (4 fix `Number()`)
- `sidcf-portal/js/main.js` (404 handler refactor)
- `sidcf-portal/js/router.js` (fallback 404 refactor)

### Impact

- **UI** : fini la page rouge avec stack trace. La fiche marché ne plante plus sur les garanties dont le taux est stocké en string.
- **Worker / DB** : aucun changement.

### Action de déploiement

- ✅ Redéploiement front Vercel obligatoire

---

## 2026-05-25 — Échéancier : remplacement du placeholder « à implémenter » par un rendu propre

> **Modif #74** — Audit pré-démo : `ecr03b-echeancier-cle.js:512` injectait littéralement le texte « **Tableau échéancier à implémenter** » dans l'UI. Visible à tout démonstrateur qui clique sur l'écran Échéancier. Aussi : deux boutons « + Ajouter échéance » et « ↻ Recalculer » étaient présents mais reliés à des fonctions stubs vides — un clic ne produisait rien.

### Correctif

1. **Rendu lecture seule des échéances existantes** : `renderEcheancierTable()` produit désormais un vrai tableau (n° / libellé / date / montant / %) avec footer total, sur le même pattern que `renderCleTable()`. Si la base n'a aucune échéance pour ce lot, on affiche une cellule pointillée discrète « Aucune échéance n'a encore été saisie ».
2. **Boutons « + Ajouter » et « ↻ Recalculer » retirés** : remplacés par un encart d'information neutre « ℹ️ La saisie pas-à-pas de l'échéancier sera disponible dans une prochaine itération. Les échéances existantes restent consultables ci-dessus. » — assume honnêtement la portée de la maquette plutôt qu'afficher des boutons morts.
3. **Sous-titre du card mis à jour** : « consultation pour la maquette » (au lieu de « Définir les échéances ») — cohérent avec l'absence de saisie.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03b-echeancier-cle.js`

### Impact

- **UI** : plus aucun texte technique exposé au démonstrateur sur l'écran Échéancier.
- **Worker / DB** : aucun changement.

### Action de déploiement

- ✅ Redéploiement front Vercel

---

## 2026-05-25 — Visibilité de la dérogation à l'Attribution et au Visa CF

> **Modif #73** — Audit pré-démo (scénario dérogation) : la déclaration de dérogation faite à la planification (ECR01D) ou à la procédure (ECR02A) **disparaissait visuellement à tous les écrans aval** (Attribution ECR03A, Approbation ECR03C). Conséquence : le contrôleur financier pouvait approuver à l'aveugle un marché dérogatoire sans aucun rappel visuel — risque de validation aveugle relevé dans l'audit.

### Correctif

Nouveau widget partagé **`ui/widgets/derogation-banner-mp.js`** qui lit `operation.procDerogation` et affiche un bandeau rouge persistant :

- **Bordure et fond rouges** (`#dc2626` / `#fef2f2`) avec icône ⚠️ — impossible à manquer
- **Statut justificatif** : badge vert « ✓ Justifiée » si `docId` présent, sinon orange « ⏳ Justificatif manquant »
- **Statut validation CF** : badge bleu « ✓ Validée le DD/MM/YYYY » si `validatedAt` rempli
- **Phrase contextuelle** : « Procédure déclarée à la planification/procédure (mode X retenu hors recommandation du Code des Marchés Publics CI) »
- **Commentaire de motivation** affiché en italique entre guillemets
- **Référence du document justificatif** (📎 docId)

### Intégration

- **`ecr03a-attribution.js`** : bandeau injecté juste après le `pageHeader`, avant le sélecteur de lot
- **`ecr03c-visa-cf.js`** : bandeau injecté juste après le `page-header`, avant le sélecteur de lot — c'est l'écran le plus critique pour ce rappel
- `ecr01c-fiche-marche.js` conserve son badge orange « ⚠️ Dérogation » existant en en-tête, maintenant cohérent visuellement avec le bandeau aval

### Cas de test (couverts par les opérations TEST-*)

| Opération | État | Bandeau attendu |
|---|---|---|
| TEST-DEROG (104) | PLANIFIE | « Procédure déclarée à la planification » + ⏳ Justificatif manquant |
| TEST-AOR (203) | ATTRIBUE | « Procédure déclarée à la procédure » + ✓ Justifiée (DOC_AOR_DEROG_203.pdf) |
| TEST-GRE-A-GRE (205) | VISE | « Procédure déclarée à la procédure » + ✓ Justifiée (DOC_ED_DEROG_205.pdf) |

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/derogation-banner-mp.js` (nouveau)
- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js`
- `sidcf-portal/js/modules/marche-plus/screens/ecr03c-visa-cf.js`

### Limites connues (à traiter dans une itération suivante)

- `procDerogation.validatedAt` est rempli automatiquement à la sauvegarde ECR02A — il faudrait un vrai workflow où le CF valide explicitement la dérogation au moment de l'approbation.
- L'upload réel du document justificatif (R2) n'est pas câblé : `ecr02a:756` génère encore un `docId` mock.

### Action de déploiement

- ✅ Redéploiement front Vercel

---

## 2026-05-25 — Fixes critiques multi-lots (anti-doublon OS, montants par lot, navigation EN_EXEC)

> **Modif #72** — Audit pré-démo (3 sous-agents Explore) sur l'opération TEST-MULTI-LOTS (3 lots distincts, créée Modif #70). Personne n'avait jamais testé visuellement les écrans en condition multi-lots — trois bugs bloquants identifiés et corrigés.

### Bugs corrigés

**1. `ecr04a-execution-os.js:680-693` — Anti-doublon OS check global (BLOQUANT démo)**

Le garde-fou anti-doublon (Modif #65) interrogeait `MP_ORDRE_SERVICE` filtré uniquement par `operationId` :

```js
const existingOS = await dataService.query(ENTITIES.MP_ORDRE_SERVICE, { operationId: idOperation });
if (existingOS && existingOS.length > 0) { alert('OS déjà existant'); return; }
```

→ Pour TEST-MULTI-LOTS, dès qu'un OS existait sur LOT-A, **impossible d'émettre l'OS de LOT-B** (le check trouvait l'OS LOT-A et refusait). Sur une démo multi-lots, le client aurait immédiatement vu « pourquoi ça ne marche que pour le 1er lot ? ».

Fix : ajout d'un filtre `os.lotId === lotId` (back-compat : OS sans lotId restent comptés en mono-lot). L'OS de démarrage est désormais unique **par (opération, lot)** et non par opération.

**2. `ecr04b-avenants.js:44-47` — Cumul d'avenants calculé sur montant global**

Le calcul du `% cumul avenants` lisait `operation.montantPrevisionnel` (somme des 3 lots), pas le montant du lot courant. Résultat avec lots 2,4 Md / 1,9 Md / 1,5 Md et 100 M d'avenants sur LOT-A :
- Affichage : `100M / 5,8Md = 1,7%` (faux, et minimise le risque)
- Attendu : `100M / 2,4Md = 4,2%` (réel pour le lot concerné)

Cela faussait surtout l'alerte de seuil (25% / 30% du Code des Marchés Publics) qui ne se déclenchait jamais en multi-lots.

Fix : lecture de `attributionForLot.montants.ttc` via `getLotData(attribution, currentLotId)`, fallback sur `montantPrevisionnel` en mono-lot.

**3. `ecr01c-fiche-marche.js:212-217` — En-tête fiche fige le montant du 1er lot**

Le bandeau sticky de la fiche marché lisait `attribution.montants.ht` / `attribution.montants.ttc` sans scoping. En multi-lots, ces champs racine contiennent soit le montant du 1er lot soit le montant agrégé. Quand l'utilisateur changeait de lot via le sélecteur, **l'en-tête ne bougeait pas** (les KPIs des accordéons étaient corrects, mais l'en-tête restait figée sur LOT-A).

Même bug sur `ordresService` ligne 217 : le find pour l'OS de démarrage cherchait dans tous les OS, prenant systématiquement celui du 1er lot.

Fix : scoping de l'attribution et des OS via `getLotData()` / filtre `os.lotId === currentLotId` quand `currentLotId !== 'ALL'`.

**4. `ecr01c-fiche-marche.js:313` — Bouton « Modifier » muet en EN_EXEC (bonus)**

`navigateToCurrentPhase()` testait `etat === 'EXECUTION'` alors que les opérations TEST-* utilisent `EN_EXEC` (cf. timeline standard). Le bouton « ✏️ Modifier » dans l'en-tête de la fiche retombait sur le fallback `/mp/procedure` au lieu de pointer vers l'écran d'exécution. Fix : accepter les deux libellés (`EN_EXEC || EXECUTION`).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr04a-execution-os.js` (anti-doublon par-lot)
- `sidcf-portal/js/modules/marche-plus/screens/ecr04b-avenants.js` (montant initial scoped, import `getLotData`)
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (en-tête scoped, navigateToCurrentPhase EN_EXEC)

### Impact

- **UI** : la démo multi-lots devient pleinement fonctionnelle. TEST-MULTI-LOTS peut être présentée sans risque.
- **Worker** : aucun changement.
- **DB** : aucun changement.

### Action de déploiement

- ❌ Pas de migration ni de `wrangler deploy`
- ✅ Redéploiement front Vercel

---

## 2026-05-25 — Fix « Page non trouvée » sur toutes les URL `/mp/*` + audit liens

> **Modif #71** — Bug critique reporté en démo : un clic depuis la fiche marché vers une autre étape affichait « Page non trouvée — La route `/mp/fiche-marche` n'existe pas dans le système » avec stack trace exposée à l'utilisateur. Audit total des liens du module Marché+ déclenché.

### Cause racine

À `sidcf-portal/js/main.js:65-70`, l'enregistrement des routes Marché et Marché+ était conditionné aux feature flags `moduleMarche` / `moduleMarchePlus` :

```js
if (dataService.getConfig()?.features?.moduleMarchePlus) {
  registerMarchePlusRoutes();
}
```

Le commentaire au-dessus indiquait pourtant le contraire : « les routes restent accessibles par URL directe même si la carte/sidebar est masquée ». **Le code contredisait le commentaire.**

En environnement où la config n'a pas `moduleMarchePlus: true` (config par défaut, déploiement Vercel qui charge une config plus ancienne), **les 15 routes `/mp/*` n'étaient jamais enregistrées** et toute navigation hash vers le module retombait sur le 404 handler de `main.js:92-108`.

### Correctif

1. **`main.js`** : suppression des `if` conditionnels. Les routes Marché et Marché+ sont désormais **toujours enregistrées**. Les feature flags continuent à gérer l'affichage des cartes du portail (`portal/portal-home.js`) et des entrées de la sidebar (`ui/sidebar.js`), comme initialement prévu.
2. **`admin/seed-import.js:160`** : bonus de l'audit — remplacement de `#/ppm-unitaire` (legacy, route jamais enregistrée) par `#/ppm-list`.

### Audit complet des liens (résultat)

Cross-référence exhaustive de tous les `router.navigate()`, `href: '#/…'` et `window.location.hash = …` du codebase contre toutes les routes enregistrées :

| Module | Cibles trouvées | Routes enregistrées | Cassés |
|---|---|---|---|
| Marché+ (`/mp/*`) | 15 | 15 | 0 |
| Marché (sans préfixe) | 15 | 15 (+1 alias `/dashboard-cf`) | 0 |
| Admin | 4 | 7 | 0 |
| Investissement | 4 | 11 | 0 |
| Portal & système | 3 | 3 | 0 |
| **Total** | **41 cibles** | **51 routes** | **1 (corrigé)** |

**Aucun autre lien cassé dans le code source.** Le problème était structurel (enregistrement conditionnel) et ne nécessitait pas de toucher aux écrans individuels.

### Fichiers touchés

- `sidcf-portal/js/main.js` (suppression des 2 `if` autour de `registerMarcheRoutes()` et `registerMarchePlusRoutes()`)
- `sidcf-portal/js/admin/seed-import.js:160` (`ppm-unitaire` → `ppm-list`)

### Impact

- **UI** : toute URL `/mp/*` est désormais accessible quel que soit l'état du flag `moduleMarchePlus`. Plus de 404 surprise lors de la démo.
- **Worker** : aucun changement.
- **DB** : aucun changement.

### Action de déploiement

- ❌ Pas de migration
- ❌ Pas de `wrangler deploy`
- ✅ **Redéploiement front Vercel obligatoire** pour que le fix prenne effet sur l'environnement de démo

---

## 2026-05-25 — Couverture exhaustive des données de test : modes manquants + multi-lots

> **Modif #70** — Demande client : « priere faire le point des donnees. faire des tests complets et avoir une source de donnees couvrant tous les cas de figure, avec plusieurs lots, les differents modes de passation, et les differents niveaux dans le workflow ». L'audit a révélé deux lacunes critiques sur la base de démo : (1) aucune opération multi-lots, (2) 5 modes de passation officiels jamais représentés dans les données — `AOO_PREQUALIF`, `AOO_2ETAPES`, `AOR`, `PI`, `ENTENTE_DIRECTE`.

### Migration `029_mp_test_couverture_modes_lots.sql`

1. **Schéma** — ajout de la colonne manquante `mp_procedure.lots JSONB DEFAULT '[]'`. Cette colonne est lue côté front par `lot-data.js / getLotsFromProcedure()` mais n'avait jamais été créée en DB (les opérations mono-lot s'en passent ; les multi-lots l'exigent).
2. **6 opérations supplémentaires** (UUIDs série 200) couvrant les cas manquants, avec workflow amont entièrement renseigné (procédure + attribution + visa CF + OS si EN_EXEC) :
   - **201** `TEST-AOO-PREQ` — AOO avec préqualification, état **VISÉ**, mono-lot, 3,5 Md XOF
   - **202** `TEST-MULTI-LOTS` — AOO 2 étapes, état **EN_EXEC**, **3 lots distincts** (réseau primaire / secondaire / raccordements) avec **3 attributaires différents** stockés dans `attributaire.parLot[lotId]`
   - **203** `TEST-AOR` — Appel d'Offres Restreint, état **ATTRIBUÉ**, mono-lot, avec `procDerogation` (art. 58 — sécurité)
   - **204** `TEST-PI` — Prestations Intellectuelles, état **EN_EXEC**, mono-lot, type de dossier `DTAO_PI`
   - **205** `TEST-GRE-A-GRE` — Entente Directe, état **VISÉ**, mono-lot, `procDerogation` (art. 67 — monopole technique)
   - **206** `TEST-2LOTS` — AOO, état **EN_EXEC**, **2 lots géographiques** (Nord Bouaké / Sud Abidjan) avec 2 attributaires
3. **10 nouvelles entreprises** validées (`mp_entreprise`, statut `VALIDATED`) — une par attribution / co-lot pour garantir la cohérence des fiches liées.

### Résultat de l'audit final

- **Couverture modes** : 10/10 — `[]` modes manquants
- **Couverture états** : 7/7 — PLANIFIE, EN_PROC, ATTRIBUE, VISE, EN_EXEC, CLOS, RESILIE
- **Multi-lots** : 2 opérations (3 lots + 2 lots) → testable sur tous les écrans qui consomment `parLot[lotId]`
- **Dérogations procédure** : 3 opérations (104 PLANIF, 203 ATTRIBUE, 205 VISE)

### Fichiers touchés

- `postgres/migrations/029_mp_test_couverture_modes_lots.sql` (nouveau)

### Impact

- **DB** : ALTER TABLE + 17 opérations TEST-* désormais en base (était 11)
- **UI** : aucun changement de code — la maquette consomme les nouvelles données automatiquement via le PPM et la liste des marchés
- **Worker** : aucun déploiement requis (pas de changement de code Worker)

### Action de déploiement

- ✅ Migration exécutée sur Neon (`node run-any.js 029_mp_test_couverture_modes_lots.sql`)
- ❌ Pas de `wrangler deploy`

---

## 2026-05-24 — Suggestion automatique du Mode de Passation à la création PPM + alerte dérogation

> **Modif #53** — Demande client : sur l'écran de création de ligne PPM, le **mode de passation est aujourd'hui en libre sélection** alors que selon le Code des Marchés Publics CI, ce mode est **imposé par le montant de la ligne, son type et sa nature économique**. Le système doit donc proposer automatiquement le mode adéquat, motiver le choix (montant + seuils + type), et alerter l'utilisateur si celui-ci sélectionne autre chose — en l'avertissant qu'une dérogation sera obligatoirement demandée aux étapes suivantes.

### Comportement attendu et livré

1. **Auto-pré-sélection** du mode recommandé dans le dropdown dès que les 3 critères sont renseignés (Montant prévisionnel + Type de marché + Nature économique). Tant que l'utilisateur n'a pas explicitement modifié le mode, le dropdown reflète la recommandation.
2. **Encart de motivation** sous le dropdown qui explique :
   - Le mode recommandé (code + libellé)
   - Le « Pourquoi ? » : montant, type de marché, nature économique, tranche de seuils, matrice institution applicable
3. **Trois états visuels** :
   - 🟢 Vert « ✓ Mode conforme à la recommandation »
   - 🟢 Vert « ✓ Mode conforme (alternative également admise) » — si le mode choisi est différent du recommandé mais reste dans la liste des modes applicables pour la tranche
   - 🔴 Rouge « ⚠ Dérogation aux règles du Code des Marchés Publics CI » — si le mode choisi sort de la liste applicable. Bouton « ↩ Appliquer le mode recommandé » proposé en un clic.
4. **Persistance** : si le mode choisi est une dérogation, le champ `operation.procDerogation` est rempli avec `{ isDerogation: true, comment: "Dérogation déclarée à la planification : mode X retenu au lieu du mode recommandé Y (tranche Z, matrice ADMIN_CENTRALE)", validatedAt: null, sourceEtape: 'PLANIF' }`. L'étape Procédure (ecr02a) consommera ce flag et exigera le justificatif comme prévu.

### Réutilisation maximale de l'existant

- **Aucun nouveau moteur de règles** : le helper `dataService.getSuggestedProcedures(operation)` existait déjà (utilisé par ecr02a). Il reçoit une « pseudo-opération » construite à partir des champs du formulaire courant (`typeMarche`, `montantPrevisionnel`, `chaineBudgetaire.natureCode`, `typeInstitution: 'ADMIN_CENTRALE'`).
- **Aucune nouvelle config** : les seuils du fichier `js/config/rules-config.json` (matrice `ADMIN_CENTRALE`) sont la source de vérité unique — modifiables sans toucher au code.
- **Mécanisme `procDerogation`** : déjà branché côté ecr02a-procedure-pv.js (ligne 877) qui lit le flag et l'utilise pour les libellés/validations. Notre flag pré-positionné se propage donc proprement en aval.

### Détails d'implémentation

- Nouveau placeholder du select : `'-- Auto (selon le montant et le type) --'` (auparavant : `'-- Sélectionner --'`).
- Le tracking « touché par utilisateur » se fait via `dataset.userTouched = '1'` sur le `<select>` au premier `change` utilisateur. Cela évite d'écraser un choix explicite à chaque keystroke du montant.
- Le bouton « Appliquer le mode recommandé » remet `dataset.userTouched` à vide → le dropdown redevient « piloté » par la recommandation jusqu'au prochain changement manuel.
- Les libellés mode / type / nature sont résolus depuis les registries pour rester lisibles métier (au lieu d'afficher les codes bruts).
- Si **aucun seuil ne correspond** au triplet (cas extrême, ex : type/nature incompatibles), un message orange explique que la dérogation sera de toute façon requise quel que soit le mode.

### Non-régression

- L'écran de procédure (ecr02a) reste la source de vérité pour la validation **bloquante** de la dérogation (qui demande le PDF justificatif). Le helper de planification ne fait que **pré-marquer** l'opération pour faciliter l'étape suivante.
- Si l'utilisateur supprime ses valeurs (montant ou type), l'encart redevient neutre (gris « Renseignez les 3 champs... »).
- Aucun toucher sur le module Marché classique (`marche/`) : ce dernier conserve son comportement libre.
- Syntaxe vérifiée + HTTP 200 confirmé.

### Fichier touché

- `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` — encart de recommandation sous le dropdown, helpers `computeModeSuggestion()` + `refreshModePassationRec()` + `setupModePassationSuggestion()`, branchement dans `handleSave` pour `procDerogation`.

Pas de Worker, pas de migration DB, pas de R2. Frontend statique. Aucun déploiement requis.

## 2026-05-24 — Refonte « Informations financières » PPM : montant unique + bailleurs liés à l'activité + priorisation dans la clé de répartition

> **Modif #52** — Demande client suite au dernier meeting : sur l'écran de création/édition d'une ligne PPM, l'utilisateur saisit **un seul montant prévisionnel** pour l'opération (les vérifications de marché précédent + disponibilité budgétaire continuent de se faire sur ce montant unique). Ensuite, il déclare **les bailleurs** un à un, mais **sans montant par bailleur** — le partage entre bailleurs se précisera plus tard dans la clé de répartition. Les bailleurs proposés sont restreints à ceux **ouverts sur la ligne budgétaire de l'activité indexée**. Ces bailleurs sont ensuite **priorisés visuellement** dans la clé de répartition, mais sans verrouillage dur (l'utilisateur peut quand même choisir un autre bailleur si besoin).

### Partie 1 — Refonte de la section « Informations financières » (`ecr01d-ppm-create-line.js`)

**Avant** : N lignes, chacune avec `{montant, type, bailleur}`, total calculé en bas. Le bailleur était filtré par type uniquement, à partir du référentiel global.

**Après** :
- **Bloc montant unique** en haut : 1 input « Montant prévisionnel (XOF) » + indicateur de couverture budgétaire global.
- **Bloc bailleurs** : liste de lignes simples (1 dropdown par bailleur), bouton « + Ajouter un bailleur ». Les options du dropdown sont **strictement filtrées par l'activité indexée** : on parcourt `mpBudgetLines` pour ne proposer que les couples `(typeFinancement, sourceFinancement)` ouverts sur cette activité.
- **Indicateur de disponibilité** sous le montant : compare la somme des enveloppes (AE) des bailleurs déclarés au montant prévisionnel saisi + cumul des autres opérations PPM sur la même activité. Pastille verte ✓ « Couverture OK » ou rouge ⚠ « Couverture insuffisante ».
- **Bandeau total** en bas : recadré pour montrer le montant unique + le nombre de bailleurs déclarés.

**Format des `<option>`** : `value="typeFinancement|bailleur"`, libellé `"Bailleur — Type"`. Le pipe `|` est utilisé comme séparateur car aucun code de référentiel ne le contient.

**Réactivité** : changement d'activité (event `change` sur le hidden `#activite`) → repopulate de tous les dropdowns bailleur. Changement du montant → refresh de l'indicateur de couverture.

### Partie 2 — Persistance (`handleSave`)

- `montantPrevisionnel` = montant saisi en haut (un seul nombre).
- `chaineBudgetaire.bailleurs[]` = liste des codes bailleurs déclarés.
- `chaineBudgetaire.financements[]` = **rétrocompat préservée** : alimenté avec `{montant: 0, typeFinancement, bailleur}` par bailleur. Les écrans en lecture qui itèrent `financements[]` continuent de fonctionner, juste avec un montant unitaire à 0 (le partage se fait dans la clé de répartition).
- Dédoublonnage : un même `(type, bailleur)` ne peut être déclaré qu'une seule fois.
- Validation : `montantTotal > 0` ET au moins 1 bailleur.

### Partie 3 — Mise en évidence dans la clé de répartition (`cle-repartition-manager-mp.js`)

- Nouveau paramètre optionnel **`bailleursPlanifies`** (6ᵉ argument) sur `renderCleRepartitionManager()`.
- Dans le `<select>` du bailleur :
  - Si `bailleursPlanifies` est non vide → 2 `<optgroup>` :
    - **« ★ Définis dans la planification »** en haut (bailleurs déclarés en PPM)
    - **« Autres bailleurs »** en dessous (tout le reste du référentiel)
  - Sinon → comportement actuel (liste plate).
- Texte d'aide sous le select : indique le nombre de bailleurs planifiés et précise que d'autres choix restent possibles. **Pas de verrouillage dur** — conformément à la consigne client.
- Cas particulier : si un enregistrement existant pointe sur un bailleur ni dans la planification ni dans le référentiel, on l'injecte tel quel (« hors référentiel ») pour ne pas perdre la donnée.

### Partie 4 — Branchement (`ecr03a-attribution.js`)

- Récupération de `operation.chaineBudgetaire.bailleurs` (filtré sur `Boolean`).
- Passage en 6ᵉ argument au widget. Aucune autre modification dans l'écran.

### Non-régression

- **Données historiques** : les anciennes opérations avec `financements[]` à montants > 0 restent affichées correctement sur les autres écrans (la lecture ne change pas).
- **Fonctions `findBudgetLine` / `computeBudgetUsageOther`** : conservées en l'état mais non utilisées par la nouvelle UI (gardées pour rétrocompat éventuelle des écrans qui les exporteraient — aucun aujourd'hui).
- **Helper `renderBudgetLineHistory`** : non utilisé dans la nouvelle section (la vérif se fait globalement, pas par ligne). Le widget reste disponible pour réutilisation future.
- **Module Marché classique** (`marche/`) : aucune modification — il utilise un autre widget (`cle-repartition-manager.js`, sans `-mp`).
- **Syntaxe vérifiée** (`node --check`) sur les 3 fichiers + serving HTTP 200 confirmé.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` — refonte UI Informations financières + `handleSave` + `setupFinancementsMulti`.
- `sidcf-portal/js/ui/widgets/cle-repartition-manager-mp.js` — paramètre `bailleursPlanifies`, optgroup + helper `planifiesSetHelpText`.
- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` — passage du paramètre au widget.

Pas de Worker, pas de migration DB, pas de R2. Frontend statique. Aucun déploiement requis.

## 2026-05-24 — Liste PPM : libellé colonne « Mode de passation », séparateurs visuels et casse Title Case du Type

> **Modif #51** — 3 retours client issus du dernier meeting, regroupés en une seule modif car même écran et même fichier source (la liste PPM Marché+).

### a) Libellé de la colonne « Mode » → « Mode de passation »

Renommage de l'en-tête de colonne pour cohérence terminologique avec le reste du module (Attribution, Procédure utilisent déjà « Mode de passation »). Largeur minimale augmentée de 100 px à 140 px pour absorber le libellé plus long sans wrap.

### b) Séparateurs visuels entre cellules

La classe `.data-table` (utilisée par 4 écrans Marché+ : liste PPM, échéancier, exécution OS, garanties) **n'avait aucune règle CSS dédiée** — seules les bordures par défaut du navigateur s'appliquaient (souvent invisibles). Ajout d'un bloc CSS dans `components.css` :

- Bordures complètes (horizontales + verticales) sur les `th` et `td` (1 px gris-200).
- Bordure basse renforcée (2 px gris-300) sous l'en-tête.
- Conservation du hover de ligne (fond gris-50).
- Conservation du padding via les variables existantes (`--spacing-3`, `--spacing-4`).

L'ajout est **rétroactivement appliqué** aux 4 écrans utilisant `data-table` → cohérence visuelle accrue sur tout le module sans modification de leur code.

### c) Casse du contenu de la colonne « Type »

Avant : `.toUpperCase()` → « PRESTATIONS DE SERVICES »
Après : `toTitleCaseFr()` → « Prestations De Services »

Nouveau helper local `toTitleCaseFr()` :
- Lowercase puis re-majuscule de la première lettre de chaque mot.
- Délimiteurs reconnus : début de chaîne, espace, tiret, apostrophe.
- Gère unicode (`\p{L}` avec flag `u`) pour les caractères accentués.
- Strict selon la consigne client : « première lettre majuscule pour chaque mot » — pas d'exception pour « de », « et », « du » (sinon « Prestations de services » serait attendu, ce qui n'a pas été demandé).
- Fallback `'-'` si valeur null/vide.

### Validation

Tests unitaires manuels sur 7 cas :

| Entrée | Sortie |
|---|---|
| `'TRAVAUX'` | `Travaux` |
| `'PRESTATIONS DE SERVICES'` | `Prestations De Services` |
| `'FOURNITURES ET SERVICES'` | `Fournitures Et Services` |
| `'ETUDE-CONTROLE'` | `Etude-Controle` |
| `null` | `-` |
| `''` | `-` |
| `'  travaux  '` | `Travaux` |

### Non-régression

- Aucune autre `toUpperCase()` dans le même fichier — risque de cascade nul.
- Le helper est local au fichier (pas d'impact sur d'autres écrans).
- La nouvelle CSS `.data-table` ne masque aucune règle préexistante (la classe n'avait pas de définition CSS jusqu'ici).
- Syntaxe JS vérifiée + fichiers servis 200.

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` — renommage colonne (l. 511), nouveau helper `toTitleCaseFr()`, remplacement de `.toUpperCase()` (l. 542).
- `sidcf-portal/css/components.css` — nouveau bloc `.data-table` (en bas, après `.table-actions`).

Pas de Worker, pas de migration DB, pas de R2. Frontend statique. Aucun déploiement requis.

## 2026-05-23 — Masquage durable des tuiles santé du marché sur la liste PPM

> **Modif #50** — Demande client : masquer durablement la rangée de 5 tuiles « EN PROGRESSION NORMALE / À SURVEILLER / À RISQUE / BLOQUÉ / NON DÉMARRÉ » en haut de la liste PPM Marché+. Ces tuiles (Modif #36, classification santé agrégée) posaient des problèmes d'UX selon le retour client.

### Approche

L'appel à `renderSanteTuiles(stats.parSante, filteredOps, santeMap)` (ecr01b-ppm-unitaire.js, ligne 219) est commenté plutôt que supprimé. Cela permet :
- **Réactivation immédiate** si le client change d'avis (décommenter une ligne).
- **Préservation de la classification** : `santeMap` reste calculée et reste disponible pour les filtres / chips de la liste.
- **Conservation du code** de la fonction `renderSanteTuiles()` plus bas dans le fichier — pas de suppression définitive.

### Fichier touché

- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` — 1 ligne commentée avec note explicative.

Pas de Worker, pas de migration DB. Frontend statique. Aucun déploiement requis.

## 2026-05-21 — Mode « Spécification » bavard pour devs externes (écran pilote : Attribution)

> **Modif #49** — Objectif : rendre la maquette interactive exploitable comme spécification fonctionnelle par un développeur externe qui prendra le relais sur l'implémentation. Chaque élément câblé (champ, section, bouton) expose un badge ℹ qui, au clic, ouvre une fiche latérale détaillant son **objet métier, sa source de données, son type, ses conditions de visibilité/édition, les règles métier applicables, les actions possibles, les acteurs concernés, la formule éventuelle, un exemple et la référence réglementaire**. Le mode tient compte des **éléments conditionnels et dynamiques** : chaque fiche évalue à l'ouverture les règles selon le contexte courant (mode de passation, état du marché, lot, etc.).

### Activation — paramètre URL ciblé devs

- **Activer** : ajouter `?spec=1` dans la query string OU dans le hash. Exemples :
  - `https://sidcf.example/index.html?spec=1#/mp/attribution?idOperation=...`
  - `https://sidcf.example/index.html#/mp/attribution?idOperation=...&spec=1`
- **Désactiver** : `?spec=0` (équivalent au clic sur « Revenir au mode utilisateur » dans la bannière violette).
- **Persistance session** : une fois activé via l'URL, le mode reste actif pour toute la session du tab via `sessionStorage[sidcf:specMode]`. Le dev n'a donc pas besoin de répéter `?spec=1` sur chaque clic, mais le **lien initial qu'il reçoit du métier diffère** : le métier garde des liens sans paramètre, les devs ont leur URL d'entrée spéciale.
- À la fermeture du tab, retour automatique au mode utilisateur.

### Helper central — `sidcf-portal/js/lib/spec-mode-mp.js`

API exposée :

| Fonction | Rôle |
|---|---|
| `initSpecMode()` | À appeler au boot (déjà branché dans main.js). Détecte `spec=1`, applique `body.spec-mode`, injecte les styles, la bannière haut de page et le panel latéral. |
| `isSpecMode()` | Retourne `true` si actif (URL ou session). |
| `wireSpec(element, spec)` | Attache une fiche de spec à un élément DOM. En mode utilisateur : no-op. En mode spec : ajoute un badge ℹ cliquable. |
| `updateSpecContext(partial)` | Met à jour le contexte runtime utilisé par les fiches dynamiques (mode passation, état, lot…). À appeler depuis chaque écran. |
| `getSpecContext()` | Lecture du contexte courant. |

### Modèle de fiche spec

Chaque appel à `wireSpec()` reçoit un objet dont les champs principaux sont :

```
{
  id              : 'identifiant-technique-stable',
  titre           : 'Titre court affiché en en-tête du panel',
  objet           : 'À quoi sert cet élément métier',
  source          : 'Entité.champ, contraintes de stockage',
  type            : 'Type de donnée ou widget',
  conditions      : { visible: …, editable: …, requis: … },
  reglesMetier    : ['règle 1', 'règle 2', …],
  formule         : 'expression de calcul',
  exemple         : 'illustration chiffrée concrète',
  actions         : ['action 1', 'action 2'],
  acteurs         : 'qui saisit / consulte / valide',
  reference       : 'références réglementaires, codes',
  dynamic         : (ctx) => ({ … })   // ← évalué à l'ouverture du panel
}
```

Le champ **`dynamic(ctx)`** est la clé du succès demandé par le client : il est invoqué à chaque clic avec le contexte courant fourni par l'écran (`updateSpecContext()`) — il peut donc afficher l'état réel (visible / masqué / requis / verrouillé / conforme au budget…) plutôt qu'une description statique qui dériverait du code.

### Écran pilote — `ecr03a-attribution.js`

5 éléments câblés en démonstration :

1. **Header de la page** (titre Attribution) — fiche écran complète : objet, entités liées, conditions de visibilité de l'écran selon timeline, etc.
2. **Section « Montant du marché de base »** — montant, calculs HT⇄TTC, lien avec montantPrevisionnel du PPM.
3. **Input « Montant HT/TTC »** (le champ du screenshot client originel) — validation, formule de conversion, valeur initiale dynamique depuis le PPM.
4. **Section « Garanties et Cautionnement »** — **exemple-clé du conditionnel** : la fiche `dynamic(ctx)` indique, selon le mode de passation courant, si la section est masquée (PI), si les garanties sont obligatoires (AOO) ou optionnelles (autres modes). Le code de la règle est centralisé dans `lib/procedure-context.js` (`isFieldHidden`, `isFieldRequired`) — la fiche LIT cette source de vérité plutôt que de la dupliquer, garantissant zéro drift.
5. **Bouton « Enregistrer l'attribution »** — déclencheur, validation côté client, règles de transition d'état (etat → ATTRIBUE), patch multi-lot, refus en post-visa, etc.

### Signalisation visuelle

- En mode spec, **tous les éléments câblés** affichent un cadre pointillé violet pâle (signalisation discrète).
- Au survol : cadre plein + fond très légèrement teinté.
- Le **badge ℹ** est positionné en haut-droite avec une petite ombre portée.
- La **bannière haut de page** rappelle en permanence « MODE SPÉCIFICATION ACTIF » avec un lien de désactivation.
- Le **panel latéral** glisse depuis la droite (largeur 420 px) avec couleur d'accent violet/indigo (distinct de l'UX normale).

### Limites et conventions

- Pas d'export PDF/Markdown automatique à ce stade — la spec se consulte dans la maquette. Export possible à cadrer dans une modif ultérieure.
- Les fiches dépendent de la **discipline de PR** : toute évolution fonctionnelle d'un élément câblé doit synchroniser sa fiche. À documenter dans le guide contributeurs.
- Le wiring est **opt-in** par élément (pas de couverture automatique 100 %). Une convention possible : tagguer chaque PR fonctionnelle avec un check « spec à jour ? » dans la description.

### Démarche recommandée pour étendre

1. Avancer écran par écran en commençant par les plus critiques (Attribution, Procédure, Visa CF, Avenant).
2. Sur chaque écran, câbler **section header → champs sensibles → boutons d'action**. Cibler 80 % de couverture des éléments significatifs (≠ exhaustif).
3. Pour chaque règle dynamique, **lire depuis la source de vérité** (rules-engine, procedure-context, etat-labels-mp) plutôt que de dupliquer.
4. Suivre la convention de nommage `id` : `<ecran>-<element>` (ex : `attribution-section-garanties`).

### Fichiers touchés

- **Nouveau** : `sidcf-portal/js/lib/spec-mode-mp.js` (~300 lignes) — toggle URL, sessionStorage, styles injectés, bannière, panel latéral, helper `wireSpec()`, contexte runtime.
- Modifié : `sidcf-portal/js/main.js` — appel `initSpecMode()` au boot (avant `boot()`).
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` — import du helper, push du contexte au chargement (`updateSpecContext`), 5 wirings de démonstration (header, section montants, input montant base, section garanties avec règle dynamique, bouton enregistrer).

Pas de Worker, pas de migration DB, pas de R2. Frontend statique. Aucun déploiement requis.

## 2026-05-20 — Tableau de suivi des décomptes : enrichissement complet (saisie + colonnes + synthèse CUMULS/%CUMULS)

> **Modif #48** — Demande client : aligner le widget « Situation d'exécution financière » (op-mandat-manager-mp) sur la maquette du tableau de suivi des décomptes du marché consulté. Trois sujets : (1) saisie des décompositions financières (Acompte HTVA, Avance, Garantie, Pénalité, Net HTVA, Net TTC), (2) affichage tabulaire 14 colonnes identique à la maquette, (3) lignes de synthèse `CUMULS` et `%CUMULS` en pied de tableau.

### Saisie : modal enrichi en 3 sections

Le modal d'édition d'un décompte/OP/Mandat passe de 6 champs à un formulaire structuré :

**Section 1 — Identification**
- Numéro de décompte (obligatoire), Type d'OP (OP / Mandat / Décompte autre), Numéro d'OP, Date de décompte.
- Le N° d'OP est explicité comme « renseigné par le module budget » dans le placeholder — saisie possible manuellement aujourd'hui en attendant l'intégration automatique.

**Section 2 — Décomposition financière**
- 4 inputs **saisis** : Acompte HTVA, Avance restituée, Retenue de garantie, Pénalités.
- 2 inputs **auto-calculés** mais surchargables : Net HTVA (= Acompte − Avance − Garantie − Pénalités, clampé à 0), Net TTC (= Net HTVA × (1 + tauxTVA)).
- Le **taux TVA est dérivé** de l'attribution : `(montantTTC / montantHT − 1) × 100`. Fallback 18 % si l'attribution n'a pas les deux montants. Le taux est affiché dans le label de la section pour transparence (« taux TVA 18 % »).
- Recalcul live sur chaque input : `oninput → recompute()`.

**Section 3 — Suivi & validation**
- État (DRAFT / SOUMIS / VISE / PAYE / REJETE — workflow du document).
- Bailleur (texte libre — *cf. question ouverte plus bas*).
- **Décision** (nouveau) : EN_ATTENTE / APPROUVE / REJETE — avis du CF, distinct de l'État (workflow).
- Le **taux d'exécution** est calculé à l'enregistrement (Net TTC ligne / Montant global × 100) — pas saisissable, lecture seule en tableau.

### Tableau : 14 colonnes alignées sur la maquette

| Colonne | Source |
|---|---|
| N° Décompte | `numero` |
| Type d'OP | `typeOP` (label allégé sans parenthèse) |
| N° d'OP | `numeroOP` |
| Date | `dateDecompte` (format fr-FR) |
| Acompte HTVA · Avance · Garantie · Pénalité · Net HTVA · Net TTC | montants formatés via `money()` (séparateurs fr-FR — Modif #46) |
| État | badge couleur (vert visé/payé, bleu soumis, rouge rejeté, gris brouillon) |
| Bailleur | texte |
| Décision | badge couleur (vert approuvé, rouge rejeté, gris en attente) |
| Taux exéc. | pourcentage formaté |
| Actions | éditer / supprimer |

Le tableau est rendu dans un conteneur `overflow-x: auto` avec `white-space: nowrap` — la largeur cumulée des 15 colonnes nécessite un scroll horizontal sur écrans étroits, ce qui est cohérent avec la maquette client (qui montre aussi un scroll).

### Lignes de synthèse CUMULS et %CUMULS

Conformément à la maquette, deux lignes apparaissent en bas du tableau, en **rouge foncé** sur fond rose pâle :
- **CUMULS** : somme absolue des 6 colonnes financières (Acompte HTVA, Avance, Garantie, Pénalité, Net HTVA, Net TTC).
- **%CUMULS** : chaque total exprimé en pourcentage du **montant global du marché** (= TTC attribution + Σ avenants financiers).

Une note en italique sous le tableau explicite la base de calcul : « Les pourcentages %CUMULS sont calculés sur le montant global du marché (XX XOF). »

Les colonnes non financières (N°, Type, N° OP, Date, État, Bailleur, Décision, Taux exéc., Actions) sont vides sur ces lignes de synthèse (`colspan` adapté).

### Questions ouvertes envoyées au client en parallèle

Bien que l'implémentation soit livrée sur des hypothèses raisonnables, **7 questions** ont été levées et envoyées au client. Si une des réponses contredit une hypothèse, l'ajustement sera mineur.

1. **TypeOP = CUMULS / %CUMULS** → interprété comme **lignes de synthèse** (pas un type de décompte stocké). Confirmation attendue.
2. **Saisie en 2 temps** → DCF saisit le décompte avec ses décompositions, puis le module budget renseigne N°OP + date à l'émission du mandat. Confirmation attendue.
3. **Net HTVA / Net TTC** : auto-calculés mais surchargeables. Confirmation que le calcul `Acompte − Avance − Garantie − Pénalités` est le bon (variantes possibles selon la pratique CI).
4. **Décision** : valeurs APPROUVE / REJETE / EN_ATTENTE, distincte de l'État. Confirmation attendue.
5. **Taux d'exécution** : calculé **par ligne** (Net TTC ligne / Montant global × 100). À confirmer vs cumulé (Σ jusqu'ici).
6. **Bailleur** : aujourd'hui **texte libre** — à terme dropdown depuis le référentiel BAILLEUR. Et confirmation : un décompte = un seul bailleur (la répartition pluri-bailleurs reste gérée par la clé).
7. **Lignes CUMULS / %CUMULS** : confirmé comme synthèses calculées en pied de tableau, non stockées en DB.

### Compatibilité ascendante

Les décomptes existants saisis sous l'ancien modal (1 seul champ « Montant » mappé sur `acompteHTVA` ET `netTTC`) restent affichés correctement :
- Les champs `avance`, `garantie`, `penalite`, `netHTVA` non saisis tomberont à 0 dans le rendu (fallback `Number(d.x) || 0`).
- À la **réédition** d'une telle ligne, l'agent verra les décompositions à 0 et pourra les compléter — le Net TTC initial restera affiché.

### Limitations connues (à cadrer ultérieurement)

- Pas d'intégration automatique avec le module budget pour récupérer N°OP / date (saisie manuelle dans l'attente).
- Pas de **versioning** des décompositions (si l'agent corrige après visa CF, l'historique n'est pas tracé — à voir avec le client si nécessaire).
- Pas de **lien direct vers un document PV** du décompte (champ `documentRef` existe en base mais pas exposé dans le modal — peut être ajouté via upload R2 si besoin).

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/op-mandat-manager-mp.js` — refonte du modal `openEditorModal()`, refonte de `renderTable()` (14 colonnes + synthèse CUMULS/%CUMULS), ajout du référentiel `DECISIONS` + helper `metaDecision()`, dérivation du taux TVA depuis l'attribution.

Pas de Worker, pas de migration DB (toutes les colonnes existent déjà dans `MP_DECOMPTE`). Pas de R2. Aucun déploiement requis — frontend statique.

## 2026-05-20 — Section Clôture : table « Marché global » consolidant les marchés liés

> **Modif #47** — Demande client adressée à la section « 6. Clôture » de la fiche de vie : ajouter une **table consolidée du marché global** réunissant le marché courant et tous ses marchés liés (étude amont, travaux, suivi et contrôle aval…). Cette synthèse capitalise sur la liaison déjà introduite en **Modif #28** (`MP_OPERATION.relations[]`) — aucune saisie supplémentaire requise, les liens définis pendant la vie du marché alimentent automatiquement la table.

### Contenu de la table

Une ligne par marché du « projet global », avec colonnes :

| Rôle | N° opération | Objet | Attributaire | Montant | État |
|---|---|---|---|---|---|
| 🎯 Marché courant — *Courant* | OP-2026-… | … | mandataire/raison sociale | montant actuel | badge état |
| 📘 Étude — *Amont* | OP-2025-… (lien cliquable) | … | – | montant | badge |
| 🏗️ Travaux — *Aval* | OP-2026-… (lien) | … | – | montant | badge |
| 🔍 Contrôle / Surveillance — *Aval* | OP-2026-… (lien) | … | – | montant | badge |

Repères visuels :
- Le marché **courant** est toujours en première ligne, badge « 🎯 Courant », montant en gras.
- Les marchés **antérieurs** (étude PI typique) portent un badge bleu « ⏪ Amont ».
- Les marchés **postérieurs** (travaux, contrôle…) portent un badge vert « ⏩ Aval ».
- Les IDs des marchés liés sont **cliquables** → ouverture directe de la fiche du marché associé.

### Réutilisation existant — économie d'effort

Le widget `related-operations-mp.js` (Modif #28) embarquait déjà la logique de résolution des liens (`computeLinks()` qui consolide les liens sortants stockés sur l'opération + les liens entrants détectés à la volée sur les autres opérations + l'inversion automatique du sens). Cette fonction et `getRoleMeta()` ont été **promues en exports** pour pouvoir être réutilisées par la section Clôture, évitant la duplication de logique.

### Comportement

- **Toujours affichée** dans la section « 6. Clôture » (ouverte ou pas), même avant la clôture effective du marché — le client ouvre la section quand il veut consulter la synthèse.
- Si **aucun marché lié** n'est défini : message d'orientation invitant à utiliser le bandeau « 🔗 Liens entre marchés » en haut de la fiche.
- Le bloc historique (réceptions provisoire/définitive, PVs, observations) reste tel quel quand le marché est clôturé ; la table « Marché global » s'ajoute en dessous.

### Résolution de l'attributaire

Pour le marché courant, l'attribution est chargée par la fiche et passée explicitement à la table → résolution complète (mandataire de groupement, ou raison sociale du titulaire simple).

Pour les marchés liés, seule l'opération est connue à ce stade (pas l'attribution → '-' affiché). C'est volontaire : le client peut cliquer sur le N° pour ouvrir la fiche complète du marché lié et voir le détail. Charger les attributions de tous les marchés liés au chargement de chaque fiche serait coûteux pour un gain marginal.

### Fichiers touchés

- `sidcf-portal/js/ui/widgets/related-operations-mp.js` — promotion de `computeLinks()` et `getRoleMeta()` en exports nommés.
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` — nouvelle fonction `renderMarcheGlobalTable()` + `renderMarcheGlobalRow()` + helper `resolveAttributaireName()` + map de couleurs `ETAT_BADGE_COLOR_MP` ; intégration dans `renderClotureContent()` ; passage de `mpOperations` au call site.

Pas de Worker, pas de migration DB, pas de R2. Réutilisation pleine de la structure de données existante. Aucun déploiement requis — frontend statique.

## 2026-05-20 — Séparateurs de milliers fr-FR sur les affichages numériques

> **Modif #46** — Uniformisation de l'affichage des montants XOF dans les écrans Marché+. Plusieurs endroits affichaient des valeurs numériques brutes (« 27848000 ») au lieu du format français avec séparateurs (« 27 848 000 »). Trois causes : (1) un `<input type="number" disabled>` ne peut pas afficher de séparateurs (les caractères non numériques sont rejetés silencieusement) ; (2) des appels `Number.prototype.toLocaleString()` sans argument utilisaient la locale du navigateur (résultat « 27,848,000 » en EN-US au lieu de « 27 848 000 ») ; (3) deux dialogues `confirm()` interpolaient un montant brut.

### Fix par fichier

**`ecr03a-attribution.js`** — Section « 💰 Montant du marché de base »
- Input calculé (Montant TTC quand base = HT, ou Montant HT quand base = TTC) : passage de `type=number disabled` à `type=text disabled`. Native HTML number input n'acceptant pas les espaces comme séparateurs, on était bloqué sur du brut. Le champ est de toute façon non éditable, donc text+disabled est le bon outil.
- Ajout d'un helper local `formatNumber(value)` qui retourne `Intl.NumberFormat('fr-FR')` sans suffixe (le label porte déjà « (XOF) »).
- `calculerMontants()` : valeur calculée injectée via `formatNumber(montant)` au lieu de `.toFixed(0)`.

**`ecr04b-avenant-create.js`** — Création d'un avenant
- 6 appels `toLocaleString()` → `toLocaleString('fr-FR')` (lignes 104, 119, 123, 503, 508, 511). Concerne le bandeau de contexte « Montant initial / Cumul avenants / Montant total » + l'aperçu impact financier (Impact / Cumul après cet avenant).

**`ecr03a-attribution.js`** indirect : le `formatMoney()` local du résumé HT/TVA/TTC utilisait déjà `Intl.NumberFormat('fr-FR')` — aucun changement requis, juste préservé.

**`ui/widgets/cle-repartition-manager-mp.js`** — Dialog suppression d'une ligne bailleur
- `confirm()` : montant interpolé via `(ligne.montant || 0).toLocaleString('fr-FR')`.

**`ui/widgets/echeancier-manager-mp.js`** — Dialog suppression d'une échéance
- `confirm()` : montant interpolé via `(echeance.montant || 0).toLocaleString('fr-FR')`.

### Choix de conception

Cas écarté : convertir les inputs **éditables** (`type=number` non disabled) en `type=text` avec masque de saisie. Décidé après confirmation utilisateur — le compromis « saisie en chiffres bruts, affichage formaté partout ailleurs » a été retenu. Cela évite : la gestion du caret pendant le masque, les bugs sur paste/sélection, et le parsing à la soumission. Les disabled/read-only et tous les affichages dérivés (résumés, badges, dialogs) sont eux formatés.

Note locale : tous les `Intl.NumberFormat`/`toLocaleString` utilisent désormais explicitement `'fr-FR'` dans Marché+. Cela rend l'affichage déterministe quelle que soit la locale du navigateur (un utilisateur sur un Mac en anglais voyait précédemment « 27,848,000 ») — important pour un public DCF Côte d'Ivoire.

### Validation

- Syntaxe JS vérifiée sur les 4 fichiers (`node --check`).
- Test manuel sur localhost:7001 : tous les fichiers servis 200, pas d'erreur de chargement.
- Logique de calcul HT⇄TTC préservée (les hidden inputs continuent à stocker la valeur brute, le seul changement est le champ de lecture).

### Fichiers touchés

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js`
- `sidcf-portal/js/modules/marche-plus/screens/ecr04b-avenant-create.js`
- `sidcf-portal/js/ui/widgets/cle-repartition-manager-mp.js`
- `sidcf-portal/js/ui/widgets/echeancier-manager-mp.js`

Pas de Worker, pas de migration SQL, pas de R2. Aucun déploiement requis — fix purement frontend statique.

## 2026-05-20 — Fix lib fuzzy : normalisation des formes juridiques avec points

> **Modif #45** — Découvert par batterie de tests end-to-end (26 assertions sur lib + DB + workflow). La fonction `normalizeRaisonSociale()` traitait les points (`.`) comme séparateurs en les remplaçant par un espace → conséquence : `« S.A.R.L. »` était transformé en `« s a r l »` (4 lettres seules) au lieu de `« sarl »`, ce qui empêchait la regex `\b(sarl|sas|sa|sasu|eurl…)\b` de détecter la forme juridique et de la retirer. Résultat : `« Société Dupont S.A.R.L. »` ne matchait pas comme doublon de `« SOCIETE DUPONT SARL »`.

### Fix

Distinction du traitement des points et des autres ponctuations :
- **`.`** → retiré sans espace (`« S.A.R.L. »` → `« sarl »` → retiré par le regex forme juridique)
- **`,;:!?'"()/\&-`** → remplacés par un espace (séparateurs de mots légitimes)

### Validation

Test e2e (26 assertions sur la lib + DB + workflow PENDING → VALIDATED → MERGED, avec contraintes SQL, FK et cleanup automatique) : **26/26 ✓**

Couvre :
- 6 cas de normalisation (accents, ponctuation, formes juridiques, edge cases)
- 4 cas de similarité (identique, casse, ponctuation, distance)
- 2 cas de recherche (fuzzy, substring)
- 2 vérifications DB (colonnes + index)
- 11 cas e2e (création PENDING, fuzzy detection, contraintes UNIQUE + CHECK, validation, fusion, FK ON DELETE SET NULL, cleanup)

#### Fichier touché

- `sidcf-portal/js/lib/entreprise-fuzzy-mp.js` — `normalizeRaisonSociale()` : 1 ligne ajoutée (`.replace(/\./g, '')`) + ajustement de la regex ponctuation

Aucune migration DB. Aucun déploiement Worker. Le fix est rétroactivement bénéfique : la détection de doublons à la création inline sera désormais plus tolérante aux formes juridiques avec points.

## 2026-05-20 — Admin queue validation + fusion doublons (Phase 2 du référentiel entreprise)

> **Modif #44** — Phase 2 du chantier référentiel entreprise. Permet de **valider à posteriori** les fiches créées en flux d'attribution (statut `PENDING`) et de **fusionner les doublons** détectés automatiquement. Ferme la boucle promise au client : « si l'entreprise n'existe pas et on rentre dans un processus de création éventuellement soumis à validation ultérieurement ».

### Migration `018_mp_entreprise_merge_support.sql`

- Ajoute la colonne `merged_into_id UUID REFERENCES mp_entreprise(id)` + index partiel
- Permet de tracer l'historique de fusion : « cette fiche a été fusionnée vers X »
- Le statut `MERGED` (déjà autorisé en check constraint depuis 017) prend tout son sens
- **Exécutée sur Neon** : `ALTER TABLE` idempotent, exécution propre

### Nouvel écran admin — `/admin/mp-entreprises`

3 onglets :

**1. « ⏳ À valider »** — Liste des fiches `validationStatus = 'PENDING'`
- Affiche raison sociale, NCC, contacts, banque, date de création
- Actions par fiche : **✓ Valider** (passe en `VALIDATED`, traçabilité avec `validationDate`) et **✕ Rejeter** (passe `actif = false`, n'apparaîtra plus dans le picker)
- Empty state si aucune fiche en attente

**2. « 🔗 Doublons probables »** — Détection automatique de fiches similaires
- Deux algorithmes de regroupement :
  - **NCC identique** (case-insensitive) → groupe certain, confiance 100 %
  - **Raison sociale fuzzy ≥ 85 %** (via `similarity()` de #43.a) → groupe probable, confiance ≥ 85 %
- Pour chaque groupe, action **« → Fusionner vers X »** :
  - Si 1 seule cible candidate → bouton direct
  - Si plusieurs → select + bouton (l'admin choisit la fiche maîtresse)

**3. « 📋 Toutes les fiches »** — Vue consultation avec badges de statut

### Cœur de la modif — Opération de fusion

Au clic sur « Fusionner » :
1. **Confirmation** explicite avec rappel : « action irréversible »
2. **Scan exhaustif** des références à la fiche source dans :
   - `mp_attribution.attributaire.entrepriseId` (racine)
   - `mp_attribution.attributaire.entreprises[].entrepriseId` (tous les rôles : TITULAIRE, MANDATAIRE, COTITULAIRE)
   - `mp_attribution.sousTraitants[].entrepriseId`
   - `mp_attribution.parLot[lotId].attributaire.*` + `sousTraitants[]` (mode multi-lot)
   - `mp_procedure.soumissionnaires[].entrepriseId`
3. **Mise à jour** de chaque référence pour pointer vers la cible (immutability : `{ ...obj, entrepriseId: targetId }`)
4. **Marquage** de la fiche source : `validationStatus: 'MERGED'`, `mergedIntoId: <targetId>`
5. **Invalidation** du cache du picker (les pickers ouverts retrouveront la liste filtrée au prochain fetch)
6. **Feedback** : nombre d'attributions / procédures mises à jour

### Filtrage dans le picker

`entreprise-picker-mp.js` filtre désormais les fiches `MERGED` à l'affichage : `actif !== false && validationStatus !== 'MERGED'`. Les attributions qui pointaient vers la fiche source pointent maintenant vers la cible → leur picker affichera correctement la fiche maîtresse.

### Schema JS

Ajout du champ `mergedIntoId: null` sur `MP_ENTREPRISE`.

### Navigation

- Route enregistrée dans `main.js` : `/admin/mp-entreprises`
- Lien ajouté dans la sidebar Administration : « 🏢 Entreprises (Marché+) »

### Garde-fous

- Toutes les mises à jour passent par `dataService.update()` (transactions Worker)
- Si une mise à jour échoue à mi-parcours, les autres déjà appliquées restent (pas de transaction distribuée) — l'admin peut relancer la fusion, qui sera idempotente (les références déjà pointant vers la cible sont skippées par `=== sourceId` check)
- Pas de suppression physique : la fiche source reste en base avec son historique, juste filtrée à l'affichage
- Le `mergedIntoId` permet à un futur écran d'historique de remonter la chaîne si besoin

### Fichiers

- Nouveau : `sidcf-portal/js/admin/mp-entreprises-validation.js` (~370 lignes)
- Nouveau : `postgres/migrations/018_mp_entreprise_merge_support.sql`
- Modifié : `sidcf-portal/js/main.js` (import + route)
- Modifié : `sidcf-portal/js/ui/sidebar.js` (lien admin)
- Modifié : `sidcf-portal/js/datastore/schema.js` (champ `mergedIntoId`)
- Modifié : `sidcf-portal/js/ui/widgets/entreprise-picker-mp.js` (filtre `MERGED`)

Pas de Worker touché. Migration SQL exécutée. Le chantier référentiel entreprise est complet (Modif #43 + #44).

## 2026-05-20 — Picker entreprise dans les cotitulaires du groupement CONJOINT (clôture Modif #43)

> **Modif #43.b.3** — Dernière sous-modif de la Phase 1 du chantier référentiel entreprise. Câble le picker dans les **cards dynamiques des co-titulaires** d'un groupement CONJOINT (les membres autres que le mandataire). Modif #43 est désormais complète sur tous les sites de saisie d'entreprise du module Marché+.

### Comportement

- Chaque card co-titulaire (créée dynamiquement via `addCoTitulaire()`) reçoit son propre picker
- L'état du picker est mirorré vers les 6 hidden inputs `attr-cotit-${idx}-{entreprise-id,raison-sociale,ncc,adresse,telephone,email}` que `readCoTitulaireFromDOM()` lisait déjà → zéro modification de la logique de persistance
- À l'autofill : pré-remplissage de la banque + agence du co-titulaire via `_prefillBanqueSection(prefix, entreprise)` (déjà introduit en #43.b.1)
- Mise à jour immédiate du `_coTitulairesState[idx]` à l'`onChange` pour éviter perte de saisie en cas de re-render (ajout/suppression d'un autre membre)
- Déclenchement de la détection sanctions groupement à chaque changement de picker
- Le schéma initial de l'état co-titulaire (`addCoTitulaire`) inclut désormais `entrepriseId: null`

### handleSave — entrepriseId persisté pour chaque cotitulaire

L'objet `entMember` construit dans la boucle des cotitulaires reçoit `entrepriseId: m.entrepriseId || null` aux côtés des autres champs identité.

### Bilan global Modif #43

| Sous-modif | Périmètre | SHA |
|---|---|---|
| #43.a | Foundation : lib fuzzy + widget picker + migration 017 (10 entreprises backfillées) + schéma JS | `138dc075` |
| #43.b.1 | Attribution : SIMPLE + MANDATAIRE du groupement | `4db73ea7` |
| #43.b.2 | sous-traitants + soumissionnaires + badges fiche liée (fiche de vie + exécution) | `04cbb027` |
| #43.b.3 | Cotitulaires du groupement CONJOINT | _ce commit_ |

Reste à venir : **Modif #44** — Admin queue PENDING + fusion doublons (couvre le workflow de validation a posteriori des fiches créées en flux).

#### Fichier touché

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` — `addCoTitulaire()` + `readCoTitulaireFromDOM()` + `renderCoTitulaireCard()` + branche cotitulaires de `handleSave()`

Pas de Worker, pas de migration DB. Rétrocompat préservée sur les groupements déjà saisis (hidden inputs initialisés depuis les données existantes).

## 2026-05-20 — Picker entreprise dans sous-traitants + soumissionnaires + badges d'affichage

> **Modif #43.b.2** — Suite immédiate de #43.b.1. Câblage du picker entreprise dans les 2 widgets restants de saisie (sous-traitants et soumissionnaires) et ajout de badges visuels « 🏢 Fiche entreprise liée » sur les 2 écrans de lecture (fiche de vie + exécution OS). Les **cotitulaires d'un groupement conjoint** sont reportés à `#43.b.3` (cards dynamiques imbriquées, refonte plus invasive).

### Intégration dans `widgets/sous-traitants-manager-mp.js`

- Modale d'édition d'un sous-traitant : remplace les 4 inputs identité (raison sociale, NCC, adresse, téléphone) par le picker + 5 inputs cachés mirorrés
- Le `draft` reçoit un champ `entrepriseId` (initialisé à `null` pour les créations, préservé en édition)
- À l'`onChange` du picker : mirror vers hidden inputs + dispatch `input` event pour déclencher la détection sanctions existante
- Le payload de save inclut désormais `entrepriseId` aux côtés des autres champs

### Intégration dans `widgets/soumissionnaires-widget.js`

- Différence d'architecture : ce widget est une **classe ES6** utilisant `FormData` au submit, pas des IDs DOM
- Approche adaptée : hidden inputs avec `name="entrepriseId"`, `name="ncc"`, `name="raisonSociale"` — lus nativement par FormData
- Pré-remplissage automatique de la banque et du numéro de compte depuis la fiche maître à l'autofill
- `loadData()` préserve désormais `entrepriseId` lors du chargement de soumissionnaires existants

### Badges d'affichage sur les écrans lecture

#### `ecr01c-fiche-marche.js` — section Attribution de la fiche de vie
- Détection : `attributaire.entrepriseId || attributaire.entreprises[0]?.entrepriseId`
- Badge bleu pâle « 🏢 Fiche entreprise liée » à côté du titre de la section si rattachement au référentiel
- **Bonus** : correction d'un bug d'affichage des champs attributaire (raison sociale, NCC, adresse, …) qui lisaient `attributaire.<champ>` au lieu de `attributaire.entreprises[0].<champ>` — la première forme est toujours vide dans la structure actuelle. Désormais fallback chaîné `entreprises[0].<champ> || attributaire.<champ> || '-'` pour rester compatible legacy.
- Champ « Nature » dérivé proprement de `attributaire.singleOrGroup` + `groupType` (au lieu d'un champ `natureGroupement` qui n'existait pas)

#### `ecr04a-execution-os.js` — encart « Marché visé »
- Badge inline « 🏢 fiche liée » à côté du nom de l'attributaire quand `entrepriseId` est présent
- `renderField()` adapté pour accepter un `HTMLElement` en valeur (en plus de la string) — backward compat préservée

### Reste à faire — Modif #43.b.3

- Cotitulaires du groupement CONJOINT (sub-cards dynamiques rendues par `renderCoTitulaireCard()`) — picker par cotitulaire avec gestion du re-render à l'ajout/suppression
- Backfill optionnel des sous-traitants et soumissionnaires existants vers le référentiel `mp_entreprise` (migration 018 si jugé utile)

#### Fichiers touchés

- `sidcf-portal/js/ui/widgets/sous-traitants-manager-mp.js` (import + draft + grid replacement + payload)
- `sidcf-portal/js/widgets/soumissionnaires-widget.js` (import + form replacement + loadData + handleFormSubmit)
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (badge + fallback chaîné)
- `sidcf-portal/js/modules/marche-plus/screens/ecr04a-execution-os.js` (badge + renderField polyvalent)

Pas de Worker, pas de migration DB. Compatibilité ascendante préservée sur tous les sous-traitants/soumissionnaires existants (les hidden inputs garantissent que les anciennes données restent affichées correctement même sans `entrepriseId`).

## 2026-05-20 — Picker entreprise dans l'écran Attribution (SIMPLE + MANDATAIRE)

> **Modif #43.b.1** — Première intégration concrète du picker entreprise (livré en Modif #43.a) dans l'écran `ecr03a-attribution.js`. Couvre les deux cas principaux : l'**entreprise unique** attributaire et le **mandataire** d'un groupement. Les cotitulaires, sous-traitants et soumissionnaires sont reportés à `#43.b.2` pour permettre une validation visuelle intermédiaire.

### Approche : minimal-invasive avec inputs cachés mirorrés

Le code existant (sanctions check, handleSave, validations) lit les champs `attr-raison-sociale`, `attr-ncc`, etc. via leurs `id` DOM. Pour éviter de tout refondre et minimiser le risque de régression, on garde ces inputs **en `type="hidden"`** et on les mirorre depuis le state du picker à chaque `onChange`.

Bénéfices :
- Le triggerSanctionCheck() existant fonctionne sans modification
- handleSave() lit toujours les mêmes IDs et ne change que sur 1 point : récupération supplémentaire de `attr-entreprise-id` (ou `attr-mandataire-entreprise-id`)
- Si l'attribution existante n'a pas d'`entrepriseId` (données legacy) → le picker bascule en mode "search" mais les autres données sont conservées intactes dans les hidden inputs

### Intégration SIMPLE (entreprise unique attributaire)

- Remplace les 2 grilles d'inputs (raison sociale/NCC + adresse/tel/email) par `renderEntreprisePicker(...)` au-dessus de la section banque
- Inputs cachés : `attr-entreprise-id`, `attr-raison-sociale`, `attr-ncc`, `attr-adresse`, `attr-telephone`, `attr-email`
- À l'`onChange` du picker : mirror des 6 inputs + pré-remplissage de la section coordonnées bancaires depuis l'autofill + déclenchement de la détection sanctions

### Intégration MANDATAIRE (groupement)

Même pattern avec préfixe `attr-mandataire-*`. Le groupement reste fonctionnel : la radio SIMPLE/GROUPEMENT togle l'affichage des deux sections.

### Helpers ajoutés (haut du fichier)

- `_mirrorEntrepriseToHiddenInputs(prefix, entreprise)` — synchronise les 6 inputs cachés depuis l'objet entreprise du picker
- `_prefillBanqueSection(prefix, entreprise)` — pré-remplit banque/agence/numéro/intitulé depuis la fiche maître. Reste éditable per-attribution (l'utilisateur peut surcharger). Gère le cas où `populateBanqueSelect()` async n'a pas encore peuplé le select (via `dataset.selected`).

### handleSave() — ajout de entrepriseId

- En mode SIMPLE : `entrepriseId` lu depuis le hidden input, placé dans `entreprises[0].entrepriseId` ET au niveau `attributaireData.entrepriseId`
- En mode GROUPEMENT : `entrepriseId` du mandataire placé idem dans `entreprises[0].entrepriseId` ET au niveau `attributaireData.entrepriseId`

### Reste à faire — Modif #43.b.2

- Cotitulaires (sous-cards dans le groupement CONJOINT) — picker par cotitulaire
- Widget `sous-traitants-manager-mp.js` — picker dans la modale d'édition
- Widget `soumissionnaires-widget.js` — picker dans la modale candidat
- Badges « 🏢 Fiche entreprise » sur `ecr01c-fiche-marche.js` (display attributaire) et `ecr04a-execution-os.js`

#### Fichier touché

- `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` (~120 lignes ajoutées/modifiées) — import + 2 state vars + 2 helpers + 2 intégrations + 2 modifs handleSave

Pas de Worker, pas de migration DB. Aucune régression sur le mode SOLIDAIRE ou les attributions legacy (les hidden inputs garantissent la rétrocompat).

## 2026-05-20 — Foundation picker entreprise (Phase 1.a)

> **Modif #43.a** — Discussion avec le client sur la qualité du référentiel d'entreprises : actuellement les saisies (attribution, sous-traitants, soumissionnaires) sont en champs libres → doublons et incohérences. Approche retenue : **mix lookup + création contrôlée**. Quand l'entreprise existe, on l'appelle depuis le référentiel `MP_ENTREPRISE` (autofill verrouillé) ; sinon on entre dans un processus de création inline avec NCC obligatoire (unicité technique), détection fuzzy des doublons probables, et statut `PENDING` pour validation a posteriori par l'admin (workflow couvert en Modif #44).

> Cette modif est livrée en 2 sous-modifs : **#43.a (foundation)** = lib + widget + migration + schema. **#43.b (intégration)** = câblage dans les 3 écrans de saisie (attribution, sous-traitants, soumissionnaires) + badges d'affichage sur les écrans lecture.

### Modif #43.a — Foundation du picker entreprise

#### Nouveau module — `js/lib/entreprise-fuzzy-mp.js`

Utilitaires de comparaison fuzzy pour la détection de doublons :
- `normalizeRaisonSociale(str)` — minuscules, sans accents, sans ponctuation, retire les formes juridiques (SARL, SA, SAS, …) qui parasitent la comparaison
- `similarity(a, b)` — score ∈ [0, 1] basé sur la distance de Levenshtein sur chaînes normalisées
- `findSimilarEntreprises(rs, list, threshold=0.85)` — retourne les fiches qui ressemblent à un nom donné
- `searchEntreprises(query, list, max=10)` — recherche typeahead (NCC prefix, raison sociale substring, fuzzy fallback)

Pas de dépendance externe. Algorithme O(n×m) sur Levenshtein, suffisant pour ≤ qq milliers d'entreprises et de la détection « à la saisie ».

#### Nouveau widget — `js/ui/widgets/entreprise-picker-mp.js`

Composant universel à 2 modes :
- **Mode "search"** (entreprise non liée) : input typeahead avec debounce 250 ms, dropdown de suggestions (≥ 2 caractères), CTA « + Créer la nouvelle entreprise « X » » en bas si rien ne matche
- **Mode "card"** (entreprise sélectionnée) : carte lecture seule avec raison sociale + NCC + adresse + tel + email + banque, badge « ⏳ À valider » si statut PENDING, boutons « ✏️ Modifier la fiche » (impact référentiel) et « 🔄 Changer » (re-pickage)

Modale de création inline (`openCreateEntrepriseModal`) :
- Champs : raison sociale (obligatoire), NCC (obligatoire, unique), RCCM, adresse, tel, email, banque (libellé + agence), compte (type + numéro)
- **Détection fuzzy à la saisie** : pendant que l'utilisateur tape la raison sociale, si une fiche existante a similarité ≥ 85 %, un bandeau rouge propose « → Cliquer pour utiliser cette fiche » avant d'autoriser la création
- Vérification d'unicité NCC côté client (alerte si conflit, en plus de la contrainte SQL `UNIQUE`)
- Création avec `validationStatus: 'PENDING'` par défaut → visible dans la queue admin (Modif #44)
- Cache module-level 30 s pour éviter les re-fetch du référentiel

API :
```js
renderEntreprisePicker({
  initialValue,      // { entrepriseId, raisonSociale, ncc, ... } ou null
  onChange,          // (entreprise|null) => void
  onEditMaster,      // (id) => void  — optionnel
  required, disabled, allowCreate
})
```

#### Migration `017_mp_entreprise_validation_status_and_backfill.sql`

- **Colonnes ajoutées** sur `mp_entreprise` : `validation_status` (`PENDING|VALIDATED|MERGED`, défaut `VALIDATED`, check constraint), `validation_by`, `validation_date` + index `idx_mp_entreprise_validation_status`
- **Backfill depuis `mp_attribution.attributaire->'entreprises'`** : dédoublonnage NCC d'abord (case-insensitive), raison sociale normalisée alphanumérique en fallback. Toutes les fiches existantes et backfillées sont marquées `VALIDATED`.
- **Résultat exécution** : 10 entreprises insérées, 1 skippée (raison sociale invalide), total 13 fiches dans `mp_entreprise` (3 préexistantes + 10 backfill), 100 % `VALIDATED`.
- **Scope volontairement réduit pour v1** : pas de backfill des sous-traitants ni des soumissionnaires (structures JSONB moins stables), pas d'injection de `entrepriseId` dans les JSONB existants (frontend gérera le dual-mode au runtime), pas de gestion multi-lot (`attributaire.parLot[lotId].entreprises[]`).

#### Schema JS — `js/datastore/schema.js`

Ajout des champs `validationStatus`, `validationBy`, `validationDate` sur `MP_ENTREPRISE`.

#### Reste à faire pour Modif #43.b

- Intégration dans `ecr03a-attribution.js` (entreprise unique + cotraitants du groupement)
- Intégration dans `widgets/sous-traitants-manager-mp.js`
- Intégration dans `widgets/soumissionnaires-widget.js`
- Badges « 🏢 Fiche entreprise » sur `ecr01c-fiche-marche.js` et `ecr04a-execution-os.js`

Pas de Worker touché. Migration SQL exécutée sur Neon.

## 2026-05-19 — Libellés des étapes Marché+ alignés sur le vocabulaire client

> **Modif #41** — Observation client sur la liste PPM Marché+ et sur les badges « étape » des tableaux : les libellés actuels (« Planifié », « En procédure », « Visé », « Clôturé ») ne correspondent pas aux termes attendus par le métier. Renommage scrupuleux sur tout le module Marché+ sans toucher au registre global (qui reste utilisé tel quel par le module Marché original). Bonus : correction du bug d'affichage du code brut « EN_EXEC » dans la colonne État.

### Mapping appliqué

| Code (inchangé en base) | Avant | Après |
|---|---|---|
| `PLANIFIE` | Planifié | **En Planification** |
| `EN_PROC` | En procédure | **En Contractualisation** |
| `ATTRIBUE` | Attribué | **Attribué** |
| `VISE` | Visé | **Approuvé** (étape d'approbation) |
| `EN_EXEC` | EN_EXEC (bug) | **En exécution** |
| `CLOS` | Clôturé | **Achevé** |
| `RESILIE` | Résilié | **Résilié** |

Renommage en parallèle des KPI de la liste PPM : « Total marchés et contrats » → **Total marché planifié** et « Montant Total (F CFA) » → **Montant total prévisionnel**. Les 5 tuiles phases sont préfixées « En » quand approprié.

### Source unique de vérité

Nouveau module `sidcf-portal/js/modules/marche-plus/etat-labels-mp.js` qui exporte `ETAT_LABEL_MP` (map code → libellé Marché+) et un helper `getEtatLabelMP(code, registries)`. Surcharge le registre global `ETAT_MARCHE` (qui contient toujours les anciens libellés pour le module Marché original).

#### Fallback en chaîne

`ETAT_LABEL_MP[code] → registry.label → code brut` — toute opération avec un etat inconnu reste lisible. Couvre aussi `EXECUTION` et `CLOTURE` (codes legacy) en sécurité.

#### Fichiers consommateurs alignés

- `ecr01b-ppm-unitaire.js` — 4 sites : filtre État du dropdown, badge ligne du tableau résultats, modale Détails opération, drawer « voir détail » des tuiles santé
- `ecr01c-fiche-marche.js` — badge état du header sticky
- `ecr06-dashboard-cf.js` — 2 sites : distribution des états + activité récente · 1 texte d'alerte « marché(s) visé(s) » → « marché(s) approuvé(s) »
- `widgets/budget-line-history-mp.js` — badge état dans le tableau d'historique d'utilisation
- `widgets/related-operations-mp.js` — badge état des opérations liées (chaîne de projet)

Pas de migration DB. Pas de changement Worker. Aucun code ni clé technique (PLANIFIE, EN_PROC, VISE…) n'est modifié — toute la logique métier conditionnelle (`etat === 'VISE'`, etc.) continue de fonctionner à l'identique.

## 2026-05-19 — Drawers « arrière-table » sur les 5 tuiles KPI de la fiche de vie

> **Modif #42** — Observation client sur la fiche de vie d'un marché : les tuiles KPI (Cumul avenants, Échéancier planifié, Garanties, Ordres de service, Difficultés) affichent un chiffre/pourcentage mais ne donnent pas accès à la liste détaillée derrière. Ajout d'une icône `+` discrète dans le coin bas-droite de chaque tuile qui ouvre un drawer latéral présentant la liste lecture seule des enregistrements, avec navigation vers l'écran dédié au clic sur une ligne.

### Comportement implémenté

- Bouton `+` (22 px, cercle bordé à la couleur du KPI, tooltip explicite « Voir la liste des… »)
- Au clic → drawer glissant depuis la droite (animation, fermeture Échap / clic extérieur / bouton ✕)
- Listing **strict lecture seule** — aucun formulaire, aucun écran reconstruit
- Clic sur une ligne → navigation vers l'écran dédié du marché en cours, dans le bon contexte de lot

### Tuile → contenu drawer → cible de navigation

| Tuile | Filtre / colonnes | Destination au clic |
|---|---|---|
| **Cumul avenants** | Avenants approuvés par le CF (`dateApprobation` non null). Colonnes : N°, Type, Signature, Approbation, Variation, Motif | `/mp/avenants?idOperation=…&lotId=…` |
| **Échéancier planifié** | Items de l'échéancier (#, Libellé, %, Montant, Échéance) | `/mp/echeancier?idOperation=…` |
| **Garanties** | Garanties du lot courant (Type, Montant, Émission, Échéance, État) | `/mp/garanties?idOperation=…&lotId=…` |
| **Ordres de service** | Tous les OS du marché (N°, Type, Émission, Objet) | `/mp/execution?idOperation=…` |
| **Difficultés** | Toutes les difficultés (Date, Impact, Statut, Description) | Scroll vers `#section-difficultes` de la fiche courante |

### Garde-fous

- **Zéro régression CRUD** : tous les clics navigent vers les écrans existants déjà testés. Aucun formulaire reconstruit dans le drawer.
- **Empty state contextuel** : ex. « 2 avenants en cours d'approbation par le CF » sur la tuile Cumul avenants quand rien n'est encore approuvé.
- **Tri stable** : avenants par numéro, OS/garanties/difficultés par date desc, échéances par ordre.
- **Bouton + non intrusif** : ne masque pas le badge 📐 (formule) qui reste en haut.

#### Fichiers

- Nouveau : `sidcf-portal/js/ui/widgets/kpi-drilldown-drawer-mp.js` (~190 lignes)
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` :
  - `renderKpiCard` accepte 2 nouveaux params optionnels (`onPlusClick`, `plusTitle`)
  - `renderHealthKPIs` reçoit `idOperation` (mis à jour côté call site)
  - 5 fonctions inline `openXxxDrilldownDrawer(...)` qui préparent les données + colonnes + handler de clic
  - Section Difficultés reçoit un anchor `#section-difficultes` pour le scroll

Pas de Worker ni de DB touchée. Pas de déploiement.

## 2026-05-19 — Modélisation TYPE_DOSSIER_APPEL conforme DGMP + propagation matrice pièces

> **Modif #40** — Suite logique de la Modif #39 (retrait des sigles fantômes). Après vérification des sources officielles, on intègre les **4 types de dossier d'appel qui manquaient** dans la nomenclature ivoirienne, avec propagation effective sur la matrice des pièces obligatoires et sur le filtrage UI.

### Modif #40.a — Refonte du référentiel `TYPE_DOSSIER_APPEL`

Refonte de `sidcf-portal/js/config/registries.json` avec **9 types officiellement attestés** (au lieu de 4) :

| Code | Libellé | Modes liés | Source officielle |
|---|---|---|---|
| `DAO` | Dossier d'Appel d'Offres | AOO, AOO_PREQUALIF, AOO_2ETAPES, AOO_CONCOURS, AON, AOI, AOR | Décrets 2013-404/405 |
| `DTAO_PI` | DTAO Prestations Intellectuelles | PI, PI_CABINET, PI_INDIVIDUEL | Décret 2013-406 |
| `AMI` | Avis à Manifestation d'Intérêt | DEM, PI_CABINET, CI | Code MP — Ord. 2019-679 |
| `DC` | Demande de Cotation | PSC | Décret 2021-909 |
| `DOSSIER_CONS_PSL` | Dossier de consultation — PSL | PSL | Décret 2021-909 (Art. 16) |
| `DOSSIER_CONS_PSO` | Dossier de consultation — PSO | PSO | Décret 2021-909 (Art. 16) |
| `BC_PROFORMA` | Bon de commande + Facture pro forma | PSD | Décret 2021-909 (PSD) |
| `LETTRE_GAG` | Lettre de marché négocié (Gré à gré) | ENTENTE_DIRECTE, RECONDUCTION | Ord. 2019-679 |
| `AUTRE` | Autre dossier | (libre) | — |

### Modif #40.b — Matrice des pièces obligatoires alignée

Mise à jour de `sidcf-portal/js/config/pieces-matrice.json` — **impact effectif sur la checklist documentaire** affichée à chaque phase du processus.

**Phase INVITATION** — pièces ajoutées avec champ `source` (texte fondateur) :
- `BON_COMMANDE` + `FACTURE_PROFORMA` (obligatoires pour PSD)
- `AUTORISATION_DMP_GAG` + `LETTRE_GAG` (obligatoires pour ENTENTE_DIRECTE)
- `DTAO_PI` (obligatoire pour PI / PI_CABINET / PI_INDIVIDUEL)
- `TDR` étendu aux modes PI* (en plus de PSO/CI)
- `COURRIER_INVITATION` étendu aux modes PI*
- Suppression du doublon `DAC` qui faisait redondance avec `DAO`

**Phase OUVERTURE / ANALYSE / JUGEMENT** — extension aux modes manquants :
- PI / PI_CABINET ajoutés à toutes les pièces de commission (liste présence, mandat, PV, grille, comité d'évaluation)
- PSL ajouté à la phase ANALYSE (lacune corrigée — il était déjà en OUVERTURE et JUGEMENT)
- Nouvelle pièce `PROCES_VERBAL_NEGOCIATION` en ANALYSE pour ENTENTE_DIRECTE
- Nouvelle pièce `PV_NEGOCIATION_PI` en JUGEMENT pour la négociation contractuelle PI

### Modif #40.c — Filtrage UI dynamique

Mise à jour de `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` (lignes 668-678) : le dropdown « Type de dossier d'appel » est désormais **filtré par mode de passation** courant — l'utilisateur en mode PSD ne voit plus les options DAO/AMI/DTAO_PI, mais uniquement `BC_PROFORMA` et `AUTRE`. Le hint utilisateur indique dynamiquement le mode actif.

### Modif #40.d — Cohérence des commentaires schema

`sidcf-portal/js/datastore/schema.js` (2 occurrences) — commentaire `typeDossierAppel` aligné sur la liste complète et pointant vers `registries.TYPE_DOSSIER_APPEL` comme source de vérité.

### Impact processus

- **UI checklist documentaire** : à la phase Invitation, l'utilisateur d'une PSD voit désormais 2 cases obligatoires (BC + facture pro forma) au lieu de zéro. Idem pour ENTENTE_DIRECTE (autorisation DMP + lettre négociée) et PI (DTAO PI + TDR).
- **Validation côté agent CF** : les contrôles « pièces manquantes » du moteur de règles seront déclenchés sur les bons documents pour chaque mode — réduit le risque de visa accordé sur dossier incomplet.
- **Reporting / traçabilité** : chaque pièce porte désormais un champ `source` citant le texte officiel — facilite l'auditabilité et l'explicabilité réglementaire vis-à-vis de la DMP.

### Périmètre **non** modifié (volontairement)

- Le module legacy `js/modules/marche/screens/ecr02a-procedure-pv.js` n'est pas mis à jour (Marché+ uniquement).
- `rules-config.json` section `contextualite_procedures` : les `documents_requis` pour PSD étaient déjà `BON_COMMANDE` + `FACTURE_PROFORMA` ✅ ; aucune modélisation `ENTENTE_DIRECTE` n'existe encore dans cette section (à traiter en modif ultérieure si besoin).
- Garanties phase EXECUTION : `GARANTIE_BONNE_EXEC` reste obligatoire pour PSO dans la matrice alors que la config la marque « optionnelle mais recommandée ». Divergence à arbitrer hors scope.

### Action déploiement

Aucun `wrangler deploy` requis — modifs purement front (JSON + JS statiques). Pas de migration SQL.

---

## 2026-05-19 — Nettoyage TYPE_DOSSIER_APPEL : retrait des sigles non officiels (AONO, DPI, DPS)

> **Modif #39** — Question explicite du client sur l'origine des sigles AONO, DPI et DPS dans le champ « Type de dossier d'appel ». Vérification croisée des sources officielles (Ordonnance n°2019-679 du 24/07/2019 portant Code des marchés publics, Décret n°2021-909 du 22/12/2021 sur les procédures simplifiées, Décrets n°2013-404/405/406 sur les DTAO, Arrêté n°112/MPMBPE/DGBF/DMP du 08/03/2016, ainsi que la page officielle DGMP `marchespublics.ci/dossier_appeloffre`) : aucun de ces trois sigles n'apparaît dans la nomenclature ivoirienne officielle. Retrait pur et simple.

- **AONO** « Avis d'Offres Négociées » → inexistant en CI et dans l'UEMOA ; pour l'entente directe, le Code parle de « marché négocié » / « gré à gré ».
- **DPI** « Demande de Prix » → existe au Burkina Faso (sigle DP) mais pas en CI ; équivalent ivoirien = PSC + Demande de Cotation (DC), déjà présente.
- **DPS** « Dossier de Procédure Spécialisée » → introuvable dans tout texte officiel ; pour PSO la DGMP utilise « Dossier de consultation » ou « Dossier de référence » (à modéliser dans une modif ultérieure si besoin).

Fichiers touchés :
- `sidcf-portal/js/config/registries.json` — suppression des 3 entrées `TYPE_DOSSIER_APPEL`.
- `sidcf-portal/js/datastore/schema.js` — commentaires mis à jour (2 occurrences) : `DAO | AMI | DC | AUTRE`.

Impact :
- **UI** : les listes déroulantes « Type de dossier d'appel » n'afficheront plus AONO/DPI/DPS. Les marchés existants ayant éventuellement l'une de ces valeurs en base conservent la donnée (pas de migration destructive), mais l'utilisateur devra rebasculer vers une valeur officielle à la prochaine édition.
- **Worker / DB** : aucun changement côté backend ni Worker (le champ est `text` libre côté SQL). Pas de migration nécessaire.

Action déploiement : aucun `wrangler deploy` requis — modif purement front (JSON statique servi tel quel).

---

## 2026-05-15 — Imputation budgétaire + Module sous-traitance (séance métier §3.a + §5.g)

> **Modif #38** — Deux points résiduels du mail de synthèse de la séance du 6 mai : renommage généralisé « Ligne budgétaire » → « Imputation budgétaire » dans les libellés UI (§3.a), et ajout d'un module de gestion des sous-traitants déclarés à l'attribution (§5.g).

### Modif #38.a — Renommage « Ligne budgétaire » → « Imputation budgétaire »

Renommage de tous les libellés visibles utilisateur. Les noms techniques (table `mp_budget_line`, entité `MP_BUDGET_LINE`, champ JSONB `chaineBudgetaire.ligneBudgetaire`) restent inchangés pour ne pas casser les données existantes — seuls les libellés UI évoluent.

Fichiers touchés (libellés uniquement) :
- `ecr01b-ppm-unitaire.js` — modale Détails opération
- `ecr01d-ppm-create-line.js` — formulaire création (label calculé + aide multi-financement)
- `ecr01c-fiche-marche.js` — section Planification (titre du sous-bloc)
- `budget-line-viewer.js` — drawer + carte synthétique + alerte vide
- `chaine-programmatique-display.js` — récap chaîne
- `budget-line-history-mp.js` — message d'erreur + titre formule 📐

Les commentaires de code (non visibles utilisateur) restent en l'état pour ne pas polluer le diff.

### Modif #38.b — Module sous-traitance dans l'Attribution

**Schéma** : ajout du champ `MP_ATTRIBUTION.sousTraitants: []`. Chaque entrée porte `{ raisonSociale, ncc, adresse, telephone, prestations, pourcentageMarche, agrementCF: bool, agrementCFDocRef, dateDeclaration }`.

**Nouveau widget** `sidcf-portal/js/ui/widgets/sous-traitants-manager-mp.js` (~280 lignes) :
- **Synthèse en tête** : nombre de sous-traitants + cumul `Σ pourcentageMarche` avec code couleur (vert ≤ 30 %, jaune 30-40 %, rouge > 40 %). Badge 📐 explique la règle (plafond légal indicatif 40 % — Code MP CI Art. 130).
- **Tableau** : raison sociale, NCC, prestations tronquées, % marché, badge agrément CF (✓ Agréé / ⚠ Non agréé), actions modifier/supprimer.
- **Détection sanctions** automatique : pour chaque sous-traitant listé, appel asynchrone à `checkSanction()` avec filtrage par période active (modif #30). Si une sanction est trouvée, un bandeau d'alerte s'affiche sous la ligne du sous-traitant. Détection live dans le modal d'édition aussi (debounce 300 ms sur raison sociale + NCC).
- **Modal d'édition** : tous les champs + checkbox Agrément CF + référence document. Validation : raison sociale obligatoire, % entre 0 et 100.

**Intégration dans `ecr03a-attribution.js`** :
- Nouvelle section « 🤝 Sous-traitance déclarée » insérée entre les Garanties et les Réserves CF.
- État module-level `_sousTraitantsState` persisté à la sauvegarde dans `MP_ATTRIBUTION.sousTraitants` (et respecte le multi-lot via `buildLotPatch`).

**Intégration dans la fiche de vie** (`ecr01c-fiche-marche.js`) :
- Section Attribution enrichie : sous-tableau lecture seule des sous-traitants déclarés avec cumul affiché en titre. Alerte si cumul > 40 %.

### Point §5.f (paiements séparés cotraitants) — confirmé OK

Le user a confirmé que côté Marché+ il suffit de collecter les coordonnées bancaires de chaque cotraitant (déjà livré en modif #20). L'orchestration des paiements séparés se fait côté module budget à l'exécution des OP / Mandats. Aucune action supplémentaire sur Marché+.

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/sous-traitants-manager-mp.js`
- Modifiés : `schema.js` (ajout champ `sousTraitants` sur `MP_ATTRIBUTION`), `ecr03a-attribution.js` (section + état + persistance), `ecr01c-fiche-marche.js` (affichage lecture-seule)
- Renommage UI (#38.a) : `ecr01b-ppm-unitaire.js`, `ecr01d-ppm-create-line.js`, `ecr01c-fiche-marche.js`, `budget-line-viewer.js`, `chaine-programmatique-display.js`, `budget-line-history-mp.js`

Pas de migration DB (champ JSONB existant). Pas de déploiement Worker.

## 2026-05-15 — Transparence des formules : badges 📐 partout où il y a un calcul

> **Modif #37** — Toutes les formules et méthodes d'évaluation sont désormais explicitement exposées via un badge cliquable 📐 placé à côté du KPI ou de l'indicateur correspondant. Cela permet aux métiers de vérifier que la méthode appliquée correspond à leur attente, et aux devs de garantir la prise en compte sans dérive.

### Modif #37 — Composant réutilisable `formula-tip-mp.js`

#### Nouveau widget
- **`renderFormulaBadge(opts)`** : petite icône 📐 (18px, cercle) inline à côté d'un libellé. Tooltip natif au survol (titre + formule + règle + réf), popup détaillé au clic avec sections « Formule », « Règle métier », « Exemple », « Référence ». Fermeture du popup au clic extérieur.
- **`renderFormulaBlock(opts)`** : variante encart visible en permanence sous un KPI (à utiliser pour les indicateurs centraux où la transparence prime sur la compacité).
- API : `{ titre, formule, regle, exemple, reference }`. Toutes les clés sauf `titre` sont optionnelles.

#### Intégration sur les zones de calcul

| Zone | Indicateur enrichi | Formule exposée |
|---|---|---|
| Fiche de vie — KPI Cumul avenants | `Σ variationMontant / montantInitial × 100` | Seuil 30 % RG021 |
| Fiche de vie — KPI Échéancier planifié | `Σ items[].pourcentage` | Doit valoir 100 % |
| Fiche de vie — KPI Garanties | `count(etat=ACTIVE) · count(etat=EXPIREE)` | Active = dans la période [émission, échéance] |
| Fiche de vie — KPI Ordres de service | `count(MP_ORDRE_SERVICE)` | OS obligatoire pour passage exécution (RG017) |
| Fiche de vie — KPI Difficultés | `count(statut=EN_COURS) par impact` | Code couleur selon gravité |
| Situation exécution — Montant global | `attribution.ttc + Σ variationMontant` | Inclut avenants FINAN/MIXTE, exclut avenants délai |
| Situation exécution — Cumul OP visé | `Σ montant pour etat ∈ {VISE, PAYE}` | Référence doc DCF 5b |
| Situation exécution — Cumul payé | `Σ montant pour etat = PAYE` | Toujours ≤ Cumul visé |
| Situation exécution — Reste à payer | `max(0, montantGlobal − cumulVisé)` | Référence doc DCF 5c |
| Situation exécution — Taux d'exécution financier | `cumulVisé / montantGlobal × 100` | Code couleur vert/bleu/orange/gris · doc DCF 5d |
| Encart pluriannualité — Total + Écart | `pivot[bailleur][année]` · `planifié − exécuté` | Doc DCF 7-8 · Modif #35 |
| Liste PPM — Tuiles santé (5 catégories) | Règles de classification détaillées | Croisement état + avenants + difficultés |
| Clé Répartition — Total contributions | `Σ ligne.montant` | F013 · RG022 · doit égaler montant marché |
| Clé Répartition — Total pourcentage | `Σ ligne.pourcentage` | Doit valoir 100 % à ±0,01 % près |
| Budget Line History — Cumul ligne | `AE − (Σ autres ops + ligne courante)` | F002 · Modif #27 |
| Attribution Garanties — Plage légale | Détails par type de garantie | Art. 97.3 (BE 3-5 %) · Art. 100 (avance ≤15 %) |
| Avenant Create — Cumul avenants | `Σ variationMontant / montantInitial × 100` | RG021 · alerte 25 % · dérogation ≥30 % |

#### Bénéfices

- **Vérification métier** : un utilisateur métier peut, en un clic sur 📐, voir la formule exacte appliquée et la confronter à sa compréhension de la règle.
- **Garde-fou dev** : si la formule indiquée diverge du code, c'est visible directement dans la UI — pas besoin d'inspecter le source.
- **Document vivant** : chaque référence légale (Art. 97.3, RG021, F011, F013…) est ancrée à l'indicateur qu'elle régit.
- **Pas de surcharge visuelle** : un petit cercle 📐 18px, popup uniquement au clic. Tooltip natif sur hover pour aperçu rapide.

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/formula-tip-mp.js` (~180 lignes)
- Modifiés : `ecr01c-fiche-marche.js`, `ecr01b-ppm-unitaire.js`, `ecr03a-attribution.js`, `ecr04b-avenant-create.js`, `op-mandat-manager-mp.js`, `pluriannualite-mp.js`, `budget-line-history-mp.js`, `cle-repartition-manager-mp.js`

Pas de migration DB. Pas de déploiement Worker.

## 2026-05-15 — Diligences DCF : exécution financière + pluriannualité + tuiles santé agrégées

> **Modifs #34 + #35 + #36** — Mise en œuvre des 4 points restants du document de diligence DCF (Hector, 26 mars). Trois modifs combinées car elles partagent la même fiche de vie et la même infrastructure de calculs financiers.

### Modif #34 — Section « Situation d'exécution financière » dans la fiche

- **Widget** `sidcf-portal/js/ui/widgets/op-mandat-manager-mp.js` (~330 lignes) :
  - Lit les OP / Mandats rattachés au marché via l'entité existante **MP_DECOMPTE** (champs `numero`, `typeOP`, `dateDecompte`, `netTTC/acompteHTVA`, `etat` DRAFT/SOUMIS/VISE/PAYE/REJETE, `bailleur`)
  - **KPIs** : Montant global du marché (base + Σ avenants), **Cumul OP/Mandat visé**, **Cumul payé**, **Reste à payer** (= montant global − cumul visé), **Taux d'exécution financier** (= cumul visé / montant global × 100). Code couleur sur le taux selon plage (vert ≥90%, bleu ≥50%, orange ≥25%, gris sinon).
  - Tableau des OP/Mandats trié par date décroissante, état avec badge coloré.
  - Saisie manuelle (CRUD) en attendant l'intégration avec le module budget externe. Le user a confirmé que **le rattachement OP↔marché est fait côté budget lors de l'exécution** — cette UI permet déjà l'affichage et la saisie pour test.
  - **Affichage conditionnel** : visible uniquement si le marché est en état EXECUTION / RESILIE / CLOS. Sinon, message informatif « Marché non encore en exécution. Les OP / Mandats apparaîtront ici dès que le marché passera à l'état Exécution. »
- **Helper exporté** `computeExecutionFinanciere(operation, attribution, avenants, decomptes)` qui retourne `{ montantGlobal, cumulVise, cumulPaye, restePayer, tauxExec, sante }` — réutilisé par les tuiles santé de la modif #36.
- **Intégration fiche** : nouvelle section « 💸 Situation d'exécution financière » insérée sous les difficultés. Chargement parallèle de `MP_DECOMPTE` ajouté au `Promise.all` existant.

### Modif #35 — Encart pluriannualité dans la fiche

Le user a confirmé que la planification pluriannuelle existe déjà dans la Clé de Répartition multi-bailleurs (chaque `MP_CLE_LIGNE` porte un champ `annee`). Cette modif rend cette information lisible et synthétique dans la fiche.

- **Widget** `sidcf-portal/js/ui/widgets/pluriannualite-mp.js` (~150 lignes) :
  - **Bandeau de synthèse** : « 📅 Marché pluriannuel sur N années : YYYY → YYYY », nombre de bailleurs, nombre de lignes, total planifié.
  - **Tableau pivot** : lignes = bailleurs (avec badge), colonnes = années, dernière colonne « Total bailleur ». Ligne en pied verte « Total planifié » par année + grand total.
  - **Si des OP/Mandats sont visés/payés** : 2 lignes supplémentaires « Exécuté à ce jour » (par année selon `dateDecompte.year`) et « Écart » (planifié − exécuté), code couleur rouge si retard, bleu si avance, vert si à l'équilibre.
  - **Affichage conditionnel** : retourne un message court si la clé de répartition est mono-annuelle (`isPluriannuel: false`) — pas d'encart si pas pluriannuel.
- **Intégration fiche** : nouvelle section « 📅 Pluriannualité — répartition année par année » insérée juste après la situation d'exécution financière. Visible seulement si le marché est sur plusieurs années.

### Modif #36 — Tuiles santé agrégées sur la liste PPM

- **5 catégories de santé** définies dans `ecr01b-ppm-unitaire.js` :
  - 🟢 **En progression normale** (vert)
  - 🟡 **À surveiller** (jaune) — cumul avenants 25-30 %, ou ≥1 difficulté élevée non résolue
  - 🔴 **À risque** (rouge) — cumul avenants ≥30 %
  - ⛔ **Bloqué** (rouge foncé) — ≥1 difficulté critique non résolue, ou état RESILIE
  - ⚪ **Non démarré** (gris) — marché pas encore en exécution
- **Calcul agrégé** : `computeSanteMarche(operation, attribution, avenants, decomptes, difficultes)` produit une catégorie par marché en croisant état + cumul avenants + difficultés critiques/élevées.
- **Chargement parallèle** : la liste PPM charge désormais en `Promise.all` MP_OPERATION + MP_ATTRIBUTION + MP_AVENANT + MP_DECOMPTE + MP_DIFFICULTE. Indexation par `operationId` pour accès O(1) lors du calcul. Coût acceptable jusqu'à ~5000 opérations.
- **Tuiles cliquables** sous les KPIs phase, juste avant la zone filtres :
  - Au survol : `transform: translateY(-1px)` + ombre légère
  - Au clic sur la tuile : toggle filtre santé (mono-sélection — re-clic désactive)
  - Au clic sur « → Voir le détail » : ouvre un **drawer latéral** listant les marchés de cette catégorie (ID, objet tronqué, activité, UA, montant en millions, badge état). Clic sur un marché → navigation vers sa fiche de vie.
- **Filtres respectés** : les comptages des tuiles utilisent `filteredOps` — donc si tu filtres par bailleur ou région, les tuiles reflètent automatiquement le sous-ensemble.
- **Nouveau filtre `sante: []`** ajouté à `activeFilters`. `applyFilters` reçoit désormais `santeMap` en second paramètre pour filtrer par catégorie.

### Réponses précises aux points DCF

| Diligence DCF | Statut après ces modifs | Détail |
|---|---|---|
| 5b — Cumul OP visé / ou Mandat | ✅ | KPI dans la fiche (modif #34) |
| 5c — Reste à payer | ✅ | KPI dans la fiche (modif #34) |
| 5d — Taux d'exécution financier | ✅ | KPI dans la fiche (modif #34) |
| 5g — Soutenabilité pluriannuelle | ✅ | Encart pluriannualité (modif #35) |
| 7-8 — Pluriannualité explicite | ✅ | Encart dans la fiche (modif #35) |
| 11 — Marchés correctement / à surveiller / à risque | ✅ | Tuiles agrégées (modif #36) |
| 12 — Vue détaillée synthétique | ✅ | Drawer latéral cliquable (modif #36) |

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/op-mandat-manager-mp.js`
- Nouveau : `sidcf-portal/js/ui/widgets/pluriannualite-mp.js`
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (chargement MP_DECOMPTE + 2 sections)
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` (catégories santé + tuiles + drawer + filtre `sante`)

Pas de migration DB (entités existantes). Pas de déploiement Worker.

## 2026-05-15 — Bouton Voir restauré + boutons phase + widget dual saisissable partout

> **Modifs #32 + #33** — Deux correctifs demandés explicitement après la refonte de la fiche :
> - **#32** : ramener le bouton « 👁 Voir » dans la liste PPM et restaurer la rangée de boutons de navigation par phase dans la fiche, perdue lors de la refonte #26.
> - **#33** : corriger un cas où, dans le widget dual montant/%, seul le champ taux semblait saisissable. Garantir partout la saisie bidirectionnelle.

### Modif #32 — Restauration des boutons de suivi du processus

**Liste PPM** (`ecr01b-ppm-unitaire.js`) — 3 boutons par ligne désormais :
- **👁 Voir** *(restauré)* — ouvre la fiche de vie
- **📋 Fiche de vie** *(modif #26)* — ouvre la fiche de vie consolidée
- **ℹ️ Détails** *(existant)* — ouvre la modale rapide d'identité

Les deux premiers boutons pointent vers la même route (`/mp/fiche-marche`) mais leur cohabitation respecte les habitudes utilisateur d'avant refonte.

**Fiche de vie** (`ecr01c-fiche-marche.js`) — restauration de la **rangée de boutons par phase** :
- Sous la timeline, avant les KPIs santé — emplacement de l'ancien fichier.
- Phases dynamiques selon le mode de passation (issues de `getPhasesAsync` qui lit la config d'étapes).
- Chaque phase a une route mappée (PROCEDURE → `/mp/procedure`, ATTRIBUTION → `/mp/attribution`, VISA_CF → `/mp/visa-cf`, EXECUTION → `/mp/execution`, AVENANTS → `/mp/avenants`, CLOTURE → `/mp/cloture`).
- La phase « PLANIF » (Identité) est en bouton primaire actif (on est sur la fiche).
- Le `lotId` courant est propagé dans les params de navigation pour préserver le filtrage par lot.
- Bandeau informatif au-dessus : « Suivi du processus — cliquez sur une phase pour ouvrir l'écran de saisie ».

### Modif #33 — Widget dual montant/% : saisie bidirectionnelle garantie

Le user a constaté dans les Garanties d'Attribution que seul le champ taux semblait saisissable. Trois durcissements appliqués au widget `montant-pourcentage-dual-input.js` :

1. **Suppression du `disabled` automatique sur le champ pourcentage** quand `totalRef <= 0`. Le user reste libre de saisir le taux même si la base est temporairement indéterminée — le calcul du montant sera juste 0 mais ne bloque plus la saisie.
2. **Pas de `disabled` par défaut sur les inputs** — uniquement si le caller passe explicitement `disabled: true`. `autocomplete: 'off'` ajouté pour éviter les interférences navigateur.
3. **Protection contre l'écrasement pendant la saisie** dans `refreshDisplay()` : on ne réécrit plus `montantInput.value` ni `pctInput.value` si `document.activeElement` est l'un de ces champs. Cas typique évité : un `setTotal()` externe (ex: changement HT↔TTC pendant qu'on tape) qui aurait pu effacer la valeur en cours de frappe.

Helpers ajustés :
- Si `totalRef <= 0` : `pctHelper` affiche « Base non définie — saisissez via le sélecteur HT/TTC » au lieu d'un message ambigu.

Comportement attendu après le fix :
- **Cliquer sur le champ Montant → taper une valeur → le % se met à jour automatiquement.**
- **Cliquer sur le champ % → taper une valeur → le montant se met à jour automatiquement.**
- Les deux directions fonctionnent partout : Clé Répartition, Échéancier, Garanties (Attribution + standalone), Avenants.

#### Fichiers
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` (3 boutons par ligne)
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (rangée boutons phase + import `getPhasesAsync`)
- Modifié : `sidcf-portal/js/ui/widgets/montant-pourcentage-dual-input.js` (durcissement saisie)

Pas de migration DB. Pas de déploiement Worker.

## 2026-05-15 — Upload de documents libres depuis la fiche de vie

> **Modif #31** — Permettre, à tout moment depuis la fiche de vie, d'uploader des documents libres rattachés au marché (notification d'attribution, lettre valant marché, bordereau, facture, correspondance, constat, photo de chantier, etc.). L'upload utilise la pipeline R2 existante et les documents apparaissent dans le panneau Documents agrégé.

### Modif #31 — Widget `document-upload-mp.js` + intégration panneau Documents

#### Nouveau widget — `sidcf-portal/js/ui/widgets/document-upload-mp.js` (~180 lignes)

Modal d'upload avec :
- **Fichier** : `input[type=file]` accepte PDF, DOC/DOCX, XLS/XLSX, images. Max 50 Mo (validé par `uploadDocument`). Affichage du nom + taille + type MIME une fois sélectionné.
- **Phase de rattachement** : sélecteur parmi `PLANIF / PROCEDURE / ATTRIBUTION / APPROBATION / EXECUTION / CLOTURE / AUTRE` (default `AUTRE`). Détermine sous quelle phase le document apparaîtra dans le panneau Documents.
- **Type / catégorie** : champ texte libre avec `<datalist>` de suggestions (Notification d'attribution, Lettre valant marché, Bordereau d'envoi, Facture, Correspondance, Rapport de réunion, Photo de chantier, Constat, Mise en demeure, Autre).
- **Note** : textarea optionnel.
- **Statut** en bas de modal qui suit l'upload (« ⏳ Upload en cours… » → « ✅ Document uploadé (id …) » ou « ❌ Échec : … »).

Le widget appelle `uploadDocument(file, { operationId, entityType:'OPERATION', phase, typeDocument, commentaire, … })` (pipeline R2 existante de `r2-storage-mp.js`). Le document est :
- Stocké sur **Cloudflare R2** avec préfixe `mp/` (filename `mp/<timestamp>_<sanitized>`)
- Persisté en base dans **MP_DOCUMENT** (entité déjà définie)
- Visible immédiatement dans le panneau Documents après recharge de la fiche

#### Intégration dans la Fiche de Vie (`ecr01c-fiche-marche.js`)
- **Chargement parallèle** : `dataService.query(MP_DOCUMENT, { operationId })` ajouté au `Promise.all` existant.
- **Bouton « 📤 Ajouter »** dans l'en-tête du panneau Documents (colonne sticky droite). Clic = ouverture du modal. Sur succès → recharge complète de la fiche pour faire apparaître le doc.
- **Répartition par phase** : les MP_DOCUMENT sont distribués dans les groupes existants du panneau (Planification, Contractualisation, Attribution, Approbation, Exécution, Clôture) selon leur `phase`, ou dans un nouveau groupe **« Autres documents »** quand `phase` est null/AUTRE.
- **Téléchargement** : si `MP_DOCUMENT.fichier` contient une URL HTTPS (cas typique après upload R2), un clic ouvre le fichier dans un nouvel onglet. Sinon (références héritées de PV / OS / etc. sans URL), affichage de la référence.
- **Libellé** dans le panneau : `<typeDocument> — <nom>` (ex : *Facture — facture_CFAO_2024.pdf*).

#### Bénéfices
- L'utilisateur peut enrichir le dossier marché à tout moment, sans passer par un écran de phase spécifique.
- Le panneau Documents devient un vrai dossier consolidé : pièces structurées par phase (PVs, garanties, OS, avenants…) + pièces libres dans « Autres documents » ou ventilées dans la phase de rattachement choisie.
- Aucune route Worker / migration DB : on réutilise `MP_DOCUMENT` et `r2-storage-mp.js`.

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/document-upload-mp.js`
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (chargement MP_DOCUMENT, bouton 📤 Ajouter, ventilation des docs uploadés, ouverture URL R2)

Pas de migration DB. Pas de déploiement Worker.

## 2026-05-15 — Sanctions : période active + détection dans un groupement

> **Modif #30** — Deux renforcements demandés explicitement : (1) encadrer la période de sanction pour ne plus alerter sur des sanctions expirées, et (2) détecter les entreprises sanctionnées qui se sont retrouvées au sein d'un groupement (mandataire ou co-titulaires).

### Modif #30 — `mp-sanctions.js` enrichi + intégration Attribution

#### Nouvelles fonctions exportées
- **`isSanctionActive(sanction, now)`** : retourne `true` si la sanction est en cours à la date donnée (`dateDebut <= now <= dateFin`, avec `dateFin == null` → sans terme).
- **`checkSanction(entreprise, opts)`** : signature étendue. Par défaut, ne retourne désormais **que les sanctions actives à la date du jour**. Pour récupérer y compris les sanctions expirées (consultation historique), passer `{ includeExpired: true }`. Le paramètre `asOf` permet de tester à une date arbitraire.
- **`checkSanctionsGroupement({ attributaire, mandataire, coTitulaires }, opts)`** : scanne les sanctions sur **tout le groupement**. Retourne `{ direct, members }` où :
  - `direct` : la sanction sur le principal (attributaire simple ou mandataire), null si aucune
  - `members` : liste agrégée `[{ role, raisonSociale, ncc, sanction }]` pour tous les membres sanctionnés (rôles ATTRIBUTAIRE / MANDATAIRE / COTITULAIRE)
- **`renderGroupementSanctionsBanner(result)`** : bandeau visuel agrégé — un tableau qui liste tous les membres sanctionnés du groupement avec rôle, raison sociale, NCC, type de sanction (badge coloré), période (avec dates), source. Bande rouge si au moins une sanction bloquante, jaune sinon. Bandeau auto-masqué si aucun membre sanctionné.

#### Intégration dans Attribution (`ecr03a-attribution.js`)
- `triggerSanctionCheck` détecte désormais le mode `GROUPEMENT` via le radio `attr-type` (SIMPLE / GROUPEMENT).
- **Mode SIMPLE** : comportement inchangé — bandeau simple sur l'entreprise unique via `renderSanctionBanner`.
- **Mode GROUPEMENT** : collecte le mandataire (champs principaux) + tous les co-titulaires (via `_coTitulairesState`), appelle `checkSanctionsGroupement`, affiche le bandeau agrégé `renderGroupementSanctionsBanner`.
- Les inputs **« Raison sociale »** et **« NCC »** des co-titulaires déclenchent désormais `window.__mpTriggerSanctionCheck()` à chaque frappe (debounce 300ms inchangé) → la détection est temps-réel.

#### Côté drawer de gestion (`openSanctionsDrawer`)
- Les champs `Date début` et `Date fin` du formulaire CRUD existaient déjà → aucun changement nécessaire à l'UI de saisie.
- Les sanctions désactivées (`actif: false`) restent invisibles dans la détection (filtrage existant).

#### Effets attendus
- Une sanction expirée (date de fin passée) n'affiche **plus** d'alerte sur les nouveaux formulaires d'attribution.
- Une entreprise sanctionnée présente comme co-titulaire d'un groupement (mode souvent utilisé pour contourner une blacklist) est **détectée et signalée explicitement** avec son rôle.

#### Fichiers
- Modifié : `sidcf-portal/js/lib/mp-sanctions.js` (+ `isSanctionActive`, signature `checkSanction` enrichie, `checkSanctionsGroupement`, `renderGroupementSanctionsBanner`)
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` (logique de détection groupement + listeners sur co-titulaires)

Pas de migration DB. Pas de déploiement Worker.

## 2026-05-15 — Saisie structurée des difficultés du marché

> **Modif #29** — Toute difficulté rencontrée pendant le cycle de vie du marché peut désormais être saisie à tout moment depuis la fiche de vie. La saisie est structurée (impact, catégorie, statut, actions correctives, décideur, document) pour permettre un suivi et une exploitation efficaces.

### Modif #29 — Widget `difficultes-manager-mp.js` + intégration fiche

#### Schéma — utilise `MP_DIFFICULTE` existant
Le schéma était déjà défini (champs `statutTraitement`, `decision`, `probleme`, `dateDecision`, `nomDecideur`, `fichier`, `impact`, `categorieProbleme`, `actionsCorrectives`). Aucune modification de schéma — modif purement UI.

#### Widget — `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js` (~400 lignes)

**Bandeau de synthèse** :
- Couleur conditionnelle selon la gravité (rouge si critique non résolue, jaune si élevé, gris sinon)
- Compteurs : total, en cours, résolues, critiques non résolues, impact élevé
- Bouton « ➕ Nouvelle difficulté »

**Filtres** : par statut (En cours / Résolu / Abandonné) + par impact (Faible / Moyen / Élevé / Critique)

**Tableau** trié intelligemment :
- En cours d'abord, puis Résolus, puis Abandonnés
- Au sein de chaque statut : Critique > Élevé > Moyen > Faible
- À gravité égale : plus récent d'abord
- Colonnes : Impact (badge couleur), Catégorie, Problème (tronqué + tooltip), Statut (badge), Décision, Date, Actions (modifier/supprimer)

**Modal d'ajout / édition** complète :
- Impact (4 niveaux), Catégorie (9 codes : TECHNIQUE, FINANCIER, JURIDIQUE, CONTRACTUEL, DELAI, QUALITE, RESSOURCE, EXTERNE, AUTRE)
- Statut + date de décision
- Description du problème (textarea, obligatoire)
- Décision prise + actions correctives + nom du décideur
- Référence document (champ texte — upload R2 prévu dans modif #31)

**Persistence** via `dataService.add/update/delete(MP_DIFFICULTE, ...)`. Aucun changement Worker requis (l'entité existait déjà côté API).

#### Intégration Fiche de Vie

1. **Chargement** : `dataService.query(MP_DIFFICULTE, { operationId })` ajouté au `Promise.all` parallèle existant.
2. **Section dédiée** : sous les KPIs santé, avant le sélecteur de lot — visibilité prioritaire car les difficultés sont transverses au cycle de vie.
3. **5e KPI santé « Difficultés »** : ajouté à la barre KPIs avec couleur conditionnelle :
   - Rouge (#dc2626) si ≥1 critique non résolue
   - Orange (#ea580c) si ≥1 impact élevé non résolu
   - Jaune (#f59e0b) si difficultés en cours sans critique/élevé
   - Vert (#16a34a) si aucune difficulté en cours
   - Sous-libellé adapté : « N critiques » / « N impact élevé » / « N en cours · M résolues » / « Aucune difficulté »
4. **Helper `countDifficultes()`** exporté du widget pour les KPIs.

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/difficultes-manager-mp.js`
- Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (import + chargement parallèle + section + KPI)

Pas de migration DB. Pas de déploiement Worker.

## 2026-05-15 — Liens entre marchés (étude antérieure / contrôle postérieur)

> **Modif #28** — Un marché s'inscrit dans une chaîne projet (Étude → Réalisation → Contrôle). On expose désormais ces liens dans la fiche de vie via un bandeau visuel synthétique, avec gestion explicite et suggestions automatiques.

### Modif #28 — Widget `related-operations-mp.js` + modèle de relation

#### Modèle de données
- Nouveau champ `MP_OPERATION.relations: []` — chaque élément suit la forme `MP_OPERATION_RELATION` :
  ```js
  { id: 'OP-2024-0123', sens: 'ANTERIEUR' | 'POSTERIEUR',
    role: 'ETUDE' | 'CONTROLE' | 'TRAVAUX' | 'FOURNITURE' | 'MAITRISE_OEUVRE' | 'AUTRE',
    note: '', createdAt: '...' }
  ```
- **Stockage mono-directionnel** : un lien créé depuis A vers B est stocké uniquement dans A.relations. À l'affichage de la fiche de B, les liens entrants (opérations qui me citent) sont calculés à la volée en scannant `allOperations` — pas de duplication, pas de désynchronisation possible.

#### Widget — `sidcf-portal/js/ui/widgets/related-operations-mp.js` (~450 lignes)

**Affichage visuel** :
- Bandeau horizontal flow-chart : `[← Antérieurs] → [📋 Marché courant] → [Postérieurs →]`
- Cartes cliquables (clic = ouverture de la fiche de l'opération liée)
- **Distinction visuelle** : carte verte pour le marché courant, cartes blanches pour les liens directs (créés depuis ici), cartes jaunes pointillées pour les liens entrants (opérations qui nous citent — non modifiables depuis ici).
- Badge état + tronquage objet à 38 caractères + tooltip complet.
- Connecteurs `→` actifs si une colonne contient au moins un lien, grisés sinon.
- Compteur total dans l'en-tête : `🔗 Liens entre marchés (N)`.

**Modal « Gérer les liens »** :
- Tableau des liens directs existants avec bouton supprimer ligne par ligne (les liens entrants ne sont pas modifiables ici — il faut aller sur la fiche source).
- Formulaire d'ajout : sélecteur de marché (recherche par ID + objet, top 200 par date), sens (ANTERIEUR / POSTERIEUR), rôle (5 codes + AUTRE), note libre.
- **Section « 💡 Suggestions automatiques »** : jusqu'à 6 opérations candidates pré-scorées, avec :
  - Score = même `activiteCode` (+5) + mots-clés rôle dans l'objet (+3) + rôles complémentaires (+2) + mots-clés communs (+1/mot)
  - Sens et rôle pré-suggérés selon la chronologie (`createdAt`) et le mot-clé détecté (étude→antérieur, contrôle/surveillance→postérieur)
  - Bouton « Lier » à un clic — note auto « Lien suggéré automatiquement »
- Détection mots-clés normalisée (accents/casse) : `étude`, `apd`, `aps`, `faisabilité`, `tdr`, `contrôle`, `surveillance`, `suivi`, `inspection`, `maîtrise d'œuvre`, `moe`, `travaux`, `construction`, `réhabilitation`, `fourniture`, `équipement`, etc.

#### Intégration dans la Fiche de Vie
- Sous la timeline, avant les KPIs santé — emplacement choisi pour visibilité maximale.
- `onSaved` recharge la fiche complète après chaque modification (simple, garantit la cohérence multi-widgets).
- Utilise `mpOperations` déjà chargé par la modif #27 — coût zéro additionnel.

#### Persistence
- `dataService.update(MP_OPERATION, id, { relations, updatedAt })` — pas de nouvelle route API ni de migration, juste un champ JSONB ajouté dans le bloc `relations` (lu/écrit comme les autres champs de l'opération).

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/related-operations-mp.js`
- Modifiés : `sidcf-portal/js/datastore/schema.js` (ajout `MP_OPERATION_RELATION` + champ `relations: []` sur `MP_OPERATION`), `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (intégration)

Pas de migration DB (champ JSONB existant). Pas de déploiement Worker.

## 2026-05-15 — Cumul ligne budgétaire + liste des opérations déjà planifiées

> **Modif #27** — Le cumul d'utilisation d'une ligne budgétaire (activité × type de financement × bailleur) tenait déjà compte de toutes les opérations existantes, mais la liste détaillée n'était pas visible. On expose maintenant **les opérations PPM déjà rattachées** à chaque combinaison, à la fois dans le formulaire de création d'une ligne PPM et dans la fiche de vie. Cela évite les ressaisies, donne le contexte complet à l'utilisateur, et rend le cumul auditable.

### Modif #27 — Widget `budget-line-history-mp.js` réutilisable

#### Nouveau widget — `sidcf-portal/js/ui/widgets/budget-line-history-mp.js` (~250 lignes)

API :
```js
const node = renderBudgetLineHistory({
  activiteCode, typeFin, bailleur,
  mpBudgetLines, mpOperations,
  currentMontant: 12_000_000,         // optionnel — ajouté au cumul
  excludeOperationId: 'OP-2025-001',  // optionnel — exclu du cumul "autres" + du tableau
  registries,
  onNavigate: (op) => router.navigate('/mp/fiche-marche', { idOperation: op.id })
});

// Refresh dynamique sans recréation du DOM
node._budgetHistory.update({ activiteCode, typeFin, bailleur, currentMontant });
```

Affichage :
- **Bandeau de synthèse** (couleur conditionnelle) : `Initiale` / `Autres opérations` / `Cumul + ligne courante` / `Disponible après` (ou `DÉPASSEMENT` en rouge).
- **Tableau** des opérations PPM déjà rattachées à cette combinaison : N°, Objet (tronqué + tooltip), Mode de passation, Montant **sur cette ligne** (pas le total opération — la part qui pèse sur cette combinaison), État (badge coloré), bouton « Voir » qui ouvre la fiche de vie de l'opération.
- Si aucune autre opération : message vert « ✓ Aucune autre opération PPM déjà planifiée sur cette ligne ».
- Gestion multi-financement : si une opération a un financement EXTERNE + un financement ETAT sur la même activité, seul le montant matchant la combinaison courante est compté (pas la totalité du `montantPrevisionnel`).
- Compat legacy : si une opération a `op.typeFinancement` + `op.sourceFinancement` à la racine (avant la modif #3 multi-financement), c'est interprété comme un financement unique.

#### Intégration 1 — Formulaire de création de ligne PPM (`ecr01d-ppm-create-line.js`)

Sous chaque ligne de financement de l'opération en cours de saisie, l'ancien indicateur simple ("Initiale | Programmé | Disponible") est remplacé par le widget complet : la ligne de synthèse + le tableau des autres opérations. À chaque changement de l'activité, du type, du bailleur ou du montant, `update()` est appelé sur le widget (pas de re-création du DOM).

#### Intégration 2 — Fiche de Vie du Marché (`ecr01c-fiche-marche.js`)

Dans la **section Planification**, après le rappel de la chaîne budgétaire, on affiche un sous-bloc « 🧮 Utilisation de la ligne budgétaire » avec **une carte par financement** de l'opération courante. Pour chaque financement, on rappelle (type, bailleur, montant) et on montre le widget historique :
- `excludeOperationId = operation.id` (l'opération courante n'apparaît pas dans le tableau, déjà affichée plus haut)
- `currentMontant = montant du financement` (sa contribution à la ligne budgétaire est comptée dans le cumul total)
- → l'utilisateur voit *toutes les autres* opérations sur la même ligne et le cumul global incluant celle-ci.

#### Données chargées en plus dans la fiche

`getMpOperationFull` ne ramène pas la liste de toutes les opérations PPM. La fiche de vie effectue désormais en parallèle :
- `dataService.query(MP_OPERATION)` — toutes les opérations PPM
- `dataService.query(MP_BUDGET_LINE)` — toutes les lignes budgétaires

Coût : 2 requêtes supplémentaires au chargement de la fiche. Aucun changement Worker / DB.

#### Bénéfices attendus

- **Évite les ressaisies** : l'utilisateur voit ce qui existe déjà, peut s'inspirer des objets, mode de passation, montants similaires.
- **Cumul auditable** : le CF/agent voit le détail des opérations qui contribuent au cumul affiché.
- **Cohérence garantie** : le widget est unique, partagé entre la création et la consultation — pas de divergence de calcul possible.

#### Fichiers
- Nouveau : `sidcf-portal/js/ui/widgets/budget-line-history-mp.js`
- Modifiés : `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` (remplacement de l'indicateur simple), `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` (section Planification enrichie)

Pas de migration DB, pas de déploiement Worker.

## 2026-05-15 — Fiche de Vie du Marché : implémentation consolidée (MVP)

> **Modif #26** — Mise en œuvre du MVP de la « Fiche de Vie » proposée en modif #25 (sous-modifs A → F). Refonte complète de `/mp/fiche-marche` : la fiche n'est plus une page de lancement, c'est une **vue consolidée exhaustive** de toutes les phases du marché, accessible via le bouton « 📋 Fiche de vie » sur chaque ligne de la liste PPM.

### Modif #26 — Fiche de Vie consolidée

#### Accès
- **Liste PPM** (`ecr01b-ppm-unitaire.js`) : renommage du bouton ligne « 👁 Voir » → **« 📋 Fiche de vie »** (bouton primaire, en avant). Le bouton « 📋 Détails » devient « ℹ️ Détails » (secondaire — ouvre la modale rapide).

#### Structure de la fiche (`ecr01c-fiche-marche.js` — refonte complète, ~600 lignes)

1. **En-tête sticky** (top de la page, reste visible au scroll) :
   - Objet, n° marché, type, mode de passation
   - Badges : état (couleur), dérogation, **nombre de lots**
   - Montants HT/TTC du marché de base (issus de `attribution.montants` sinon `montantPrevisionnel`)
   - Dates clés condensées : OS de démarrage, clôture/durée prévisionnelle
   - Actions : ⤓ PDF (stub), ⤓ Excel (stub), 🖨 Imprimer, ✏️ Modifier (navigue vers l'écran de la phase courante selon `operation.etat`)
   - Bouton retour « ← Liste PPM »

2. **Timeline 5 phases** via `renderStepsAsync` (composant existant)

3. **4 KPIs de santé** (cards avec bordure colorée) :
   - **Cumul avenants** : `Σ variationMontant / montantInitial × 100` — vert <25%, jaune 25-30%, rouge ≥30% (RG021)
   - **Échéancier planifié** : somme des `pourcentage` des items
   - **Garanties** : nb actives / nb expirées (rouge si ≥1 expirée)
   - **Ordres de Service** : nombre + indicateur démarrage

4. **Sélecteur de lot global + Sommaire par lot** (visible uniquement si > 1 lot) :
   - Vue par défaut = **« 📊 Marché global (tous lots) »** (currentLotId = `'ALL'`).
   - Sélecteur dropdown en en-tête du bloc → bascule entre `ALL` et chaque lotId. La sélection est passée via l'URL (`?lotId=...`) et toutes les sections aval se filtrent automatiquement.
   - **Tableau récapitulatif par lot** : Lot, libellé, attributaire, montant TTC, cumul avenants (avec code couleur), nb garanties, état déduit (En procédure / Attribué / En exécution). Bouton « Voir » par ligne pour zoomer.

5. **6 sections accordéon** dans le main (colonne gauche du grid 2 colonnes) :
   - **Planification** (PPM) — défaut ouvert : objet, type, montants prévisionnels, dates, chaîne budgétaire (ou ligne budgétaire si liée), livrables prévisionnels avec quantité et localisation cascade.
   - **Contractualisation** : mode + type dossier + commission, observations, **détails par lot** (offres reçues/classées, 4 dates, soumissionnaires). Si vue par lot, n'affiche que ce lot.
   - **Attribution** : attributaire (raison sociale, NCC, adresse, nature), montants HT/TTC, **garanties contractuelles** (avance/BE/cautionnement avec base, montant, dates), échéancier (n°, date, type, base, montant, %), clé de répartition (année, bailleur, type fin, base, montant, %, avec ligne TVA État en jaune), bandeau warning si réserves CF.
   - **Approbation (Visa CF)** : tableau des visas (organe, décision avec couleur, date, motif, document).
   - **Exécution** : 3 sous-tableaux — Ordres de Service (type, n°, dates), Avenants (n°, type, base, variation colorée rouge/vert selon signe, motif, date signature), Garanties en cours (type étendu, base, taux, montant, dates, état).
   - **Clôture** : dates dernier décompte/réception provisoire/définitive + PVs + clôture effective.
   - Chaque section a un **badge de complétude** (Complet/Partiel/Vide) et un bouton **✏️ Modifier** qui navigue vers l'écran de saisie de la phase, en propageant le `lotId` si applicable.
   - **État replié/déployé persistant** par section dans `localStorage` (clé `sidcf:fiche:accordion:<id>`).

6. **Panneau Documents latéral sticky** (colonne droite, 320px desktop, position sticky top:160px) :
   - **Agrégation de tous les `documentRef` / `docRef`** trouvés dans : procedure.lots.pv, attribution.documentRef, attribution.garanties.*.docRef, visasCF.documentRef, ordresService.documentRef, avenants.documentRef, garanties.doc (entité standalone), cloture.receptionProv/Def.documentRef.
   - Groupés par phase, comptage par groupe et global.
   - Clic = alerte stub (téléchargement R2 à brancher dans une modif future).
   - Filtré sur `lotId` quand vue par lot.

7. **Section Audit log** (placeholder repliable, status `empty`) — l'implémentation NF07 (table `mp_audit_log` côté serveur + instrumentation CRUD) est notée comme modif à venir.

#### Responsive et impression
- Grid 2 colonnes (main + side 320px) sur desktop ; **passage en colonne unique sous 1024px** (style injecté `<style>` global).
- **Style print** : en-tête repasse en flow normal, boutons masqués. Le `window.print()` du bouton 🖨 produit une fiche imprimable de base (à raffiner dans la sous-modif #G PDF).

#### Pas livré dans ce MVP (sous-modifs proposées séparément)
- **G** : Export PDF (jsPDF ou puppeteer Worker)
- **H** : Export Excel multi-onglets (SheetJS)
- **I** : Audit log serveur (table + instrumentation)

#### Réponse à une question métier
- **Question #6 de la proposition** « Multi-lot — fiche consolidée tous lots ? » → **OUI** : implémentée via la vue par défaut `ALL` qui affiche le marché entier + le tableau sommaire par lot. La vue par lot reste accessible via le sélecteur.

#### Fichiers
- `sidcf-portal/js/modules/marche-plus/screens/ecr01c-fiche-marche.js` — **refonte complète** (de 238 lignes minimalistes à ~600 lignes consolidées)
- `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` — renommage bouton ligne

**Pas de migration DB**, **pas de déploiement Worker** (lecture uniquement via `getMpOperationFull` existant).

## 2026-05-15 — Conformité SDF : RG010 + types garantie + modes de passation + proposition Fiche Marché

> **Modif #25** — Trois corrections de conformité au SDF (Hector 26/11/2025 V1.0) + proposition de design pour la « vraie » Fiche de Marché demandée par UC04.

### Modif #25 — Mises à jour référentielles + proposition Fiche Marché

#### 25.1 — RG010 : seuil garantie de bonne exécution corrigé (3–5%)
- **Avant** : `rules-config.json` → `garantie_bonne_execution: { taux_min: 5, taux_max: 10 }`
- **Après** : `{ taux_min: 3, taux_max: 5 }` conforme à l'**Art. 97.3 du Code des Marchés Publics CI** (SDF slide 15, RG010)
- **Impact** : l'écran Garanties (Attribution + standalone) affichera désormais le bandeau « Plage légale 3% – 5% » au lieu de 5–10%. Le warning d'alerte hors plage est recalculé sur ces nouvelles bornes.

#### 25.2 — Référentiel TYPE_GARANTIE élargi à 9 types (vs 3 auparavant)
- **Ajoutés** : `OFFRE` (garantie d'offre/soumission, phase PROCEDURE), `BIENS_REMIS` (Art. 102), `APPROV_REMIS`, `DELAI_PAIEMENT` (Art. 104), `DECENNALE` (BTP, phase CLOTURE), `AUTRE`.
- **Conservés et enrichis** : `AVANCE` (Art. 100), `BONNE_EXEC` (Art. 97.3), `RETENUE`.
- **Méta ajoutées par type** : `regleType` (pointe vers la règle de taux dans `rules-config.garanties`) + `phase` (PROCEDURE / ATTRIBUTION / EXECUTION / CLOTURE) pour permettre un futur filtrage contextuel dans l'UI.
- **Cohérence** : `rules-config.json` → `referentiels.types_garantie` synchronisé sur la même liste.
- **Note** : pas de migration des records existants — les anciennes valeurs (`AVANCE`, `BONNE_EXEC`, `RETENUE`) restent valides puisqu'elles sont conservées dans la liste.

#### 25.3 — Référentiel MODE_PASSATION élargi avec sous-variantes
- **Avant** : 8 codes (PSC, PSD, AOO, PSO, AOR, CI, DEM, ENTENTE_DIRECTE).
- **Après** : **18 codes** structurés par familles + parent :
  - **Famille SIMPLIFIEE** : PSD, PSC, PSL, PSO (avec libellés conformes au SDF — PSC = « demande de Cotation », PSO = « à compétition Ouverte »)
  - **Famille CLASSIQUE** : AOO + sous-variantes AOO_PREQUALIF, AOO_2ETAPES, AOO_CONCOURS (SDF slide 28) ; AON, AOI, CI, DEM
  - **Famille DEROGATOIRE** : AOR, ENTENTE_DIRECTE, **RECONDUCTION (Art. 79)** ← nouveau
  - **Famille PI** : PI + sous-variantes PI_CABINET, PI_INDIVIDUEL (Art. 62)
- **Méta ajoutées par mode** : `famille` (SIMPLIFIEE / CLASSIQUE / DEROGATOIRE / PI) + `parent` (code du mode parent pour les sous-variantes) → permet à terme un sélecteur en cascade dans le formulaire procédure.
- **Compat** : tous les codes existants conservés, libellés rapprochés du SDF (clarification PSC/PSO/PSL).

#### 25.4 — Proposition de design « Vraie Fiche de Marché »
- **Fichier livré** : `sidcf-portal/Documentation/proposition-fiche-marche.md` (~250 lignes)
- **Contenu** :
  - Constat : l'actuelle `/mp/fiche-marche` n'est qu'une page de lancement (Identité + Chaîne budgétaire + Livrables). Le SDF UC04 demande une **fiche consolidée exhaustive lecture seule** avec toutes les phases + documents + historique + export PDF.
  - **Structure proposée** : en-tête sticky, timeline 5 phases, 4 KPIs de santé (cumul avenants, échéancier, garanties, docs obligatoires), 6 sections accordéon (Planification → Clôture), panneau Documents latéral, section Audit log.
  - **Comportements** : sélecteur de lot global, accordéons à état persistant `localStorage`, lien « Modifier » vers chaque écran de phase, exports PDF/Excel.
  - **Découpage d'implémentation** : 9 sous-modifs (A → I), MVP estimé 4–5 jours pour le squelette + sections, +4–6 jours pour PDF/Excel/Audit log serveur.
  - **6 questions à trancher avec le métier** avant code (annotations CF, signature PDF, recherche full-text PDF, etc.)
- **Pas d'implémentation dans cette modif** — purement un document de design à valider.

#### Fichiers modifiés
- `sidcf-portal/js/config/rules-config.json` (garantie BE + liste types_garantie)
- `sidcf-portal/js/config/registries.json` (TYPE_GARANTIE + MODE_PASSATION)
- `sidcf-portal/Documentation/proposition-fiche-marche.md` (NEW)

**Pas de migration DB**, **pas de déploiement Worker**.

## 2026-05-15 — Filtres PPM : multi-select replié par défaut

> **Modif #24** — Refonte UX des filtres de la liste PPM. Chaque filtre devient un **bouton compact** (replié par défaut) qui ouvre à la demande un panneau avec recherche + cases à cocher.

### Modif #24 — Widget `multi-select-collapsible-mp.js` pour les filtres PPM
- **Écran touché** : `/mp/ppm-list` (ecr01b-ppm-unitaire.js)
- **Problème** : la zone des filtres affichait chaque filtre comme une **liste plate toujours ouverte** (`<select multiple size="6">`). Sur 10 filtres, l'écran était saturé de listes scrollables côte à côte.
- **Solution** :
  - Nouveau widget `sidcf-portal/js/ui/widgets/multi-select-collapsible-mp.js` (~250 lignes) :
    - Bouton compact affichant `Label + badge compteur + aperçu textuel des 2 premières sélections + flèche ▾`
    - Au clic : ouverture d'un **popover** sous le bouton avec :
      - Champ de recherche en haut (focus auto, filtre live)
      - Liste de **cases à cocher** scrollable (max-height 230px)
      - Footer : boutons **Tout** / **Vider** / **Fermer**
    - Fermeture automatique : clic en dehors, touche `Escape`, ou bouton Fermer
    - Un seul panneau ouvert à la fois (état global `_activePanel`)
    - `z-index: 9999` pour passer au-dessus de tout le reste de l'UI
- **Intégration** :
  - `renderMultiSelectFilter` réécrit pour wrapper le nouveau widget — signature inchangée, callers PPM list inchangés.
  - `setupFilterListeners` simplifié : seul le champ texte « Recherche » garde son `addEventListener('input')` ; les multi-select wirent via `onChange` directement du widget vers `activeFilters[name]`.
  - Texte d'aide mis à jour : `Cmd/Ctrl + clic pour multi-sélection` → `Cliquez sur un filtre pour le déployer · multi-sélection via cases à cocher`.
- **Effet visuel** : chaque filtre prend désormais **1 ligne** au lieu de 8-10 lignes. La zone Filtres passe d'un mur de listes à une grille compacte de boutons explicites.
- **Pas de changement de logique de filtrage** : `activeFilters[name]` reste le même format (array de codes), le `applyFilters()` est inchangé.
- **Fichiers** :
  - Nouveau : `sidcf-portal/js/ui/widgets/multi-select-collapsible-mp.js`
  - Modifié : `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` (3 zones : import, renderMultiSelectFilter, setupFilterListeners)

## 2026-05-15 — Écran Garanties (exécution) : widget dual + base HT/TTC

> **Modif #23** — Application de la règle « saisie bidirectionnelle Montant ↔ Pourcentage » à l'écran Garanties standalone (`/mp/garanties`), qui utilisait jusqu'ici le pattern unidirectionnel (taux saisissable → montant en lecture seule).

### Modif #23 — `ecr04c-garanties.js` migré vers le widget DUAL

- **Écran touché** : `/mp/garanties` (gestion des garanties pendant la phase Exécution)
- **Avant** : champ « Taux (%) » saisissable + champ « Montant (XOF) » `disabled` calculé automatiquement. Le sens inverse (saisir le montant → déduire le taux) n'était pas possible.
- **Après** :
  - Nouveau sélecteur **Base de calcul (HT / TTC)** — base exclusive, par défaut HT.
  - Widget DUAL `montant-pourcentage-dual-input.js` : les deux champs Montant et Pourcentage sont visibles et **synchronisés bidirectionnellement** (modifier l'un met à jour l'autre instantanément).
  - Quand l'utilisateur change le **type de garantie** (AVANCE / BONNE_EXEC / RETENUE), le taux recommandé est injecté dans le widget via `setMontant((tauxRecommandé / 100) * baseCourante)` ; les deux champs s'actualisent en cohérence.
  - Quand l'utilisateur change la **base HT/TTC**, le widget recalcule via `setTotal()` — le pourcentage saisi est conservé, le montant se recalcule (ou inversement selon le dernier mode saisi).
  - Le `taux` (% absolu) est désormais **dérivé** du montant et de la base au moment de la sauvegarde, plus saisi manuellement.
- **Table « Garanties enregistrées »** : nouvelle colonne **Base** (HT/TTC) intercalée entre Type et Taux. Le taux s'affiche désormais avec 2 décimales (`(garantie.taux ?? 0).toFixed(2)`).
- **Schéma** (`schema.js`) :
  - `MP_GARANTIE` : ajout `baseCalc: 'HT'` + `saisieMode: 'POURCENTAGE'`. Pas de migration nécessaire — les anciennes lignes restent valides (lues comme TTC par défaut dans l'UI, car la table affiche `garantie.baseCalc || 'TTC'`).
- **Pas de migration DB**, **pas de déploiement Worker**.
- **Fichiers modifiés** :
  - `sidcf-portal/js/modules/marche-plus/screens/ecr04c-garanties.js`
  - `sidcf-portal/js/datastore/schema.js`

## 2026-05-15 — Libellés de montant contextuels par phase

> **Modif #22** — Le même chiffre porte un libellé différent selon l'étape du cycle de vie du marché. On uniformise tous les écrans pour respecter la règle métier énoncée par l'utilisateur.

### Modif #22 — Libellés Montant selon la phase
- **Règle métier** :
  | Phase | Libellé |
  |---|---|
  | PPM (planification) | `Montant prévisionnel` |
  | Attribution | `Montant du marché de base` |
  | Saisie d'avenant | `Montant de l'avenant` |
  | Après avenant | `Montant total du marché` |
- **Nouveau helper** : `sidcf-portal/js/lib/montant-labels-mp.js` — `getMontantLabel(phase, options)` + variante courte `getMontantLabelShort(phase)`. Centralise la règle pour éviter la dérive entre écrans.
- **Renommages appliqués** :
  - **Attribution** (`ecr03a-attribution.js`) : carte « 💰 Montants du marché » → **« 💰 Montant du marché de base »** + sous-titre explicatif rappelant que les avenants viendront s'y cumuler.
  - **Visa CF / Approbation** (`ecr03c-visa-cf.js`) : libellé « Montant attribué » → **« Montant du marché de base »**.
  - **Échéancier / Clé** (`ecr03b-echeancier-cle.js`) : KPIs « Montant Marché (TTC) » + « Montant HT » → **« Montant du marché de base (TTC) »** + **« Montant du marché de base (HT) »**.
  - **Exécution OS** (`ecr04a-execution-os.js`) : KPIs « Montant initial » / « Montant actuel » → **« Montant du marché de base »** / **« Montant total du marché »**.
  - **Avenants liste** (`ecr04b-avenants.js`) : KPIs idem → **« Montant du marché de base »** / **« Montant total du marché »**.
  - **Avenant create** (`ecr04b-avenant-create.js`) :
    - Bloc info contexte : « Montant initial » → **« Montant du marché de base »** ; « Montant actuel » → **« Montant total du marché »**.
    - Champ Variation : label « Variation montant et % » → **« Montant de l'avenant (montant + %) »**.
    - Affichage calculé : « Nouveau montant marché » → **« Montant total du marché (après cet avenant) »**.
    - Aperçu impact dynamique : « Nouveau montant » → **« Montant total du marché »**.
  - **Garanties** (`ecr04c-garanties.js`) : KPI « Montant marché » → **« Montant total du marché »**.
- **Pas de changement de données** : les noms de champs en base et le modèle restent identiques (`montantPrevisionnel`, `montants.ht/ttc`, `variationMontant`, etc.). Uniquement les libellés d'affichage évoluent.

## 2026-05-15 — Saisie duale Montant + % avec base de calcul exclusive HT/TTC

> **Modif #21** — Refonte de la saisie des montants susceptibles d'être évalués sur la base d'un pourcentage : deux champs visibles **Montant (XOF)** et **Pourcentage (%)**, synchronisés bidirectionnellement (modifier l'un met à jour l'autre), avec une **base de calcul exclusive HT ou TTC** (suppression de l'option « HT et TTC »). Appliqué à 4 endroits : Clé de Répartition, Échéancier, Garanties (avance/bonne exécution/cautionnement), Avenants.

### Modif #21 — Widget DUAL `montant-pourcentage-dual-input.js` + base exclusive

- **Écrans touchés** : `/mp/attribution` (Clé Répartition, Garanties, Échéancier embedded) + `/mp/avenant-create`
- **Nouveau widget** `sidcf-portal/js/ui/widgets/montant-pourcentage-dual-input.js` (~180 lignes) :
  - **Deux champs visibles** empilés verticalement : ligne Montant (XOF) au-dessus, ligne Pourcentage (%) en dessous, chacun avec son helper d'équivalent (« ≈ X% du total » / « ≈ Y XOF »).
  - **Synchronisation bidirectionnelle** : saisir un montant met le % à jour ; saisir un % met le montant à jour.
  - **Base de référence dynamique** : `setTotal(newTotal)` permet au caller de basculer HT↔TTC à la volée. Le widget recalcule le côté approprié selon le dernier mode saisi (si l'utilisateur a saisi un %, le montant se recalcule ; sinon le % se recalcule).
  - **Mode `allowNegative`** : pour les avenants (variations en diminution possibles).
  - API publique : `getMontant()`, `getMode()`, `setTotal()`, `setMontant()`.
- **Base de calcul exclusive HT ou TTC** :
  - Retrait de l'entrée `HT_TTC` dans `registries.json` (`BASE_CALCUL_CLE`).
  - **Migration douce** dans `cle-repartition-manager-mp.js` : à la lecture, toute ligne avec `baseCalc === 'HT_TTC'` est normalisée en `HT`. Pas de migration SQL — les données vivent dans le JSONB de `mp_cle_repartition` et la correction est appliquée à la prochaine sauvegarde.
  - Le formulaire filtre les options HT/TTC uniquement.
- **Application aux 4 écrans** :
  - **Clé Répartition Multi-Bailleurs** (`cle-repartition-manager-mp.js`) : remplace l'input toggle XOF/% par le widget dual. Bascule HT↔TTC via le sélecteur existant → `setTotal()`. La table affiche déjà les colonnes Base et Pourcentage par ligne.
  - **Échéancier** (`echeancier-manager-mp.js`) : ajout d'un sélecteur **Base de calcul (HT/TTC) par échéance**, signature étendue (3ᵉ paramètre accepte désormais `{ ht, ttc }` ; compat avec l'ancienne forme `number` interprété comme TTC). Nouvelle colonne **Base** dans la table.
  - **Garanties** (`ecr03a-attribution.js` - `renderGarantiesSection` + `initGarantieWidget`) : pour chacune des 3 garanties (avance, bonne exécution, cautionnement), ajout d'un sélecteur baseCalc HT/TTC, widget dual remplaçant le single toggle, et `data-total-ht` / `data-total-ttc` au lieu d'un seul `data-total`. Avance et bonne exécution default à `POURCENTAGE` (saisie typique en taux), cautionnement default à `MONTANT`. Le warning de seuil (plage légale) continue à être recalculé sur la base courante via `_garantieWidgetApis[id]`.
  - **Avenants** (`ecr04b-avenant-create.js`) : nouveau bloc « Base de calcul (HT/TTC) » + widget dual avec `allowNegative: true`. Base HT/TTC issue de `fullData.attribution.montants` (fallback `montantPrevisionnel`/1.18 pour HT, `montantPrevisionnel` pour TTC). Un champ caché `avenant-montant` est synchronisé via onChange pour préserver le flow de soumission existant (`updateImpactPreview`). Nouvelle colonne **Base** dans la liste des avenants (`ecr04b-avenants.js`).
- **Schéma** (`schema.js`) :
  - `CLE_LIGNE` / `MP_CLE_LIGNE` : ajout commentaire `baseCalc: 'HT' | 'TTC' (exclusif)` + champ `saisieMode`.
  - `MP_ECHEANCE_ITEM` : ajout `baseCalc` (`'TTC'` par défaut) + `saisieMode`.
  - `MP_ATTRIBUTION.garanties.*` : ajout `baseCalc: 'HT'` + `saisieMode`.
  - `MP_AVENANT` : ajout `variationBaseCalc: 'TTC'` + `variationSaisieMode`.
- **Pas de migration DB** : tous les nouveaux champs vivent dans les colonnes JSONB existantes. Les anciennes lignes sans ces champs sont rétro-compatibles (lecture avec valeurs par défaut).
- **Pas de déploiement Worker** : aucune route API modifiée, aucune nouvelle entité.
- **Fichiers** :
  - Nouveau : `sidcf-portal/js/ui/widgets/montant-pourcentage-dual-input.js`
  - Modifiés : `cle-repartition-manager-mp.js`, `echeancier-manager-mp.js`, `ecr03a-attribution.js`, `ecr04b-avenant-create.js`, `ecr04b-avenants.js`, `schema.js`, `registries.json`
- **Réversibilité** : retirer le sélecteur baseCalc et reconvertir vers le widget single `montant-pourcentage-input.js` (toujours présent dans la base, non supprimé). Les données existantes avec `baseCalc`/`saisieMode` resteront en place mais seront ignorées.

## 2026-05-15 — Approbation : élargissement des organes (CF + autres)

> **Modif #16** — La liste des organes d'approbation du marché passe de 11 à 27 entrées, incluant le **Contrôleur Financier (CF)** et plusieurs autres organes transverses ou sectoriels demandés par l'utilisateur.

### Modif #16 — Référentiel `mp-organes-approbation.json` enrichi
- **Écran touché** : `/mp/visa-cf` (« Approbation du marché »)
- **Description** :
  - L'écran filtrait par scope (institution) + seuil (montant) sur une liste très restreinte (11 organes). Sur **ADMIN_CENTRALE 472M**, seules 3 entrées s'affichaient (Ministre MP, DMP, Autre).
  - On ratisse plus large : **+ 16 organes**, dont :
    - **Contrôleur Financier (CF)** — scope `*` (transverse, tout type d'institution)
    - **DGMP** (Directeur Général des Marchés Publics) — scope `*`
    - **DGBF** (Directeur Général du Budget et des Finances) — scope `*`
    - **Premier Ministre** (≥ 1 Md XOF) et **Président de la République** (cas exceptionnel)
    - **Directeur de Cabinet** / **SG** des ministères Technique et Marchés Publics (par délégation)
    - **Préfet de Région** + **Sous-Préfet** (par délégation) pour le scope déconcentré
    - **Maire**, **Présidents de Conseil Régional / Départemental** (collectivités)
    - **PCA EPN** + **DG EPN** (Établissements Publics Nationaux — scope nouveau `EPN`)
    - **Directeur du Projet** (en plus du Coordonnateur, pour les projets cofinancés)
- **Filtrage inchangé** : les organes en scope `*` (CF, DGMP, DGBF, AUTRE) apparaissent **quel que soit le scope** ; les autres sont filtrés sur `scope === institutionType` + seuil `[min, max]`. Le filtre fallback (« si tout est filtré → afficher tous les organes du scope ») reste en place.
- **Effet pour Admin Centrale 472M XOF** : la liste passe de 3 à **8 options** (CF, DGMP, DGBF, Ministre MP, Directeur Cabinet MMP, DMP, Président République, Autre).
- **Fichier** : `sidcf-portal/js/config/mp-organes-approbation.json`

## 2026-05-06 — Désactivation du module Marché historique

> **Modif #15** — Marché historique masqué pour éviter l'ambiguïté dans la sidebar.

### Modif #15 — `moduleMarche: false` dans app-config.json
- **Description** :
  - L'utilisateur testait sur le module **Marché** historique au lieu de **Marché+** (sidebar montrait les deux entrées « PPM & Opérations » côte-à-côte) → toutes les modifs Marché+ étaient invisibles.
  - On désactive le module Marché via le feature flag `moduleMarche: false` dans `app-config.json`. Les routes `/ppm-list`, `/fiche-marche`, etc. ne sont plus enregistrées ; la carte du portail et la section sidebar disparaissent. **Les tables `operation`, `procedure`, etc. en base restent intactes** — réversible à tout moment en remettant `true`.
  - Marché+ devient désormais le seul module marché visible.
- **Fichier** : `sidcf-portal/js/config/app-config.json`
- **Réversibilité** : remettre `"moduleMarche": true` dans `app-config.json` + F5.

## 2026-05-06 — Multi-lot bout en bout : sélecteur de lot pour les phases en aval

> **Point traité** : **Modif #13** — extension du multi-lot (modif #12) à toutes les phases en aval. Chaque écran aval affiche un sélecteur de lot quand l'opération en comporte plusieurs ; les données sont stockées per-lot (back-compat préservée pour le mono-lot).

### Modif #13 — Sélecteur de lot pour Attribution / Échéancier / Visa CF / Exécution / Avenants / Garanties / Clôture
- **Description** :
  - **2 nouveaux helpers** dans `sidcf-portal/js/lib/lot-data.js` :
    - `getLotData(entity, lotId)` : lit les données d'un lot (merge `entity` racine + `entity.parLot[lotId]` si présent ; fallback transparent sur la racine pour les opérations à 1 lot ou héritées).
    - `buildLotPatch(lotId, fields, existingEntity)` : compose un patch de mise à jour qui place les `fields` sous `parLot[lotId]` (multi-lot) ou à la racine (single-lot, comportement legacy).
    - `getLotsFromProcedure(procedure)` + `resolveCurrentLotId(lots, params)` : utilitaires pour récupérer la liste des lots et le lot courant depuis l'URL.
  - **Nouveau widget** `sidcf-portal/js/ui/widgets/lot-selector.js` :
    - `renderLotSelector({ lots, currentLotId, route, routeParams })` : sélecteur de lot en haut de page.
    - **Retourne `null` quand l'opération a ≤ 1 lot** → totalement transparent pour les opérations mono-lot.
    - Sur changement, navigue vers la même route en injectant `lotId` dans les params, ce qui force un re-render avec le lot ciblé.
  - **Application sur 7 écrans** (`/mp/attribution`, `/mp/echeancier`, `/mp/visa-cf`, `/mp/execution`, `/mp/avenants`, `/mp/avenant-create`, `/mp/garanties`, `/mp/cloture`).

- **Deux patterns de stockage selon l'entité** :
  - **Singleton per-operation** (MP_ATTRIBUTION, MP_ECHEANCIER, MP_CLE_REPARTITION, MP_CLOTURE) → champ JSONB `parLot: { [lotId]: { … } }`. Lecture via `getLotData`, écriture via `buildLotPatch`.
  - **Liste de records per-operation** (MP_VISA_CF, MP_ORDRE_SERVICE, MP_AVENANT, MP_GARANTIE) → chaque record porte un champ `lotId`. Affichage : filtré sur le lot courant (les records sans `lotId` apparaissent toujours — back-compat). Création : `lotId = currentLotId`.

- **Fichiers modifiés / créés** :
  - `sidcf-portal/js/lib/lot-data.js` (nouveau, ~80 lignes)
  - `sidcf-portal/js/ui/widgets/lot-selector.js` (nouveau, ~60 lignes)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js` (Attribution — singleton parLot)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr03b-echeancier-cle.js` (Échéancier + Clé Répartition — singletons parLot ; persistance MP_ECHEANCIER ajoutée au passage car le code legacy avait un TODO non implémenté)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr03c-visa-cf.js` (Visa CF — array + lotId)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr04a-execution-os.js` (Exécution OS — array + lotId, + filtrages dérivés sur visasCF/avenants/attribution pour les KPIs et flags du lot courant)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr04b-avenants.js` (liste avenants — filtrage par lot)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr04b-avenant-create.js` (création avenant — `lotId` injecté)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr04c-garanties.js` (Garanties — array + lotId)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr05-cloture.js` (Clôture — singleton parLot)

- **Back-compat** :
  - Pour une opération à **1 lot ou sans lots définis** : `currentLotId === null`, `getLotData` renvoie l'entité brute, `buildLotPatch` renvoie un patch racine sans `parLot`. Comportement strictement identique à avant.
  - Pour les **records existants sans `lotId`** dans les listes (visas, OS, avenants, garanties) : ils restent visibles dans tous les lots (interprétés comme "non scopés"). À long terme, une migration pourrait leur attribuer le lot 1, mais pour l'instant aucune perte de données.

- **Pas de migration DB** : tous les champs `parLot` et `lotId` vivent dans les colonnes JSONB existantes (`mp_attribution.par_lot` n'existe pas en colonne dédiée — il est sérialisé dans le JSONB ambient des entités).

- **Limitations connues à itérer plus tard** :
  - La navigation inter-écrans (← Retour fiche, → Suivant…) ne propage pas systématiquement le `lotId` ; chaque écran le résout depuis l'URL et reprend le 1er lot par défaut sinon. Acceptable pour la 1ʳᵉ itération.
  - Les widgets latéraux d'Attribution (`renderCleRepartitionManager`, `renderEcheancierManager`) ne sont pas encore scopés au lot courant côté UI (mais leurs entités sous-jacentes le sont via Échéancier/Clé écran).

## 2026-05-06 — Multi-lot dans Contractualisation + vérification libellé Multi-Bailleurs

> **Points traités** : multi-lot par procédure (#12) + vérification du libellé « Multi-Bailleurs » (#14).

### Modif #14 — Vérification libellé « Multi-Bailleurs » (aucun changement nécessaire)
- **Recherche** : tous les fichiers du projet ont été grepés pour `MULTI BAILLEUR` / `Multi Bailleur` / `MULTI_BAILLEUR`.
- **Constat** : il n'existe **aucun libellé bare « MULTI BAILLEUR »**. Le seul libellé existant est déjà **« 📊 Clé de Répartition Multi-Bailleurs »** dans `ecr03a-attribution.js` (et son équivalent dans le module Marché historique). C'est la forme propre demandée — aucun changement nécessaire.
- **Aucun fichier modifié.**

### Modif #12 — Multi-lot dans la Contractualisation (procédure par lot)
- **Écran touché** : `/mp/procedure` (modes AOO, PSO, PSL, PI, PSC — tous ceux où `info_lots: true`)
- **Description** :
  - Un projet peut désormais comporter **plusieurs lots**, chacun avec sa propre procédure (offres, dates, PVs).
  - Nouveau widget **`renderLotsProcedureMP`** (`sidcf-portal/js/ui/widgets/lots-procedure-mp.js`) :
    - Champ **« Nombre de lots »** + bouton **« Définir »** pour ajuster le total + bouton **« + Ajouter un lot »**.
    - Pour chaque lot : libellé (pré-rempli avec l'objet du marché pour le lot 1), nb d'offres reçues / classées, **4 dates** (ouverture / analyse technique / analyse financière / jugement), **5 PVs** (ouverture, analyse technique, analyse financière, **analyse tech & fin combiné**, jugement).
    - Édition inline (cartes avec bordure), ✕ pour retirer (toujours au moins 1 lot).
  - **L'ancienne section globale Nb offres / Dates / PVs est retirée du formulaire** (les détails sont désormais dans chaque carte de lot). La section globale conserve : Type de commission, Catégorie, Type de dossier d'appel, Document dossier d'appel.
  - **Migration douce** : pour les procédures existantes ayant `dates` / `pv` / `nbOffresRecues` au niveau racine (legacy avant #9), un lot 1 est généré automatiquement avec ces valeurs et le libellé `operation.objet`.
  - **Tous les champs restent optionnels.** Les warnings (champs manquants, chronologie incohérente) sont remontés par lot dans l'alerte de succès post-save (non bloquants).
- **Fichiers** :
  - `sidcf-portal/js/ui/widgets/lots-procedure-mp.js` (nouveau widget)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js` (intégration du widget, retrait de l'ancien `LotsWidget` Marché+ et des sections globales nb offres / dates / PVs)
- **Stockage** :
  - `procedureData.lots = [{ id, numero, libelle, nbOffresRecues, nbOffresClassees, dates: {ouverture, analyseTechnique, analyseFinanciere, jugement}, pv: {ouverture, analyseTechnique, analyseFinanciere, analyseTechFin, jugement} }]`
  - Champs additionnels héritage (objet, montantHT/TTC, livrables, soumissionnairesLot, observations) **conservés en passthrough** par `normalizeLot` pour ne pas perdre les données existantes.
  - Pas de migration DB (champ JSONB `mp_procedure.lots`).
- **À noter (modif #13 prévue)** : pour l'instant, les phases en aval (Attribution, Visa CF, Exécution, Avenants, Garanties, Clôture) opèrent encore au niveau de l'opération entière. La sélection de lot pour ces phases sera traitée dans une **modif #13 séparée** (touche 6 écrans + le modèle de données).

## 2026-05-06 — Procédure-PV + Attribution + Rules engine

> **Points traités** : commissions limitées (#8), multi-PV avec champs optionnels (#9), retrait du « Motif détaillé » sur Attribution (#10), correction du moteur de règles (#11).

### Modif #11 — Rules engine : matching corrigé (`natureCode` + lenient)
- **Fichier** : `sidcf-portal/js/datastore/rules-engine.js`
- **Description** :
  - Sur l'écran `/mp/procedure`, le bandeau **« Aucune règle trouvée »** s'affichait systématiquement et par conséquent **« DÉROGATION DÉTECTÉE »** se déclenchait sur n'importe quel mode. Cause double :
    1. Le moteur de règles lisait `chaineBudgetaire.nature` (le **libellé** depuis modif #1, ex: `« 221 - Fonctionnement courant »`) alors que les matrices `rules-config.json` contiennent des **codes** (`"221"`, `"232"`, …). Le matching échouait silencieusement.
    2. Pour les opérations héritées (sans `natureCode`), `natureEco.includes('')` retourne `false` → exclusion systématique.
  - **Fix** :
    - Lire **`natureCode` en priorité**, fallback sur `nature` (legacy).
    - **Matching lenient** : si `natureCode` / `typeMarche` ne sont pas renseignés sur l'opération, on ne filtre pas dessus (suggestions établies sur le montant uniquement).
    - Conversion explicite du montant en `Number()` (évite les `NaN`).
    - Lire aussi `typeInstitution` (utilisé par l'UI) en plus de `institutionType`.
- **Effet** : les « Procédures admissibles » s'affichent réellement, et « DÉROGATION DÉTECTÉE » ne se déclenche que quand le mode choisi sort véritablement de la matrice.

### Modif #10 — Attribution : retrait du champ « Motif détaillé » (Réserves CF)
- **Écran** : `/mp/attribution`
- **Fichier** : `sidcf-portal/js/modules/marche-plus/screens/ecr03a-attribution.js`
- **Description** : dans la section « Réserves du Contrôleur Financier », le champ `<textarea>` **« Motif détaillé »** est retiré. Les champs « Type de réserve » et « Commentaire » sont conservés.
- **Modèle de données** : le champ `decisionCF.motifReserve` n'est plus alimenté par l'écran Attribution, mais reste dans le modèle (toujours utilisé par l'écran Visa CF qui a sa propre saisie).

### Modif #9 — Procédure-PV : multi-PV (analyse tech / fin / combiné) + champs optionnels
- **Écran** : `/mp/procedure` (mode AOO, PSO, PSL, PI)
- **Fichier** : `sidcf-portal/js/modules/marche-plus/screens/ecr02a-procedure-pv.js`
- **Description** :
  - **PVs (5 emplacements)** : PV d'ouverture, PV d'analyse technique, PV d'analyse financière, **PV d'analyse technique & financière (combiné — alternative aux 2 précédents)**, PV de jugement.
  - **Dates (4)** : Date d'ouverture, Date d'analyse technique, Date d'analyse financière, Date de jugement.
  - **Tous les champs sont optionnels**. Plus aucun blocage à la sauvegarde si commission, catégorie, dates ou PVs sont vides ; les incohérences chronologiques (analyse antérieure à l'ouverture, etc.) ne bloquent plus non plus.
  - **Warnings non bloquants** : à la fin de la sauvegarde, l'alerte de succès liste les champs manquants ou incohérences sous forme de bullets.
  - **Back-compat** : `pv.analyse` legacy mappé sur `pv.analyseTechFin` à la lecture, `dates.analyse` legacy mappé sur `dates.analyseTechnique`.

### Modif #8 — Limiter `TYPE_COMMISSION` à COJO + COPE
- **Fichier** : `sidcf-portal/js/config/registries.json`
- **Description** : retire l'entrée `TECH` (« Commission Technique ») du registre. Sur l'écran Procédure & Mode de Passation, seules **COJO** et **COPE** apparaissent désormais dans le sélecteur « Type de commission ».
- **Portée** : registre partagé → l'effet s'applique aussi au module Marché.

## 2026-05-06 — Ajustement Liste PPM + rattrapage Livrables + Type uniforme

> **Points traités** : **Ajustement Liste PPM** (modifs #5 et #7), **Rattrapage bloc Livrables** (modif #6).

### Modif #7 — Libellés `TYPE_MARCHE` en MAJUSCULES (uniformisation)
- **Description** : sur la liste PPM, certains types s'affichaient en majuscules (`SERVICES`) et d'autres en casse mixte (`Travaux`, `Fournitures`) selon la source du libellé. Uniformisation : tous les libellés `TYPE_MARCHE` du registre passent en MAJUSCULES.
  - `Travaux` → `TRAVAUX`
  - `Fournitures` → `FOURNITURES`
  - `Services Courants` → `SERVICES COURANTS`
  - `Services Intellectuels` → `SERVICES INTELLECTUELS`
  - `Délégation de Service Public` → `DÉLÉGATION DE SERVICE PUBLIC`
- **Sécurité** : `.toUpperCase()` ajouté à l'affichage de la cellule Type dans le tableau de la liste PPM, pour forcer la majuscule même sur les anciennes opérations dont le code stocké ne match pas le registre (ex: `op.typeMarche === 'Travaux'`).
- **Fichiers** :
  - `sidcf-portal/js/config/registries.json` (registre `TYPE_MARCHE`)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` (affichage cellule Type)
- **Portée** : le registre étant partagé, tous les écrans qui affichent `TYPE_MARCHE.label` (Marché et Marché+, filtres, fiches, dropdowns) bénéficient automatiquement.
- **Cache localStorage** : les registres sont rechargés depuis `registries.json` à chaque boot, donc un F5 suffit. Si un utilisateur a un cache `localStorage` (`sidcf_registries`) avec les anciens labels, il peut le purger via la console (`localStorage.removeItem('sidcf_registries')`) ou attendre la prochaine MàJ via l'admin.

### Modif #6 — Bloc Livrables : édition inline + génération en lot + champs optionnels
- **Écran touché** : `/mp/ppm-create-line` (et tout futur écran Marché+ qui utilise le widget)
- **Description** :
  - Création d'un nouveau widget **`renderLivrableManagerMP`** (`sidcf-portal/js/ui/widgets/livrable-manager-mp.js`) dédié à Marché+. L'ancien widget `livrable-manager.js` (encore utilisé par le module Marché) reste intouché.
  - **Édition inline** : chaque livrable apparaît comme une **card éditable directement** (Type, Libellé, Région → Département → Sous-préfecture → Localité, Latitude, Longitude). Plus de modal pour éditer.
  - **Génération en lot** : champ « Générer N » + bouton → ajoute N cards vides d'un coup. Permet de définir le nombre de livrables dès le départ et de remplir au fur et à mesure.
  - **Bouton « + Ajouter un livrable »** conservé pour ajouter un livrable à la fois.
  - **Tous les champs sont optionnels** : aucune validation bloquante, l'utilisateur peut sauvegarder un livrable même partiellement renseigné (au minimum vide).
  - **✕ par card** pour retirer un livrable.
  - L'écran `ecr01d-ppm-create-line.js` importe désormais `renderLivrableManagerMP` au lieu de `renderLivrableManager`.
- **Fichiers** :
  - `sidcf-portal/js/ui/widgets/livrable-manager-mp.js` (nouveau, ~340 lignes)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` (changement d'import et d'appel)
- **Impact** : UI uniquement. Format de stockage des livrables identique (compatible avec l'ancien widget).

### Modif #5 — Liste PPM : « État » → « Étape » + retrait colonne Bailleur
- **Écran touché** : `/mp/ppm-list` (`ecr01b-ppm-unitaire.js`)
- **Description** :
  - Le libellé de la colonne **« État »** est renommé en **« Étape »** (correspond mieux à la sémantique : étape du workflow PPM, pas un état arbitraire).
  - La colonne **« Bailleur »** est retirée du tableau. Avec le multi-financement (modif #3), une opération peut avoir plusieurs bailleurs — afficher juste le premier en colonne devient trompeur. L'information bailleur reste accessible dans les écrans de détail (fiche marché, etc.).
  - Le filtre « Bailleur » du bloc Filtres est conservé (filtre sur `sourceFinancement` legacy = 1er bailleur), à revoir lors d'une future modif si on veut un filtrage multi-bailleur intelligent.
- **Fichier** :
  - `sidcf-portal/js/modules/marche-plus/screens/ecr01b-ppm-unitaire.js` (en-tête `<th>` et cellule `<td>` Bailleur retirées, libellé colonne État → Étape)
- **Impact** : UI uniquement. Pas de changement de données ni de Worker.

> **Point traité** : **Activité dans la chaîne programmatique + Contrôle disponibilité budgétaire**
> Couvre les modifs #1 → #4 ci-dessous : restructuration du bloc Identification autour de l'Activité, recherche filtrable, multi-financement par opération, indicateur de disponibilité budgétaire avec warning de dépassement, et alignement du seed `MP_BUDGET_LINE` sur le référentiel.

### Modif #4 — Alignement des MP_BUDGET_LINE sur ua-activites.json
- **Type** : alignement de données (DB only, pas de code)
- **Description** :
  - Le seed `MP_BUDGET_LINE` cloné depuis l'ancien module Marché contenait 2 lignes avec des codes activité de l'ancien format (`520-03-005`, `440-01-001`) qui ne matchaient pas le référentiel `ua-activites.json` utilisé par l'écran de création.
  - Migration SQL `015` qui : (a) supprime ces lignes, (b) insère **17 nouvelles lignes** alignées sur les 11 activités du référentiel (UA `13001` × 5 activités, UA `13030` × 6 activités), avec un mix `ETAT/EMPRUNT/DON` et plusieurs bailleurs (`TRESOR`, `BAD`, `BM`, `AFD`, `BOAD`, `UE`) pour permettre de tester le multi-financement.
  - Une activité (`ACT_13001_005` — Études et audits) a un AE volontairement faible (50 M XOF) pour permettre de **tester facilement le scénario de dépassement** côté formulaire.
  - Total AE distribué : ~16 milliards XOF.
- **Fichier** :
  - `postgres/migrations/015_marche_plus_budget_lines_align.sql` (nouvelle migration, idempotente)
- **Application** : exécutée sur Neon avec `node run-any.js 015_marche_plus_budget_lines_align.sql` le 2026-05-06. Vérifié via l'API : 17 lignes, toutes en format `ACT_*`.
- **Effet utilisateur** : l'indicateur de la modif #3 affiche désormais des valeurs réelles (Initiale/Programmé/Disponible) au lieu de « Aucune ligne budgétaire enregistrée ».

### Modif #3 — Multi-financement par opération + indicateur de disponibilité budgétaire
- **Écran touché** : `/mp/ppm/create-line`
- **Description** :
  - Le bloc Informations financières devient une **liste de lignes de financement**. L'unité duplicable est désormais le triplet **(Montant prévisionnel, Type de financement, Bailleur)**, plus seulement le bailleur. Les règles de corrélation Type → Bailleurs (filtrage ETAT/EXTERNE) s'appliquent par ligne.
  - Bouton `+ Ajouter une ligne de financement` / ✕ pour retirer (au moins 1 ligne requise).
  - Le **montant prévisionnel total de l'opération** = somme des montants des lignes, calculé en temps réel et affiché en bas du bloc.
  - **Indicateur de disponibilité par ligne** : pour chaque (Activité, Type, Bailleur), on cherche la `MP_BUDGET_LINE` correspondante (clé : `activiteCode + typeFinancement + sourceFinancement`). On affiche en regard :
    - **Initiale** : `MP_BUDGET_LINE.ae` (Autorisation d'Engagement = enveloppe de la ligne)
    - **Programmé (avec cette opération)** : somme des montants déjà engagés sur cette ligne par les autres opérations + le montant de la ligne courante
    - **Disponible après / DÉPASSEMENT** : différence (rouge si négatif, vert sinon)
  - **Warning visuel** : la ligne du formulaire passe en bordure rouge + bandeau rouge si dépassement, et le total de l'opération porte un message « ⚠ Au moins une ligne dépasse l'enveloppe budgétaire ».
  - Les indicateurs se mettent à jour en live quand l'utilisateur change l'activité, le type, le bailleur ou le montant.
  - Après une sauvegarde « Enregistrer et créer nouveau », le snapshot des opérations est rechargé et l'indicateur reflète immédiatement l'opération qui vient d'être enregistrée.
- **Fichiers** :
  - `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` (UI + logique multi-financement, fetch des `MP_BUDGET_LINE` / `MP_OPERATION` au chargement)
  - `sidcf-portal/js/datastore/schema.js` (nouveau champ `chaineBudgetaire.financements: []`)
- **Stockage** :
  - `chaineBudgetaire.financements = [{ montant, typeFinancement, bailleur }]` (NEW)
  - Back-compat : `montantPrevisionnel = somme`, `typeFinancement / sourceFinancement = 1ère ligne`, `chaineBudgetaire.bailleurs = liste`, `chaineBudgetaire.bailleur = 1er bailleur`.
  - Pas de migration DB (champ JSONB).
- **⚠ Limite connue (à corriger côté données)** : les codes activité du seed `MP_BUDGET_LINE` (ex: `520-03-005`) ne matchent pas le format `ACT_<UA>_<NN>` issu de `ua-activites.json`. Tant que les codes ne sont pas alignés, l'indicateur affichera systématiquement « Aucune ligne budgétaire enregistrée pour cette combinaison ». La logique fonctionnera dès que les `MP_BUDGET_LINE.activiteCode` seront alignés sur le référentiel `ua-activites.json`.

### Modif #2 — Recherche filtrable sur le champ Activité
- **Écran touché** : `/mp/ppm/create-line`
- **Description** :
  - Le `<select>` Activité est remplacé par un combobox filtrable (champ de saisie + panneau déroulant).
  - Recherche intelligente : la requête match sur le libellé de l'activité, le code/libellé de l'UA, le libellé du programme et le code de l'activité — l'utilisateur peut donc filtrer par UA naturellement (taper « 13030 » ou « Direction des Marchés » ramène les activités de cette UA).
  - Les options sont groupées par **Section (Ministère)** dans le panneau pour structurer la liste.
  - Navigation clavier : ↑ / ↓ / Enter / Esc.
  - Bouton ✕ intégré pour effacer la sélection.
- **Fichiers** :
  - `sidcf-portal/js/ui/widgets/searchable-select.js` (nouveau widget réutilisable)
  - `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` (intégration)
- **Impact** : UI uniquement. Le widget crée un `<input type="hidden" id="activite">` qui porte le code → tout le code aval (cascade, handleSave) reste compatible sans changement de signature.
- **Réutilisation** : `renderSearchableSelect()` est générique et pourra équiper d'autres champs filtrables dans les modifs suivantes.

### Modif #1 — Activité dans la chaîne programmatique
- **Écran touché** : `/mp/ppm/create-line` (création manuelle d'une ligne PPM)
- **Description** :
  - Le bloc Identification est restructuré autour de l'**Activité** comme 1ʳᵉ saisie. Le choix de l'activité déclenche l'auto-remplissage en lecture seule de **UA**, **Programme** et **Section** (cascade inversée par rapport à l'ancienne logique Section→Programme→UA).
  - L'**Exercice** devient en lecture seule (info fixe et globale, non manipulée ici).
  - La **Nature économique** est ajoutée comme sélection explicite (registre `NATURE_ECO`) après les auto-sélections.
  - La **Ligne budgétaire** n'est plus saisie : elle est calculée et affichée comme `code activité + code nature éco` (lecture seule).
  - Le bloc « Chaîne budgétaire » en bas de page est supprimé (son contenu est désormais entièrement dans Identification).
  - Dans **Informations financières** : le bailleur unique est remplacé par une **liste multi-bailleurs** avec un bouton `+ Ajouter un bailleur` (chaque bailleur sur sa ligne, ✕ pour retirer ; au moins 1 requis).
- **Fichiers** :
  - `sidcf-portal/js/modules/marche-plus/screens/ecr01d-ppm-create-line.js` (réécriture)
  - `sidcf-portal/js/datastore/schema.js` (extension de `MP_OPERATION.chaineBudgetaire` : `sectionCode`, `programmeCode`, `natureCode`, `bailleurs: []`)
- **Impact** : UI uniquement. Pas de migration DB (le champ `mp_operation.chaine_budgetaire` étant JSONB, le tableau `bailleurs` y rentre librement). Pas de redeploy Worker.
- **Back-compat** : `chaineBudgetaire.bailleur` (singular, legacy) continue d'être renseigné avec le 1er bailleur de la liste, idem pour `sourceFinancement` au top-level.
- **Limite connue** : seuls les UA présents explicitement dans `js/config/ua-activites.json` (codes `13001`, `13030`) ont leurs activités dans le dropdown. Les UA mappés sur `_DEFAULT` sont exclus de l'index — il faudra étendre la config si on veut couvrir plus d'UA.
