/**
 * Mode « Spécification » — Modif #49
 * ============================================================================
 *
 * Permet de basculer la maquette en mode bavard pour la consommation par des
 * développeurs externes : chaque élément d'UI préalablement câblé (`wireSpec`)
 * expose un badge ℹ. Au clic, une fiche latérale détaille la spécification de
 * l'élément : objet métier, source de données, type, conditions de visibilité
 * et d'édition, règles métier, actions possibles, acteurs, formules, exemples
 * et références réglementaires.
 *
 * ## Activation
 *
 *   - URL  : ajouter `?spec=1` dans la query string OU le hash, ex :
 *     https://sidcf.example/index.html?spec=1#/mp/attribution?idOperation=…
 *     https://sidcf.example/index.html#/mp/attribution?idOperation=…&spec=1
 *
 *   - Désactivation : `?spec=0` (idempotent) ou fermeture du tab.
 *
 *   - Persistance : la session retient l'activation via sessionStorage
 *     (clé `sidcf:specMode`). Les devs n'ont donc pas besoin de propager
 *     `?spec=1` sur chaque clic ; le métier garde un lien sans paramètre et
 *     reste en mode utilisateur normal.
 *
 * ## Câblage d'un élément
 *
 *   import { wireSpec } from '../../lib/spec-mode-mp.js';
 *
 *   const inputModePassation = el('select', { ... });
 *   wireSpec(inputModePassation, {
 *     id: 'attribution-mode-passation',
 *     titre: 'Mode de passation',
 *     objet: 'Procédure légale par laquelle le marché est attribué.',
 *     source: 'MP_OPERATION.modePassation (référentiel MODE_PASSATION)',
 *     type: 'Code référentiel (AOO, AOR, AOOO, PSD, PI, …)',
 *     conditions: {
 *       visible: 'Toujours',
 *       editable: 'Avant visa CF',
 *       requis: 'Oui'
 *     },
 *     reglesMetier: [
 *       'Doit correspondre au mode admis (issu du budget). Sinon dérogation requise (RG-014).',
 *       'Conditionne la visibilité des champs garanties / soumissionnaires.'
 *     ],
 *     actions: ['Sélection dans la liste', 'Flag dérogation + justificatif si non admis'],
 *     acteurs: 'DCF (saisie) · CF (consultation)',
 *     reference: 'Code MP CI · RG-014 du SDF',
 *     exemple: 'Mode admis = AOO ; agent choisit AOR → dérogation requise',
 *     dynamic: (ctx) => ({
 *       etatCourant: `Mode : ${ctx.modePassation || '(non sélectionné)'}`,
 *       conformite: ctx.modePassation === ctx.modeAdmis ? '✓ Conforme' : '⚠ Dérogation requise'
 *     })
 *   });
 *
 * ## Tenir compte du conditionnel et du dynamique
 *
 * Le champ `dynamic(ctx)` est invoqué à l'OUVERTURE de la fiche (clic), avec
 * le contexte courant que le widget pousse via `updateSpecContext()`. Cela
 * permet d'afficher l'état réel du champ (visible/masqué, requis ou non,
 * conforme au budget ou en dérogation) plutôt qu'une description statique
 * qui dériverait du code.
 *
 *   import { updateSpecContext } from '../../lib/spec-mode-mp.js';
 *   updateSpecContext({ modePassation: 'AOR', modeAdmis: 'AOO', etat: 'EN_PROC' });
 *
 * Le contexte est partagé entre tous les `dynamic()` appels de l'écran courant.
 * ============================================================================
 */

import { el } from './dom.js';
import logger from './logger.js';

const SS_KEY = 'sidcf:specMode';
const URL_PARAM = 'spec';

// Contexte runtime partagé — alimenté par les écrans pour évaluer les conditions
let specContext = {};

/**
 * Met à jour le contexte runtime utilisé par les fiches dynamiques.
 * À appeler depuis un écran à chaque changement d'état pertinent (mode de
 * passation, lot courant, état du marché, etc.).
 */
export function updateSpecContext(partial) {
  specContext = { ...specContext, ...partial };
}

export function getSpecContext() {
  return { ...specContext };
}

/**
 * Lit `spec=…` depuis la query string ET le hash, dans cet ordre.
 * Le hash contient typiquement `#/mp/attribution?idOperation=…&spec=1`.
 */
function readSpecParam() {
  // 1. Query string standard (?spec=…)
  const search = new URLSearchParams(window.location.search || '');
  if (search.has(URL_PARAM)) return search.get(URL_PARAM);

  // 2. Hash params — le hash a la forme `#/path?key=val&key=val`
  const hash = window.location.hash || '';
  const q = hash.indexOf('?');
  if (q >= 0) {
    const hashParams = new URLSearchParams(hash.slice(q + 1));
    if (hashParams.has(URL_PARAM)) return hashParams.get(URL_PARAM);
  }
  return null;
}

/**
 * @returns {boolean} true si le mode est actif (URL ou session storage).
 */
