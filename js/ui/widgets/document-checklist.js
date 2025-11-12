/* ============================================
   Document Checklist Widget
   Affiche la checklist des pièces par phase
   ============================================ */

import { el } from '../../lib/dom.js';

/**
 * Render document checklist for a given phase
 * @param {string} phase - Phase code (INVITATION, OUVERTURE, ANALYSE, etc.)
 * @param {string} modePassation - Mode de passation
 * @param {Array} documents - Array of uploaded DOCUMENT entities
 * @param {Object} piecesMatrice - pieces-matrice.json data
 * @param {Function} onUpload - Callback for upload action (typeDoc) => void
 * @param {Function} onView - Callback for view action (doc) => void
 * @returns {HTMLElement}
 */
export function renderDocumentChecklist(phase, modePassation, documents = [], piecesMatrice, onUpload, onView) {
  if (!piecesMatrice?.phases?.[phase]) {
    return el('div', { className: 'alert alert-warning' }, 'Phase non trouvée dans la matrice');
  }

  const phaseData = piecesMatrice.phases[phase];
  const pieces = phaseData.pieces.filter(p =>
    p.modes.includes('ALL') ||
    p.modes.includes(modePassation)
  );

  // Group documents by type
  const docsByType = {};
  documents.forEach(doc => {
    if (doc.phase === phase) {
      if (!docsByType[doc.typeDocument]) {
        docsByType[doc.typeDocument] = [];
      }
      docsByType[doc.typeDocument].push(doc);
    }
  });

  // Calculate stats
  const stats = {
    total: pieces.length,
    obligatoires: pieces.filter(p => p.obligatoire).length,
    fournis: pieces.filter(p => docsByType[p.code]?.length > 0).length,
    manquants: pieces.filter(p => p.obligatoire && !docsByType[p.code]?.length).length
  };

  return el('div', { className: 'document-checklist' }, [
    // Header with stats
    el('div', { className: 'checklist-header' }, [
      el('h4', { className: 'checklist-title' }, [
        `📋 ${phaseData.label}`,
        stats.manquants > 0
          ? el('span', { className: 'badge badge-error', style: { marginLeft: '12px', fontSize: '12px' } },
              `${stats.manquants} manquant${stats.manquants > 1 ? 's' : ''}`)
          : el('span', { className: 'badge badge-success', style: { marginLeft: '12px', fontSize: '12px' } },
              '✓ Complet')
      ]),
      el('div', { className: 'checklist-stats', style: { marginTop: '8px' } }, [
        renderStatBadge('Total', stats.total, 'var(--color-gray-500)'),
        renderStatBadge('Fournis', stats.fournis, 'var(--color-success)'),
        renderStatBadge('Manquants', stats.manquants, 'var(--color-error)')
      ])
    ]),

    // Pieces list
    el('div', { className: 'checklist-items', style: { marginTop: '16px' } },
      pieces.map(piece => renderChecklistItem(piece, docsByType[piece.code] || [], onUpload, onView))
    )
  ]);
}

/**
 * Render stat badge
 */
function renderStatBadge(label, value, color) {
  return el('span', {
    style: {
      display: 'inline-block',
      padding: '4px 12px',
      marginRight: '8px',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '500',
      background: `${color}20`,
      color: color
    }
  }, `${label}: ${value}`);
}

/**
 * Render single checklist item
 */
function renderChecklistItem(piece, documents, onUpload, onView) {
  const hasDoc = documents.length > 0;
  const isObligatoire = piece.obligatoire;

  let icon, statusColor, statusLabel;

  if (hasDoc) {
    icon = '✅';
    statusColor = 'var(--color-success)';
    statusLabel = 'Fourni';
  } else if (isObligatoire) {
    icon = '⛔';
    statusColor = 'var(--color-error)';
    statusLabel = 'Manquant (obligatoire)';
  } else {
    icon = '⚠️';
    statusColor = 'var(--color-warning)';
    statusLabel = 'Optionnel';
  }

  const item = el('div', {
    className: 'checklist-item',
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '12px',
      marginBottom: '8px',
      border: `1px solid ${hasDoc ? 'var(--color-success-300)' : isObligatoire ? 'var(--color-error-300)' : 'var(--color-gray-300)'}`,
      borderRadius: '6px',
      background: hasDoc ? 'var(--color-success-50)' : 'var(--color-bg)'
    }
  }, [
    // Icon
    el('div', {
      className: 'checklist-icon',
      style: {
        fontSize: '20px',
        marginRight: '12px',
        marginTop: '2px'
      }
    }, icon),

    // Content
    el('div', { style: { flex: 1 } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '4px' } }, [
        el('span', { style: { fontWeight: '600', fontSize: '14px' } }, piece.libelle),
        el('span', {
          style: {
            marginLeft: '12px',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: `${statusColor}20`,
            color: statusColor,
            fontWeight: '500'
          }
        }, statusLabel)
      ]),

      piece.description ? el('div', {
        className: 'text-small text-muted',
        style: { marginTop: '4px' }
      }, piece.description) : null,

      // Documents list
      hasDoc ? el('div', { style: { marginTop: '8px' } },
        documents.map(doc => renderDocumentBadge(doc, onView))
      ) : null
    ]),

    // Actions
    el('div', { className: 'checklist-actions', style: { marginLeft: '12px' } }, [
      createButton('btn btn-sm btn-secondary', '📤 Upload', () => {
        if (onUpload) onUpload(piece.code);
      })
    ])
  ]);

  return item;
}

