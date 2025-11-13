/* ============================================
   Admin - Gestion des Référentiels
   ============================================ */

import { mount, el } from '../lib/dom.js';
import dataService from '../datastore/data-service.js';
import router from '../router.js';
import logger from '../lib/logger.js';

let currentRegistries = {};

export async function renderReferentiels() {
  currentRegistries = dataService.getAllRegistries();

  const page = el('div', { className: 'page' }, [
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, 'Gestion des référentiels'),
      el('p', { className: 'page-subtitle' }, 'Configuration des listes de valeurs de l\'application')
    ]),

    el('div', { className: 'alert alert-info', style: { marginBottom: '24px' } }, [
      el('div', { className: 'alert-icon' }, 'ℹ️'),
      el('div', { className: 'alert-content' }, [
        el('div', { className: 'alert-title' }, 'Gestion des référentiels'),
        el('div', { className: 'alert-message' }, 'Cliquez sur "Ajouter" pour créer un nouvel élément. Cliquez sur un élément existant pour le modifier.')
      ])
    ]),

    // Types de marché
    renderRegistrySection('TYPE_MARCHE', 'Types de Marché', currentRegistries.TYPE_MARCHE || []),

    // États de marché
    renderRegistrySection('ETAT_MARCHE', 'États de Marché', currentRegistries.ETAT_MARCHE || []),

    // Modes de passation
    renderRegistrySection('MODE_PASSATION', 'Modes de Passation', currentRegistries.MODE_PASSATION || []),

    // Types d'institution
    renderRegistrySection('TYPE_INSTITUTION', 'Types d\'Institution', currentRegistries.TYPE_INSTITUTION || []),

    // Sources de financement
    renderRegistrySection('SOURCE_FINANCEMENT', 'Sources de Financement', currentRegistries.SOURCE_FINANCEMENT || []),

    // Devises
    renderRegistrySection('DEVISE', 'Devises', currentRegistries.DEVISE || []),

    // Types d'avenants
    renderRegistrySection('TYPE_AVENANT', 'Types d\'Avenant', currentRegistries.TYPE_AVENANT || []),

    // Types de garantie
    renderRegistrySection('TYPE_GARANTIE', 'Types de Garantie', currentRegistries.TYPE_GARANTIE || []),

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
  const bodyId = `section-body-${key}`;
  const isCollapsed = false; // Par défaut ouvert

  const toggleBtn = el('button', {
    className: 'btn btn-sm',
    style: 'padding: 4px 8px; margin-right: 12px; background: transparent; border: none; cursor: pointer; font-size: 18px;',
    onclick: function() {
      const bodyDiv = document.getElementById(bodyId);
      if (bodyDiv) {
        const isHidden = bodyDiv.style.display === 'none';
        bodyDiv.style.display = isHidden ? 'block' : 'none';
        this.textContent = isHidden ? '▼' : '▶';
      }
    }
  }, isCollapsed ? '▶' : '▼');

  const bodyDiv = el('div', {
    id: bodyId,
    className: 'card-body',
    style: isCollapsed ? 'display: none;' : ''
  }, [
    items.length === 0
      ? el('p', { style: { color: '#6B7280', textAlign: 'center' } }, 'Aucun élément')
      : isArrayOfObjects
        ? renderObjectList(key, items)
        : renderSimpleList(key, items)
  ]);

  return el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', { className: 'card-header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center' } }, [
        toggleBtn,
        el('h3', { className: 'card-title', style: { margin: 0 } }, title)
      ]),
      el('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
        el('span', { className: 'badge badge-secondary' }, `${items.length} élément(s)`),
        el('button', {
          className: 'btn btn-sm btn-primary',
          onclick: () => openAddModal(key, title, isArrayOfObjects)
        }, '+ Ajouter')
      ])
    ]),
    bodyDiv
  ]);
}

/**
 * Liste simple (array de strings)
 */
