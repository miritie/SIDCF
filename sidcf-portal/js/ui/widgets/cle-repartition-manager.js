/**
 * Widget de gestion de la Clé de Répartition multi-bailleurs
 * Permet de définir les contributions de plusieurs bailleurs sur un marché
 * avec support de la TVA État (18%)
 */

import { el } from '../../lib/dom.js';
import logger from '../../lib/logger.js';

/**
 * @param {Array} cleRepartition - Liste des lignes de répartition existantes
 * @param {Number} montantMarcheHT - Montant HT du marché (pour calcul %)
 * @param {Number} montantMarcheTTC - Montant TTC du marché (pour calcul %)
 * @param {Object} registries - Référentiels (BAILLEUR, TYPE_FINANCEMENT, NATURE_ECO, BASE_CALCUL_CLE)
 * @param {Function} onChange - Callback appelé quand la liste change: onChange(cleRepartitionList)
 * @returns {HTMLElement}
 */
export function renderCleRepartitionManager(
  cleRepartition = [],
  montantMarcheHT = 0,
  montantMarcheTTC = 0,
  registries = {},
  onChange = null
) {
  const container = el('div', { className: 'cle-repartition-manager' });

  let currentCle = [...cleRepartition];
  let etatSupporteTVA = currentCle.some(ligne => ligne.isTVAEtat === true);

  // Fonction pour notifier le parent
  function notifyChange() {
    if (onChange) {
      onChange([...currentCle]);
    }
  }

  // Fonction pour calculer le pourcentage d'une ligne
  function calculatePourcentage(ligne) {
    const montantBase = ligne.baseCalc === 'TTC' ? montantMarcheTTC : montantMarcheHT;
    if (montantBase === 0) return 0;
    return parseFloat(((ligne.montant / montantBase) * 100).toFixed(2));
  }

  // Fonction pour recalculer tous les pourcentages
  function recalculatePourcentages() {
    currentCle = currentCle.map(ligne => ({
      ...ligne,
      pourcentage: calculatePourcentage(ligne)
    }));
  }

  // Fonction pour ajouter la ligne TVA État (18% du TTC)
  function addTVAEtatLine() {
    const montantTVA = parseFloat((montantMarcheTTC * 0.18).toFixed(2));
    const ligneTVA = {
      annee: new Date().getFullYear(),
      bailleur: 'ETAT_CI',
      typeFinancement: 'ETAT',
      natureEco: 'TVA',
      baseCalc: 'TTC',
      etatSupporteTVA: true,
      isTVAEtat: true, // flag pour identifier cette ligne
      montant: montantTVA,
      montantTVAEtat: montantTVA,
      pourcentage: 18
    };
    currentCle.push(ligneTVA);
    recalculatePourcentages();
    notifyChange();
  }

  // Fonction pour retirer la ligne TVA État
  function removeTVAEtatLine() {
    currentCle = currentCle.filter(ligne => !ligne.isTVAEtat);
    recalculatePourcentages();
    notifyChange();
  }

  // Fonction pour ouvrir le formulaire d'ajout/édition
  function openLineForm(ligne = null, mode = 'add', index = null) {
    const modal = el('div', { className: 'modal-overlay' });
    const modalContent = el('div', { className: 'modal-content', style: { maxWidth: '600px' } });

    const formData = ligne ? { ...ligne } : {
      annee: new Date().getFullYear(),
      bailleur: '',
      typeFinancement: '',
      natureEco: '',
      baseCalc: 'HT',
      etatSupporteTVA: false,
      montant: 0,
      montantTVAEtat: 0,
      pourcentage: 0
    };

    const form = el('form', { id: 'cle-ligne-form' }, [
      // Header
      el('div', { className: 'modal-header' }, [
        el('h3', { className: 'modal-title' }, mode === 'add' ? '➕ Ajouter une ligne' : '✏️ Modifier la ligne'),
        el('button', {
          type: 'button',
          className: 'btn-close',
          onclick: () => modal.remove()
        }, '✕')
      ]),

      // Body
      el('div', { className: 'modal-body' }, [
        // Année
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Année', el('span', { className: 'required' }, '*')]),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'ligne-annee',
            value: formData.annee,
            required: true,
            min: 2020,
            max: 2050
          })
        ]),

        // Bailleur
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Bailleur', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'ligne-bailleur', required: true }, [
            el('option', { value: '' }, '-- Sélectionner un bailleur --'),
            ...(registries.BAILLEUR || []).map(b =>
              el('option', { value: b.code, selected: b.code === formData.bailleur }, b.label)
            )
          ])
        ]),

        // Type de financement
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Type de financement', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'ligne-type-financement', required: true }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.TYPE_FINANCEMENT || []).map(t =>
              el('option', { value: t.code, selected: t.code === formData.typeFinancement }, t.label)
            )
          ])
        ]),

        // Nature économique
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Nature économique', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'ligne-nature-eco', required: true }, [
            el('option', { value: '' }, '-- Sélectionner --'),
            ...(registries.NATURE_ECO || []).map(n =>
              el('option', { value: n.code, selected: n.code === formData.natureEco }, n.label)
            )
          ])
        ]),

        // Base de calcul
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Base de calcul', el('span', { className: 'required' }, '*')]),
          el('select', { className: 'form-input', id: 'ligne-base-calc', required: true }, [
            ...(registries.BASE_CALCUL_CLE || []).map(b =>
              el('option', { value: b.code, selected: b.code === formData.baseCalc }, b.label)
            )
          ]),
          el('small', { className: 'text-muted' }, 'Base sur laquelle sera calculé le pourcentage')
        ]),

        // Montant
        el('div', { className: 'form-field' }, [
          el('label', { className: 'form-label' }, ['Montant (XOF)', el('span', { className: 'required' }, '*')]),
          el('input', {
            type: 'number',
            className: 'form-input',
            id: 'ligne-montant',
            value: formData.montant,
            required: true,
            min: 0,
            step: 0.01
          }),
          el('small', { className: 'text-muted', id: 'ligne-pourcentage-preview' }, 'Pourcentage : 0%')
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
    const montantInput = form.querySelector('#ligne-montant');
    const baseCalcSelect = form.querySelector('#ligne-base-calc');
    const pourcentagePreview = form.querySelector('#ligne-pourcentage-preview');

    function updatePourcentagePreview() {
      const montant = parseFloat(montantInput.value) || 0;
      const baseCalc = baseCalcSelect.value;
      const montantBase = baseCalc === 'TTC' ? montantMarcheTTC : montantMarcheHT;

      if (montantBase === 0) {
        pourcentagePreview.textContent = 'Pourcentage : 0% (montant marché non défini)';
        return;
      }

      const pourcent = ((montant / montantBase) * 100).toFixed(2);
      pourcentagePreview.textContent = `Pourcentage : ${pourcent}% (base: ${baseCalc})`;
    }

    montantInput.addEventListener('input', updatePourcentagePreview);
    baseCalcSelect.addEventListener('change', updatePourcentagePreview);
    updatePourcentagePreview();

    // Soumission du formulaire
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const newLigne = {
        annee: parseInt(document.getElementById('ligne-annee').value),
        bailleur: document.getElementById('ligne-bailleur').value,
        typeFinancement: document.getElementById('ligne-type-financement').value,
        natureEco: document.getElementById('ligne-nature-eco').value,
        baseCalc: document.getElementById('ligne-base-calc').value,
        etatSupporteTVA: false,
        isTVAEtat: false,
        montant: parseFloat(document.getElementById('ligne-montant').value),
        montantTVAEtat: 0,
        pourcentage: 0
      };

      // Calculer le pourcentage
      newLigne.pourcentage = calculatePourcentage(newLigne);

      if (mode === 'add') {
        currentCle.push(newLigne);
        logger.info('[Clé Répartition] Ligne ajoutée', newLigne);
      } else {
        currentCle[index] = newLigne;
        logger.info('[Clé Répartition] Ligne modifiée', newLigne);
      }

      recalculatePourcentages();
      notifyChange();
      render();
      modal.remove();
    });

    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  // Fonction pour supprimer une ligne
  function deleteLine(index) {
    const ligne = currentCle[index];

    if (ligne.isTVAEtat) {
      alert('⚠️ Impossible de supprimer directement la ligne TVA État. Décochez la case "État supporte TVA" pour la retirer.');
      return;
    }

    if (confirm(`Supprimer la ligne "${ligne.bailleur}" (${ligne.montant} XOF) ?`)) {
      currentCle.splice(index, 1);
      recalculatePourcentages();
      notifyChange();
      render();
      logger.info('[Clé Répartition] Ligne supprimée', ligne);
    }
  }

  // Fonction de rendu principal
  function render() {
    container.innerHTML = '';

    // Header avec checkbox TVA État
    const header = el('div', { className: 'cle-repartition-header', style: { marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } }, [
        el('label', { className: 'form-label', style: { margin: 0, display: 'flex', alignItems: 'center', gap: '8px' } }, [
          el('input', {
            type: 'checkbox',
            id: 'etat-supporte-tva',
            checked: etatSupporteTVA,
            onchange: (e) => {
              etatSupporteTVA = e.target.checked;
              if (etatSupporteTVA) {
                addTVAEtatLine();
              } else {
                removeTVAEtatLine();
              }
              render();
            }
          }),
          el('span', {}, 'État supporte la TVA (18%)')
        ]),
        el('small', { className: 'text-muted' }, 'Ajoute automatiquement une ligne TVA État = 18% du TTC')
      ]),

      el('button', {
        type: 'button',
        className: 'btn btn-primary btn-sm',
        onclick: () => openLineForm(null, 'add')
      }, '➕ Ajouter une ligne')
    ]);

    // Tableau des lignes
    const table = el('table', { className: 'table', style: { width: '100%', marginBottom: '16px' } }, [
      el('thead', {}, [
        el('tr', {}, [
          el('th', {}, 'Année'),
          el('th', {}, 'Bailleur'),
          el('th', {}, 'Type Financement'),
          el('th', {}, 'Nature Éco.'),
          el('th', {}, 'Base'),
          el('th', { style: { textAlign: 'right' } }, 'Montant (XOF)'),
          el('th', { style: { textAlign: 'right' } }, 'Pourcentage (%)'),
          el('th', { style: { textAlign: 'center' } }, 'Actions')
        ])
      ]),
      el('tbody', {},
        currentCle.length === 0
          ? [el('tr', {}, [
              el('td', { colspan: 8, style: { textAlign: 'center', padding: '24px' } },
                el('span', { className: 'text-muted' }, '📊 Aucune ligne de répartition définie')
              )
            ])]
          : currentCle.map((ligne, index) => {
              const bailleurLabel = (registries.BAILLEUR || []).find(b => b.code === ligne.bailleur)?.label || ligne.bailleur;
              const typeFinLabel = (registries.TYPE_FINANCEMENT || []).find(t => t.code === ligne.typeFinancement)?.label || ligne.typeFinancement;
              const natureEcoLabel = (registries.NATURE_ECO || []).find(n => n.code === ligne.natureEco)?.label || ligne.natureEco;
              const baseCalcLabel = (registries.BASE_CALCUL_CLE || []).find(b => b.code === ligne.baseCalc)?.label || ligne.baseCalc;

              const rowStyle = ligne.isTVAEtat ? { backgroundColor: '#fff3cd' } : {};

              return el('tr', { style: rowStyle }, [
                el('td', {}, ligne.annee.toString()),
                el('td', {}, [
                  el('span', { className: 'badge badge-info' }, bailleurLabel),
                  ligne.isTVAEtat ? el('span', { className: 'badge badge-warning', style: { marginLeft: '4px' } }, 'TVA État') : null
                ]),
                el('td', {}, el('span', { className: 'text-small' }, typeFinLabel)),
                el('td', {}, el('span', { className: 'text-small' }, natureEcoLabel)),
                el('td', {}, el('span', { className: 'badge badge-secondary' }, baseCalcLabel)),
                el('td', { style: { textAlign: 'right', fontWeight: 'bold' } }, ligne.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })),
                el('td', { style: { textAlign: 'right', fontWeight: 'bold' } }, `${ligne.pourcentage.toFixed(2)}%`),
                el('td', { style: { textAlign: 'center' } }, [
                  ligne.isTVAEtat
                    ? el('span', { className: 'text-muted text-small' }, 'Auto')
                    : el('div', { style: { display: 'flex', gap: '4px', justifyContent: 'center' } }, [
                        el('button', {
                          type: 'button',
                          className: 'btn btn-sm btn-secondary',
                          onclick: () => openLineForm(ligne, 'edit', index)
                        }, '✏️'),
                        el('button', {
                          type: 'button',
                          className: 'btn btn-sm btn-danger',
                          onclick: () => deleteLine(index)
                        }, '🗑️')
                      ])
                ])
              ]);
            })
      )
    ]);

    // Ligne de total et validation
    const totalMontant = currentCle.reduce((sum, ligne) => sum + ligne.montant, 0);
    const totalPourcent = currentCle.reduce((sum, ligne) => sum + ligne.pourcentage, 0);
    const isValid = Math.abs(totalPourcent - 100) < 0.01; // tolérance de 0.01%

    const summary = el('div', { className: 'cle-repartition-summary', style: { padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' } }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' } }, [
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Montant marché HT'),
          el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, montantMarcheHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' XOF')
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Montant marché TTC'),
          el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, montantMarcheTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' XOF')
        ]),
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Nombre de lignes'),
          el('div', { style: { fontSize: '18px', fontWeight: 'bold' } }, currentCle.length.toString())
        ])
      ]),

      el('hr', { style: { margin: '12px 0' } }),

      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
        el('div', {}, [
          el('div', { className: 'text-small text-muted' }, 'Total contributions'),
          el('div', { style: { fontSize: '20px', fontWeight: 'bold', color: '#0066cc' } }, totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' XOF')
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
            totalPourcent.toFixed(2) + '%',
            isValid
              ? el('span', { className: 'badge badge-success', style: { marginLeft: '8px' } }, '✓ Valide')
              : el('span', { className: 'badge badge-danger', style: { marginLeft: '8px' } }, '⚠️ Doit = 100%')
          ])
        ])
      ])
    ]);

    container.appendChild(header);
    container.appendChild(table);
    container.appendChild(summary);
  }

  // Rendu initial
  render();

  return container;
}
