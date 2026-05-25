/* ============================================
   Widget : bandeau dérogation Marché+
   ============================================
   Modif #73 — Avant ce widget, la dérogation déclarée à la planification
   (ECR01D) ou à la procédure (ECR02A) n'était RAPPELÉE NULLE PART en aval
   du workflow. Conséquence : à l'attribution et au visa CF, le contrôleur
   ne savait pas qu'il manipulait un dossier dérogatoire — risque sérieux
   de validation aveugle.

   Usage :
     import { renderDerogationBanner } from '<...>/widgets/derogation-banner-mp.js';
     ...
     renderDerogationBanner(operation, { variant: 'compact' })

   Retourne `null` si pas de dérogation (laisse le `el(..., [a, b, null, c])`
   filtrer naturellement les nulls).
*/

import { el } from '../../lib/dom.js';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  } catch { return iso; }
}

const SOURCE_LABELS = {
  PLANIF: 'déclarée à la planification (PPM)',
  PROCEDURE: 'déclarée à la procédure'
};

export function renderDerogationBanner(operation, opts = {}) {
  const derog = operation?.procDerogation;
  if (!derog?.isDerogation) return null;

  const variant = opts.variant || 'standard';
  const isCompact = variant === 'compact';

  const sourceLabel = SOURCE_LABELS[derog.sourceEtape] || 'déclarée';
  const justifie = !!derog.docId;
  const validee = !!derog.validatedAt;

  const statusBadge = justifie
    ? el('span', {
        style: {
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '12px',
          background: '#d1fae5',
          color: '#065f46',
          fontSize: '11px',
          fontWeight: '600'
        }
      }, '✓ Justifiée')
    : el('span', {
        style: {
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '12px',
          background: '#fef3c7',
          color: '#92400e',
          fontSize: '11px',
          fontWeight: '600'
        }
      }, '⏳ Justificatif manquant');

  const validationBadge = validee
    ? el('span', {
        style: {
          display: 'inline-block',
          padding: '2px 10px',
          borderRadius: '12px',
          background: '#dbeafe',
          color: '#1e40af',
          fontSize: '11px',
          fontWeight: '600',
          marginLeft: '6px'
        }
      }, `✓ Validée ${fmtDate(derog.validatedAt)}`)
    : null;

  return el('div', {
    style: {
      borderLeft: '4px solid #dc2626',
      background: '#fef2f2',
      padding: isCompact ? '10px 14px' : '14px 18px',
      borderRadius: '6px',
      marginBottom: '16px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start'
    }
  }, [
    el('div', { style: { fontSize: '20px', lineHeight: '1' } }, '⚠️'),
    el('div', { style: { flex: '1', minWidth: 0 } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' } }, [
        el('strong', { style: { color: '#991b1b', fontSize: '14px' } }, 'Marché en DÉROGATION'),
        statusBadge,
        validationBadge
      ]),
      el('div', { style: { fontSize: '13px', color: '#7f1d1d', lineHeight: '1.4' } }, [
        `Procédure ${sourceLabel} (mode ${operation.modePassation} retenu hors recommandation du Code des Marchés Publics CI).`
      ]),
      !isCompact && derog.comment ? el('div', {
        style: {
          marginTop: '8px',
          padding: '8px 10px',
          background: '#fff',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#4b5563',
          fontStyle: 'italic'
        }
      }, `« ${derog.comment} »`) : null,
      !isCompact && derog.docId ? el('div', {
        style: { marginTop: '6px', fontSize: '12px', color: '#6b7280' }
      }, `📎 Justificatif : ${derog.docId}`) : null
    ])
  ]);
}

export default { renderDerogationBanner };
