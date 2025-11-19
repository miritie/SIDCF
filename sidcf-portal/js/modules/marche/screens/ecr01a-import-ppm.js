/* ============================================
   ECR01A - Import PPM (Excel)
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import { formField, formActions } from '../../../ui/widgets/form.js';
import router from '../../../router.js';
import dataService from '../../../datastore/data-service.js';
import logger from '../../../lib/logger.js';

export async function renderImportPPM() {
  let selectedFile = null;

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Import PPM depuis Excel'),
      el('p', { className: 'page-subtitle' }, 'Importer un Plan de Passation des Marchés depuis un fichier Excel')
    ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Sélection du fichier')
      ]),
      el('div', { className: 'card-body' }, [
        el('div', { className: 'alert alert-info' }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Format attendu'),
            el('div', { className: 'alert-message' }, 'Le fichier Excel doit contenir les colonnes : Objet, Type de marché, Mode de passation, Montant, etc.')
          ])
        ]),

        formField({
          type: 'file',
          name: 'ppmFile',
          label: 'Fichier Excel PPM',
          required: true,
          help: 'Formats acceptés : .xlsx, .xls'
        }),

        formField({
          type: 'text',
          name: 'unite',
          label: 'Unité administrative',
          required: true,
          placeholder: 'Ex: Direction Générale des Marchés Publics'
        }),

        formField({
          type: 'number',
          name: 'exercice',
          label: 'Exercice budgétaire',
          required: true,
          value: new Date().getFullYear()
        }),

        formActions([
          {
            label: 'Annuler',
            className: 'btn-secondary',
            onClick: () => router.navigate('/ppm-list')
          },
          {
            label: 'Importer',
            className: 'btn-primary',
            onClick: handleImport
          }
        ])
      ])
    ])
  ]);

  async function handleImport() {
    const uniteInput = document.querySelector('[name="unite"]');
    const exerciceInput = document.querySelector('[name="exercice"]');
    const fileInput = document.querySelector('[name="ppmFile"]');

    if (!uniteInput?.value || !exerciceInput?.value || !fileInput?.files?.[0]) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const file = fileInput.files[0];
    const mapping = {}; // TODO: column mapping

    logger.info('[ImportPPM] Starting import:', file.name);

    try {
      const result = await dataService.importPPM(file, mapping);

      if (result.success) {
        alert(`Import réussi: ${result.operationsCount} opérations importées`);
        router.navigate('/ppm-list');
      } else {
        alert('Erreur lors de l\'import: ' + result.errors.join(', '));
      }
    } catch (error) {
      logger.error('[ImportPPM] Import failed:', error);
      alert('Erreur lors de l\'import: ' + error.message);
    }
  }

  mount('#app', page);
}

export default renderImportPPM;
