/* ============================================
   Marché+ — Picker d'entreprise (lookup + autofill + création)
   ============================================
   Modif #43 — Composant universel pour saisir l'identité d'une
   entreprise dans tout formulaire Marché+ (attribution, sous-traitants,
   soumissionnaires, …).

   API :
   const picker = renderEntreprisePicker({
     initialValue: { entrepriseId, raisonSociale, ncc, adresse, telephone, email, banque, compte } | null,
     onChange: (entreprise | null) => void,
     onEditMaster: (entrepriseId) => void,  // optionnel : clic « modifier la fiche »
     required: boolean,
     disabled: boolean,
     allowCreate: boolean  // défaut true
   });

   - Si `initialValue.entrepriseId` est défini → mode "card" lecture seule (déjà liée)
   - Sinon → mode "search" (typeahead) avec possibilité de créer
   ============================================ */

import { el } from '../../lib/dom.js';
import dataService, { ENTITIES } from '../../datastore/data-service.js';
import { searchEntreprises, findSimilarEntreprises } from '../../lib/entreprise-fuzzy-mp.js';
import logger from '../../lib/logger.js';

// Cache module-level pour éviter de re-fetch à chaque clic
let _entreprisesCache = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;  // 30s — refresh court pour intégrer une création récente

async function getEntreprises({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && _entreprisesCache && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _entreprisesCache;
  }
  try {
    const list = await dataService.query(ENTITIES.MP_ENTREPRISE);
    // Modif #44 — exclure les fiches fusionnées (MERGED) du picker
    _entreprisesCache = (list || []).filter(e =>
      e.actif !== false && e.validationStatus !== 'MERGED'
    );
    _cacheTimestamp = now;
    return _entreprisesCache;
  } catch (err) {
    logger.error('[EntreprisePicker] Erreur chargement entreprises:', err);
    return [];
  }
}

/** Force le rafraîchissement du cache (à appeler après création/modif). */
export function invalidateEntreprisesCache() {
  _entreprisesCache = null;
  _cacheTimestamp = 0;
}

/**
 * Composant principal : rendu de la zone picker.
 * Retourne un élément DOM. État interne géré via closure.
 */
export function renderEntreprisePicker(opts = {}) {
  const {
    initialValue = null,
    onChange = () => {},
    onEditMaster = null,
    required = false,
    disabled = false,
    allowCreate = true,
    placeholder = 'Rechercher par NCC ou raison sociale (≥ 2 caractères)…'
  } = opts;

  const container = el('div', {
    className: 'entreprise-picker',
    style: { position: 'relative' }
  });

  // État interne
  let currentEntreprise = initialValue && initialValue.entrepriseId ? initialValue : null;

  function setEntreprise(e) {
    currentEntreprise = e || null;
    rerender();
    onChange(currentEntreprise);
  }

  function rerender() {
    container.innerHTML = '';
    if (currentEntreprise) {
      container.appendChild(renderSelectedCard(currentEntreprise, {
        onClear: disabled ? null : () => setEntreprise(null),
        onEditMaster: onEditMaster ? () => onEditMaster(currentEntreprise.entrepriseId || currentEntreprise.id) : null,
        disabled
      }));
    } else {
      container.appendChild(renderSearchInput({
        placeholder,
        required,
        disabled,
        allowCreate,
        onPicked: setEntreprise,
        prefillValues: initialValue && !initialValue.entrepriseId ? initialValue : null
      }));
    }
  }

  rerender();
  return container;
}

// ============================================
// Mode "Carte sélectionnée" (entreprise déjà liée)
// ============================================

