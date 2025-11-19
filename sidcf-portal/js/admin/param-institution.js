/* ============================================
   Admin - Institution Parameters
   ============================================ */

import { mount, el } from '../lib/dom.js';
import { formGrid, formActions } from '../ui/widgets/form.js';
import dataService from '../datastore/data-service.js';
import router from '../router.js';

export async function renderParamInstitution() {
  const config = dataService.getConfig();
  const institution = config?.institution || {};
  const registries = dataService.getAllRegistries();

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Paramètres Institution'),
      el('p', { className: 'page-subtitle' }, 'Configuration des informations de l\'institution')
    ]),

    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Informations générales')
      ]),
      el('form', { id: 'formInstitution', className: 'card-body' }, [
        formGrid([
          {
            name: 'name',
            label: 'Nom de l\'institution',
            value: institution.name,
            required: true
          },
          {
            type: 'select',
            name: 'type',
            label: 'Type d\'institution',
            value: institution.type,
            options: registries.TYPE_INSTITUTION,
            required: true
          },
          {
            name: 'logo',
            label: 'Chemin du logo',
            value: institution.logo,
            help: 'Ex: assets/logo.svg'
          }
        ]),
        formActions([
          {
            label: 'Annuler',
            className: 'btn-secondary',
            onClick: () => router.navigate('/portal')
          },
          {
            label: 'Enregistrer',
            className: 'btn-primary',
            type: 'submit'
          }
        ])
      ])
    ])
  ]);

  mount('#app', page);

  document.getElementById('formInstitution').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Configuration enregistrée (mock)');
  });
}

export default renderParamInstitution;
