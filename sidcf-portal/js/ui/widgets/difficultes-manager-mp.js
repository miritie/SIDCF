/**
 * Widget : Difficultés du marché (Marché+ modif #29)
 *
 * Permet, depuis la fiche de vie, de saisir, modifier et suivre les
 * difficultés rencontrées tout au long du cycle de vie d'un marché.
 *
 * Données : entité MP_DIFFICULTE (schéma déjà défini)
 *   { id, operationId, statutTraitement, decision, probleme,
 *     dateDecision, nomDecideur, fichier,
 *     impact, categorieProbleme, actionsCorrectives,
 *     createdAt, updatedAt }
 *
 * Affichage :
 *   - Bandeau de synthèse (compteurs par statut + alerte si impact CRITIQUE en cours)
 *   - Tableau filtrable des difficultés (statut, impact, catégorie)
 *   - Modal d'ajout / d'édition avec tous les champs
 *
 * Usage :
 *   const node = renderDifficultesManager({
 *     operationId,
 *     difficultes,     // tableau initial des difficultés de l'opération
 *     registries,
 *     onSaved: async (list) => { ... }
 *   });
 */

import { el } from '../../lib/dom.js';
import dataService, { ENTITIES } from '../../datastore/data-service.js';
import logger from '../../lib/logger.js';
import { date as fmtDate } from '../../lib/format.js';
import { uid } from '../../lib/uid.js';

// ----- Référentiels locaux -----

export const STATUT_TRAITEMENT = [
  { code: 'EN_COURS',   label: 'En cours',   color: '#0066cc', bg: '#dbeafe' },
  { code: 'RESOLU',     label: 'Résolu',     color: '#16a34a', bg: '#dcfce7' },
  { code: 'ABANDONNE',  label: 'Abandonné',  color: '#6b7280', bg: '#f3f4f6' }
];

// Modif #125 (E-3) — Statut du MARCHÉ en difficulté (axe distinct du « statut de
// traitement » de la difficulté). Codes alignés sur ETAT_MARCHE quand ils existent.
export const STATUT_MARCHE_DIFFICULTE = [
  { code: 'EN_COURS',  label: 'En cours',  color: '#0066cc', bg: '#dbeafe' },
  { code: 'SUSPENDU',  label: 'Suspendu',  color: '#d97706', bg: '#fef3c7' },
  { code: 'ABANDONNE', label: 'Abandonné', color: '#6b7280', bg: '#f3f4f6' },
  { code: 'RESILIE',   label: 'Résilié',   color: '#dc2626', bg: '#fee2e2' }
];

export const IMPACT_LEVELS = [
  { code: 'FAIBLE',   label: 'Faible',   color: '#16a34a', bg: '#dcfce7' },
  { code: 'MOYEN',    label: 'Moyen',    color: '#f59e0b', bg: '#fef3c7' },
  { code: 'ELEVE',    label: 'Élevé',    color: '#ea580c', bg: '#ffedd5' },
  { code: 'CRITIQUE', label: 'Critique', color: '#dc2626', bg: '#fee2e2' }
];

export const CATEGORIES_PROBLEME = [
  { code: 'TECHNIQUE',     label: 'Technique' },
  { code: 'FINANCIER',     label: 'Financier' },
  { code: 'JURIDIQUE',     label: 'Juridique' },
  { code: 'CONTRACTUEL',   label: 'Contractuel' },
  { code: 'DELAI',         label: 'Délai / planning' },
  { code: 'QUALITE',       label: 'Qualité' },
  { code: 'RESSOURCE',     label: 'Ressource humaine / matérielle' },
  { code: 'EXTERNE',       label: 'Cause externe (climat, contexte)' },
  { code: 'AUTRE',         label: 'Autre' }
];

function metaStatut(code) {
  return STATUT_TRAITEMENT.find(s => s.code === code) || STATUT_TRAITEMENT[0];
}
function metaImpact(code) {
  return IMPACT_LEVELS.find(i => i.code === code) || IMPACT_LEVELS[0];
}
function metaCategorie(code) {
  return CATEGORIES_PROBLEME.find(c => c.code === code) || CATEGORIES_PROBLEME[CATEGORIES_PROBLEME.length - 1];
}

