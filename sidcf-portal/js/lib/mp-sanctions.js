/**
 * Marché+ — Détection et gestion des entreprises sanctionnées
 *
 * Détection (informative — ne bloque pas) :
 *   - Match prioritaire sur NCC ou RCCM (égalité stricte, casse normalisée)
 *   - Fallback fuzzy match sur la raison sociale
 *
 * Affichage :
 *   - renderSanctionBanner(sanction) : bandeau d'alerte sous un champ
 *   - openSanctionsDrawer() : drawer CRUD pour gérer la liste
 */

import dataService, { ENTITIES } from '../datastore/data-service.js';
import { el } from './dom.js';
import logger from './logger.js';

const ENT = 'MP_ENTREPRISE_SANCTION';

// Cache mémoire (rafraîchi à chaque ouverture du drawer ou save)
let cache = null;
let cacheAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

function normalize(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents
    .replace(/[^a-z0-9]/g, '')                        // ponctuation/espaces
    .trim();
}

/**
 * Vérifie si une sanction est active à une date donnée (par défaut : maintenant).
 * Modif #30 — On encadre la période de sanction : sanction active si
 *   dateDebut <= now  ET  (dateFin >= now  OU  dateFin == null/vide)
 */
export function isSanctionActive(sanction, now = new Date()) {
  if (!sanction) return false;
  const nowMs = (now instanceof Date ? now : new Date(now)).getTime();
  const debutMs = sanction.dateDebut ? new Date(sanction.dateDebut).getTime() : null;
  const finMs = sanction.dateFin ? new Date(sanction.dateFin).getTime() : null;
  if (debutMs != null && debutMs > nowMs) return false; // pas encore en vigueur
  if (finMs != null && finMs < nowMs) return false;     // expirée
  return true;
}

async function loadAll(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache && (now - cacheAt) < CACHE_TTL_MS) return cache;
  try {
    cache = await dataService.query(ENT, { actif: true });
    cacheAt = now;
  } catch (err) {
    logger.warn('[mp-sanctions] Échec chargement :', err.message);
    cache = [];
  }
  return cache;
}

/**
 * Vérifie si une entreprise est sanctionnée (informatif).
 *
 * Par défaut, seule une sanction **active à date du jour** est retournée
 * (cf. encadrement de la période — modif #30). Pour récupérer toutes les
 * sanctions matchantes y compris expirées, passer `{ includeExpired: true }`.
 *
 * @param {{raisonSociale?:string, ncc?:string, rccm?:string}} entreprise
 * @param {{includeExpired?:boolean, asOf?:Date|string}} [opts]
 * @returns {Promise<Object|null>} la sanction trouvée, ou null
 */
export async function checkSanction(entreprise, opts = {}) {
  if (!entreprise) return null;
  const all = await loadAll();
  if (!all || all.length === 0) return null;

  const ncc = (entreprise.ncc || '').trim();
  const rccm = (entreprise.rccm || '').trim();
  const nameNorm = normalize(entreprise.raisonSociale);
  const asOf = opts.asOf ? new Date(opts.asOf) : new Date();
  const includeExpired = !!opts.includeExpired;

  const pool = includeExpired ? all : all.filter(s => isSanctionActive(s, asOf));

  // 1. Match exact sur NCC
  if (ncc) {
    const m = pool.find(s => s.ncc && s.ncc.trim().toLowerCase() === ncc.toLowerCase());
    if (m) return m;
  }
  // 2. Match exact sur RCCM
  if (rccm) {
    const m = pool.find(s => s.rccm && s.rccm.trim().toLowerCase() === rccm.toLowerCase());
    if (m) return m;
  }
  // 3. Match normalisé sur la raison sociale
  if (nameNorm && nameNorm.length >= 4) {
    const m = pool.find(s => normalize(s.raisonSociale) === nameNorm);
    if (m) return m;
  }
  return null;
}

