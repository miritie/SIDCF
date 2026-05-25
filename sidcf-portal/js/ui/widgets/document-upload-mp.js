/**
 * Widget : Upload de documents libres pour un marché (Marché+ modif #31)
 *
 * Ouvre un modal qui permet à l'utilisateur d'uploader, à tout moment
 * depuis la fiche de vie, un document libre rattaché au marché.
 *
 * Les documents sont stockés via la pipeline R2 existante (uploadDocument)
 * et persistés en base dans MP_DOCUMENT avec :
 *   - operationId      → l'opération courante
 *   - entityType       → 'OPERATION' (rattachement direct, hors phase précise)
 *   - phase            → choix utilisateur (PLANIF / PROCEDURE / ATTRIBUTION /
 *                        APPROBATION / EXECUTION / CLOTURE / AUTRE)
 *   - typeDocument     → texte libre choisi par l'utilisateur (catégorie)
 *   - commentaire      → description libre
 *
 * À tout instant l'utilisateur peut :
 *   - sélectionner un fichier (PDF, image, doc, xlsx — max 50 Mo)
 *   - choisir une phase de rattachement (ou AUTRE)
 *   - donner un libellé/catégorie
 *   - ajouter une note
 *
 * Usage :
 *   openDocumentUploadModal({
 *     operationId,
 *     onUploaded: async (doc) => { ... }   // appelé après upload réussi
 *   });
 */

import { el } from '../../lib/dom.js';
import { uploadDocument } from '../../lib/r2-storage-mp.js';
import logger from '../../lib/logger.js';

export const DOCUMENT_PHASES = [
  { code: 'PLANIF',       label: '📝 Planification (PPM)' },
  { code: 'PROCEDURE',    label: '📑 Contractualisation' },
  { code: 'ATTRIBUTION',  label: '🤝 Attribution' },
  { code: 'APPROBATION',  label: '🔍 Approbation' },
  { code: 'EXECUTION',    label: '⚙️ Exécution' },
  { code: 'CLOTURE',      label: '🏁 Clôture' },
  { code: 'AUTRE',        label: '📎 Autre (libre)' }
];

const COMMON_TYPES = [
  'Notification d\'attribution',
  'Lettre valant marché',
  'Bordereau d\'envoi',
  'Facture',
  'Correspondance',
  'Rapport de réunion',
  'Photo de chantier',
  'Constat',
  'Mise en demeure',
  'Autre'
];

/**
 * @param {Object} opts
 * @param {string} opts.operationId
 * @param {Function} [opts.onUploaded] callback async (uploadedDoc) => void
 * @param {string} [opts.defaultPhase] code par défaut (ex: 'EXECUTION')
 */
export function openDocumentUploadModal({ operationId, onUploaded, defaultPhase = 'AUTRE' } = {}) {
  if (!operationId) {
    alert('Opération inconnue — impossible d\'uploader');
    return;
  }

  const modal = el('div', {
    className: 'modal-overlay',
    style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 },
    onclick: (e) => { if (e.target === modal) modal.remove(); }
  });

  const content = el('div', {
    style: { background: '#fff', borderRadius: '8px', width: '90%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '20px' }
  });

  content.appendChild(el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } }, [
    el('h3', { style: { margin: 0, fontSize: '16px' } }, '📤 Ajouter un document au marché'),
    el('button', { className: 'btn btn-sm btn-secondary', onclick: () => modal.remove() }, '✕')
  ]));

  // Champ fichier
  const fileInput = el('input', {
    type: 'file',
    className: 'form-input',
    id: 'doc-upload-file',
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg'
  });
  const fileMeta = el('div', { id: 'doc-upload-meta', style: { fontSize: '11px', color: '#6b7280', marginTop: '4px' } });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    fileMeta.innerHTML = '';
    if (!f) return;
    const sizeKb = (f.size / 1024).toFixed(1);
    fileMeta.appendChild(document.createTextNode(`📄 ${f.name} · ${sizeKb} KB · ${f.type || 'type inconnu'}`));
  });

  content.appendChild(el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
    el('label', { className: 'form-label' }, ['Fichier', el('span', { className: 'required' }, '*')]),
    fileInput,
    fileMeta,
    el('small', { className: 'text-muted' }, 'Formats : PDF, DOC/DOCX, XLS/XLSX, images. Taille max : 50 Mo.')
  ]));

  // Phase de rattachement
  content.appendChild(el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
    el('label', { className: 'form-label' }, 'Phase de rattachement'),
    el('select', { className: 'form-input', id: 'doc-upload-phase' },
      DOCUMENT_PHASES.map(p => el('option', { value: p.code, selected: p.code === defaultPhase }, p.label))
    )
  ]));

  // Type / catégorie — datalist pour suggestion sans contraindre
  content.appendChild(el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
    el('label', { className: 'form-label' }, ['Type / catégorie', el('span', { className: 'required' }, '*')]),
    el('input', {
      type: 'text',
      className: 'form-input',
      id: 'doc-upload-type',
      list: 'doc-upload-type-list',
      placeholder: 'Ex : Notification d\'attribution, Facture, Photo de chantier…'
    }),
    el('datalist', { id: 'doc-upload-type-list' },
      COMMON_TYPES.map(t => el('option', { value: t }))
    )
  ]));

  // Description / note
  content.appendChild(el('div', { className: 'form-field', style: { marginBottom: '12px' } }, [
    el('label', { className: 'form-label' }, 'Note (optionnel)'),
    el('textarea', {
      className: 'form-input',
      id: 'doc-upload-note',
      rows: 2,
      placeholder: 'Précision, contexte, références…'
    })
  ]));

  // Statut upload
  const statusBar = el('div', { id: 'doc-upload-status', style: { marginTop: '12px', fontSize: '13px', minHeight: '20px' } });
  content.appendChild(statusBar);

  // Boutons
  const submitBtn = el('button', {
    className: 'btn btn-primary',
    onclick: async () => {
      const file = fileInput.files[0];
      if (!file) { alert('Sélectionnez un fichier'); return; }
      const phase = document.getElementById('doc-upload-phase').value;
      const typeDocument = document.getElementById('doc-upload-type').value.trim();
      if (!typeDocument) { alert('Précisez le type / catégorie du document'); return; }
      const note = document.getElementById('doc-upload-note').value.trim();

      submitBtn.disabled = true;
      cancelBtn.disabled = true;
      statusBar.style.color = '#0066cc';
      statusBar.textContent = '⏳ Upload en cours vers R2…';

      try {
        const result = await uploadDocument(file, {
          operationId,
          entityType: 'OPERATION',
          entityId: operationId,
          phase: phase === 'AUTRE' ? null : phase,
          typeDocument,
          commentaire: note,
          obligatoire: false
        });
        logger.info('[Upload document libre] OK', result);
        statusBar.style.color = '#16a34a';
        statusBar.textContent = `✅ Document uploadé (id ${result.documentId})`;
        if (onUploaded) await onUploaded(result);
        setTimeout(() => modal.remove(), 700);
      } catch (err) {
        logger.error('[Upload document libre] échec', err);
        statusBar.style.color = '#dc2626';
        statusBar.textContent = `❌ Échec : ${err.message}`;
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
      }
    }
  }, '📤 Uploader');

  const cancelBtn = el('button', {
    className: 'btn btn-secondary',
    onclick: () => modal.remove()
  }, 'Annuler');

  content.appendChild(el('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' } }, [cancelBtn, submitBtn]));

  modal.appendChild(content);
  document.body.appendChild(modal);
}

export default { openDocumentUploadModal };
