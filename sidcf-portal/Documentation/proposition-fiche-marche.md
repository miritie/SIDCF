# Proposition — La « vraie » Fiche de Marché

> **Contexte** : la spec SDF (slide 11 — UC04, exigences F018 / F020) demande une fiche complète qui permet « à tout utilisateur autorisé de consulter la fiche complète d'un marché, incluant **toutes les informations saisies à chaque phase** (Planification, Contractualisation, Attribution, Exécution, Clôture), **tous les documents** joints, **l'historique** des modifications ». Notre `/mp/fiche-marche` actuelle ne montre que l'identité + chaîne budgétaire + livrables — c'est une *page de lancement vers les phases*, pas une fiche consolidée.

> **Objectif** : proposer une **vue lecture unique, exhaustive, exportable** qui réponde réellement à UC04. Pas un tableau de bord — un **dossier consolidé**.

---

## 1. Qui consomme cette fiche ?

| Acteur | Cas d'usage |
|---|---|
| **Contrôleur Financier** | Vérifier la conformité globale (cumuls, seuils, documents obligatoires) en un coup d'œil. Préparer un visa. Archiver. |
| **Agent marché** | Re-prendre un dossier après pause. Voir l'état avant action. Préparer un point d'avancement. |
| **Direction (lecture)** | Comprendre un marché complet sans naviguer 8 écrans. Exporter pour réunion. |
| **Audit / Inspection** | Consulter l'historique et les documents d'un marché passé sans modifier. |

→ **Conséquence** : la fiche est avant tout en **lecture seule**. La modification se fait via les écrans de phase (boutons « Modifier cette section » qui redirigent).

---

## 2. Structure proposée

### 2.1 Layout général