export function isSpecMode() {
  // L'URL gagne sur la session : permet d'activer/désactiver explicitement.
  const fromUrl = readSpecParam();
  if (fromUrl === '1') {
    try { sessionStorage.setItem(SS_KEY, '1'); } catch (_) { /* ignore */ }
    return true;
  }
  if (fromUrl === '0') {
    try { sessionStorage.removeItem(SS_KEY); } catch (_) { /* ignore */ }
    return false;
  }
  try { return sessionStorage.getItem(SS_KEY) === '1'; } catch (_) { return false; }
}

/**
 * À appeler au boot. Applique la classe `body.spec-mode`, injecte la
 * bannière persistante et le panel latéral.
 */
export function initSpecMode() {
  if (!isSpecMode()) return;
  document.body.classList.add('spec-mode');
  injectSpecStyles();
  injectSpecBanner();
  injectSpecPanel();
  logger.info('[SpecMode] Mode spécification actif. Câblez les éléments via wireSpec().');
}

/**
 * Attache une fiche de spécification à un élément DOM.
 * En mode utilisateur normal : no-op (l'élément reste tel quel).
 * En mode spec : ajoute un badge ℹ cliquable qui ouvre le panel.
 *
 * @param {HTMLElement} element  — l'élément à documenter
 * @param {Object} spec          — l'objet de spécification (cf. JSDoc en tête)
 * @returns {HTMLElement} l'élément (chainable)
 */
export function wireSpec(element, spec) {
  if (!element || !spec) return element;
  if (!isSpecMode()) return element;

  // Stockage de la spec sur l'élément lui-même (DataSet ne suit pas les objets,
  // on utilise une propriété directe).
  element._specMeta = spec;
  element.classList.add('spec-anchored');

  // Surcouche : insertion d'un badge ℹ positionné en haut-droite de l'élément.
  // L'élément doit pouvoir contenir un enfant absolument positionné — on lui
  // applique `position: relative` si nécessaire.
  const cs = window.getComputedStyle(element);
  if (cs.position === 'static') element.style.position = 'relative';

  const badge = el('button', {
    type: 'button',
    className: 'spec-badge',
    title: spec.titre || 'Voir la spécification',
    onclick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSpecPanel(spec);
    }
  }, 'ℹ');
  element.appendChild(badge);

  return element;
}

// ----- Styles injectés (1 fois) -----

let stylesInjected = false;
function injectSpecStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'spec-mode-styles';
  style.textContent = `
    body.spec-mode .spec-anchored {
      outline: 1px dashed rgba(99, 102, 241, 0.35);
      outline-offset: 1px;
    }
    body.spec-mode .spec-anchored:hover {
      outline: 1px solid rgba(99, 102, 241, 0.75);
      background: rgba(99, 102, 241, 0.04);
    }
    .spec-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 1px solid #6366f1;
      background: #fff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      cursor: pointer;
      padding: 0;
      z-index: 50;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .spec-badge:hover {
      background: #6366f1;
      color: #fff;
    }
    .spec-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #4f46e5, #7c3aed);
      color: #fff;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    .spec-banner a {
      color: #fde68a;
      text-decoration: underline;
      margin-left: 12px;
    }
    body.spec-mode {
      padding-top: 26px;
    }
    .spec-panel {
      position: fixed;
      top: 26px;
      right: 0;
      width: 420px;
      max-width: 100vw;
      height: calc(100vh - 26px);
      background: #fff;
      border-left: 2px solid #6366f1;
      box-shadow: -4px 0 16px rgba(0,0,0,0.1);
      z-index: 9999;
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 0.2s ease-out;
    }
    .spec-panel.open {
      transform: translateX(0);
    }
    .spec-panel-header {
      padding: 14px 16px;
      background: #4f46e5;
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      position: sticky;
      top: 0;
      z-index: 2;
    }
    .spec-panel-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
      line-height: 1.3;
    }
    .spec-panel-close {
      background: rgba(255,255,255,0.18);
      border: 0;
      color: #fff;
      font-size: 18px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      line-height: 1;
    }
    .spec-panel-close:hover { background: rgba(255,255,255,0.32); }
    .spec-panel-body { padding: 14px 16px; font-size: 13px; color: #1f2937; }
    .spec-section { margin-bottom: 14px; }
    .spec-section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6366f1;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .spec-section-value { line-height: 1.5; }
    .spec-section-value code {
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #4338ca;
    }
    .spec-section ul { margin: 4px 0 0; padding-left: 20px; }
    .spec-section ul li { margin-bottom: 3px; }
    .spec-dynamic-block {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
      padding: 8px 10px;
      border-radius: 4px;
      margin-top: 6px;
      font-size: 12px;
    }
    .spec-dynamic-block strong {
      display: inline-block;
      min-width: 110px;
      color: #92400e;
    }
    .spec-conditions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 2px;
    }
    .spec-conditions-table th, .spec-conditions-table td {
      text-align: left;
      padding: 4px 8px;
      border-bottom: 1px solid #f3f4f6;
    }
    .spec-conditions-table th {
      font-weight: 600;
      color: #4338ca;
      background: #f9fafb;
      width: 35%;
    }
  `;
  document.head.appendChild(style);
}

// ----- Bannière persistante -----