/**
 * Vérifie les sanctions sur un groupement complet : attributaire principal + mandataire + co-titulaires.
 * Modif #30 — Permet de détecter une entreprise sanctionnée qui s'est retrouvée
 * au sein d'un groupement (souvent l'angle d'attaque utilisé pour contourner une sanction).
 *
 * @param {Object} input
 * @param {Object} [input.attributaire]    Entreprise principale (cas hors groupement)
 * @param {Object} [input.mandataire]      Mandataire du groupement (si applicable)
 * @param {Array}  [input.coTitulaires]    Co-titulaires du groupement
 * @param {Object} [opts]
 * @returns {Promise<{ direct: ?Object, members: Array<{role:string,raisonSociale:string,sanction:Object}> }>}
 *   - `direct`   : sanction sur l'attributaire / mandataire principal (null si aucune)
 *   - `members`  : liste agrégée de toutes les entreprises sanctionnées (attributaire compris)
 */
export async function checkSanctionsGroupement(input = {}, opts = {}) {
  const { attributaire, mandataire, coTitulaires = [] } = input;
  const members = [];

  // Le rôle "principal" couvre soit l'attributaire simple, soit le mandataire du groupement
  const principal = mandataire || attributaire;
  const principalSanction = principal ? await checkSanction(principal, opts) : null;
  if (principalSanction) {
    members.push({
      role: mandataire ? 'MANDATAIRE' : 'ATTRIBUTAIRE',
      raisonSociale: principal.raisonSociale || '?',
      ncc: principal.ncc || '',
      sanction: principalSanction
    });
  }

  for (const m of coTitulaires) {
    if (!m) continue;
    const s = await checkSanction(m, opts);
    if (s) {
      members.push({
        role: 'COTITULAIRE',
        raisonSociale: m.raisonSociale || '?',
        ncc: m.ncc || '',
        sanction: s
      });
    }
  }

  return { direct: principalSanction, members };
}

/**
 * Construit un bandeau de warning sous un champ.
 * @param {Object} sanction - l'entité MP_ENTREPRISE_SANCTION
 * @returns {HTMLElement}
 */
export function renderSanctionBanner(sanction) {
  if (!sanction) return null;

  const isBlocking = sanction.gravite === 'BLOQUANTE';
  const color = isBlocking ? '#dc3545' : '#f59e0b';
  const bg = isBlocking ? '#fef2f2' : '#fffbeb';
  const border = isBlocking ? '#fecaca' : '#fde68a';
  const icon = isBlocking ? '🚫' : '⚠️';

  const title = sanction.typeSanction === 'BLACKLIST'
    ? 'Entreprise BLACKLISTÉE'
    : sanction.typeSanction === 'SUSPENSION'
      ? 'Entreprise SUSPENDUE'
      : 'Avertissement enregistré';

  const dateRange = sanction.dateFin
    ? `${sanction.dateDebut || '?'} → ${sanction.dateFin}`
    : `Depuis ${sanction.dateDebut || '?'} (sans terme)`;

  return el('div', {
    className: 'sanction-banner',
    style: {
      marginTop: '8px',
      padding: '12px 14px',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '6px',
      fontSize: '13px'
    }
  }, [
    el('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '10px' } }, [
      el('div', { style: { fontSize: '20px', lineHeight: '1' } }, icon),
      el('div', { style: { flex: '1' } }, [
        el('div', { style: { fontWeight: 'bold', color, marginBottom: '4px' } }, title),
        sanction.motif ? el('div', { style: { color: '#374151', marginBottom: '6px' } }, sanction.motif) : null,
        el('div', { style: { color: '#6b7280', fontSize: '12px' } }, [
          el('span', {}, `Source : ${sanction.source || '?'}`),
          el('span', { style: { margin: '0 8px' } }, '•'),
          el('span', {}, `Période : ${dateRange}`),
          sanction.decisionRef ? el('span', {}, [
            el('span', { style: { margin: '0 8px' } }, '•'),
            el('span', {}, `Réf. : ${sanction.decisionRef}`)
          ]) : null
        ])
      ])
    ])
  ]);
}

