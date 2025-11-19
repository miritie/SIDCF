/* ============================================
   Widget: Livrable Manager
   Gestion des livrables (CRUD inline)
   ============================================ */

import { el } from '../../lib/dom.js';
import { uid } from '../../lib/uid.js';

/**
 * Render livrable manager widget
 *
 * @param {Array} livrables - Liste des livrables actuels
 * @param {Object} registries - Référentiels (TYPE_LIVRABLE, LOCALITE_CI)
 * @param {Function} onChange - Callback appelé quand la liste change
 * @returns {HTMLElement}
 */
export function renderLivrableManager(livrables = [], registries = {}, onChange = null) {
  const container = el('div', { className: 'livrable-manager' });

  // State
  let currentLivrables = [...livrables];

  // Render initial list
  renderLivrableList();

  function renderLivrableList() {
    container.innerHTML = '';

    // Header
    const header = el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } }, [
      el('h4', { style: { margin: 0 } }, `Livrables (${currentLivrables.length})`),
      createButton('btn btn-sm btn-accent', '+ Ajouter un livrable', () => {
        openLivrableForm(null, 'create');
      })
    ]);

    container.appendChild(header);

    // List
    if (currentLivrables.length === 0) {
      const emptyState = el('div', { className: 'alert alert-info' }, [
        el('div', { className: 'alert-icon' }, 'ℹ️'),
        el('div', { className: 'alert-content' }, 'Aucun livrable défini. Cliquez sur "Ajouter un livrable" pour commencer.')
      ]);
      container.appendChild(emptyState);
    } else {
      const table = el('table', { className: 'table', style: { width: '100%' } }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Type'),
            el('th', {}, 'Libellé'),
            el('th', {}, 'Localisation'),
            el('th', { style: { width: '120px', textAlign: 'center' } }, 'Actions')
          ])
        ]),
        el('tbody', {}, currentLivrables.map((liv, index) => renderLivrableRow(liv, index)))
      ]);
      container.appendChild(table);
    }
  }

  function renderLivrableRow(livrable, index) {
    const typeLabel = registries.TYPE_LIVRABLE?.find(t => t.code === livrable.type)?.label || livrable.type;
    const locText = formatLocalisation(livrable.localisation);

    return el('tr', {}, [
      el('td', {}, el('span', { className: 'badge badge-info' }, typeLabel)),
      el('td', {}, livrable.libelle || '-'),
      el('td', {}, el('span', { className: 'text-small text-muted' }, locText)),
      el('td', { style: { textAlign: 'center' } }, [
        el('div', { style: { display: 'flex', gap: '4px', justifyContent: 'center' } }, [
          createButton('btn btn-sm btn-secondary', '✏️', () => openLivrableForm(livrable, 'edit', index)),
          createButton('btn btn-sm btn-error', '🗑️', () => deleteLivrable(index))
        ])
      ])
    ]);
  }

  function formatLocalisation(loc) {
    if (!loc) return 'Non localisé';
    const parts = [loc.region, loc.commune, loc.sousPrefecture, loc.localite].filter(Boolean);
    return parts.length > 0 ? parts.join(' > ') : 'Non localisé';
  }

  function openLivrableForm(livrable, mode, index = null) {
    const isEdit = mode === 'edit';
    const formData = livrable ? { ...livrable } : {
      id: uid('LIV'),
      type: '',
      libelle: '',
      localisation: {
        region: '',
        regionCode: '',
        district: '',
        districtCode: '',
        commune: '',
        communeCode: '',
        sousPrefecture: '',
        sousPrefectureCode: '',
        localite: '',
        latitude: null,
        longitude: null,
        coordsOK: false
      }
    };

    // Create modal overlay
    const modalOverlay = el('div', {
      className: 'modal-overlay',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }
    });

    const modalContent = el('div', {
      className: 'card',
      style: {
        width: '90%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto'
      }
    }, [
      // Header
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, isEdit ? '✏️ Modifier le livrable' : '➕ Nouveau livrable')
      ]),

      // Body
      el('div', { className: 'card-body' }, [
        // Type livrable
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Type de livrable', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'liv-type', value: formData.type }, [
            el('option', { value: '' }, '-- Sélectionner un type --'),
            ...(registries.TYPE_LIVRABLE || []).map(t =>
              el('option', { value: t.code, selected: t.code === formData.type }, t.label)
            )
          ])
        ]),

        // Libellé
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Libellé / Description', el('span', { className: 'required' }, '*')]),
          el('textarea', {
            className: 'form-input',
            id: 'liv-libelle',
            rows: 3,
            placeholder: 'Description détaillée du livrable...',
            value: formData.libelle
          }, formData.libelle)
        ]),

        // Localisation en cascade
        el('div', { style: { marginTop: '16px', marginBottom: '8px' } }, [
          el('strong', {}, '📍 Localisation géographique')
        ]),

        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } }, [
          // Région
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Région'),
            el('select', { className: 'form-input', id: 'liv-region' }, [
              el('option', { value: '' }, '-- Sélectionner --'),
              ...(registries.LOCALITE_CI?.regions || []).map(r =>
                el('option', { value: r.code, 'data-label': r.label, selected: r.code === formData.localisation.regionCode }, r.label)
              )
            ])
          ]),

          // Département (District)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Département'),
            el('select', { className: 'form-input', id: 'liv-departement', disabled: true }, [
              el('option', { value: '' }, '-- Sélectionner région d\'abord --')
            ])
          ]),

          // Commune (mapped to sous-préfecture for now)
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Sous-préfecture'),
            el('select', { className: 'form-input', id: 'liv-sousPrefecture', disabled: true }, [
              el('option', { value: '' }, '-- Sélectionner département d\'abord --')
            ])
          ]),

          // Localité
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Localité'),
            el('select', { className: 'form-input', id: 'liv-localite', disabled: true }, [
              el('option', { value: '' }, '-- Sélectionner sous-préfecture d\'abord --')
            ])
          ]),

          // Latitude
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Latitude'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'liv-latitude',
              step: '0.000001',
              placeholder: 'Ex: 5.33255',
              value: formData.localisation.latitude || ''
            })
          ]),

          // Longitude
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Longitude'),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'liv-longitude',
              step: '0.000001',
              placeholder: 'Ex: -4.02290',
              value: formData.localisation.longitude || ''
            })
          ])
        ])
      ]),

      // Footer
      el('div', { className: 'card-footer', style: { display: 'flex', gap: '12px', justifyContent: 'flex-end' } }, [
        createButton('btn btn-secondary', 'Annuler', () => {
          document.body.removeChild(modalOverlay);
        }),
        createButton('btn btn-primary', isEdit ? 'Modifier' : 'Ajouter', () => {
          saveLivrable(formData, isEdit, index, modalOverlay);
        })
      ])
    ]);

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Setup cascading dropdowns
    setupLocalisationCascades(formData, registries);
  }

  function setupLocalisationCascades(formData, registries) {
    const regionSelect = document.getElementById('liv-region');
    const deptSelect = document.getElementById('liv-departement');
    const spSelect = document.getElementById('liv-sousPrefecture');
    const localiteSelect = document.getElementById('liv-localite');

    if (!regionSelect || !deptSelect || !spSelect || !localiteSelect) return;

    // Région change
    regionSelect.addEventListener('change', (e) => {
      const regionCode = e.target.value;

      deptSelect.innerHTML = '<option value="">-- Sélectionner un département --</option>';
      deptSelect.disabled = !regionCode;
      spSelect.innerHTML = '<option value="">-- Sélectionner un département d\'abord --</option>';
      spSelect.disabled = true;
      localiteSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture d\'abord --</option>';
      localiteSelect.disabled = true;

      if (!regionCode) return;

      const region = registries.LOCALITE_CI?.regions?.find(r => r.code === regionCode);
      if (region?.departements) {
        region.departements.forEach(dept => {
          const option = document.createElement('option');
          option.value = dept.code;
          option.textContent = dept.label;
          option.dataset.label = dept.label;
          deptSelect.appendChild(option);
        });
        deptSelect.disabled = false;
      }
    });

    // Département change
    deptSelect.addEventListener('change', (e) => {
      const regionCode = regionSelect.value;
      const deptCode = e.target.value;

      spSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture --</option>';
      spSelect.disabled = !deptCode;
      localiteSelect.innerHTML = '<option value="">-- Sélectionner une sous-préfecture d\'abord --</option>';
      localiteSelect.disabled = true;

      if (!deptCode) return;

      const region = registries.LOCALITE_CI?.regions?.find(r => r.code === regionCode);
      const dept = region?.departements?.find(d => d.code === deptCode);
      if (dept?.sousPrefectures) {
        dept.sousPrefectures.forEach(sp => {
          const option = document.createElement('option');
          option.value = sp.code;
          option.textContent = sp.label;
          option.dataset.label = sp.label;
          spSelect.appendChild(option);
        });
        spSelect.disabled = false;
      }
    });

    // Sous-préfecture change
    spSelect.addEventListener('change', (e) => {
      const regionCode = regionSelect.value;
      const deptCode = deptSelect.value;
      const spCode = e.target.value;

      localiteSelect.innerHTML = '<option value="">-- Sélectionner une localité --</option>';
      localiteSelect.disabled = !spCode;

      if (!spCode) return;

      const region = registries.LOCALITE_CI?.regions?.find(r => r.code === regionCode);
      const dept = region?.departements?.find(d => d.code === deptCode);
      const sp = dept?.sousPrefectures?.find(s => s.code === spCode);
      if (sp?.localites && Array.isArray(sp.localites)) {
        sp.localites.forEach(loc => {
          const option = document.createElement('option');
          option.value = loc;
          option.textContent = loc;
          localiteSelect.appendChild(option);
        });
        localiteSelect.disabled = false;
      }
    });

    // Pre-populate if editing
    if (formData.localisation.regionCode) {
      regionSelect.value = formData.localisation.regionCode;
      regionSelect.dispatchEvent(new Event('change'));

      setTimeout(() => {
        if (formData.localisation.districtCode) {
          deptSelect.value = formData.localisation.districtCode;
          deptSelect.dispatchEvent(new Event('change'));

          setTimeout(() => {
            if (formData.localisation.sousPrefectureCode) {
              spSelect.value = formData.localisation.sousPrefectureCode;
              spSelect.dispatchEvent(new Event('change'));

              setTimeout(() => {
                if (formData.localisation.localite) {
                  localiteSelect.value = formData.localisation.localite;
                }
              }, 50);
            }
          }, 50);
        }
      }, 50);
    }
  }

  function saveLivrable(formData, isEdit, index, modalOverlay) {
    // Collect form data
    const type = document.getElementById('liv-type')?.value;
    const libelle = document.getElementById('liv-libelle')?.value?.trim();

    // Validation
    if (!type || !libelle) {
      alert('⚠️ Veuillez remplir le type et le libellé du livrable');
      return;
    }

    // Get location data
    const regionSelect = document.getElementById('liv-region');
    const deptSelect = document.getElementById('liv-departement');
    const spSelect = document.getElementById('liv-sousPrefecture');
    const localiteSelect = document.getElementById('liv-localite');

    const getSelectLabel = (selectEl) => {
      if (!selectEl || !selectEl.value) return '';
      const option = selectEl.options[selectEl.selectedIndex];
      return option?.dataset?.label || option?.textContent || '';
    };

    const livrable = {
      ...formData,
      type,
      libelle,
      localisation: {
        region: getSelectLabel(regionSelect),
        regionCode: regionSelect?.value || '',
        district: getSelectLabel(deptSelect),
        districtCode: deptSelect?.value || '',
        commune: '', // Not used in CI context
        communeCode: '',
        sousPrefecture: getSelectLabel(spSelect),
        sousPrefectureCode: spSelect?.value || '',
        localite: localiteSelect?.value || '',
        latitude: document.getElementById('liv-latitude')?.value ? Number(document.getElementById('liv-latitude')?.value) : null,
        longitude: document.getElementById('liv-longitude')?.value ? Number(document.getElementById('liv-longitude')?.value) : null,
        coordsOK: !!(document.getElementById('liv-latitude')?.value && document.getElementById('liv-longitude')?.value)
      }
    };

    // Update list
    if (isEdit) {
      currentLivrables[index] = livrable;
    } else {
      currentLivrables.push(livrable);
    }

    // Notify parent
    if (onChange) {
      onChange([...currentLivrables]);
    }

    // Close modal
    document.body.removeChild(modalOverlay);

    // Re-render
    renderLivrableList();
  }

  function deleteLivrable(index) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livrable ?')) {
      return;
    }

    currentLivrables.splice(index, 1);

    // Notify parent
    if (onChange) {
      onChange([...currentLivrables]);
    }

    // Re-render
    renderLivrableList();
  }

  function createButton(className, text, onClick) {
    const btn = el('button', { className, type: 'button' }, text);
    btn.addEventListener('click', onClick);
    return btn;
  }

  return container;
}

export default renderLivrableManager;