/**
 * Render document badge
 */
function renderDocumentBadge(doc, onView) {
  const badge = el('div', {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      marginRight: '8px',
      marginTop: '4px',
      borderRadius: '4px',
      background: 'var(--color-primary-100)',
      fontSize: '12px',
      cursor: 'pointer'
    }
  }, [
    el('span', { style: { marginRight: '6px' } }, '📄'),
    el('span', {}, doc.nom || doc.fichier || 'Document'),
    doc.version > 1 ? el('span', {
      style: {
        marginLeft: '6px',
        padding: '2px 6px',
        borderRadius: '3px',
        background: 'var(--color-info)',
        color: 'white',
        fontSize: '10px'
      }
    }, `v${doc.version}`) : null
  ]);

  if (onView) {
    badge.addEventListener('click', () => onView(doc));
  }

  return badge;
}

/**
 * Create button helper
 */
function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  if (onClick) {
    btn.addEventListener('click', onClick);
  }
  return btn;
}

/**
 * Render compact checklist summary (for dashboard)
 * @param {Array} allPhases - Array of phase names
 * @param {string} modePassation
 * @param {Array} documents
 * @param {Object} piecesMatrice
 * @returns {HTMLElement}
 */
export function renderChecklistSummary(allPhases, modePassation, documents, piecesMatrice) {
  const phasesData = allPhases.map(phase => {
    const phaseData = piecesMatrice.phases[phase];
    if (!phaseData) return null;

    const pieces = phaseData.pieces.filter(p =>
      p.modes.includes('ALL') || p.modes.includes(modePassation)
    );

    const docsByType = {};
    documents.forEach(doc => {
      if (doc.phase === phase) {
        if (!docsByType[doc.typeDocument]) {
          docsByType[doc.typeDocument] = [];
        }
        docsByType[doc.typeDocument].push(doc);
      }
    });

    const obligatoires = pieces.filter(p => p.obligatoire).length;
    const fournis = pieces.filter(p => docsByType[p.code]?.length > 0).length;
    const manquants = pieces.filter(p => p.obligatoire && !docsByType[p.code]?.length).length;

    return {
      phase,
      label: phaseData.label,
      obligatoires,
      fournis,
      manquants,
      complet: manquants === 0
    };
  }).filter(Boolean);

  return el('div', { className: 'checklist-summary' }, [
    el('h4', { style: { fontSize: '14px', fontWeight: '600', marginBottom: '12px' } }, 'Complétude des pièces'),
    el('div', { style: { display: 'grid', gap: '8px' } },
      phasesData.map(data => renderPhaseSummaryRow(data))
    )
  ]);
}

/**
 * Render phase summary row
 */
function renderPhaseSummaryRow(data) {
  const completion = data.obligatoires > 0 ? Math.round((data.fournis / data.obligatoires) * 100) : 100;

  return el('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid var(--color-gray-300)',
      background: data.complet ? 'var(--color-success-50)' : 'var(--color-bg)'
    }
  }, [
    el('div', { style: { flex: 1 } }, [
      el('div', { style: { fontWeight: '500', fontSize: '13px' } }, data.label),
      el('div', {
        style: {
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          marginTop: '2px'
        }
      }, `${data.fournis}/${data.obligatoires} obligatoires`)
    ]),
    el('div', { style: { marginLeft: '12px' } }, [
      data.complet
        ? el('span', {
            style: {
              color: 'var(--color-success)',
              fontSize: '20px'
            }
          }, '✓')
        : el('span', {
            style: {
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '600',
              background: data.manquants > 0 ? 'var(--color-error-100)' : 'var(--color-warning-100)',
              color: data.manquants > 0 ? 'var(--color-error)' : 'var(--color-warning)'
            }
          }, `${completion}%`)
    ])
  ]);
}

export default {
  renderDocumentChecklist,
  renderChecklistSummary
};