function injectSpecBanner() {
  if (document.querySelector('.spec-banner')) return;
  const banner = el('div', { className: 'spec-banner' }, [
    '🔍 MODE SPÉCIFICATION ACTIF — La maquette est en mode bavard pour les développeurs. ',
    el('a', { href: '#', onclick: (e) => { e.preventDefault(); disableAndReload(); } }, 'Revenir au mode utilisateur')
  ]);
  document.body.prepend(banner);
}

function disableAndReload() {
  try { sessionStorage.removeItem(SS_KEY); } catch (_) { /* ignore */ }
  // Retire spec=… des params (hash + query) et recharge
  const url = new URL(window.location.href);
  url.searchParams.delete(URL_PARAM);
  const hash = url.hash || '';
  const qIdx = hash.indexOf('?');
  if (qIdx >= 0) {
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    params.delete(URL_PARAM);
    const newQs = params.toString();
    url.hash = hash.slice(0, qIdx) + (newQs ? '?' + newQs : '');
  }
  // Force désactivation
  url.searchParams.set(URL_PARAM, '0');
  window.location.href = url.toString();
}

// ----- Panel latéral -----

let panelEl = null;
function injectSpecPanel() {
  if (panelEl) return;
  panelEl = el('aside', { className: 'spec-panel', id: 'spec-panel' });
  document.body.appendChild(panelEl);
}

function openSpecPanel(spec) {
  if (!panelEl) injectSpecPanel();
  panelEl.innerHTML = '';

  const header = el('div', { className: 'spec-panel-header' }, [
    el('h3', { className: 'spec-panel-title' }, spec.titre || spec.id || 'Spécification'),
    el('button', {
      className: 'spec-panel-close',
      onclick: () => panelEl.classList.remove('open')
    }, '✕')
  ]);

  const body = el('div', { className: 'spec-panel-body' });

  // Section 1 — Objet
  if (spec.objet) body.appendChild(section('Objet métier', el('div', {}, spec.objet)));

  // Section 2 — Source
  if (spec.source) body.appendChild(section('Source / Entité', el('div', { className: 'spec-section-value' }, [
    el('code', {}, spec.source)
  ])));

  // Section 3 — Type
  if (spec.type) body.appendChild(section('Type', el('div', {}, spec.type)));

  // Section 4 — Conditions statiques (visibilité / édition / requis)
  if (spec.conditions) {
    const table = el('table', { className: 'spec-conditions-table' });
    Object.entries(spec.conditions).forEach(([key, val]) => {
      table.appendChild(el('tr', {}, [
        el('th', {}, capitalize(key)),
        el('td', {}, val)
      ]));
    });
    body.appendChild(section('Conditions', table));
  }

  // Section 5 — Évaluation dynamique sur le contexte courant
  if (typeof spec.dynamic === 'function') {
    let dyn = {};
    try {
      dyn = spec.dynamic(specContext) || {};
    } catch (err) {
      dyn = { erreur: `Échec d'évaluation dynamique : ${err.message}` };
    }
    const block = el('div', { className: 'spec-dynamic-block' });
    Object.entries(dyn).forEach(([k, v]) => {
      block.appendChild(el('div', {}, [
        el('strong', {}, capitalize(k) + ' : '),
        el('span', {}, String(v))
      ]));
    });
    body.appendChild(section('État courant (évalué)', block));
  }

  // Section 6 — Règles métier
  if (Array.isArray(spec.reglesMetier) && spec.reglesMetier.length) {
    const ul = el('ul', {});
    spec.reglesMetier.forEach(r => ul.appendChild(el('li', {}, r)));
    body.appendChild(section('Règles métier', ul));
  }

  // Section 7 — Formule
  if (spec.formule) body.appendChild(section('Formule', el('div', { className: 'spec-section-value' }, [
    el('code', {}, spec.formule)
  ])));

  // Section 8 — Exemple
  if (spec.exemple) body.appendChild(section('Exemple', el('div', {}, spec.exemple)));

  // Section 9 — Actions possibles
  if (Array.isArray(spec.actions) && spec.actions.length) {
    const ul = el('ul', {});
    spec.actions.forEach(a => ul.appendChild(el('li', {}, a)));
    body.appendChild(section('Actions', ul));
  }

  // Section 10 — Acteurs
  if (spec.acteurs) body.appendChild(section('Acteurs', el('div', {}, spec.acteurs)));

  // Section 11 — Référence réglementaire
  if (spec.reference) body.appendChild(section('Référence', el('div', { style: { fontStyle: 'italic', color: '#6b7280' } }, spec.reference)));

  // ID technique (pour les devs — utile pour la traçabilité)
  if (spec.id) body.appendChild(section('ID technique', el('div', { className: 'spec-section-value' }, [
    el('code', {}, spec.id)
  ])));

  panelEl.appendChild(header);
  panelEl.appendChild(body);
  panelEl.classList.add('open');
}

function section(title, content) {
  return el('div', { className: 'spec-section' }, [
    el('div', { className: 'spec-section-title' }, title),
    content
  ]);
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default { isSpecMode, initSpecMode, wireSpec, updateSpecContext, getSpecContext };
