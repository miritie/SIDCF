/**
 * Widget de gestion de l'Échéancier de paiement avec livrables
 * Permet de définir les échéances de paiement liées aux livrables du marché
 * avec suivi de l'avancement de chaque livrable
 */

import { el } from '../../lib/dom.js';
import logger from '../../lib/logger.js';

/**
 * @param {Object} echeancier - Objet échéancier existant
 * @param {Array} livrables - Liste des livrables du marché
 * @param {Number} montantMarcheTotal - Montant total du marché (pour calcul %)
 * @param {Object} registries - Référentiels (TYPE_ECHEANCE, PERIODICITE_ECHEANCE, STATUT_LIVRABLE)
 * @param {Function} onChange - Callback appelé quand l'échéancier change: onChange(echeancierData)
 * @returns {HTMLElement}
 */
export function renderEcheancierManager(
  echeancier = null,
  livrables = [],
  montantMarcheTotal = 0,
  registries = {},
  onChange = null
) {
  const container = el('div', { className: 'echeancier-manager' });

  // État initial
  let currentEcheancier = echeancier ? { ...echeancier } : {
    periodicite: 'LIBRE',
    periodiciteJours: null,
    items: [],
    total: 0,
    totalPourcent: 0
  };

  // Fonction pour notifier le parent
  function notifyChange() {
    if (onChange) {
      onChange({ ...currentEcheancier });
    }
  }

  // Fonction pour recalculer les totaux
  function recalculateTotals() {
    const total = currentEcheancier.items.reduce((sum, item) => sum + item.montant, 0);
    const totalPourcent = currentEcheancier.items.reduce((sum, item) => sum + item.pourcentage, 0);

    currentEcheancier.total = total;
    currentEcheancier.totalPourcent = parseFloat(totalPourcent.toFixed(2));
  }

  // Fonction pour calculer le pourcentage d'une échéance
  function calculatePourcentage(montant) {
    if (montantMarcheTotal === 0) return 0;
    return parseFloat(((montant / montantMarcheTotal) * 100).toFixed(2));
  }

  // Fonction pour calculer la date prévisionnelle selon la périodicité
  function calculateNextDate(previousDate, periodicite, periodiciteJours) {
    if (!previousDate) return null;

    const date = new Date(previousDate);

    switch (periodicite) {
      case 'MENSUEL':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'BIMESTRIEL':
        date.setMonth(date.getMonth() + 2);
        break;
      case 'TRIMESTRIEL':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'SEMESTRIEL':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'ANNUEL':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'LIBRE':
        if (periodiciteJours) {
          date.setDate(date.getDate() + parseInt(periodiciteJours));
        }
        break;
    }

    return date.toISOString().split('T')[0];
  }

  // Fonction pour ouvrir le formulaire d'échéance
  function openEcheanceForm(echeance = null, mode = 'add', index = null) {
    const modal = el('div', { className: 'modal-overlay' });
    const modalContent = el('div', { className: 'modal-content', style: { maxWidth: '800px' } });

    // Calculer la date suggérée si mode ajout
    let suggestedDate = null;
    if (mode === 'add' && currentEcheancier.items.length > 0) {
      const lastItem = currentEcheancier.items[currentEcheancier.items.length - 1];
      suggestedDate = calculateNextDate(lastItem.datePrevisionnelle, currentEcheancier.periodicite, currentEcheancier.periodiciteJours);
    }

    const formData = echeance ? { ...echeance } : {
      num: currentEcheancier.items.length + 1,
      datePrevisionnelle: suggestedDate || null,
      montant: 0,
      pourcentage: 0,
      typeEcheance: 'ACOMPTE',
      livrablesCibles: [],
      statutsLivrables: {}
    };

    const form = el('form', { id: 'echeance-form' }, [
      // Header
      el('div', { className: 'modal-header' }, [
        el('h3', { className: 'modal-title' }, mode === 'add' ? '➕ Ajouter une échéance' : '✏️ Modifier l\'échéance'),
        el('button', {
          type: 'button',
          className: 'btn-close',
          onclick: () => modal.remove()
        }, '✕')
      ]),

      // Body
      el('div', { className: 'modal-body' }, [
        // Informations de base
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['N° échéance', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'echeance-num',
              value: formData.num,
              required: true,
              min: 1
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Date prévisionnelle', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'date',
              className: 'form-input',
              id: 'echeance-date',
              value: formData.datePrevisionnelle || '',
              required: true
            }),
            suggestedDate ? el('small', { className: 'text-muted' }, `Suggérée: ${new Date(suggestedDate).toLocaleDateString('fr-FR')}`) : null
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Type d\'échéance', el('span', { className: 'required' }, '*')]),
            el('select', { className: 'form-input', id: 'echeance-type', required: true }, [
              ...(registries.TYPE_ECHEANCE || []).map(t =>
                el('option', { value: t.code, selected: t.code === formData.typeEcheance }, t.label)
              )
            ])
          ])
        ]),

        // Montant et pourcentage
        el('div', { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' } }, [
          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, ['Montant (XOF)', el('span', { className: 'required' }, '*')]),
            el('input', {
              type: 'number',
              className: 'form-input',
              id: 'echeance-montant',
              value: formData.montant,
              required: true,
              min: 0,
              step: 0.01
            })
          ]),

          el('div', { className: 'form-field' }, [
            el('label', { className: 'form-label' }, 'Pourcentage (%)'),
            el('input', {
              type: 'text',
              className: 'form-input',
              id: 'echeance-pourcentage',
              value: formData.pourcentage.toFixed(2) + '%',
              disabled: true,
              style: { backgroundColor: '#e9ecef', fontWeight: 'bold' }
            }),
            el('small', { className: 'text-muted' }, 'Calculé automatiquement')
          ])
        ]),

        // Section Livrables
        el('div', { style: { marginBottom: '16px' } }, [
          el('h4', { style: { marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' } }, '📦 Livrables concernés par cette échéance'),

          livrables.length === 0
            ? el('p', { className: 'text-muted' }, 'Aucun livrable défini pour ce marché')
            : el('div', { id: 'livrables-selection', style: { border: '1px solid #dee2e6', borderRadius: '4px', padding: '12px', maxHeight: '300px', overflowY: 'auto' } },
                livrables.map(livrable => {
                  const isSelected = formData.livrablesCibles.includes(livrable.id);
                  const currentStatut = formData.statutsLivrables[livrable.id] || { statut: 'NON_DEMARRE', pourcentage: 0 };
                  const typeLabel = (registries.TYPE_LIVRABLE || []).find(t => t.code === livrable.type)?.label || livrable.type;

                  return el('div', {
                    className: 'livrable-item',
                    style: {
                      padding: '12px',
                      marginBottom: '8px',
                      border: isSelected ? '2px solid #0066cc' : '1px solid #dee2e6',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? '#f0f8ff' : '#fff'
                    }
                  }, [
                    // Checkbox sélection
                    el('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '12px' } }, [
                      el('input', {
                        type: 'checkbox',
                        className: 'livrable-checkbox',
                        'data-livrable-id': livrable.id,
                        checked: isSelected,
                        onchange: (e) => {
                          const statutDiv = document.getElementById(`livrable-statut-${livrable.id}`);
                          if (statutDiv) {
                            statutDiv.style.display = e.target.checked ? 'block' : 'none';
                          }
                        }
                      }),

                      el('div', { style: { flex: 1 } }, [
                        el('div', { style: { fontWeight: 'bold', marginBottom: '4px' } }, [
                          el('span', { className: 'badge badge-info', style: { marginRight: '8px' } }, typeLabel),
                          livrable.libelle
                        ]),
                        el('div', { className: 'text-small text-muted' }, `📍 ${livrable.localisation?.region || 'Non localisé'}`),

                        // Statut du livrable (affiché si sélectionné)
                        el('div', {
                          id: `livrable-statut-${livrable.id}`,
                          style: {
                            display: isSelected ? 'block' : 'none',
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px dashed #dee2e6'
                          }
                        }, [
                          el('label', { className: 'form-label text-small', style: { marginBottom: '8px' } }, 'Statut d\'avancement :'),
                          el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' } },
                            (registries.STATUT_LIVRABLE || []).map(statut => {
                              const radioId = `statut-${livrable.id}-${statut.code}`;
                              return el('label', {
                                className: 'form-label text-small',
                                style: {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '6px',
                                  border: '1px solid #dee2e6',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  backgroundColor: currentStatut.statut === statut.code ? '#e7f3ff' : '#fff'
                                }
                              }, [
                                el('input', {
                                  type: 'radio',
                                  name: `statut-${livrable.id}`,
                                  id: radioId,
                                  value: statut.code,
                                  checked: currentStatut.statut === statut.code,
                                  onchange: (e) => {
                                    const pctDiv = document.getElementById(`livrable-pct-${livrable.id}`);
                                    if (pctDiv && statut.withPourcentage) {
                                      pctDiv.style.display = 'block';
                                    } else if (pctDiv) {
                                      pctDiv.style.display = 'none';
                                    }
                                  }
                                }),
                                el('span', {}, statut.label)
                              ]);
                            })
                          ),

                          // Pourcentage si EN_COURS
                          el('div', {
                            id: `livrable-pct-${livrable.id}`,
                            style: { display: currentStatut.statut === 'EN_COURS' ? 'block' : 'none' }
                          }, [
                            el('label', { className: 'form-label text-small' }, 'Pourcentage d\'avancement (%) :'),
                            el('input', {
                              type: 'number',
                              className: 'form-input form-input-sm',
                              'data-livrable-pct': livrable.id,
                              value: currentStatut.pourcentage || 0,
                              min: 1,
                              max: 99,
                              step: 1
                            })
                          ])
                        ])
                      ])
                    ])
                  ]);
                })
              )
        ])
      ]),

      // Footer
      el('div', { className: 'modal-footer' }, [
        el('button', {
          type: 'button',
          className: 'btn btn-secondary',
          onclick: () => modal.remove()
        }, 'Annuler'),
        el('button', {
          type: 'submit',
          className: 'btn btn-primary'
        }, mode === 'add' ? 'Ajouter' : 'Modifier')
      ])
    ]);

    // Preview du pourcentage en temps réel
    const montantInput = form.querySelector('#echeance-montant');
    const pourcentageInput = form.querySelector('#echeance-pourcentage');

    montantInput.addEventListener('input', () => {
      const montant = parseFloat(montantInput.value) || 0;
      const pct = calculatePourcentage(montant);
      pourcentageInput.value = pct.toFixed(2) + '%';
    });

    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const montant = parseFloat(document.getElementById('echeance-montant').value);
      const newEcheance = {
        num: parseInt(document.getElementById('echeance-num').value),
        datePrevisionnelle: document.getElementById('echeance-date').value,
        montant: montant,
        pourcentage: calculatePourcentage(montant),
        typeEcheance: document.getElementById('echeance-type').value,
        livrablesCibles: [],
        statutsLivrables: {}
      };

      // Récupérer les livrables sélectionnés et leurs statuts
      document.querySelectorAll('.livrable-checkbox:checked').forEach(checkbox => {
        const livrableId = checkbox.getAttribute('data-livrable-id');
        newEcheance.livrablesCibles.push(livrableId);

        // Récupérer le statut sélectionné
        const statutRadio = document.querySelector(`input[name="statut-${livrableId}"]:checked`);
        const statut = statutRadio ? statutRadio.value : 'NON_DEMARRE';

        // Récupérer le pourcentage si EN_COURS
        let pourcentage = 0;
        if (statut === 'EN_COURS') {
          const pctInput = document.querySelector(`[data-livrable-pct="${livrableId}"]`);
          pourcentage = pctInput ? parseInt(pctInput.value) || 0 : 0;
        } else if (statut === 'TERMINE') {
          pourcentage = 100;
        } else if (statut === 'DEMARRE') {
          pourcentage = 0;
        }

        newEcheance.statutsLivrables[livrableId] = { statut, pourcentage };
      });

      if (mode === 'add') {
        currentEcheancier.items.push(newEcheance);
        logger.info('[Échéancier] Échéance ajoutée', newEcheance);
      } else {
        currentEcheancier.items[index] = newEcheance;
        logger.info('[Échéancier] Échéance modifiée', newEcheance);
      }

      recalculateTotals();
      notifyChange();
      render();
      modal.remove();
    });

    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  // Fonction pour supprimer une échéance
  function deleteEcheance(index) {
    const echeance = currentEcheancier.items[index];

    if (confirm(`Supprimer l'échéance n°${echeance.num} (${echeance.montant} XOF) ?`)) {
      currentEcheancier.items.splice(index, 1);
      recalculateTotals();
      notifyChange();
      render();
      logger.info('[Échéancier] Échéance supprimée', echeance);
    }
  }

  // Fonction de rendu principal
  function render() {
    container.innerHTML = '';

    // Header avec périodicité
    const header = el('div', { className: 'echeancier-header', style: { marginBottom: '16px' } }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: currentEcheancier.periodicite === 'LIBRE' ? '2fr 1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' } }, [
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Périodicité', el('span', { className: 'required' }, '*')]),
          el('select', {
            className: 'form-input',
            id: 'echeancier-periodicite',
            value: currentEcheancier.periodicite,
            onchange: (e) => {
              currentEcheancier.periodicite = e.target.value;
              if (e.target.value !== 'LIBRE') {
                currentEcheancier.periodiciteJours = null;
              }
              notifyChange();
              render();
            }
          }, [
            ...(registries.PERIODICITE_ECHEANCE || []).map(p =>
              el('option', { value: p.code, selected: p.code === currentEcheancier.periodicite }, p.label)
            )
          ]),
          el('small', { className: 'text-muted' }, 'Définit la fréquence des échéances')
        ]),

        currentEcheancier.periodicite === 'LIBRE'
          ? el('div', { className: 'form-field' }, [
              el('label', { className: 'form-label' }, 'Nombre de jours'),
              el('input', {
                type: 'number',
                className: 'form-input',
                id: 'echeancier-jours',
                value: currentEcheancier.periodiciteJours || '',
                min: 1,
                placeholder: 'Ex: 45',
                oninput: (e) => {
                  currentEcheancier.periodiciteJours = e.target.value ? parseInt(e.target.value) : null;
                  notifyChange();
                }
              }),
              el('small', { className: 'text-muted' }, 'Entre chaque échéance')
            ])
          : null,

        el('div', { style: { display: 'flex', alignItems: 'flex-end' } }, [
          el('button', {
            type: 'button',
            className: 'btn btn-primary',
            style: { width: '100%' },
            onclick: () => openEcheanceForm(null, 'add')
          }, '➕ Ajouter une échéance')
        ])
      ])
    ]);

    // Tableau des échéances
    const table = el('table', { className: 'table', style: { width: '100%', marginBottom: '16px' } }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'N°'),
          el('th', {}, 'Date prévisionnelle'),
          el('th', {}, 'Type'),
          el('th', { style: { textAlign: 'right' } }, 'Montant (XOF)'),
          el('th', { style: { textAlign: 'right' } }, 'Pourcentage (%)'),
          el('th', {}, 'Livrables'),
          el('th', { style: { textAlign: 'center' } }, 'Actions')
        ])
      ]),
      el('tbody', {},
        currentEcheancier.items.length === 0
          ? [el('tr', {}, [
              el('td', { colspan: 7, style: { textAlign: 'center', padding: '24px' } },
                el('span', { className: 'text-muted' }, '📅 Aucune échéance définie')
              )
            ])]
          : currentEcheancier.items.map((item, index) => {
              const typeLabel = (registries.TYPE_ECHEANCE || []).find(t => t.code === item.typeEcheance)?.label || item.typeEcheance;
              const nbLivrables = item.livrablesCibles.length;

              // Créer un tooltip pour les livrables
              let livrablesDetail = '';
              if (nbLivrables > 0) {
                livrablesDetail = item.livrablesCibles.map(livrableId => {
                  const livrable = livrables.find(l => l.id === livrableId);
                  const statut = item.statutsLivrables[livrableId];
                  if (!livrable || !statut) return '';

                  const statutLabel = (registries.STATUT_LIVRABLE || []).find(s => s.code === statut.statut)?.label || statut.statut;
                  const pct = statut.statut === 'EN_COURS' ? ` (${statut.pourcentage}%)` : '';
                  return `• ${livrable.libelle} → ${statutLabel}${pct}`;
                }).filter(Boolean).join('\n');
              }

              return el('tr', {}, [
                el('td', { style: { fontWeight: 'bold' } }, `#${item.num}`),
                el('td', {}, new Date(item.datePrevisionnelle).toLocaleDateString('fr-FR')),
                el('td', {}, el('span', { className: 'badge badge-secondary' }, typeLabel)),
                el('td', { style: { textAlign: 'right', fontWeight: 'bold' } }, item.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })),
                el('td', { style: { textAlign: 'right', fontWeight: 'bold' } }, `${item.pourcentage.toFixed(2)}%`),
                el('td', {}, [
                  nbLivrables > 0
                    ? el('span', {
                        className: 'badge badge-info',
                        title: livrablesDetail,
                        style: { cursor: 'help' }
                      }, `${nbLivrables} livrable${nbLivrables > 1 ? 's' : ''}`)
                    : el('span', { className: 'text-muted text-small' }, 'Aucun')
                ]),
                el('td', { style: { textAlign: 'center' } }, [
                  el('div', { style: { display: 'flex', gap: '4px', justifyContent: 'center' } }, [
                    el('button', {
                      type: 'button',
                      className: 'btn btn-sm btn-secondary',
                      onclick: () => openEcheanceForm(item, 'edit', index)
                    }, '✏️'),
                    el('button', {
                      type: 'button',
                      className: 'btn btn-sm btn-danger',
                      onclick: () => deleteEcheance(index)
                    }, '🗑️')
                  ])
                ])
              ]);
            })
      )
    ]);

    // Résumé
    const isValid = Math.abs(currentEcheancier.totalPourcent - 100) < 0.01;

    const summary = el('div', { className: 'echeancier-summary', style: { padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' } }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' } }, [
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Montant marché total'),
          el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, montantMarcheTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' XOF')
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Nombre d\'échéances'),
          el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, currentEcheancier.items.length.toString())
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Total échéancé'),
          el('div', { style: { fontSize: '18px', fontWeight: 'bold', color: '#0066cc' } }, currentEcheancier.total.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' XOF')
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Total pourcentage'),
          el('div', {
            style: {
              fontSize: '20px',
              fontWeight: 'bold',
              color: isValid ? '#28a745' : '#dc3545'
            }
          }, [
            currentEcheancier.totalPourcent.toFixed(2) + '%',
            isValid
              ? el('span', { className: 'badge badge-success', style: { marginLeft: '8px', fontSize: '12px' } }, '✓ Valide')
              : el('span', { className: 'badge badge-danger', style: { marginLeft: '8px', fontSize: '12px' } }, '⚠️ Doit = 100%')
          ])
        ])
      ])
    ]);

    container.appendChild(header);
    container.appendChild(table);
    container.appendChild(summary);
  }

  // Rendu initial
  recalculateTotals();
  render();

  return container;
}