/**
 * Drawer CRUD pour gérer la liste des sanctions.
 * Style minimaliste : panneau qui slide depuis la droite.
 */
export async function openSanctionsDrawer() {
  // Supprimer un drawer existant
  const old = document.getElementById('mp-sanctions-drawer');
  if (old) old.remove();

  const sanctions = await loadAll(true);

  const drawer = el('div', {
    id: 'mp-sanctions-drawer',
    style: {
      position: 'fixed',
      top: '0',
      right: '0',
      width: 'min(640px, 96vw)',
      height: '100vh',
      background: '#fff',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
      zIndex: '9999',
      overflowY: 'auto',
      padding: '24px'
    }
  });

  const header = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' } }, [
    el('div', {}, [
      el('h2', { style: { margin: '0 0 4px 0', fontSize: '20px' } }, '🚫 Entreprises sanctionnées'),
      el('div', { style: { color: '#6b7280', fontSize: '13px' } }, `${sanctions.length} sanction(s) active(s) — liste indicative`)
    ]),
    el('button', {
      className: 'btn btn-secondary btn-sm',
      onclick: () => drawer.remove()
    }, '✕ Fermer')
  ]);

  const addBtn = el('button', {
    className: 'btn btn-primary',
    style: { marginBottom: '16px' },
    onclick: () => renderForm(null)
  }, '➕ Ajouter une sanction');

  const listContainer = el('div', { id: 'mp-sanctions-list' });
  const formContainer = el('div', { id: 'mp-sanctions-form', style: { display: 'none', marginTop: '16px' } });

  function renderList() {
    listContainer.innerHTML = '';
    if (sanctions.length === 0) {
      listContainer.appendChild(el('div', { style: { color: '#6b7280', fontStyle: 'italic', padding: '16px', textAlign: 'center' } }, 'Aucune sanction enregistrée.'));
      return;
    }
    sanctions.forEach(s => {
      const card = el('div', {
        style: {
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '8px',
          background: s.gravite === 'BLOQUANTE' ? '#fef2f2' : '#fffbeb'
        }
      }, [
        el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } }, [
          el('div', { style: { flex: '1' } }, [
            el('div', { style: { fontWeight: 'bold', marginBottom: '4px' } }, s.raisonSociale || '?'),
            el('div', { style: { fontSize: '12px', color: '#6b7280', marginBottom: '6px' } }, [
              s.ncc ? `NCC: ${s.ncc}` : null,
              s.rccm ? ` • RCCM: ${s.rccm}` : null
            ].filter(Boolean).join('')),
            el('div', { style: { fontSize: '13px', marginBottom: '4px' } }, [
              el('span', { style: { background: '#374151', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginRight: '6px' } }, s.typeSanction),
              el('span', { style: { color: '#6b7280', fontSize: '12px' } }, `${s.source || '?'} • ${s.dateDebut || '?'}${s.dateFin ? ' → ' + s.dateFin : ''}`)
            ]),
            s.motif ? el('div', { style: { fontSize: '13px', color: '#374151' } }, s.motif) : null
          ]),
          el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
            el('button', { className: 'btn btn-sm btn-secondary', onclick: () => renderForm(s) }, '✏️'),
            el('button', {
              className: 'btn btn-sm btn-secondary',
              onclick: async () => {
                if (!confirm(`Désactiver la sanction de "${s.raisonSociale}" ?`)) return;
                await dataService.update(ENT, s.id, { actif: false });
                cache = null; // invalider
                openSanctionsDrawer(); // refresh
              }
            }, '🗑️')
          ])
        ])
      ]);
      listContainer.appendChild(card);
    });
  }

  function renderForm(existing) {
    formContainer.style.display = 'block';
    formContainer.innerHTML = '';
    const isEdit = !!existing;
    const data = existing || {
      raisonSociale: '', ncc: '', rccm: '',
      typeSanction: 'BLACKLIST', gravite: 'BLOQUANTE',
      motif: '', source: 'INTERNE', decisionRef: '',
      dateDebut: '', dateFin: '', commentaire: ''
    };

    const form = el('div', { className: 'card', style: { padding: '16px', background: '#f9fafb' } }, [
      el('h3', { style: { marginTop: '0' } }, isEdit ? '✏️ Modifier la sanction' : '➕ Nouvelle sanction'),
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Raison sociale *'),
          el('input', { type: 'text', id: 'mp-s-raison', className: 'form-input', value: data.raisonSociale || '', required: true })
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'NCC'),
          el('input', { type: 'text', id: 'mp-s-ncc', className: 'form-input', value: data.ncc || '' })
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'RCCM'),
          el('input', { type: 'text', id: 'mp-s-rccm', className: 'form-input', value: data.rccm || '' })
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Type'),
          el('select', { id: 'mp-s-type', className: 'form-input' }, [
            el('option', { value: 'BLACKLIST', selected: data.typeSanction === 'BLACKLIST' }, 'Blacklist'),
            el('option', { value: 'SUSPENSION', selected: data.typeSanction === 'SUSPENSION' }, 'Suspension'),
            el('option', { value: 'AVERTISSEMENT', selected: data.typeSanction === 'AVERTISSEMENT' }, 'Avertissement')
          ])
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Gravité'),
          el('select', { id: 'mp-s-gravite', className: 'form-input' }, [
            el('option', { value: 'BLOQUANTE', selected: data.gravite === 'BLOQUANTE' }, 'Bloquante (rouge)'),
            el('option', { value: 'AVERTISSEMENT', selected: data.gravite === 'AVERTISSEMENT' }, 'Avertissement (orange)')
          ])
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Source'),
          el('select', { id: 'mp-s-source', className: 'form-input' }, [
            ['INTERNE', 'DGMP', 'BAD', 'BANQUE_MONDIALE', 'UE', 'AFD', 'BEI', 'AUTRE'].map(s =>
              el('option', { value: s, selected: data.source === s }, s)
            )
          ].flat())
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Date début'),
          el('input', { type: 'date', id: 'mp-s-debut', className: 'form-input', value: data.dateDebut ? String(data.dateDebut).slice(0, 10) : '' })
        ]),
        el('div', {}, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Date fin (vide = sans terme)'),
          el('input', { type: 'date', id: 'mp-s-fin', className: 'form-input', value: data.dateFin ? String(data.dateFin).slice(0, 10) : '' })
        ]),
        el('div', { style: { gridColumn: '1 / -1' } }, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Référence décision'),
          el('input', { type: 'text', id: 'mp-s-ref', className: 'form-input', value: data.decisionRef || '' })
        ]),
        el('div', { style: { gridColumn: '1 / -1' } }, [
          el('label', { style: { fontSize: '12px', fontWeight: 'bold' } }, 'Motif'),
          el('textarea', { id: 'mp-s-motif', className: 'form-input', rows: 2 }, data.motif || '')
        ])
      ]),
      el('div', { style: { marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, [
        el('button', { className: 'btn btn-secondary', onclick: () => { formContainer.style.display = 'none'; } }, 'Annuler'),
        el('button', {
          className: 'btn btn-primary',
          onclick: async () => {
            const payload = {
              raisonSociale: document.getElementById('mp-s-raison').value.trim(),
              ncc: document.getElementById('mp-s-ncc').value.trim(),
              rccm: document.getElementById('mp-s-rccm').value.trim(),
              typeSanction: document.getElementById('mp-s-type').value,
              gravite: document.getElementById('mp-s-gravite').value,
              source: document.getElementById('mp-s-source').value,
              dateDebut: document.getElementById('mp-s-debut').value || null,
              dateFin: document.getElementById('mp-s-fin').value || null,
              decisionRef: document.getElementById('mp-s-ref').value.trim(),
              motif: document.getElementById('mp-s-motif').value.trim(),
              actif: true
            };
            if (!payload.raisonSociale) { alert('Raison sociale requise'); return; }
            if (isEdit) {
              await dataService.update(ENT, existing.id, payload);
            } else {
              await dataService.add(ENT, payload);
            }
            cache = null;
            openSanctionsDrawer();
          }
        }, isEdit ? '💾 Enregistrer' : '➕ Créer')
      ])
    ]);

    formContainer.appendChild(form);
  }

  drawer.appendChild(header);
  drawer.appendChild(addBtn);
  drawer.appendChild(listContainer);
  drawer.appendChild(formContainer);
  renderList();

  document.body.appendChild(drawer);
}