function renderSelectedCard(entreprise, { onClear, onEditMaster, disabled }) {
  return el('div', {
    style: {
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      padding: '12px 14px',
      background: '#f9fafb',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }
  }, [
    el('div', { style: { flex: 1, minWidth: 0 } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' } }, [
        el('span', { style: { fontSize: '14px', fontWeight: 600, color: '#111827' } },
          `🏢 ${entreprise.raisonSociale || '(sans raison sociale)'}`),
        entreprise.validationStatus === 'PENDING' ? el('span', {
          style: {
            fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
            background: '#fef3c7', color: '#92400e', fontWeight: 600
          },
          title: 'Fiche en attente de validation par l\'administrateur'
        }, '⏳ À valider') : null
      ]),
      el('div', { style: { fontSize: '12px', color: '#4b5563', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 10px' } }, [
        entreprise.ncc ? el('span', { style: { color: '#6b7280' } }, 'NCC :') : null,
        entreprise.ncc ? el('span', {}, entreprise.ncc) : null,
        entreprise.adresse ? el('span', { style: { color: '#6b7280' } }, 'Adresse :') : null,
        entreprise.adresse ? el('span', {}, entreprise.adresse) : null,
        entreprise.telephone ? el('span', { style: { color: '#6b7280' } }, 'Tél :') : null,
        entreprise.telephone ? el('span', {}, entreprise.telephone) : null,
        entreprise.email ? el('span', { style: { color: '#6b7280' } }, 'Email :') : null,
        entreprise.email ? el('span', {}, entreprise.email) : null,
        entreprise.banque?.libelle ? el('span', { style: { color: '#6b7280' } }, 'Banque :') : null,
        entreprise.banque?.libelle ? el('span', {}, `${entreprise.banque.libelle}${entreprise.banque.agence ? ' — ' + entreprise.banque.agence : ''}`) : null
      ])
    ]),
    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 } }, [
      onEditMaster ? el('button', {
        type: 'button',
        className: 'btn btn-secondary btn-sm',
        title: 'Modifier la fiche maître (impacte tous les marchés qui la référencent)',
        onclick: (e) => { e.preventDefault(); onEditMaster(); },
        style: { fontSize: '11px', padding: '4px 8px' }
      }, '✏️ Modifier la fiche') : null,
      onClear && !disabled ? el('button', {
        type: 'button',
        className: 'btn btn-secondary btn-sm',
        title: 'Désélectionner cette entreprise',
        onclick: (e) => { e.preventDefault(); onClear(); },
        style: { fontSize: '11px', padding: '4px 8px' }
      }, '🔄 Changer') : null
    ])
  ]);
}

// ============================================
// Mode "Recherche typeahead" (entreprise non encore liée)
// ============================================

function renderSearchInput({ placeholder, required, disabled, allowCreate, onPicked, prefillValues }) {
  const wrap = el('div', { style: { position: 'relative' } });

  const input = el('input', {
    type: 'text',
    className: 'form-input',
    placeholder,
    required: !!required,
    disabled: !!disabled,
    autocomplete: 'off',
    value: prefillValues?.raisonSociale || ''
  });

  const dropdown = el('div', {
    style: {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      marginTop: '2px',
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxHeight: '280px',
      overflowY: 'auto',
      zIndex: '100',
      display: 'none'
    }
  });

  let debounceTimer = null;
  let lastQuery = '';

  async function handleInput() {
    const q = input.value.trim();
    if (q === lastQuery) return;
    lastQuery = q;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (q.length < 2) {
        dropdown.style.display = 'none';
        return;
      }
      const all = await getEntreprises();
      const matches = searchEntreprises(q, all, 10);
      renderDropdown(matches, q);
    }, 250);
  }

  function renderDropdown(matches, query) {
    dropdown.innerHTML = '';
    if (matches.length === 0) {
      dropdown.appendChild(el('div', {
        style: { padding: '10px 14px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }
      }, 'Aucune entreprise trouvée'));
    } else {
      matches.forEach(e => {
        const row = el('div', {
          style: {
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '13px',
            borderBottom: '1px solid #f3f4f6',
            transition: 'background 0.1s'
          },
          onmouseenter: (ev) => ev.currentTarget.style.background = '#eff6ff',
          onmouseleave: (ev) => ev.currentTarget.style.background = '',
          onclick: () => {
            dropdown.style.display = 'none';
            onPicked(buildPickerValueFromEntreprise(e));
          }
        }, [
          el('div', { style: { fontWeight: 600, color: '#111827' } }, [
            el('span', {}, e.raisonSociale || '(sans nom)'),
            e.validationStatus === 'PENDING' ? el('span', {
              style: { marginLeft: '6px', fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: '#fef3c7', color: '#92400e' }
            }, 'à valider') : null
          ]),
          el('div', { style: { fontSize: '11px', color: '#6b7280', marginTop: '2px' } },
            [e.ncc ? `NCC ${e.ncc}` : null, e.adresse, e.telephone].filter(Boolean).join(' · '))
        ]);
        dropdown.appendChild(row);
      });
    }
    if (allowCreate && !disabled) {
      dropdown.appendChild(el('div', {
        style: {
          padding: '10px 14px',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          cursor: 'pointer',
          fontSize: '13px',
          color: '#0d6efd',
          fontWeight: 600
        },
        onmouseenter: (ev) => ev.currentTarget.style.background = '#dbeafe',
        onmouseleave: (ev) => ev.currentTarget.style.background = '#f9fafb',
        onclick: async () => {
          dropdown.style.display = 'none';
          const created = await openCreateEntrepriseModal({ raisonSocialePrefill: query });
          if (created) {
            onPicked(buildPickerValueFromEntreprise(created));
          }
        }
      }, `➕ Créer la nouvelle entreprise « ${query} »`));
    }
    dropdown.style.display = 'block';
  }

  input.addEventListener('input', handleInput);
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) handleInput();
  });

  // Fermeture du dropdown au clic extérieur
  document.addEventListener('click', (ev) => {
    if (!wrap.contains(ev.target)) dropdown.style.display = 'none';
  });

  wrap.appendChild(input);
  wrap.appendChild(dropdown);
  return wrap;
}

