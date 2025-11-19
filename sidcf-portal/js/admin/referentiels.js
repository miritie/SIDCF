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

    formFields = el('div', { style: { display: 'grid', gap: '20px' } }, [
      // Code field
      el('div', {}, [
        el('label', {
          className: 'form-label',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }
        }, [
          el('span', {}, '🏷️'),
          el('span', {}, 'Code'),
          el('span', { style: { color: '#EF4444', fontSize: '16px' } }, '*')
        ]),
        el('input', {
          type: 'text',
          id: 'modal-code',
          className: 'form-control',
          value: currentCode,
          placeholder: 'Ex: TRAV_SERV',
          style: {
            fontSize: '15px',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '2px solid #E5E7EB',
            transition: 'all 0.2s ease'
          }
        })
      ]),

      // Label field
      el('div', {}, [
        el('label', {
          className: 'form-label',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }
        }, [
          el('span', {}, '📝'),
          el('span', {}, 'Libellé'),
          el('span', { style: { color: '#EF4444', fontSize: '16px' } }, '*')
        ]),
        el('input', {
          type: 'text',
          id: 'modal-label',
          className: 'form-control',
          value: currentLabel,
          placeholder: 'Ex: Travaux et Services',
          style: {
            fontSize: '15px',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '2px solid #E5E7EB',
            transition: 'all 0.2s ease'
          }
        })
      ]),

      // Color picker with preview
      el('div', {}, [
        el('label', {
          className: 'form-label',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }
        }, [
          el('span', {}, '🎨'),
          el('span', {}, 'Couleur')
        ]),
        el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
          el('input', {
            type: 'color',
            id: 'modal-color',
            className: 'form-control',
            value: currentColor,
            style: {
              width: '80px',
              height: '44px',
              padding: '4px',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
              cursor: 'pointer'
            }
          }),
          el('div', {
            id: 'color-preview',
            style: `
              flex: 1;
              height: 44px;
              background: ${currentColor};
              border-radius: 8px;
              border: 2px solid #E5E7EB;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 13px;
              font-weight: 600;
              text-shadow: 0 1px 2px rgba(0,0,0,0.3);
            `
          }, currentColor)
        ])
      ]),

      // Description field
      el('div', {}, [
        el('label', {
          className: 'form-label',
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }
        }, [
          el('span', {}, '📄'),
          el('span', {}, 'Description'),
          el('span', { style: { color: '#9CA3AF', fontSize: '12px', fontWeight: '400' } }, '(optionnelle)')
        ]),
        el('textarea', {
          id: 'modal-description',
          className: 'form-control',
          value: currentDescription,
          rows: 3,
          placeholder: 'Ajoutez une description pour clarifier l\'usage de cet élément...',
          style: {
            fontSize: '14px',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '2px solid #E5E7EB',
            resize: 'vertical',
            minHeight: '90px',
            lineHeight: '1.5'
          }
        })
      ])
    ]);

    // Add color picker live update
    setTimeout(() => {
      const colorInput = document.getElementById('modal-color');
      const colorPreview = document.getElementById('color-preview');
      if (colorInput && colorPreview) {
        colorInput.addEventListener('input', (e) => {
          const newColor = e.target.value;
          colorPreview.style.background = newColor;
          colorPreview.textContent = newColor;
        });
      }
    }, 0);

  } else {
    // Simple string form
    const currentValue = item || '';

    formFields = el('div', {}, [
      el('label', {
        className: 'form-label',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '8px'
        }
      }, [
        el('span', {}, '✏️'),
        el('span', {}, 'Valeur'),
        el('span', { style: { color: '#EF4444', fontSize: '16px' } }, '*')
      ]),
      el('input', {
        type: 'text',
        id: 'modal-value',
        className: 'form-control',
        value: currentValue,
        placeholder: 'Entrer la valeur...',
        style: {
          fontSize: '15px',
          padding: '12px 14px',
          borderRadius: '8px',
          border: '2px solid #E5E7EB',
          transition: 'all 0.2s ease'
        }
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
      background: rgba(17, 24, 39, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.25s ease;
      padding: 20px;
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
        border-radius: 20px;
        padding: 0;
        max-width: 560px;
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      `
    }, [
      // Header minimaliste et élégant
      el('div', {
        style: `
          padding: 32px 32px 24px 32px;
          border-bottom: 1px solid #F3F4F6;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        `
      }, [
        el('div', {}, [
          el('h2', {
            style: {
              fontSize: '24px',
              fontWeight: '700',
              margin: '0 0 6px 0',
              color: '#111827',
              letterSpacing: '-0.02em'
            }
          }, modalTitle),
          el('p', {
            style: {
              fontSize: '14px',
              color: '#6B7280',
              margin: 0
            }
          }, isEdit ? 'Modifier les informations ci-dessous' : 'Complétez le formulaire pour ajouter un nouvel élément')
        ]),
        el('button', {
          style: `
            background: #F3F4F6;
            border: none;
            color: #6B7280;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
          `,
          onmouseenter: function() {
            this.style.background = '#E5E7EB';
            this.style.color = '#374151';
          },
          onmouseleave: function() {
            this.style.background = '#F3F4F6';
            this.style.color = '#6B7280';
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

      // Footer moderne
      el('div', {
        style: `
          padding: 24px 32px;
          border-top: 1px solid #F3F4F6;
          background: white;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        `
      }, [
        el('button', {
          style: `
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 10px;
            border: 2px solid #E5E7EB;
            background: white;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 120px;
          `,
          onmouseenter: function() {
            this.style.background = '#F9FAFB';
            this.style.borderColor = '#D1D5DB';
          },
          onmouseleave: function() {
            this.style.background = 'white';
            this.style.borderColor = '#E5E7EB';
          },
          onclick: () => closeModal(modalOverlay)
        }, 'Annuler'),
        el('button', {
          style: `
            padding: 12px 28px;
            font-size: 15px;
            font-weight: 600;
            border-radius: 10px;
            border: none;
            background: #3B82F6;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 140px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          `,
          onmouseenter: function() {
            this.style.background = '#2563EB';
            this.style.transform = 'translateY(-1px)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          },
          onmouseleave: function() {
            this.style.background = '#3B82F6';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          },
          onclick: () => saveRegistryItem(key, index, isObject, modalOverlay)
        }, isEdit ? '✓ Enregistrer' : '+ Ajouter')
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