```
┌──────────────────────────────────────────────────────────────────────┐
│  EN-TÊTE STICKY                                                       │
│  📋 Construction route Bouaké–Korhogo (lot 2)                         │
│  M-2025-1234 · TRAVAUX · AOO préqualification    [En exécution]      │
│  💰 472 000 000 XOF HT · 556 960 000 XOF TTC                          │
│  📅 OS 15/02/2026 · Fin prév. 15/02/2027 · Visa CF 10/02/2026         │
│  ┌──────────────┬───────────────┬─────────────────┐                   │
│  │ ⤓ Export PDF │ ⤓ Export XLSX │ 🖨 Imprimer    │                   │
│  └──────────────┴───────────────┴─────────────────┘                   │
├──────────────────────────────────────────────────────────────────────┤
│  TIMELINE — 5 PHASES                                                  │
│  ●━━━━●━━━━●━━━━○━━━━○                                                │
│  Planif Contract Attrib Visa Exec  Cloture                            │
│  ✓ 03/12 ✓ 15/01 ✓ 02/02 ✓ 10/02 ⏳ -                                 │
├──────────────────────────────────────────────────────────────────────┤
│  INDICATEURS DE SANTÉ (KPIs synthétiques)                             │
│  Cumul avenants : 12.5% (seuil 30%)  Échéancier : 40% versé           │
│  Garanties : 3 actives / 0 expirées   Docs obligatoires : 18/20 ✓     │
├──────────────────────────────────────────────────────────────────────┤
│  📑 SECTIONS PAR PHASE (toutes affichées, accordéons repliables)      │
│  ▸ 1. Planification (PPM)                                             │
│  ▸ 2. Contractualisation                                              │
│  ▸ 3. Attribution                                                     │
│  ▸ 4. Approbation (Visa CF)                                           │
│  ▸ 5. Exécution                                                       │
│  ▸ 6. Clôture                                                         │
├──────────────────────────────────────────────────────────────────────┤
│  📚 DOCUMENTS (panneau latéral sticky droite — voir 2.5)              │
│  🕒 HISTORIQUE / AUDIT (section en bas)                               │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 En-tête sticky

Visible en permanence pendant le scroll. Contient :

- **Objet du marché** (titre principal)
- **Numéro** + **type de marché** + **mode de passation** (avec sous-variante si applicable)
- **Badge d'état** (Planifié / Contractualisé / Attribué / Visé / En exécution / Résilié / Clôturé)
- **Badge dérogation** si applicable
- **Montants** HT et TTC (issus de l'attribution si disponible, sinon montant prévisionnel)
- **Dates clés condensées** : OS, fin prévisionnelle, dernière action significative
- **Sélecteur de lot** si > 1 lot (filtre toutes les sections per-lot ci-dessous)
- **Actions** : Export PDF, Export Excel, Imprimer, **lien direct « Modifier cette phase »** (saute à la phase courante)

### 2.3 Timeline 5 phases

Bandeau visuel avec :
- État de chaque phase (terminée ✓ / en cours ⏳ / à venir ○)
- Date de validation/transition
- Clic = ancre vers la section correspondante ci-dessous

### 2.4 KPIs de santé du marché

Encart synthétique avec **4 indicateurs critiques** :

| KPI | Calcul | Code couleur |
|---|---|---|
| Cumul avenants | `Σ variationMontant / montantInitial × 100` | vert <25%, jaune 25-30%, rouge ≥30% (RG021) |
| Avancement échéancier | `Σ montants des échéances déclarées payées / total échéancier × 100` | bleu informatif |
| Garanties actives / expirées | comptage | rouge si ≥1 expirée et non levée |
| Documents obligatoires | `pieces présentes / pieces attendues` (cf. `pieces-matrice.json`) | vert si 100% |

→ Donne au CF une vue de risque en 3 secondes.

### 2.5 Sections par phase (le cœur de la fiche)

Chaque section est un **accordéon** :
- État replié par défaut pour les phases non significatives à l'étape courante
- Bouton **« Modifier »** dans l'en-tête qui redirige vers l'écran de saisie de la phase
- Indicateur de complétude (badge `Complet` / `Partiel` / `Vide`)

#### Section 1 — Planification (PPM)

- Section, programme, action, activité, nature économique, unité administrative
- Ligne budgétaire (avec rappel disponibilité)
- Région, département, sous-préfecture, localité
- Dotation, montant prévisionnel HT, montant prévisionnel TTC
- Dates prévisionnelles (début exec, fin prévisionnelle, durée)
- Bénéficiaires
- **Livrables prévisionnels** : type, libellé, quantité, localisation cascade + coordonnées géo

#### Section 2 — Contractualisation

- Mode de passation + sous-variante (AOO préqualification, AOO 2 étapes…)
- Catégorie (nationale/internationale), nature de prix, revue
- **Dérogation procédure** si applicable (motif + document justificatif)
- **Lots définis** : pour chaque lot : libellé, nb offres reçues/classées, 4 dates (ouverture, analyse technique, analyse financière, jugement), 5 PVs téléchargeables
- **Soumissionnaires** par lot : NCC, raison sociale, nature (simple/groupement conjoint/solidaire), statut sanction (avec lien vers détection)
- **Commission de jugement** (COJO/COPE) : type + membres
- **Recours** éventuels (type, dépôt, organe, conclusion)
- Type de dossier d'appel (DAO, DPI, DC, AMI, etc.)

#### Section 3 — Attribution

- **Attributaire** : entreprise simple ou groupement (mandataire + co-titulaires si conjoint), avec coordonnées bancaires et SWIFT
- **Montants attribués** HT / TTC (carte « Montant du marché de base »)
- **Garanties contractuelles** (avance, bonne exécution, cautionnement) : pour chacune → existence, base HT/TTC, montant + taux, dates émission/échéance, document. Affichage du seuil légal en regard (3-5% pour BE, ≤15% pour avance).
- **Échéancier de paiement** : tableau des échéances avec n°, date prévisionnelle, base HT/TTC, montant, %, type, livrables ciblés
- **Clé de répartition multi-bailleurs** : tableau des lignes avec année, bailleur, type financement, nature éco, base HT/TTC, montant, %. Ligne TVA État si activée. Totaux + validation 100%.
- **Réserves CF** : type, motif, commentaire
- **TVA État** : activée ou non, montant pris en charge

#### Section 4 — Approbation (Visa CF)

- Organe d'approbation (un des 27 organes du référentiel)
- Date du visa
- Décision (Visa / Réserve / Refus)
- Motif si réserve ou refus
- **Document signé téléchargeable**

#### Section 5 — Exécution

- **Ordre de Service de démarrage** : date, document
- **Calcul automatique** : date fin prévisionnelle = OS + durée
- **Avenants chronologiques** : numéro, type (FINAN/DELAI/MIXTE), montant + %, base HT/TTC, motif, date signature, date approbation, document. Indicateur cumul vs seuils 25% / 30%.
- **Garanties en cours** (vue depuis MP_GARANTIE) : type étendu (offre, BE, avance, retenue, biens remis, approvisionnements, délai paiement, décennale, etc.), base, taux, montant, état (active/expirée/levée), date mainlevée.
- **Décomptes / Ordres de Paiement** (UI à construire — cf. SDF F012) : montant, date, livrable concerné. Comparaison avec échéancier prévu → écart calendaire et financier.
- **Résiliation** si applicable : date, motif

#### Section 6 — Clôture

- Date dernier décompte
- **PV de réception provisoire** (obligatoire — RG020)
- **PV de réception définitive**
- **Mainlevées des garanties** restantes
- **Livrables réalisés** vs livrables prévus → cohérence RG013 (alerte si écart)
- Date de clôture effective

### 2.6 Documents (panneau latéral sticky)

À droite, un panneau qui liste **tous les documents** rattachés au marché, **groupés par phase** :

```
📚 Documents (24)
─────────────
▸ Planification (1)
    📄 PPM_2026_signed.pdf
▸ Contractualisation (8)
    📄 DAO.pdf
    📄 PV_ouverture_lot1.pdf
    📄 PV_jugement_lot1.pdf
    …