function renderSimpleList(key, items) {
  return el('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
    items.map((item, index) =>
      el('span', {
        className: 'badge',
        style: 'background-color: #E5E7EB; color: #374151; padding: 8px 12px; font-size: 14px; cursor: pointer;',
        onclick: () => openEditModal(key, item, index, false)
      }, item)
    )
  );
}

/**
 * Liste d'objets
 */
function renderObjectList(key, items) {
  return el('div', { style: { display: 'grid', gap: '8px' } },
    items.map((item, index) => {
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
          cursor: pointer;
          transition: all 0.2s ease;
        `,
        onclick: () => openEditModal(key, item, index, true)
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
        ]),
        el('button', {
          className: 'btn btn-sm btn-danger',
          style: { marginLeft: '12px' },
          onclick: (e) => {
            e.stopPropagation();
            deleteRegistryItem(key, index);
          }
        }, '🗑️')
      ]);
    })
  );
}

/**
 * Ouvrir modal pour ajouter un élément
 */
function openAddModal(key, title, isObject) {
  logger.info(`[Referentiels] Opening add modal for ${key}`);

  const modal = createEditModal(key, title, null, -1, isObject);
  document.body.appendChild(modal);
}

/**
 * Ouvrir modal pour éditer un élément
 */
function openEditModal(key, item, index, isObject) {
  logger.info(`[Referentiels] Opening edit modal for ${key}[${index}]`);

  const registryTitle = LIFECYCLE_STEPS.find(s => s.code === key)?.label || key;
  const modal = createEditModal(key, registryTitle, item, index, isObject);
  document.body.appendChild(modal);
}

/**
 * Créer le modal d'édition
 */
function createEditModal(key, title, item, index, isObject) {
  const isEdit = index >= 0;
  const modalTitle = isEdit ? `Modifier - ${title}` : `Ajouter - ${title}`;

  // Form fields
  let formFields;

  if (isObject) {
    // Object form: code, label, color, description
    const currentCode = item?.code || item?.id || item?.value || '';
    const currentLabel = item?.label || item?.nom || item?.name || '';
    const currentColor = item?.color || '#3B82F6';
    const currentDescription = item?.description || '';

    formFields = el('div', { style: { display: 'grid', gap: '16px' } }, [
      el('div', {}, [
        el('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px' } }, 'Code *'),
        el('input', {
          type: 'text',
          id: 'modal-code',
          className: 'form-control',
          value: currentCode,
          placeholder: 'Ex: TRAV_SERV'
        })
      ]),
      el('div', {}, [
        el('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px' } }, 'Libellé *'),
        el('input', {
          type: 'text',
          id: 'modal-label',
          className: 'form-control',
          value: currentLabel,
          placeholder: 'Ex: Travaux et Services'
        })
      ]),
      el('div', {}, [
        el('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px' } }, 'Couleur'),
        el('input', {
          type: 'color',
          id: 'modal-color',
          className: 'form-control',
          value: currentColor,
          style: { height: '40px' }
        })
      ]),
      el('div', {}, [
        el('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px' } }, 'Description'),
        el('textarea', {
          id: 'modal-description',
          className: 'form-control',
          value: currentDescription,
          rows: 3,
          placeholder: 'Description optionnelle...'
        })
      ])
    ]);
  } else {
    // Simple string form
    const currentValue = item || '';

    formFields = el('div', {}, [
      el('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px' } }, 'Valeur *'),
      el('input', {
        type: 'text',
        id: 'modal-value',
        className: 'form-control',
        value: currentValue,
        placeholder: 'Entrer la valeur...'
      })
    ]);
  }

  // Modal container
  const modalOverlay = el('div', {
    className: 'modal-overlay',
    style: `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    `,
    onclick: (e) => {
      if (e.target === modalOverlay) {
        closeModal(modalOverlay);
      }
    }
  }, [
    el('div', {
      className: 'modal-content',
      style: `
        background: white;
        border-radius: 16px;
        padding: 0;
        max-width: 540px;
        width: 90%;
        max-height: 85vh;
        overflow: hidden;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        animation: slideUp 0.3s ease;
      `
    }, [
      // Header avec gradient
      el('div', {
        style: `
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `
      }, [
        el('h2', {
          style: {
            fontSize: '22px',
            fontWeight: '700',
            margin: 0,
            color: 'white'
          }
        }, modalTitle),
        el('button', {
          style: `
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          `,
          onmouseenter: function() {
            this.style.background = 'rgba(255, 255, 255, 0.3)';
          },
          onmouseleave: function() {
            this.style.background = 'rgba(255, 255, 255, 0.2)';
          },
          onclick: () => closeModal(modalOverlay)
        }, '✕')
      ]),

      // Body avec scroll
      el('div', {
        style: `
          padding: 28px;
          max-height: calc(85vh - 180px);
          overflow-y: auto;
        `
      }, [formFields]),

      // Footer fixe
      el('div', {
        style: `
          padding: 20px 28px;
          border-top: 1px solid #E5E7EB;
          background: #F9FAFB;
          display: flex;
          gap: 12px;
        `
      }, [
        el('button', {
          className: 'btn btn-secondary',
          style: { flex: 1, padding: '12px 24px', fontSize: '15px', fontWeight: '600' },
          onclick: () => closeModal(modalOverlay)
        }, 'Annuler'),
        el('button', {
          className: 'btn btn-primary',
          style: {
            flex: 1,
            padding: '12px 24px',
            fontSize: '15px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            border: 'none'
          },
          onclick: () => saveRegistryItem(key, index, isObject, modalOverlay)
        }, isEdit ? '💾 Enregistrer' : '➕ Ajouter')
      ])
    ])
  ]);

  return modalOverlay;
}

/**
 * Sauvegarder un élément du référentiel
 */
function saveRegistryItem(key, index, isObject, modalOverlay) {
  try {
    const isEdit = index >= 0;
    let newItem;

    if (isObject) {
      const code = document.getElementById('modal-code')?.value.trim();
      const label = document.getElementById('modal-label')?.value.trim();
      const color = document.getElementById('modal-color')?.value;
      const description = document.getElementById('modal-description')?.value.trim();

      if (!code || !label) {
        alert('Le code et le libellé sont obligatoires');
        return;
      }

      newItem = { code, label, color, description };
    } else {
      const value = document.getElementById('modal-value')?.value.trim();

      if (!value) {
        alert('La valeur est obligatoire');
        return;
      }

      newItem = value;
    }

    // Update registry
    const registry = [...(currentRegistries[key] || [])];

    if (isEdit) {
      registry[index] = newItem;
      logger.info(`[Referentiels] Updated ${key}[${index}]`);
    } else {
      registry.push(newItem);
      logger.info(`[Referentiels] Added new item to ${key}`);
    }

    // Save to dataService
    currentRegistries[key] = registry;
    dataService.updateRegistry(key, registry);

    // Close modal and refresh
    closeModal(modalOverlay);
    renderReferentiels();

  } catch (error) {
    logger.error('[Referentiels] Error saving item:', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
  }
}

/**
 * Supprimer un élément du référentiel
 */
function deleteRegistryItem(key, index) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
    return;
  }

  try {
    const registry = [...(currentRegistries[key] || [])];
    registry.splice(index, 1);

    currentRegistries[key] = registry;
    dataService.updateRegistry(key, registry);

    logger.info(`[Referentiels] Deleted ${key}[${index}]`);
    renderReferentiels();

  } catch (error) {
    logger.error('[Referentiels] Error deleting item:', error);
    alert('Erreur lors de la suppression: ' + error.message);
  }
}

/**
 * Fermer le modal
 */
function closeModal(modalOverlay) {
  if (modalOverlay && modalOverlay.parentNode) {
    modalOverlay.parentNode.removeChild(modalOverlay);
  }
}

export default renderReferentiels;
