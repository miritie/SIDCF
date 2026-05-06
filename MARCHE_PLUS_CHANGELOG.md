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