▸ Attribution (6)
▸ Visa CF (1)
▸ Exécution (5)
▸ Clôture (3)
```

Chaque entrée téléchargeable. Filtre rapide par type (PV, garantie, contrat, etc.).

### 2.7 Historique / Audit

Section en bas de page. Chronologie des actions sur le marché :

| Date / heure | Utilisateur | Action | Détail |
|---|---|---|---|
| 2026-05-15 14:32 | M. Koffi (Agent) | Avenant créé | AV2 +25M XOF (motif : variation matériaux) |
| 2026-05-12 09:18 | Mme Adjoua (CF) | Visa accordé | Sans réserves |
| 2026-05-02 16:05 | M. Koffi (Agent) | Attribution validée | Attributaire : SOCIBAT |
| … | | | |

→ Exigence NF07 (journalisation centralisée). Nécessite une **table backend `mp_audit_log`** alimentée par tous les écrans CRUD.

---

## 3. Comportements interactifs

| Action | Comportement |
|---|---|
| Clic sur une étape de la timeline | Scroll auto vers la section correspondante |
| Clic sur « Modifier » dans une section | Navigation vers l'écran de saisie de la phase, avec retour vers la fiche |
| Sélecteur de lot | Filtre toutes les sections per-lot ; les sections opération globales restent visibles |
| Toggle accordéon | Replie/déplie ; état mémorisé en `localStorage` (ex: `sidcf:fiche:accordion:M-2025-1234`) |
| Export PDF | Génère un PDF de la fiche complète, lisible pour archive papier (jsPDF côté client OU export serveur via Worker) |
| Export Excel | Génère un classeur multi-onglets (un onglet par phase + un onglet documents + un onglet audit log) |
| Hover sur un KPI | Tooltip avec détail (ex: cumul avenants → liste des avenants contributifs) |
| Documents | Clic = téléchargement R2 direct (via URL signée Worker) |

---

## 4. Découpage en implémentation (proposition)

Pour ne pas livrer un monolithe d'un coup :

| Modif # | Livraison | Effort |
|---|---|---|
| **#A** | Squelette : en-tête sticky enrichi + sélecteur de lot + timeline améliorée + sections vides repliables | 1 jour |
| **#B** | Sections Planification + Contractualisation (peuplées depuis `procedure`, `operation`) | 1 jour |
| **#C** | Sections Attribution + Visa CF (peuplées depuis `attribution`, `visasCF`) | 1 jour |
| **#D** | Sections Exécution + Clôture (peuplées depuis `avenants`, `garanties`, `ordresService`, `cloture`) | 1-2 jours |
| **#E** | Panneau Documents latéral sticky + téléchargement R2 | 1 jour |
| **#F** | KPIs de santé du marché (calculs + alertes) | 0.5 jour |
| **#G** | Export PDF (mise en page imprimable, jsPDF ou puppeteer côté Worker) | 1-2 jours |
| **#H** | Export Excel multi-onglets (SheetJS côté client) | 1 jour |
| **#I** | Audit log (table backend + UI section historique) | 2-3 jours (touche back) |

**Total estimé MVP fiche consolidée (A→F) : 4-5 jours**. PDF/Excel/Audit ajoutent 4-6 jours.

---

## 5. Choix de conception clés

1. **Tout dans une seule page**, pas d'onglets. Le scroll long est acceptable et imprimable.
2. **Accordéons** plutôt qu'onglets pour rester compatible avec l'export PDF (tout doit être déployable d'un coup pour l'impression).
3. **Read-only par défaut** : limite les bugs, simplifie la mise en cache, sépare les responsabilités (la fiche présente, les écrans de phase modifient).
4. **Sélecteur de lot global en en-tête** : pas un sélecteur par section. Cohérence visuelle.
5. **Toutes les phases visibles**, même celles à venir (avec badge `À venir` + bouton `Commencer`). Donne une vue de progression complète, pas seulement un historique du passé.
6. **Documents en panneau latéral** plutôt que dispersés dans chaque section : facilite l'inventaire d'archivage.
7. **Audit log en bas**, optionnel et repliable : ne pollue pas la lecture principale mais reste accessible.

---

## 6. Questions à trancher avec le métier avant implémentation

- Le **rôle CF** doit-il pouvoir annoter la fiche (commentaires sticky) sans repasser par les écrans de phase ?
- La **vue impression** doit-elle inclure l'audit log et les pièces jointes (en annexe) ou uniquement le résumé ?
- L'**export PDF** doit-il être signé numériquement (pour archive officielle) ?
- Le **panneau Documents** : faut-il une recherche full-text dans les PDFs (Tika / Elasticsearch côté serveur) ou seulement par nom/type ?
- L'**alerte cohérence livrables prévus vs réalisés** (RG013) : à quel point bloquante en clôture ?
- **Multi-lot** : faut-il aussi une « fiche consolidée tous lots » (vue marché global avec sommaire par lot) en plus de la fiche par lot ?
