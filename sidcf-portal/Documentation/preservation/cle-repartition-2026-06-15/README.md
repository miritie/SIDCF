# Préservation — Tableau « Clé de répartition » (état au 15/06/2026)

> Snapshot SCOPÉ (pas une sauvegarde globale) du **tableau de clé de répartition**
> tel que conçu et validé, afin de pouvoir y **revenir précisément** si les
> évolutions demandées par le client (Excel « 11 06 2026 — CLE DE REPARTITION ET
> ORDONNANCEMENT CP ANNEE ») devaient être annulées.

## Point de référence Git

- **Commit** : `fc1cd1e8` (branche `main`, 15/06/2026).
- **Tag** : `cle-repartition-v1-2026-06-15` (pointe sur ce commit).
- Pour récupérer la version live à cet état (sans toucher au reste) :
  ```bash
  git checkout cle-repartition-v1-2026-06-15 -- sidcf-portal/js/ui/widgets/cle-repartition-manager-mp.js
  ```

## Contenu du snapshot

| Fichier | Rôle |
|---|---|
| `cle-repartition-manager-mp.SNAPSHOT.js` | Copie fidèle du **widget** `js/ui/widgets/cle-repartition-manager-mp.js` — le cœur du tableau (lignes par source, montant + %, base HT/TTC, ligne « TVA État » 18 % du TTC). |
| `ecr03a-ordonnancement-cle.SNAPSHOT.txt` | Extrait (avec n° de ligne) des fonctions liées dans `ecr03a-attribution.js` : `renderCleRepartitionSection`, `renderOrdonnancementSection`, `computeOrdonnancementFromCle`, `renderOrdonnancementRecap` (#141 — l'ordonnancement CP par année **dérivé** de la clé, en lecture seule). |

## Ce que fait l'implémentation préservée (rappel)

- **Lignes** : une par source de financement — `typeFinancement` ∈ {ETAT, DON, EMPRUNT} + `bailleur`.
- **Saisie duale montant ↔ %** (widget `montant-pourcentage-dual-input`), % calculé sur la **base** choisie par ligne (`baseCalc` = HT ou TTC) du montant marché.
- **Ligne « TVA État »** dédiée (`isTVAEtat`) = **18 % du TTC**, `typeFinancement: ETAT`, base TTC — matérialise la prise en charge de la TVA par l'État.
- **Total** attendu = montant total **TTC** du marché (somme des parts = 100 %).
- **Ordonnancement** (#141) : récap **lecture seule** dérivé de la clé, ventilé par **année** × source (ETAT→Trésor, DON→Dons, EMPRUNT→Emprunts).

## Lien avec l'Excel client (pour mémoire)

L'Excel décrit exactement ce modèle (SOURCE / TYPE / PART CONTRACTUEL (TAUX) / MONTANT TTC ;
total = montant marché) et 4 scénarios canoniques de répartition État↔Bailleur fondés sur TVA/HT/TTC :
1. État : 100 % TVA (18 %) — Bailleur : 100 % HT
2. État : 18 % TVA + xx % HT — Bailleur : yy % HT
3. État : 0 % — Bailleur : 100 % TTC
4. État : 100 % TTC — Bailleur : 0 %

L'ordonnancement = engagement réparti sur les **CP** : « Année courante », « Année courante + 1 », etc.
**Ces 4 scénarios sont déjà tous exprimables avec l'implémentation préservée.**