/**
 * Bandeau visuel agrégé pour les sanctions détectées dans un groupement.
 * Modif #30 — Met en évidence les entreprises sanctionnées au sein
 * d'un groupement (mandataire ou co-titulaires).
 */
export function renderGroupementSanctionsBanner(result) {
  if (!result || !result.members || result.members.length === 0) return null;

  const anyBlocking = result.members.some(m => m.sanction?.gravite === 'BLOQUANTE');
  const color = anyBlocking ? '#dc2626' : '#f59e0b';
  const bg = anyBlocking ? '#fef2f2' : '#fffbeb';
  const border = anyBlocking ? '#fecaca' : '#fde68a';

  const roleLabel = {
    ATTRIBUTAIRE: 'Attributaire',
    MANDATAIRE: 'Mandataire du groupement',
    COTITULAIRE: 'Co-titulaire'
  };

  return el('div', {
    className: 'sanction-groupement-banner',
    style: {
      marginTop: '8px',
      padding: '12px 14px',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: '6px',
      fontSize: '13px'
    }
  }, [
    el('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' } }, [
      el('div', { style: { fontSize: '20px', lineHeight: '1' } }, anyBlocking ? '🚫' : '⚠️'),
      el('div', { style: { flex: 1 } }, [
        el('div', { style: { fontWeight: 'bold', color } },
          `${result.members.length} entreprise${result.members.length > 1 ? 's' : ''} sanctionnée${result.members.length > 1 ? 's' : ''} détectée${result.members.length > 1 ? 's' : ''} dans ce groupement`),
        el('div', { style: { fontSize: '11px', color: '#6b7280', marginTop: '2px' } },
          'Une entreprise sanctionnée présente dans un groupement reste informative (non-bloquant).')
      ])
    ]),
    el('table', { style: { width: '100%', fontSize: '12px', background: '#fff', borderRadius: '4px' } }, [
      el('thead', {}, [el('tr', { style: { background: '#f3f4f6' } }, [
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Rôle'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Raison sociale'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'NCC'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Type'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Période'),
        el('th', { style: { padding: '6px 8px', textAlign: 'left' } }, 'Source')
      ])]),
      el('tbody', {}, result.members.map(m => {
        const sanction = m.sanction;
        const dateRange = sanction.dateFin
          ? `${sanction.dateDebut || '?'} → ${sanction.dateFin}`
          : `Depuis ${sanction.dateDebut || '?'} (sans terme)`;
        return el('tr', { style: { borderBottom: '1px solid #e5e7eb' } }, [
          el('td', { style: { padding: '5px 8px', fontWeight: 600 } }, roleLabel[m.role] || m.role),
          el('td', { style: { padding: '5px 8px' } }, m.raisonSociale),
          el('td', { style: { padding: '5px 8px', fontFamily: 'monospace', fontSize: '11px', color: '#6b7280' } }, m.ncc || '-'),
          el('td', { style: { padding: '5px 8px' } }, el('span', {
            style: {
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: sanction.gravite === 'BLOQUANTE' ? '#dc2626' : '#f59e0b',
              color: '#fff'
            }
          }, sanction.typeSanction || '?')),
          el('td', { style: { padding: '5px 8px', fontSize: '11px' } }, dateRange),
          el('td', { style: { padding: '5px 8px', fontSize: '11px' } }, sanction.source || '?')
        ]);
      }))
    ])
  ]);
}

export default { checkSanction, checkSanctionsGroupement, renderSanctionBanner, renderGroupementSanctionsBanner, openSanctionsDrawer, isSanctionActive };
