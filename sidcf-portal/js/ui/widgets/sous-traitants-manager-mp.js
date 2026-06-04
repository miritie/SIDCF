/**
 * Widget : Gestion des sous-traitants déclarés (Marché+ modif #38.b)
 *
 * Saisie des sous-traitants déclarés par l'attributaire dans le cadre
 * de l'attribution du marché. Permet de :
 *   - lister, ajouter, modifier, supprimer un sous-traitant
 *   - capturer les informations essentielles : raison sociale, NCC,
 *     adresse, téléphone, prestations confiées, % du marché
 *   - tracer l'agrément CF (oui/non + référence document)
 *   - détecter automatiquement les sanctions sur les sous-traitants
 *     (réutilise mp-sanctions.checkSanction avec filtrage par période active)
 *   - alerter si le cumul des % dépasse 40 % (plafond légal indicatif
 *     Code MP CI Art. 130)
 *
 * Stockage : MP_ATTRIBUTION.sousTraitants[] (liste d'objets sérialisés
 * dans le JSONB de l'attribution — pas de table dédiée).
 *
 * Usage :
 *   const node = renderSousTraitantsManager({
 *     sousTraitants: existing,
 *     onChange: (list) => { ... }
 *   });
 */

import { el } from '../../lib/dom.js';
import { checkSanction, renderSanctionBanner } from '../../lib/mp-sanctions.js';
import { renderFormulaBadge } from './formula-tip-mp.js';
import { renderEntreprisePicker } from './entreprise-picker-mp.js';
import logger from '../../lib/logger.js';

const PLAFOND_LEGAL_PCT = 40; // Code MP CI Art. 130 (indicatif)

/**
 * @param {Object} opts
 * @param {Array}  opts.sousTraitants  Liste initiale
 * @param {Function} opts.onChange     Callback (list) => void
 */