// ----- Composant principal -----

export function renderDifficultesManager({
  operationId,
  difficultes = [],
  registries = {},
  lots = [],          // Modif #68 — liste des lots du marché (cf. getLotsFromProcedure)
  onSaved
} = {}) {
  let items = [...difficultes];
  let filterStatut = 'TOUS';
  let filterImpact = 'TOUS';
  let filterLot = 'TOUS';   // Modif #68 — filtre par lot

  const container = el('div', { className: 'difficultes-manager-mp' });

  function render() {
    container.innerHTML = '';
    container.appendChild(renderSynthese());
    container.appendChild(renderFilters());
    container.appendChild(renderTable());
  }

  function renderSynthese() {
    const enCours = items.filter(d => d.statutTraitement === 'EN_COURS').length;
    const resolus = items.filter(d => d.statutTraitement === 'RESOLU').length;
    const critiques = items.filter(d => d.statutTraitement === 'EN_COURS' && d.impact === 'CRITIQUE').length;
    const eleves = items.filter(d => d.statutTraitement === 'EN_COURS' && d.impact === 'ELEVE').length;

    const banner = el('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        marginBottom: '12px',
        borderRadius: '6px',
        background: critiques > 0 ? '#fee2e2' : (eleves > 0 ? '#fef3c7' : '#f9fafb'),
        borderLeft: `4px solid ${critiques > 0 ? '#dc2626' : (eleves > 0 ? '#f59e0b' : '#6b7280')}`,
        fontSize: '13px'
      }
    }, [
      el('div', {}, [
        el('strong', {}, `${items.length} difficulté${items.length > 1 ? 's' : ''} enregistrée${items.length > 1 ? 's' : ''}`),
        el('span', { style: { marginLeft: '12px', color: '#374151' } },
          `· En cours : ${enCours} · Résolues : ${resolus}`),
        critiques > 0
          ? el('span', { style: { marginLeft: '12px', color: '#7f1d1d', fontWeight: 600 } },
              `⚠ ${critiques} critique${critiques > 1 ? 's' : ''} non résolue${critiques > 1 ? 's' : ''}`)
          : (eleves > 0
              ? el('span', { style: { marginLeft: '12px', color: '#92400e', fontWeight: 600 } },
                  `⚠ ${eleves} difficulté${eleves > 1 ? 's' : ''} d'impact élevé`)
              : null)
      ]),
      el('button', {
        className: 'btn btn-sm btn-primary',
        onclick: () => openEditorModal(null)
      }, '➕ Nouvelle difficulté')
    ]);
    return banner;
  }

  function renderFilters() {
    const children = [
      el('label', { style: { fontSize: '12px', color: '#6b7280' } }, 'Statut :'),
      el('select', {
        className: 'form-input',
        style: { width: '160px', padding: '4px 8px', fontSize: '12px' },
        onchange: (e) => { filterStatut = e.target.value; render(); }
      }, [
        el('option', { value: 'TOUS', selected: filterStatut === 'TOUS' }, 'Tous statuts'),
        ...STATUT_TRAITEMENT.map(s => el('option', { value: s.code, selected: filterStatut === s.code }, s.label))
      ]),
      el('label', { style: { fontSize: '12px', color: '#6b7280' } }, 'Impact :'),
      el('select', {
        className: 'form-input',
        style: { width: '160px', padding: '4px 8px', fontSize: '12px' },
        onchange: (e) => { filterImpact = e.target.value; render(); }
      }, [
        el('option', { value: 'TOUS', selected: filterImpact === 'TOUS' }, 'Tous impacts'),
        ...IMPACT_LEVELS.map(i => el('option', { value: i.code, selected: filterImpact === i.code }, i.label))
      ])
    ];
    // Modif #68 — Filtre par lot (visible uniquement si > 1 lot)
    if (Array.isArray(lots) && lots.length > 1) {
      children.push(
        el('label', { style: { fontSize: '12px', color: '#6b7280' } }, 'Lot :'),
        el('select', {
          className: 'form-input',
          style: { width: '160px', padding: '4px 8px', fontSize: '12px' },
          onchange: (e) => { filterLot = e.target.value; render(); }
        }, [
          el('option', { value: 'TOUS', selected: filterLot === 'TOUS' }, 'Tous lots'),
          ...lots.map(l => el('option', { value: l.id, selected: filterLot === l.id }, l.libelle || l.id))
        ])
      );
    }
    return el('div', { style: { display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' } }, children);
  }

  function renderTable() {
    const filtered = items.filter(d =>
      (filterStatut === 'TOUS' || d.statutTraitement === filterStatut) &&
      (filterImpact === 'TOUS' || d.impact === filterImpact) &&
      (filterLot === 'TOUS' || (d.lotId || '') === filterLot)
    ).sort((a, b) => {
      // En cours d'abord, puis par impact (CRITIQUE > ELEVE > MOYEN > FAIBLE), puis par date
      const statutOrder = { EN_COURS: 0, RESOLU: 1, ABANDONNE: 2 };
      const impactOrder = { CRITIQUE: 0, ELEVE: 1, MOYEN: 2, FAIBLE: 3 };
      const aS = statutOrder[a.statutTraitement] ?? 9;
      const bS = statutOrder[b.statutTraitement] ?? 9;
      if (aS !== bS) return aS - bS;
      const aI = impactOrder[a.impact] ?? 9;
      const bI = impactOrder[b.impact] ?? 9;
      if (aI !== bI) return aI - bI;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    if (filtered.length === 0) {
      return el('p', {
        className: 'text-muted',
        style: { fontStyle: 'italic', padding: '20px', textAlign: 'center', background: '#fafafa', borderRadius: '6px' }
      }, items.length === 0
        ? '✅ Aucune difficulté enregistrée sur ce marché.'
        : 'Aucune difficulté ne correspond aux filtres.');
    }

    return el('table', { className: 'table', style: { width: '100%', fontSize: '13px' } }, [
      el('thead', {}, [el('tr', {}, [
        el('th', {}, 'Impact'),
        el('th', {}, 'Catégorie'),
        el('th', {}, 'Problème'),
        el('th', {}, 'Statut'),
        el('th', {}, 'Statut marché'),
        el('th', {}, 'Décision'),
        el('th', {}, 'Date'),
        el('th', { style: { textAlign: 'center' } }, 'Actions')
      ])]),
      el('tbody', {}, filtered.map(d => {
        const impact = metaImpact(d.impact);
        const statut = metaStatut(d.statutTraitement);
        const statutM = STATUT_MARCHE_DIFFICULTE.find(s => s.code === (d.statutMarche || 'EN_COURS')) || STATUT_MARCHE_DIFFICULTE[0];
        const categorie = metaCategorie(d.categorieProbleme);
        const problemeShort = (d.probleme || '').length > 80
          ? d.probleme.substring(0, 80) + '…'
          : (d.probleme || '-');

        return el('tr', {}, [
          el('td', {}, el('span', {
            style: {
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '10px',
              background: impact.bg,
              color: impact.color
            }
          }, impact.label)),
          el('td', { style: { fontSize: '12px' } }, categorie.label),
          el('td', { style: { fontSize: '12px' }, title: d.probleme || '' }, problemeShort),
          el('td', {}, el('span', {
            style: {
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '10px',
              background: statut.bg,
              color: statut.color
            }
          }, statut.label)),
          el('td', {}, el('span', {
            style: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: statutM.bg, color: statutM.color }
          }, statutM.label)),
          el('td', { style: { fontSize: '12px' } }, d.decision || '-'),
          el('td', { style: { fontSize: '12px' } }, fmtDate(d.dateDecision || d.createdAt)),
          el('td', { style: { textAlign: 'center' } }, [
            el('button', {
              className: 'btn btn-sm btn-secondary',
              title: 'Modifier',
              style: { marginRight: '4px' },
              onclick: () => openEditorModal(d)
            }, '✏️'),
            // Modif #126 (E-3/E-10) — action explicite : appliquer le statut du
            // marché en difficulté à l'état effectif du marché (Suspendu/Résilié).
            ['SUSPENDU', 'RESILIE'].includes(d.statutMarche)
              ? el('button', {
                  className: 'btn btn-sm btn-warning',
                  title: 'Appliquer ce statut au marché',
                  style: { marginRight: '4px' },
                  onclick: () => applyStatutMarche(d)
                }, '↪ Appliquer au marché')
              : null,
            el('button', {
              className: 'btn btn-sm btn-danger',
              title: 'Supprimer',
              onclick: () => deleteDifficulte(d)
            }, '🗑')
          ])
        ]);
      }))
    ]);
  }

  // ----- Editor modal -----

  function openEditorModal(existing) {
    const isEdit = !!existing;
    const draft = isEdit ? { ...existing } : {
      id: null,
      operationId,
      lotId: (lots && lots.length === 1) ? lots[0].id : null,   // Modif #68
      statutTraitement: 'EN_COURS',
      statutMarche: 'EN_COURS', // Modif #125 (E-3)
      decision: '',
      probleme: '',
      dateDecision: null,
      nomDecideur: '',
      fichier: null,
      impact: 'MOYEN',
      categorieProbleme: 'TECHNIQUE',
      actionsCorrectives: '',
      createdAt: null,
      updatedAt: null
    };

    const modal = el('div', {
      className: 'modal-overlay',
      style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
      onclick: (e) => { if (e.target === modal) modal.remove(); }
    });

    const content = el('div', {
      style: {
        background: '#fff',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '20px'
      }
    });

    // Header modal
    content.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } }, [
      el('h3', { style: { margin: 0, fontSize: '16px' } }, isEdit ? '✏️ Modifier la difficulté' : '➕ Nouvelle difficulté'),
      el('button', { className: 'btn btn-sm btn-secondary', onclick: () => modal.remove() }, '✕')
    ]));

    // Form
    const formGrid = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } });

    // Modif #68 — Sélecteur de lot (visible si > 1 lot, sinon fixé au lot unique)
    if (Array.isArray(lots) && lots.length > 1) {
      const lotSelect = el('select', { className: 'form-input', id: 'dif-lot' }, [
        el('option', { value: '' }, '-- Sélectionner un lot --'),
        ...lots.map(l => el('option', { value: l.id, selected: draft.lotId === l.id }, l.libelle || l.id))
      ]);
      formGrid.appendChild(el('div', { style: { gridColumn: '1 / -1' } }, [
        el('label', { className: 'form-label' }, ['Lot concerné', el('span', { className: 'required' }, '*')]),
        lotSelect,
        el('small', { className: 'text-muted', style: { fontSize: '11px' } },
          'Une difficulté est toujours rattachée à un lot précis (règle métier).')
      ]));
    } else if (Array.isArray(lots) && lots.length === 1) {
      // Mono-lot : affichage informatif read-only
      formGrid.appendChild(el('div', { style: { gridColumn: '1 / -1' } }, [
        el('label', { className: 'form-label' }, 'Lot concerné'),
        el('div', {
          style: {
            padding: '6px 10px', background: '#f3f4f6', borderRadius: '4px',
            fontSize: '12px', color: '#374151'
          }
        }, `📦 ${lots[0].libelle || lots[0].id} (lot unique du marché)`)
      ]));
    }

    // Impact
    const impactSelect = el('select', { className: 'form-input', id: 'dif-impact' },
      IMPACT_LEVELS.map(i => el('option', { value: i.code, selected: draft.impact === i.code }, i.label))
    );
    formGrid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, ['Impact', el('span', { className: 'required' }, '*')]),
      impactSelect
    ]));

    // Catégorie
    const categorieSelect = el('select', { className: 'form-input', id: 'dif-categorie' },
      CATEGORIES_PROBLEME.map(c => el('option', { value: c.code, selected: draft.categorieProbleme === c.code }, c.label))
    );
    formGrid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, ['Catégorie', el('span', { className: 'required' }, '*')]),
      categorieSelect
    ]));

    // Statut de traitement
    const statutSelect = el('select', { className: 'form-input', id: 'dif-statut' },
      STATUT_TRAITEMENT.map(s => el('option', { value: s.code, selected: draft.statutTraitement === s.code }, s.label))
    );
    formGrid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, ['Statut de traitement', el('span', { className: 'required' }, '*')]),
      statutSelect
    ]));

    // Modif #125 (E-3) — Statut du marché en difficulté (En cours / Suspendu / Abandonné / Résilié).
    const statutMarcheSelect = el('select', { className: 'form-input', id: 'dif-statut-marche' },
      STATUT_MARCHE_DIFFICULTE.map(s => el('option', { value: s.code, selected: (draft.statutMarche || 'EN_COURS') === s.code }, s.label))
    );
    formGrid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Statut du marché'),
      statutMarcheSelect
    ]));

    // Date décision (visible si statut != EN_COURS)
    const dateInput = el('input', {
      type: 'date',
      className: 'form-input',
      id: 'dif-date',
      value: draft.dateDecision || ''
    });
    formGrid.appendChild(el('div', {}, [
      el('label', { className: 'form-label' }, 'Date de décision'),
      dateInput
    ]));

    content.appendChild(formGrid);

    // Problème (full width)
    content.appendChild(el('div', { style: { marginTop: '12px' } }, [
      el('label', { className: 'form-label' }, ['Description du problème', el('span', { className: 'required' }, '*')]),
      el('textarea', {
        className: 'form-input',
        id: 'dif-probleme',
        rows: 3,
        placeholder: 'Décrire le problème rencontré, son contexte, les acteurs impliqués…'
      }, draft.probleme || '')
    ]));

    // Décision (full width)
    content.appendChild(el('div', { style: { marginTop: '12px' } }, [
      el('label', { className: 'form-label' }, 'Décision prise'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: 'dif-decision',
        value: draft.decision || '',
        placeholder: 'Ex : suspension travaux, mise en demeure, avenant…'
      })
    ]));

    // Actions correctives (full width)
    content.appendChild(el('div', { style: { marginTop: '12px' } }, [
      el('label', { className: 'form-label' }, 'Actions correctives'),
      el('textarea', {
        className: 'form-input',
        id: 'dif-actions',
        rows: 2,
        placeholder: 'Mesures correctives mises en œuvre…'
      }, draft.actionsCorrectives || '')
    ]));

    // Décideur + fichier
    const bottomGrid = el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' } });
    bottomGrid.appendChild(el('div', {}, [
      // Modif #124 (E-4) — « Autorité décisionnelle » au lieu de « Nom du décideur ».
      el('label', { className: 'form-label' }, 'Autorité décisionnelle'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: 'dif-decideur',
        value: draft.nomDecideur || '',
        placeholder: 'Personne ou instance habilitée à décider'
      })
    ]));
    bottomGrid.appendChild(el('div', {}, [
      // Modif #124 (E-6) — « Référence / N° de l'acte » (acte : résiliation, suspension…).
      el('label', { className: 'form-label' }, 'Référence / N° de l\'acte'),
      el('input', {
        type: 'text',
        className: 'form-input',
        id: 'dif-fichier',
        value: draft.fichier || '',
        placeholder: 'N° / référence de l\'acte de décision'
      })
    ]));
    content.appendChild(bottomGrid);

    // Boutons
    content.appendChild(el('div', { style: { marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, [
      el('button', { className: 'btn btn-secondary', onclick: () => modal.remove() }, 'Annuler'),
      el('button', {
        className: 'btn btn-primary',
        onclick: async () => {
          const probleme = document.getElementById('dif-probleme').value.trim();
          if (!probleme) {
            alert('La description du problème est obligatoire');
            return;
          }
          // Modif #68 — Récupération du lotId : depuis le select si multi-lot,
          // sinon depuis le draft (qui contient le lot unique).
          const lotSelectEl = document.getElementById('dif-lot');
          const lotId = lotSelectEl ? (lotSelectEl.value || null) : (draft.lotId || null);
          if (Array.isArray(lots) && lots.length > 1 && !lotId) {
            alert('Veuillez sélectionner le lot concerné par la difficulté');
            return;
          }
          const payload = {
            ...draft,
            lotId,
            statutTraitement: document.getElementById('dif-statut').value,
            statutMarche: document.getElementById('dif-statut-marche')?.value || 'EN_COURS', // Modif #125 (E-3)
            impact: document.getElementById('dif-impact').value,
            categorieProbleme: document.getElementById('dif-categorie').value,
            probleme,
            decision: document.getElementById('dif-decision').value.trim(),
            actionsCorrectives: document.getElementById('dif-actions').value.trim(),
            nomDecideur: document.getElementById('dif-decideur').value.trim(),
            fichier: document.getElementById('dif-fichier').value.trim() || null,
            dateDecision: document.getElementById('dif-date').value || null,
            updatedAt: new Date().toISOString()
          };
          if (!payload.id) {
            payload.id = `DIF-${operationId}-${uid('DIF')}`;
            payload.operationId = operationId;
            payload.createdAt = new Date().toISOString();
          }
          await persist(payload, isEdit);
          modal.remove();
        }
      }, isEdit ? 'Enregistrer' : 'Ajouter')
    ]));

    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  // ----- Persistence -----

  async function persist(payload, isEdit) {
    try {
      if (isEdit) {
        await dataService.update(ENTITIES.MP_DIFFICULTE, payload.id, payload);
        const idx = items.findIndex(d => d.id === payload.id);
        if (idx >= 0) items[idx] = payload;
        logger.info('[Difficultés] Mise à jour', payload);
      } else {
        const result = await dataService.add(ENTITIES.MP_DIFFICULTE, payload);
        const saved = result?.entity || payload;
        items.push(saved);
        logger.info('[Difficultés] Création', saved);
      }
      render();
      if (onSaved) await onSaved(items);
    } catch (err) {
      logger.error('[Difficultés] Erreur persistence', err);
      alert(`❌ Erreur lors de la sauvegarde : ${err.message}`);
    }
  }

  // Modif #126 (E-3/E-10) — applique le statut du marché en difficulté à l'état
  // effectif du marché (action EXPLICITE, sur décision de l'agent).
  async function applyStatutMarche(d) {
    const meta = STATUT_MARCHE_DIFFICULTE.find(s => s.code === d.statutMarche);
    const label = meta ? meta.label : d.statutMarche;
    if (!window.confirm(`Appliquer le statut « ${label} » au marché ?\nL'état effectif du marché sera mis à jour.`)) return;
    try {
      await dataService.update(ENTITIES.MP_OPERATION, operationId, { etat: d.statutMarche });
      logger.info('[Difficultés] Statut marché appliqué', operationId, d.statutMarche);
      alert(`✅ État du marché mis à jour : « ${label} ».`);
      window.location.reload();
    } catch (err) {
      logger.error('[Difficultés] Erreur application statut marché', err);
      alert('❌ Échec de la mise à jour de l\'état du marché.');
    }
  }

  async function deleteDifficulte(d) {
    if (!confirm(`Supprimer cette difficulté ?\n\n${(d.probleme || '').substring(0, 100)}`)) return;
    try {
      await dataService.delete(ENTITIES.MP_DIFFICULTE, d.id);
      items = items.filter(x => x.id !== d.id);
      logger.info('[Difficultés] Suppression', d.id);
      render();
      if (onSaved) await onSaved(items);
    } catch (err) {
      logger.error('[Difficultés] Erreur suppression', err);
      alert(`❌ Erreur lors de la suppression : ${err.message}`);
    }
  }

  render();
  return container;
}

/**
 * Helper pour compter les difficultés actives par niveau d'impact.
 * Utilisé par les KPIs de santé de la fiche de vie.
 */
export function countDifficultes(difficultes = []) {
  return {
    total: difficultes.length,
    enCours: difficultes.filter(d => d.statutTraitement === 'EN_COURS').length,
    resolus: difficultes.filter(d => d.statutTraitement === 'RESOLU').length,
    critiques: difficultes.filter(d => d.statutTraitement === 'EN_COURS' && d.impact === 'CRITIQUE').length,
    eleves: difficultes.filter(d => d.statutTraitement === 'EN_COURS' && d.impact === 'ELEVE').length
  };
}

export default { renderDifficultesManager, countDifficultes };
