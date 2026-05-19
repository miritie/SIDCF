/**
 * Widget : Liens entre marchés (Marché+ modif #28)
 *
 * Affiche dans la fiche de vie un bandeau visuel synthétique présentant
 * la chaîne du projet :
 *
 *   [📘 Étude OP-001] → [📋 Marché courant] → [🔍 Contrôle OP-099]
 *                       ↗ [📋 Travaux OP-005]
 *
 * Permet à l'utilisateur de :
 *   - voir d'un coup d'œil les marchés antérieurs et postérieurs liés
 *   - ouvrir un modal "Gérer les liens" pour ajouter/supprimer un lien
 *   - bénéficier de suggestions intelligentes basées sur l'activité
 *     budgétaire et les mots-clés de l'objet (étude / contrôle / etc.)
 *
 * Stockage : MP_OPERATION.relations[] = [{ id, sens, role, note, createdAt }]
 *   - sens : 'ANTERIEUR' | 'POSTERIEUR'
 *   - role : 'ETUDE' | 'CONTROLE' | 'TRAVAUX' | 'FOURNITURE' | 'MAITRISE_OEUVRE' | 'AUTRE'
 *
 * Stockage mono-directionnel : un lien créé depuis A vers B est stocké
 * uniquement dans A. À l'affichage de la fiche de B, on cherche aussi
 * les autres opérations qui citent B (liens entrants) — pour éviter
 * d'obliger l'utilisateur à saisir la même relation des deux côtés.
 *
 * Usage :
 *   const node = renderRelatedOperations({
 *     operation,                  // l'opération courante
 *     allOperations,              // toutes les opérations PPM (pour résolution + liens entrants)
 *     registries,
 *     onSaved: async (updatedOp) => { ... }  // appelé après chaque modif persistée
 *   });
 */

import { el } from '../../lib/dom.js';
import dataService, { ENTITIES } from '../../datastore/data-service.js';
import router from '../../router.js';
import logger from '../../lib/logger.js';
import { ETAT_LABEL_MP } from '../../modules/marche-plus/etat-labels-mp.js';

// ----- Référentiels statiques (locaux au widget) -----

export const RELATION_ROLES = [
  { code: 'ETUDE', label: 'Étude', icon: '📘', typicalSens: 'ANTERIEUR' },
  { code: 'MAITRISE_OEUVRE', label: 'Maîtrise d\'œuvre', icon: '📐', typicalSens: 'POSTERIEUR' },
  { code: 'CONTROLE', label: 'Contrôle / Surveillance', icon: '🔍', typicalSens: 'POSTERIEUR' },
  { code: 'TRAVAUX', label: 'Travaux', icon: '🏗️', typicalSens: 'POSTERIEUR' },
  { code: 'FOURNITURE', label: 'Fourniture', icon: '📦', typicalSens: 'POSTERIEUR' },
  { code: 'AUTRE', label: 'Autre', icon: '🔗', typicalSens: 'POSTERIEUR' }
];

function getRoleMeta(roleCode) {
  return RELATION_ROLES.find(r => r.code === roleCode) || RELATION_ROLES[RELATION_ROLES.length - 1];
}

// Inverse d'un sens — utilisé pour les liens entrants
function inverseSens(sens) {
  return sens === 'ANTERIEUR' ? 'POSTERIEUR' : 'ANTERIEUR';
}

// Pour les liens entrants, on conserve le role de l'autre opération mais inversé en sens
function inverseRoleHeuristic(role) {
  // Si l'autre opération est "Étude", elle est antérieure à moi par défaut.
  // Inversement, je suis "Travaux" ou "AUTRE" par rapport à l'étude. Pour rester
  // simple, on garde le rôle d'origine et on indique uniquement le sens inverse.
  return role;
}

// ----- Détection intelligente -----

const KEYWORDS_BY_ROLE = {
  ETUDE: ['etude', 'études', 'avant-projet', 'apd', 'aps', 'faisabilité', 'faisabilite', 'tdr', 'termes de reference', 'termes de référence'],
  CONTROLE: ['contrôle', 'controle', 'surveillance', 'suivi', 'inspection'],
  MAITRISE_OEUVRE: ['maîtrise d\'œuvre', 'maitrise d\'oeuvre', 'maîtrise d\'oeuvre', 'moe', 'maître d\'œuvre'],
  TRAVAUX: ['travaux', 'construction', 'réhabilitation', 'rehabilitation', 'aménagement', 'amenagement'],
  FOURNITURE: ['fourniture', 'équipement', 'equipement', 'matériel', 'materiel', 'achat']
};

