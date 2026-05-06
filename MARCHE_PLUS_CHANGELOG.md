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
