/* ============================================
   Admin - Gestion des Référentiels
   ============================================ */

import { mount, el } from '../lib/dom.js';
import dataService from '../datastore/data-service.js';
import router from '../router.js';

export async function renderReferentiels() {
  const registries = dataService.getAllRegistries();

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Gestion des référentiels'),
      el('p', { className: 'page-subtitle' }, 'Configuration des listes de valeurs de l\'application')
    ]),

    // Types de marché
    renderRegistrySection('TYPE_MARCHE', 'Types de Marché', registries.TYPE_MARCHE || []),

    // États de marché
    renderRegistrySection('ETAT_MARCHE', 'États de Marché', registries.ETAT_MARCHE || []),

    // Modes de passation
    renderRegistrySection('MODE_PASSATION', 'Modes de Passation', registries.MODE_PASSATION || []),

    // Types d'institution
    renderRegistrySection('TYPE_INSTITUTION', 'Types d\'Institution', registries.TYPE_INSTITUTION || []),

    // Sources de financement
    renderRegistrySection('SOURCE_FINANCEMENT', 'Sources de Financement', registries.SOURCE_FINANCEMENT || []),

    // Devises
    renderRegistrySection('DEVISE', 'Devises', registries.DEVISE || []),

    // Types d'avenants
    renderRegistrySection('TYPE_AVENANT', 'Types d\'Avenant', registries.TYPE_AVENANT || []),

    // Types de garantie
    renderRegistrySection('TYPE_GARANTIE', 'Types de Garantie', registries.TYPE_GARANTIE || []),

    // Actions
    el('div', { className: 'card' }, [
      el('div', { className: 'card-body' }, [
        el('button', {
          className: 'btn btn-secondary',
          onclick: () => router.navigate('/portal')
        }, '← Retour au portail')
      ])
    ])
  ]);

  mount('#app', page);
}

/**
 * Rendu d'une section de référentiel
 */
function renderRegistrySection(key, title, items) {
  const isArrayOfObjects = items.length > 0 && typeof items[0] === 'object';

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('h3', { className: 'card-title' }, title),
      el('span', { className: 'badge badge-secondary' }, `${items.length} élément(s)`)
    ]),
    el('div', { className: 'card-body' }, [
      items.length === 0
        ? el('p', { style: { color: '#6B7280', textAlign: 'center' } }, 'Aucun élément')
        : isArrayOfObjects
          ? renderObjectList(items)
          : renderSimpleList(items)
    ])
  ]);
}

/**
 * Liste simple (array de strings)
 */
function renderSimpleList(items) {
  return el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
    items.map(item =>
      el('span', {
        className: 'badge',
        style: 'background-color: #E5E7EB; color: #374151; padding: 8px 12px; font-size: 14px;'
      }, item)
    )
  );
}

/**
 * Liste d'objets
 */
function renderObjectList(items) {
  return el('div', { style: { display: 'grid', gap: '8px' } },
    items.map(item => {
      const code = item.code || item.id || item.value;
      const label = item.label || item.nom || item.name || code;
      const color = item.color;
      const description = item.description;

      return el('div', {
        className: 'registry-item',
        style: `
          padding: 12px 16px;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        `
      }, [
        el('div', { style: { flex: 1 } }, [
          el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
            color ? el('div', {
              style: `
                width: 16px;
                height: 16px;
                background-color: ${color};
                border-radius: 4px;
                border: 1px solid rgba(0,0,0,0.1);
              `
            }) : null,
            el('strong', { style: { fontSize: '14px' } }, label),
            code && code !== label ? el('code', {
              style: 'background: #F3F4F6; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #6B7280;'
            }, code) : null
          ]),
          description ? el('div', {
            style: 'font-size: 13px; color: #6B7280; margin-top: 4px;'
          }, description) : null
        ])
      ]);
    })
  );
}

export default renderReferentiels;
