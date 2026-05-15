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