function normalize(s) {
  return (s || '').toString().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/\s+/g, ' ').trim();
}

function detectRoleFromObjet(objet) {
  const norm = normalize(objet);
  for (const [role, kws] of Object.entries(KEYWORDS_BY_ROLE)) {
    if (kws.some(kw => norm.includes(normalize(kw)))) return role;
  }
  return null;
}

/**
 * Suggère des opérations candidates à lier à `op` :
 *  - opérations ayant la même activiteCode (chaîne budgétaire)
 *  - opérations dont l'objet contient des mots-clés de rôles complémentaires
 *  - chronologie cohérente (createdAt avant ou après op.createdAt)
 *
 * Retourne au max `max` suggestions, triées par pertinence.
 */
function suggestRelations(op, allOperations, max = 6) {
  const activiteCode = op?.chaineBudgetaire?.activiteCode;
  const opObjetNorm = normalize(op?.objet);
  const opCreatedAt = op?.createdAt ? new Date(op.createdAt).getTime() : null;
  const alreadyRelatedIds = new Set((op.relations || []).map(r => r.id));

  const scored = [];
  for (const candidate of (allOperations || [])) {
    if (!candidate || candidate.id === op.id) continue;
    if (alreadyRelatedIds.has(candidate.id)) continue;

    let score = 0;
    let reasons = [];

    // Même activité budgétaire (+5)
    if (activiteCode && candidate?.chaineBudgetaire?.activiteCode === activiteCode) {
      score += 5;
      reasons.push('même activité budgétaire');
    }

    // Match mot-clé de rôle dans l'objet du candidat (+3)
    const candidateRole = detectRoleFromObjet(candidate.objet);
    if (candidateRole) {
      score += 3;
      reasons.push(`mot-clé "${getRoleMeta(candidateRole).label}"`);
    }

    // Match avec mes propres mots-clés (objet courant)
    const myRole = detectRoleFromObjet(op.objet);
    if (myRole && candidateRole && myRole !== candidateRole) {
      score += 2;
      reasons.push(`rôles complémentaires (${myRole}/${candidateRole})`);
    }

    // Mots communs dans l'objet (heuristique grossière, +1 par mot >= 4 lettres en commun)
    if (opObjetNorm && candidate.objet) {
      const myWords = new Set(opObjetNorm.split(' ').filter(w => w.length >= 4));
      const candidateWords = new Set(normalize(candidate.objet).split(' ').filter(w => w.length >= 4));
      const common = [...myWords].filter(w => candidateWords.has(w));
      if (common.length > 0) {
        score += Math.min(common.length, 3);
        reasons.push(`mots-clés communs : ${common.slice(0, 3).join(', ')}`);
      }
    }

    // Sens chronologique
    let sensSuggested = 'POSTERIEUR';
    if (opCreatedAt && candidate.createdAt) {
      const cCreatedAt = new Date(candidate.createdAt).getTime();
      if (cCreatedAt < opCreatedAt) sensSuggested = 'ANTERIEUR';
    }

    // Si rôle détecté typiquement antérieur (ETUDE) ou typiquement postérieur (CONTROLE),
    // ça aide à choisir le sens suggéré.
    if (candidateRole) {
      const typical = getRoleMeta(candidateRole).typicalSens;
      if (typical) sensSuggested = typical;
    }

    if (score > 0) {
      scored.push({
        op: candidate,
        score,
        reasons,
        suggestedSens: sensSuggested,
        suggestedRole: candidateRole || 'AUTRE'
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, max);
}

// ----- Calcul des liens à afficher (sortants + entrants) -----

function computeLinks(operation, allOperations) {
  const directLinks = (operation.relations || []).map(rel => {
    const target = (allOperations || []).find(o => o.id === rel.id);
    return target ? { rel, target, source: 'direct' } : null;
  }).filter(Boolean);

  // Liens entrants : autres opérations qui me citent
  const directIds = new Set(directLinks.map(l => l.target.id));
  const incoming = [];
  for (const other of (allOperations || [])) {
    if (!other || other.id === operation.id || directIds.has(other.id)) continue;
    const r = (other.relations || []).find(x => x.id === operation.id);
    if (r) {
      incoming.push({
        rel: {
          id: other.id,
          sens: inverseSens(r.sens),
          role: inverseRoleHeuristic(r.role),
          note: r.note,
          createdAt: r.createdAt
        },
        target: other,
        source: 'incoming'
      });
    }
  }

  const all = [...directLinks, ...incoming];
  return {
    anterieurs: all.filter(l => l.rel.sens === 'ANTERIEUR'),
    posterieurs: all.filter(l => l.rel.sens === 'POSTERIEUR')
  };
}

// ----- Composant principal -----

export function renderRelatedOperations({
  operation,
  allOperations = [],
  registries = {},
  onSaved
} = {}) {
  let workingOp = { ...operation, relations: Array.isArray(operation.relations) ? [...operation.relations] : [] };
  let workingAll = allOperations;

  const container = el('div', {
    className: 'related-operations-mp card',
    style: { marginBottom: '20px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0' }
  });

  function render() {
    container.innerHTML = '';
    const { anterieurs, posterieurs } = computeLinks(workingOp, workingAll);

    // En-tête
    const header = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' } }, [
      el('div', { style: { fontSize: '13px', fontWeight: 600, color: '#374151' } },
        `🔗 Liens entre marchés (${anterieurs.length + posterieurs.length})`),
      el('button', {
        className: 'btn btn-sm btn-primary',
        onclick: () => openManagerModal()
      }, '🔗 Gérer les liens')
    ]);
    container.appendChild(header);

    // Bandeau visuel — flow horizontal
    container.appendChild(renderFlowChart(workingOp, anterieurs, posterieurs));
  }

  function renderFlowChart(op, anterieurs, posterieurs) {
    const objet = op.objet || '(sans objet)';
    const objetShort = objet.length > 38 ? objet.substring(0, 38) + '…' : objet;

    const flow = el('div', {
      style: {
        display: 'flex',
        alignItems: 'stretch',
        gap: '10px',
        overflowX: 'auto',
        padding: '4px 0'
      }
    });

    // Colonne Antérieurs
    flow.appendChild(renderLinkColumn(anterieurs, 'Antérieurs', 'left'));

    // Connecteur
    flow.appendChild(renderConnector(anterieurs.length > 0));

    // Carte centrale (opération courante)
    flow.appendChild(el('div', {
      style: {
        minWidth: '220px',
        flex: '0 0 auto',
        background: '#0f5132',
        color: '#fff',
        padding: '12px 14px',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(15,81,50,0.25)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }
    }, [
      el('div', { style: { fontSize: '10px', textTransform: 'uppercase', opacity: '0.8', letterSpacing: '0.5px' } }, '📋 Marché courant'),
      el('div', { style: { fontSize: '12px', fontFamily: 'monospace', opacity: '0.9', margin: '2px 0' } }, op.id || '-'),
      el('div', { style: { fontSize: '13px', fontWeight: 600, lineHeight: '1.3' }, title: objet }, objetShort)
    ]));

    // Connecteur
    flow.appendChild(renderConnector(posterieurs.length > 0));

    // Colonne Postérieurs
    flow.appendChild(renderLinkColumn(posterieurs, 'Postérieurs', 'right'));

    return flow;
  }

  function renderLinkColumn(links, label, side) {
    if (links.length === 0) {
      return el('div', {
        style: {
          minWidth: '180px',
          flex: '0 0 auto',
          padding: '12px',
          border: '1px dashed #cbd5e1',
          borderRadius: '8px',
          background: '#fff',
          color: '#94a3b8',
          fontSize: '12px',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }
      }, `Aucun marché ${label.toLowerCase()}`);
    }

    return el('div', {
      style: {
        minWidth: '220px',
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }
    }, [
      el('div', { style: { fontSize: '10px', textTransform: 'uppercase', color: '#64748b', textAlign: side === 'left' ? 'right' : 'left', letterSpacing: '0.5px' } }, label),
      ...links.map(link => renderLinkCard(link, side))
    ]);
  }

  function renderLinkCard(link, side) {
    const { rel, target, source } = link;
    const roleMeta = getRoleMeta(rel.role);
    const etat = registries.ETAT_MARCHE?.find(e => e.code === target.etat);
    const objet = target.objet || '(sans objet)';
    const objetShort = objet.length > 38 ? objet.substring(0, 38) + '…' : objet;
    const bg = source === 'incoming' ? '#fefce8' : '#fff';
    const border = source === 'incoming' ? '1px dashed #eab308' : '1px solid #d1d5db';

    return el('div', {
      style: {
        background: bg,
        border,
        borderRadius: '6px',
        padding: '8px 10px',
        cursor: 'pointer',
        transition: 'transform 0.1s',
        position: 'relative'
      },
      title: source === 'incoming' ? 'Lien entrant (cette opération nous cite)' : (rel.note || ''),
      onclick: () => router.navigate('/mp/fiche-marche', { idOperation: target.id }),
      onmouseenter: (e) => e.currentTarget.style.transform = 'translateY(-1px)',
      onmouseleave: (e) => e.currentTarget.style.transform = 'translateY(0)'
    }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' } }, [
        el('span', {}, `${roleMeta.icon} ${roleMeta.label}`),
        source === 'incoming' ? el('span', {
          style: { fontSize: '9px', padding: '1px 5px', background: '#fef9c3', color: '#854d0e', borderRadius: '4px' },
          title: 'Lien défini depuis l\'autre opération'
        }, 'entrant') : null
      ]),
      el('div', { style: { fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8', margin: '1px 0' } }, target.id),
      el('div', { style: { fontSize: '12px', fontWeight: 600, color: '#1e293b', lineHeight: '1.3' }, title: objet }, objetShort),
      (etat || target.etat) ? el('div', { style: { marginTop: '4px' } }, [
        el('span', { className: `badge badge-${etat?.color || 'gray'}`, style: { fontSize: '9px' } }, ETAT_LABEL_MP[target.etat] || etat?.label || target.etat)
      ]) : null
    ]);
  }

  function renderConnector(active) {
    return el('div', {
      style: {
        flex: '0 0 auto',
        alignSelf: 'center',
        fontSize: '18px',
        color: active ? '#0f5132' : '#cbd5e1',
        padding: '0 2px'
      }
    }, '→');
  }

  // ----- Modal de gestion -----

  function openManagerModal() {
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
        maxHeight: '85vh',
        overflowY: 'auto',
        padding: '20px'
      }
    });

    function renderModalBody() {
      content.innerHTML = '';

      content.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } }, [
        el('h3', { style: { margin: 0, fontSize: '16px' } }, '🔗 Gérer les liens entre marchés'),
        el('button', { className: 'btn btn-sm btn-secondary', onclick: () => modal.remove() }, '✕')
      ]));

      // Liste des liens existants (directs uniquement — on ne peut pas supprimer un lien entrant ici)
      content.appendChild(el('h4', { style: { fontSize: '13px', marginBottom: '8px' } },
        `Liens définis sur ce marché (${workingOp.relations.length})`));

      if (workingOp.relations.length === 0) {
        content.appendChild(el('p', { style: { fontSize: '12px', color: '#6b7280', fontStyle: 'italic' } },
          'Aucun lien défini. Ajoutez-en un ci-dessous.'));
      } else {
        const table = el('table', { className: 'table', style: { width: '100%', fontSize: '12px', marginBottom: '16px' } }, [
          el('thead', {}, [el('tr', {}, [
            el('th', {}, 'Rôle'),
            el('th', {}, 'Sens'),
            el('th', {}, 'Marché lié'),
            el('th', {}, 'Note'),
            el('th', {}, '')
          ])]),
          el('tbody', {}, workingOp.relations.map((rel, idx) => {
            const target = workingAll.find(o => o.id === rel.id);
            const roleMeta = getRoleMeta(rel.role);
            return el('tr', {}, [
              el('td', {}, `${roleMeta.icon} ${roleMeta.label}`),
              el('td', {}, rel.sens === 'ANTERIEUR' ? '← Antérieur' : 'Postérieur →'),
              el('td', {}, target
                ? el('span', {}, [el('span', { style: { fontFamily: 'monospace', fontSize: '10px', color: '#6b7280' } }, rel.id), ' — ', target.objet?.substring(0, 40) || '(sans objet)'])
                : el('span', { style: { color: '#dc2626' } }, `${rel.id} (introuvable)`)),
              el('td', { style: { fontSize: '11px', color: '#6b7280' } }, rel.note || '-'),
              el('td', {}, el('button', {
                className: 'btn btn-sm btn-danger',
                onclick: async () => {
                  if (!confirm('Supprimer ce lien ?')) return;
                  workingOp.relations.splice(idx, 1);
                  await persist();
                  renderModalBody();
                  render();
                }
              }, '🗑'))
            ]);
          }))
        ]);
        content.appendChild(table);
      }

      // Formulaire d'ajout
      content.appendChild(el('h4', { style: { fontSize: '13px', marginTop: '16px', marginBottom: '8px' } }, '➕ Ajouter un lien'));

      const targetSelect = el('select', {
        className: 'form-input',
        id: 'rel-target-select'
      }, [
        el('option', { value: '' }, '— Choisir un marché PPM —'),
        ...workingAll
          .filter(o => o.id !== workingOp.id && !workingOp.relations.some(r => r.id === o.id))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
          .slice(0, 200)
          .map(o => el('option', { value: o.id },
            `${o.id} — ${(o.objet || '(sans objet)').substring(0, 60)}`
          ))
      ]);

      const sensSelect = el('select', { className: 'form-input', id: 'rel-sens-select' }, [
        el('option', { value: 'ANTERIEUR' }, '← Antérieur (précède ce marché)'),
        el('option', { value: 'POSTERIEUR', selected: true }, 'Postérieur (succède à ce marché) →')
      ]);

      const roleSelect = el('select', { className: 'form-input', id: 'rel-role-select' },
        RELATION_ROLES.map(r => el('option', { value: r.code }, `${r.icon} ${r.label}`))
      );

      const noteInput = el('input', {
        type: 'text',
        className: 'form-input',
        id: 'rel-note-input',
        placeholder: 'Note libre (optionnel)'
      });

      content.appendChild(el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' } }, [
        el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Marché à lier'), targetSelect]),
        el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Sens'), sensSelect]),
        el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Rôle'), roleSelect]),
        el('div', {}, [el('label', { className: 'form-label', style: { fontSize: '12px' } }, 'Note'), noteInput])
      ]));

      content.appendChild(el('button', {
        className: 'btn btn-primary',
        onclick: async () => {
          const id = targetSelect.value;
          if (!id) { alert('Sélectionnez un marché à lier'); return; }
          const sens = sensSelect.value;
          const role = roleSelect.value;
          const note = noteInput.value.trim();
          workingOp.relations.push({
            id, sens, role, note,
            createdAt: new Date().toISOString()
          });
          await persist();
          renderModalBody();
          render();
        }
      }, '➕ Ajouter le lien'));

      // Suggestions intelligentes
      const suggestions = suggestRelations(workingOp, workingAll, 6);
      content.appendChild(el('h4', { style: { fontSize: '13px', marginTop: '20px', marginBottom: '8px' } },
        `💡 Suggestions automatiques (${suggestions.length})`));

      if (suggestions.length === 0) {
        content.appendChild(el('p', { style: { fontSize: '12px', color: '#6b7280', fontStyle: 'italic' } },
          'Aucune suggestion détectée (basé sur l\'activité budgétaire et les mots-clés de l\'objet).'));
      } else {
        suggestions.forEach(s => {
          const roleMeta = getRoleMeta(s.suggestedRole);
          const card = el('div', {
            style: {
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 10px',
              marginBottom: '6px',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px'
            }
          }, [
            el('div', { style: { flex: 1, minWidth: 0 } }, [
              el('div', { style: { fontWeight: 600 } }, [
                el('span', {}, `${roleMeta.icon} `),
                el('span', { style: { fontFamily: 'monospace', fontSize: '11px', color: '#6b7280' } }, s.op.id),
                ' — ',
                (s.op.objet || '(sans objet)').substring(0, 50)
              ]),
              el('div', { style: { fontSize: '10px', color: '#6b7280', marginTop: '2px' } },
                `${s.suggestedSens === 'ANTERIEUR' ? '← Antérieur' : 'Postérieur →'} · ${roleMeta.label} · ${s.reasons.join(' · ')}`)
            ]),
            el('button', {
              className: 'btn btn-sm btn-secondary',
              onclick: async () => {
                workingOp.relations.push({
                  id: s.op.id,
                  sens: s.suggestedSens,
                  role: s.suggestedRole,
                  note: 'Lien suggéré automatiquement',
                  createdAt: new Date().toISOString()
                });
                await persist();
                renderModalBody();
                render();
              }
            }, 'Lier')
          ]);
          content.appendChild(card);
        });
      }
    }

    async function persist() {
      try {
        await dataService.update(ENTITIES.MP_OPERATION, workingOp.id, {
          relations: workingOp.relations,
          updatedAt: new Date().toISOString()
        });
        logger.info('[Relations] Mise à jour des liens', { id: workingOp.id, relations: workingOp.relations });
        if (onSaved) await onSaved({ ...workingOp });
      } catch (err) {
        logger.error('[Relations] Erreur de persistence', err);
        alert(`❌ Erreur lors de la sauvegarde : ${err.message}`);
      }
    }

    renderModalBody();
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  render();
  return container;
}

export default { renderRelatedOperations };
