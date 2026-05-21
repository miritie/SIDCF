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