/** Construit la valeur que le picker passe à onChange à partir d'une entreprise complète. */
function buildPickerValueFromEntreprise(e) {
  return {
    entrepriseId: e.id,
    raisonSociale: e.raisonSociale || '',
    ncc: e.ncc || '',
    rccm: e.rccm || '',
    adresse: e.adresse || '',
    telephone: e.telephone || '',
    email: e.email || '',
    banque: { ...(e.banque || {}) },
    compte: { ...(e.compte || {}) },
    validationStatus: e.validationStatus || 'VALIDATED'
  };
}

// ============================================
// Modale de création d'une nouvelle entreprise
// ============================================

/**
 * Ouvre une modale pour créer une nouvelle entreprise.
 * Retourne une Promise qui résout vers l'entreprise créée (objet complet), ou null si annulé.
 */
export function openCreateEntrepriseModal({ raisonSocialePrefill = '' } = {}) {
  return new Promise(async (resolve) => {
    const allEntreprises = await getEntreprises();

    // Overlay
    const overlay = el('div', {
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: '1000',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      },
      onclick: (e) => { if (e.target === overlay) cancel(); }
    });

    function buildModal() {
      return el('div', {
        style: {
          background: '#fff', borderRadius: '8px', width: 'min(640px, 95vw)',
          maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
        },
        onclick: (e) => e.stopPropagation()
      }, [
        // Header
        el('div', { style: { padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
          el('h3', { style: { margin: 0, fontSize: '16px' } }, '➕ Créer une nouvelle entreprise'),
          el('button', { type: 'button', onclick: cancel, style: { background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' } }, '×')
        ]),
        // Body
        el('div', { style: { padding: '16px 20px' } }, [
          el('div', { style: { fontSize: '12px', color: '#6b7280', marginBottom: '12px', padding: '8px 12px', background: '#fef3c7', borderRadius: '6px' } },
            '⚠️ Cette fiche sera créée avec le statut « À valider ». Un administrateur la confirmera ou la fusionnera avec une fiche existante.'),
          // Raison sociale
          el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
            el('label', { className: 'form-label' }, 'Raison sociale *'),
            el('input', {
              id: 'ent-create-rs', type: 'text', className: 'form-input',
              value: raisonSocialePrefill, required: true,
              oninput: (e) => updateFuzzyWarning(e.target.value)
            })
          ]),
          el('div', { id: 'ent-create-fuzzy-warning' }),
          // NCC + RCCM
          el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'NCC * (unique)'),
              el('input', { id: 'ent-create-ncc', type: 'text', className: 'form-input', placeholder: 'CI-ABJ-2024-XXXXX', required: true })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'RCCM'),
              el('input', { id: 'ent-create-rccm', type: 'text', className: 'form-input' })
            ])
          ]),
          // Adresse + Tel + Email
          el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
            el('label', { className: 'form-label' }, 'Adresse'),
            el('input', { id: 'ent-create-adresse', type: 'text', className: 'form-input' })
          ]),
          el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Téléphone'),
              el('input', { id: 'ent-create-tel', type: 'text', className: 'form-input' })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Email'),
              el('input', { id: 'ent-create-email', type: 'email', className: 'form-input' })
            ])
          ]),
          // Banque
          el('div', { style: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' } }, '🏦 Coordonnées bancaires (optionnel)'),
          el('div', { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Banque'),
              el('input', { id: 'ent-create-banque-libelle', type: 'text', className: 'form-input', placeholder: 'Ex : SGCI, NSIA, BACI…' })
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Agence'),
              el('input', { id: 'ent-create-banque-agence', type: 'text', className: 'form-input', placeholder: 'Plateau, Cocody…' })
            ])
          ]),
          el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' } }, [
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Type compte'),
              el('select', { id: 'ent-create-compte-type', className: 'form-input' }, [
                el('option', { value: 'IBAN' }, 'IBAN'),
                el('option', { value: 'RIB' }, 'RIB')
              ])
            ]),
            el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'N° de compte'),
              el('input', { id: 'ent-create-compte-numero', type: 'text', className: 'form-input' })
            ])
          ])
        ]),
        // Footer
        el('div', { style: { padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' } }, [
          el('button', { type: 'button', className: 'btn btn-secondary', onclick: cancel }, 'Annuler'),
          el('button', { type: 'button', className: 'btn btn-primary', onclick: submit }, '✓ Créer la fiche')
        ])
      ]);
    }

    function updateFuzzyWarning(rs) {
      const slot = document.getElementById('ent-create-fuzzy-warning');
      if (!slot) return;
      slot.innerHTML = '';
      if (!rs || rs.length < 4) return;
      const similar = findSimilarEntreprises(rs, allEntreprises, 0.85);
      if (similar.length > 0) {
        slot.appendChild(el('div', {
          style: {
            padding: '10px 12px', background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: '6px', marginBottom: '12px', fontSize: '12px'
          }
        }, [
          el('div', { style: { fontWeight: 600, color: '#991b1b', marginBottom: '6px' } },
            `⚠️ ${similar.length} entreprise${similar.length > 1 ? 's' : ''} ressemble${similar.length > 1 ? 'nt' : ''} fortement à ce nom :`),
          ...similar.slice(0, 3).map(({ entreprise, score }) => el('div', {
            style: { padding: '4px 0', cursor: 'pointer', color: '#1d4ed8', textDecoration: 'underline' },
            onclick: () => {
              overlay.remove();
              resolve(entreprise);
            }
          }, `→ ${entreprise.raisonSociale}${entreprise.ncc ? ` (NCC ${entreprise.ncc})` : ''} — ${(score * 100).toFixed(0)} % similaire — cliquer pour utiliser cette fiche`))
        ]));
      }
    }

    function cancel() {
      overlay.remove();
      resolve(null);
    }

    async function submit() {
      const raisonSociale = document.getElementById('ent-create-rs').value.trim();
      const ncc = document.getElementById('ent-create-ncc').value.trim();
      if (!raisonSociale) {
        alert('Raison sociale obligatoire.');
        return;
      }
      if (!ncc) {
        alert('NCC obligatoire (clé d\'unicité).');
        return;
      }
      const conflict = allEntreprises.find(e => (e.ncc || '').trim().toLowerCase() === ncc.toLowerCase());
      if (conflict) {
        alert(`Le NCC « ${ncc} » est déjà utilisé par : ${conflict.raisonSociale}`);
        return;
      }

      const data = {
        ncc,
        raisonSociale,
        rccm: document.getElementById('ent-create-rccm').value.trim(),
        adresse: document.getElementById('ent-create-adresse').value.trim(),
        telephone: document.getElementById('ent-create-tel').value.trim(),
        email: document.getElementById('ent-create-email').value.trim(),
        banque: {
          libelle: document.getElementById('ent-create-banque-libelle').value.trim(),
          agence: document.getElementById('ent-create-banque-agence').value.trim()
        },
        compte: {
          type: document.getElementById('ent-create-compte-type').value,
          numero: document.getElementById('ent-create-compte-numero').value.trim()
        },
        validationStatus: 'PENDING',
        actif: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const result = await dataService.add(ENTITIES.MP_ENTREPRISE, data);
        if (!result.success) {
          alert('Erreur lors de la création. ' + (result.errors ? JSON.stringify(result.errors) : ''));
          return;
        }
        invalidateEntreprisesCache();
        overlay.remove();
        resolve(result.entity);
      } catch (err) {
        logger.error('[EntreprisePicker] Erreur création:', err);
        alert('Erreur réseau lors de la création de la fiche entreprise.');
      }
    }

    overlay.appendChild(buildModal());
    document.body.appendChild(overlay);
  });
}