export function renderSousTraitantsManager({ sousTraitants = [], onChange } = {}) {
  let items = Array.isArray(sousTraitants) ? [...sousTraitants] : [];

  const container = el('div', { className: 'sous-traitants-manager-mp' });

  function notifyChange() {
    if (onChange) onChange([...items]);
  }

  function cumulPct() {
    return items.reduce((s, x) => s + (Number(x.pourcentageMarche) || 0), 0);
  }

  function render() {
    container.innerHTML = '';
    container.appendChild(renderSummary());
    container.appendChild(renderActionRow());
    container.appendChild(renderList());
  }

  function renderSummary() {
    const total = cumulPct();
    const isOver = total > PLAFOND_LEGAL_PCT;
    const color = isOver ? '#dc2626' : (total > 30 ? '#f59e0b' : '#16a34a');
    const bg = isOver ? '#fee2e2' : (total > 30 ? '#fef3c7' : '#f0fdf4');

    return el('div', {
      style: {
        padding: '10px 14px',
        marginBottom: '10px',
        borderRadius: '6px',
        background: bg,
        borderLeft: `4px solid ${color}`,
        fontSize: '13px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }
    }, [
      el('div', {}, [
        el('strong', {}, `${items.length} sous-traitant${items.length > 1 ? 's' : ''} déclaré${items.length > 1 ? 's' : ''}`),
        items.length > 0 ? el('span', { style: { marginLeft: '10px', color: '#374151' } },
          `Cumul : `) : null,
        items.length > 0 ? el('strong', { style: { color } }, `${total.toFixed(2)} %`) : null,
        items.length > 0 ? el('span', { style: { marginLeft: '6px', fontSize: '11px', color: '#6b7280' } },
          `(plafond légal ${PLAFOND_LEGAL_PCT} %)`) : null,
        isOver ? el('span', { style: { marginLeft: '8px', fontWeight: 600, color: '#7f1d1d' } }, '⚠ DÉPASSEMENT') : null
      ]),
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
        renderFormulaBadge({
          titre: 'Cumul des sous-traitants',
          formule: 'Σ sousTraitants[].pourcentageMarche',
          regle: `Plafond légal indicatif : ${PLAFOND_LEGAL_PCT} % du montant du marché (Code MP CI Art. 130). Alerte jaune au-delà de 30 %, rouge au-delà du plafond. La part sous-traitée doit faire l'objet d'un agrément du Contrôle Financier.`,
          exemple: '2 sous-traitants à 20 % et 15 % ⇒ cumul = 35 % (alerte jaune, sous le plafond)',
          reference: 'Art. 130 Code MP CI · Mail séance 6 mai §5.g'
        })
      ])
    ]);
  }

  function renderActionRow() {
    return el('div', { style: { display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' } }, [
      el('button', {
        type: 'button',
        className: 'btn btn-sm btn-primary',
        onclick: () => openEditorModal(null)
      }, '➕ Ajouter un sous-traitant')
    ]);
  }

  function renderList() {
    if (items.length === 0) {
      return el('p', {
        className: 'text-muted',
        style: { fontStyle: 'italic', padding: '14px', textAlign: 'center', background: '#fafafa', borderRadius: '6px' }
      }, 'Aucun sous-traitant déclaré pour ce marché.');
    }

    return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
      el('thead', {}, [el('tr', {}, [
        el('th', {}, 'Raison sociale'),
        el('th', {}, 'NCC'),
        el('th', {}, 'Prestations'),
        el('th', { style: { textAlign: 'right' } }, '% marché'),
        el('th', {}, 'Compte bancaire'),
        el('th', {}, 'Agrément CF'),
        el('th', { style: { textAlign: 'center' } }, 'Actions')
      ])]),
      el('tbody', {}, items.map((st, idx) => {
        const sanctionWarn = el('div', { id: `st-sanction-${idx}` });
        // Vérifier les sanctions de manière asynchrone (résultat injecté en DOM)
        checkSanction({ raisonSociale: st.raisonSociale, ncc: st.ncc }).then(s => {
          if (s) {
            sanctionWarn.innerHTML = '';
            const banner = renderSanctionBanner(s);
            if (banner) sanctionWarn.appendChild(banner);
          }
        }).catch(() => {});

        const agrementBadge = st.agrementCF
          ? el('span', {
              style: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontWeight: 600 }
            }, '✓ Agréé')
          : el('span', {
              style: { fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }
            }, '⚠ Non agréé');

        return [
          el('tr', {}, [
            el('td', { style: { fontWeight: 500 } }, st.raisonSociale || '-'),
            el('td', { style: { fontFamily: 'monospace', fontSize: '11px', color: '#6b7280' } }, st.ncc || '-'),
            el('td', { style: { fontSize: '12px' }, title: st.prestations || '' },
              (st.prestations || '').length > 50 ? st.prestations.substring(0, 50) + '…' : (st.prestations || '-')),
            el('td', { style: { textAlign: 'right', fontWeight: 500 } }, `${(Number(st.pourcentageMarche) || 0).toFixed(2)} %`),
            el('td', { style: { fontSize: '12px' } },
              (st.banque || st.numeroCompte)
                ? `${st.banque || ''}${st.banque && st.numeroCompte ? ' — ' : ''}${st.numeroCompte || ''}`
                : '-'),
            el('td', {}, agrementBadge),
            el('td', { style: { textAlign: 'center' } }, [
              el('button', {
                className: 'btn btn-sm btn-secondary',
                style: { marginRight: '4px' },
                onclick: () => openEditorModal(idx)
              }, '✏️'),
              el('button', {
                className: 'btn btn-sm btn-danger',
                onclick: () => deleteItem(idx)
              }, '🗑')
            ])
          ]),
          // Ligne d'alerte sanction sous la ligne principale (colspan 6)
          el('tr', {}, [
            el('td', { colspan: 7, style: { padding: 0 } }, sanctionWarn)
          ])
        ];
      }).flat())
    ]);
  }

  // ----- Modal Editor -----

  function openEditorModal(idx) {
    const isEdit = idx !== null && idx !== undefined;
    const draft = isEdit ? { ...items[idx] } : {
      entrepriseId: null,
      raisonSociale: '',
      ncc: '',
      adresse: '',
      telephone: '',
      prestations: '',
      pourcentageMarche: 0,
      banque: '',         // Modif #138 (E-18) — compte bancaire du sous-traitant
      numeroCompte: '',   // Modif #138 (E-18)
      agrementCF: false,
      agrementCFDocRef: '',
      dateDeclaration: new Date().toISOString().slice(0, 10)
    };

    const modal = el('div', {
      className: 'modal-overlay',
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onclick: (e) => { if (e.target === modal) modal.remove(); }
    });

    const content = el('div', {
      style: { background: '#fff', borderRadius: '8px', width: '90%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }
    });

    content.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } }, [
      el('h3', { style: { margin: 0, fontSize: '16px' } }, isEdit ? '✏️ Modifier le sous-traitant' : '➕ Nouveau sous-traitant'),
      el('button', { className: 'btn btn-sm btn-secondary', onclick: () => modal.remove() }, '✕')
    ]));

    // Modif #43.b — Picker entreprise (lookup + autofill + création inline)
    content.appendChild(el('label', { className: 'form-label' }, [
      'Identité du sous-traitant ', el('span', { className: 'required' }, '*')
    ]));
    content.appendChild(el('div', { id: 'st-picker-host', style: { marginBottom: '8px' } },
      renderEntreprisePicker({
        initialValue: draft.entrepriseId ? draft : null,
        onChange: (entreprise) => {
          // Mirror vers les hidden inputs pour rester compat avec checkSanctionLive + payload
          const setVal = (id, val) => { const i = document.getElementById(id); if (i) i.value = val || ''; };
          setVal('st-entreprise-id', entreprise?.entrepriseId || '');
          setVal('st-rs',            entreprise?.raisonSociale || '');
          setVal('st-ncc',           entreprise?.ncc || '');
          setVal('st-adresse',       entreprise?.adresse || '');
          setVal('st-tel',           entreprise?.telephone || '');
          // Modif #138 (E-18) — pré-remplir le compte bancaire du sous-traitant
          // depuis la fiche entreprise (le cas échéant ; reste modifiable).
          setVal('st-banque', entreprise?.banque?.libelle || entreprise?.banque?.code || '');
          setVal('st-compte', entreprise?.compte?.numero || '');
          // Déclenche le check sanctions
          const ev = new Event('input', { bubbles: true });
          document.getElementById('st-rs')?.dispatchEvent(ev);
        }
      })
    ));
    // Inputs cachés mirorrés depuis le picker — compat avec checkSanctionLive + collecte payload
    content.appendChild(el('input', { type: 'hidden', id: 'st-entreprise-id', value: draft.entrepriseId || '' }));
    content.appendChild(el('input', { type: 'hidden', id: 'st-rs', value: draft.raisonSociale || '' }));
    content.appendChild(el('input', { type: 'hidden', id: 'st-ncc', value: draft.ncc || '' }));
    content.appendChild(el('input', { type: 'hidden', id: 'st-adresse', value: draft.adresse || '' }));
    content.appendChild(el('input', { type: 'hidden', id: 'st-tel', value: draft.telephone || '' }));

    // Bandeau sanction temps-réel (réutilise debounce de mp-sanctions)
    const sanctionBanner = el('div', { id: 'st-form-sanction-banner', style: { marginTop: '8px' } });
    content.appendChild(sanctionBanner);
    let sanctionTimer = null;
    const checkSanctionLive = () => {
      clearTimeout(sanctionTimer);
      sanctionTimer = setTimeout(async () => {
        const rs = document.getElementById('st-rs')?.value.trim();
        const ncc = document.getElementById('st-ncc')?.value.trim();
        sanctionBanner.innerHTML = '';
        if (!rs && !ncc) return;
        const s = await checkSanction({ raisonSociale: rs, ncc });
        if (s) {
          const b = renderSanctionBanner(s);
          if (b) sanctionBanner.appendChild(b);
        }
      }, 300);
    };

    content.appendChild(el('div', { style: { marginTop: '12px' } }, [
      el('label', { className: 'form-label' }, 'Prestations confiées'),
      el('textarea', {
        className: 'form-input',
        id: 'st-prestations',
        rows: 2,
        placeholder: 'Décrire les prestations sous-traitées (ex : terrassement, second œuvre, étude topographique…)'
      }, draft.prestations || '')
    ]));

    const grid2 = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' } });
    grid2.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, ['% du marché', el('span', { className: 'required' }, '*')]),
      el('input', { type: 'number', className: 'form-input', id: 'st-pct', min: '0', max: '100', step: '0.01', value: draft.pourcentageMarche || 0 })
    ]));
    grid2.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Agrément CF'),
      el('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' } }, [
        el('input', { type: 'checkbox', id: 'st-agrement', checked: !!draft.agrementCF }),
        el('span', { style: { fontSize: '13px' } }, 'Agréé par le CF')
      ])
    ]));
    grid2.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Réf. document agrément'),
      el('input', { type: 'text', className: 'form-input', id: 'st-agrement-doc', value: draft.agrementCFDocRef || '', placeholder: 'N° / réf. décision' })
    ]));
    content.appendChild(grid2);

    // Modif #138 (E-18) — compte bancaire du sous-traitant (« le cas échéant »).
    // Optionnel ; pré-rempli depuis la fiche entreprise mais éditable.
    const grid3 = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginTop: '12px' } });
    grid3.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Banque'),
      el('input', { type: 'text', className: 'form-input', id: 'st-banque', value: draft.banque || '', placeholder: 'Banque du sous-traitant (facultatif)' })
    ]));
    grid3.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'N° de compte (RIB / IBAN)'),
      el('input', { type: 'text', className: 'form-input', id: 'st-compte', value: draft.numeroCompte || '', placeholder: 'N° de compte du sous-traitant (facultatif)' })
    ]));
    content.appendChild(grid3);

    content.appendChild(el('div', { style: { marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, [
      el('button', { className: 'btn btn-secondary', onclick: () => modal.remove() }, 'Annuler'),
      el('button', {
        className: 'btn btn-primary',
        onclick: () => {
          const rs = document.getElementById('st-rs').value.trim();
          if (!rs) { alert('Raison sociale obligatoire'); return; }
          const pct = parseFloat(document.getElementById('st-pct').value) || 0;
          if (pct < 0 || pct > 100) { alert('Pourcentage du marché entre 0 et 100'); return; }
          const payload = {
            ...draft,
            entrepriseId: document.getElementById('st-entreprise-id')?.value.trim() || null,
            raisonSociale: rs,
            ncc: document.getElementById('st-ncc').value.trim(),
            adresse: document.getElementById('st-adresse').value.trim(),
            telephone: document.getElementById('st-tel').value.trim(),
            prestations: document.getElementById('st-prestations').value.trim(),
            pourcentageMarche: pct,
            banque: document.getElementById('st-banque').value.trim(),         // Modif #138 (E-18)
            numeroCompte: document.getElementById('st-compte').value.trim(),    // Modif #138 (E-18)
            agrementCF: document.getElementById('st-agrement').checked,
            agrementCFDocRef: document.getElementById('st-agrement-doc').value.trim()
          };
          if (isEdit) {
            items[idx] = payload;
            logger.info('[Sous-traitants] Mise à jour', payload);
          } else {
            items.push(payload);
            logger.info('[Sous-traitants] Ajout', payload);
          }
          notifyChange();
          render();
          modal.remove();
        }
      }, isEdit ? 'Enregistrer' : 'Ajouter')
    ]));

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Brancher la vérification sanctions live après mount
    setTimeout(() => {
      document.getElementById('st-rs')?.addEventListener('input', checkSanctionLive);
      document.getElementById('st-ncc')?.addEventListener('input', checkSanctionLive);
      checkSanctionLive(); // vérification initiale en mode édition
    }, 0);
  }

  function deleteItem(idx) {
    const st = items[idx];
    if (!confirm(`Supprimer le sous-traitant "${st.raisonSociale}" ?`)) return;
    items.splice(idx, 1);
    notifyChange();
    render();
  }

  render();
  return container;
}

export default { renderSousTraitantsManager };
