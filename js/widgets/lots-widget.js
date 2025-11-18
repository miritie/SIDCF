/**
 * Widget Lots - Gestion complète des lots d'un marché
 *
 * Permet la saisie et la gestion des lots avec :
 * - Objet du lot
 * - Montants HT et TTC
 * - Livrables attendus (quantitatifs et qualitatifs)
 * - Entreprises soumissionnaires par lot
 * - Délais d'exécution spécifiques
 *
 * Usage:
 *   import { LotsWidget } from './widgets/lots-widget.js';
 *   const widget = new LotsWidget(containerId, options);
 *
 * @version 1.0.0
 */

import { dom } from '../lib/dom.js';

export class LotsWidget {
  constructor(containerId, options = {}) {
    this.container = dom.id(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} not found`);
    }

    this.options = {
      allowAdd: true,
      allowEdit: true,
      allowDelete: true,
      showLivrables: true,
      showSoumissionnaires: true,
      maxLots: 20,
      tva: 18, // Taux TVA par défaut en Côte d'Ivoire
      onAdd: null,
      onChange: null,
      onDelete: null,
      ...options
    };

    this.lots = [];
    this.soumissionnaires = options.soumissionnaires || []; // Liste des soumissionnaires disponibles
    this.render();
  }

  /**
   * Charge les lots depuis les données
   */
  loadData(lots = []) {
    this.lots = lots.map((lot, idx) => ({
      id: lot.id || `lot_${Date.now()}_${idx}`,
      numero: lot.numero || idx + 1,
      objet: lot.objet || '',
      montantHT: parseFloat(lot.montantHT) || 0,
      montantTTC: parseFloat(lot.montantTTC) || 0,
      delaiExecution: lot.delaiExecution || '',
      livrables: lot.livrables || [],
      soumissionnairesLot: lot.soumissionnairesLot || [],
      observations: lot.observations || ''
    }));
    this.render();
  }

  /**
   * Met à jour la liste des soumissionnaires disponibles
   */
  setSoumissionnaires(soumissionnaires) {
    this.soumissionnaires = soumissionnaires;
    this.render();
  }

  /**
   * Récupère les données actuelles
   */
  getData() {
    return this.lots;
  }

  /**
   * Calcule le montant total HT
   */
  getTotalHT() {
    return this.lots.reduce((sum, lot) => sum + lot.montantHT, 0);
  }

  /**
   * Calcule le montant total TTC
   */
  getTotalTTC() {
    return this.lots.reduce((sum, lot) => sum + lot.montantTTC, 0);
  }

  /**
   * Rendu principal du widget
   */
  render() {
    this.container.innerHTML = '';

    const wrapper = dom.create('div', { className: 'lots-widget' });

    // En-tête
    const header = this.renderHeader();
    wrapper.appendChild(header);

    // Liste des lots
    const list = this.renderList();
    wrapper.appendChild(list);

    // Formulaire d'ajout (si activé)
    if (this.options.allowAdd && this.lots.length < this.options.maxLots) {
      const form = this.renderForm();
      wrapper.appendChild(form);
    }

    this.container.appendChild(wrapper);
  }

  /**
   * Rendu de l'en-tête
   */
  renderHeader() {
    const header = dom.create('div', { className: 'widget-header' });

    const title = dom.create('h4', {
      textContent: `Lots du marché (${this.lots.length})`
    });

    header.appendChild(title);

    if (this.lots.length > 0) {
      const summary = dom.create('div', { className: 'lots-summary' });
      summary.innerHTML = `
        <div><strong>Total HT:</strong> ${this.formatCurrency(this.getTotalHT())}</div>
        <div><strong>Total TTC:</strong> ${this.formatCurrency(this.getTotalTTC())}</div>
      `;
      header.appendChild(summary);
    }

    return header;
  }

  /**
   * Rendu de la liste des lots
   */
  renderList() {
    const list = dom.create('div', { className: 'lots-list' });

    if (this.lots.length === 0) {
      const empty = dom.create('div', {
        className: 'empty-state',
        textContent: 'Aucun lot défini'
      });
      list.appendChild(empty);
      return list;
    }

    this.lots.forEach((lot, idx) => {
      const card = this.renderLotCard(lot, idx);
      list.appendChild(card);
    });

    return list;
  }

  /**
   * Rendu d'une carte lot
   */
  renderLotCard(lot, idx) {
    const card = dom.create('div', { className: 'lot-card' });

    // En-tête du lot
    const cardHeader = dom.create('div', { className: 'lot-card-header' });
    cardHeader.innerHTML = `
      <strong>Lot ${lot.numero}</strong>
      <span class="lot-montant">${this.formatCurrency(lot.montantTTC)}</span>
    `;
    card.appendChild(cardHeader);

    // Corps du lot
    const cardBody = dom.create('div', { className: 'lot-card-body' });

    // Objet
    const objet = dom.create('div', {
      className: 'lot-objet',
      innerHTML: `<strong>Objet:</strong> ${lot.objet || 'Non renseigné'}`
    });
    cardBody.appendChild(objet);

    // Montants
    const montants = dom.create('div', { className: 'lot-montants' });
    montants.innerHTML = `
      <div><strong>Montant HT:</strong> ${this.formatCurrency(lot.montantHT)}</div>
      <div><strong>Montant TTC:</strong> ${this.formatCurrency(lot.montantTTC)}</div>
    `;
    cardBody.appendChild(montants);

    // Délai
    if (lot.delaiExecution) {
      const delai = dom.create('div', {
        className: 'lot-delai',
        innerHTML: `<strong>Délai d'exécution:</strong> ${lot.delaiExecution}`
      });
      cardBody.appendChild(delai);
    }

    // Livrables
    if (this.options.showLivrables && lot.livrables.length > 0) {
      const livrables = dom.create('div', { className: 'lot-livrables' });
      const livrablesTitle = dom.create('strong', { textContent: 'Livrables attendus:' });
      livrables.appendChild(livrablesTitle);

      const livrablesList = dom.create('ul', { className: 'livrables-list' });
      lot.livrables.forEach(livrable => {
        const li = dom.create('li');
        li.innerHTML = `${livrable.description} <em>(Quantité: ${livrable.quantite}, Unité: ${livrable.unite})</em>`;
        livrablesList.appendChild(li);
      });
      livrables.appendChild(livrablesList);
      cardBody.appendChild(livrables);
    }

    // Soumissionnaires du lot
    if (this.options.showSoumissionnaires && lot.soumissionnairesLot.length > 0) {
      const soums = dom.create('div', { className: 'lot-soumissionnaires' });
      const soumsTitle = dom.create('strong', { textContent: 'Soumissionnaires:' });
      soums.appendChild(soumsTitle);

      const soumsList = dom.create('ul', { className: 'soums-list' });
      lot.soumissionnairesLot.forEach(ncc => {
        const soum = this.soumissionnaires.find(s => s.ncc === ncc);
        const li = dom.create('li', {
          textContent: soum ? `${soum.raisonSociale} (${ncc})` : ncc
        });
        soumsList.appendChild(li);
      });
      soums.appendChild(soumsList);
      cardBody.appendChild(soums);
    }

    // Observations
    if (lot.observations) {
      const obs = dom.create('div', {
        className: 'lot-observations',
        innerHTML: `<strong>Observations:</strong> ${lot.observations}`
      });
      cardBody.appendChild(obs);
    }

    card.appendChild(cardBody);

    // Actions
    if (this.options.allowEdit || this.options.allowDelete) {
      const actions = dom.create('div', { className: 'lot-actions' });

      if (this.options.allowEdit) {
        const editBtn = dom.create('button', {
          type: 'button',
          className: 'btn btn-sm btn-secondary',
          textContent: 'Modifier'
        });
        editBtn.addEventListener('click', () => this.editLot(idx));
        actions.appendChild(editBtn);

        const livrablesBtn = dom.create('button', {
          type: 'button',
          className: 'btn btn-sm btn-info',
          textContent: 'Livrables'
        });
        livrablesBtn.addEventListener('click', () => this.manageLivrables(idx));
        actions.appendChild(livrablesBtn);
      }

      if (this.options.allowDelete) {
        const deleteBtn = dom.create('button', {
          type: 'button',
          className: 'btn btn-sm btn-danger',
          textContent: 'Supprimer'
        });
        deleteBtn.addEventListener('click', () => this.deleteLot(idx));
        actions.appendChild(deleteBtn);
      }

      card.appendChild(actions);
    }

    return card;
  }

  /**
   * Rendu du formulaire d'ajout/modification
   */
  renderForm() {
    const formContainer = dom.create('div', { className: 'lot-form-container' });

    const formTitle = dom.create('h5', { textContent: 'Ajouter un lot' });
    formContainer.appendChild(formTitle);

    const form = dom.create('form', { className: 'lot-form' });

    // Numéro du lot
    const numeroGroup = this.createFormGroup('Numéro du lot *', 'number', 'numero', '1');
    const numeroInput = numeroGroup.querySelector('input');
    numeroInput.value = this.lots.length + 1;
    numeroInput.min = 1;
    form.appendChild(numeroGroup);

    // Objet
    const objetGroup = dom.create('div', { className: 'form-group' });
    const objetLabel = dom.create('label', { textContent: 'Objet du lot *' });
    const objetTextarea = dom.create('textarea', {
      name: 'objet',
      className: 'form-control',
      placeholder: 'Ex: Construction de bâtiments administratifs',
      rows: 3,
      required: true
    });
    objetGroup.appendChild(objetLabel);
    objetGroup.appendChild(objetTextarea);
    form.appendChild(objetGroup);

    // Montant HT
    const montantHTGroup = this.createFormGroup('Montant HT (XOF) *', 'number', 'montantHT', '0');
    const montantHTInput = montantHTGroup.querySelector('input');
    montantHTInput.step = '0.01';
    montantHTInput.min = '0';
    montantHTInput.addEventListener('input', () => this.calculateTTC(form));
    form.appendChild(montantHTGroup);

    // Montant TTC (calculé automatiquement)
    const montantTTCGroup = this.createFormGroup('Montant TTC (XOF) *', 'number', 'montantTTC', '0');
    const montantTTCInput = montantTTCGroup.querySelector('input');
    montantTTCInput.step = '0.01';
    montantTTCInput.min = '0';
    montantTTCInput.readOnly = true;
    montantTTCInput.style.background = '#e9ecef';
    form.appendChild(montantTTCGroup);

    // Délai d'exécution
    const delaiGroup = this.createFormGroup('Délai d\'exécution', 'text', 'delaiExecution', 'Ex: 12 mois');
    form.appendChild(delaiGroup);

    // Observations
    const obsGroup = dom.create('div', { className: 'form-group' });
    const obsLabel = dom.create('label', { textContent: 'Observations' });
    const obsTextarea = dom.create('textarea', {
      name: 'observations',
      className: 'form-control',
      placeholder: 'Observations particulières sur ce lot',
      rows: 2
    });
    obsGroup.appendChild(obsLabel);
    obsGroup.appendChild(obsTextarea);
    form.appendChild(obsGroup);

    // Boutons
    const btnGroup = dom.create('div', { className: 'form-group form-actions' });

    const addBtn = dom.create('button', {
      type: 'submit',
      className: 'btn btn-primary',
      textContent: 'Ajouter le lot'
    });

    const resetBtn = dom.create('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: 'Réinitialiser'
    });
    resetBtn.addEventListener('click', () => {
      form.reset();
      numeroInput.value = this.lots.length + 1;
    });

    btnGroup.appendChild(addBtn);
    btnGroup.appendChild(resetBtn);
    form.appendChild(btnGroup);

    // Submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(form);
    });

    formContainer.appendChild(form);
    return formContainer;
  }

  /**
   * Calcule automatiquement le montant TTC à partir du HT
   */
  calculateTTC(form) {
    const montantHT = parseFloat(form.montantHT.value) || 0;
    const montantTTC = montantHT * (1 + this.options.tva / 100);
    form.montantTTC.value = montantTTC.toFixed(2);
  }

  /**
   * Crée un groupe de formulaire
   */
  createFormGroup(label, type, name, placeholder = '') {
    const group = dom.create('div', { className: 'form-group' });
    const labelEl = dom.create('label', { textContent: label });
    const input = dom.create('input', {
      type,
      name,
      className: 'form-control',
      placeholder
    });

    if (label.includes('*')) {
      input.required = true;
    }

    group.appendChild(labelEl);
    group.appendChild(input);
    return group;
  }

  /**
   * Gestion de la soumission du formulaire
   */
  handleFormSubmit(form) {
    const formData = new FormData(form);

    const newLot = {
      id: `lot_${Date.now()}`,
      numero: parseInt(formData.get('numero')),
      objet: formData.get('objet'),
      montantHT: parseFloat(formData.get('montantHT')),
      montantTTC: parseFloat(formData.get('montantTTC')),
      delaiExecution: formData.get('delaiExecution') || '',
      observations: formData.get('observations') || '',
      livrables: [],
      soumissionnairesLot: []
    };

    // Validation
    if (newLot.montantHT <= 0) {
      alert('Le montant HT doit être supérieur à 0');
      return;
    }

    // Vérifier numéro unique
    if (this.lots.some(l => l.numero === newLot.numero)) {
      alert(`Un lot avec le numéro ${newLot.numero} existe déjà`);
      return;
    }

    this.lots.push(newLot);
    this.lots.sort((a, b) => a.numero - b.numero);

    form.reset();
    form.numero.value = this.lots.length + 1;
    this.render();

    if (this.options.onAdd) {
      this.options.onAdd(newLot);
    }

    if (this.options.onChange) {
      this.options.onChange(this.lots);
    }
  }

  /**
   * Éditer un lot
   */
  editLot(idx) {
    const lot = this.lots[idx];
    // TODO: Implémenter modal d'édition ou formulaire inline
    console.log('Edit lot', lot);
  }

  /**
   * Gérer les livrables d'un lot
   */
  manageLivrables(idx) {
    const lot = this.lots[idx];

    // Créer modal pour gérer les livrables
    const modal = this.createLivrablesModal(lot, idx);
    document.body.appendChild(modal);
  }

  /**
   * Crée une modal pour gérer les livrables
   */
  createLivrablesModal(lot, lotIdx) {
    const modal = dom.create('div', { className: 'modal-overlay' });

    const modalContent = dom.create('div', { className: 'modal-content' });

    const modalHeader = dom.create('div', { className: 'modal-header' });
    modalHeader.innerHTML = `<h5>Livrables - Lot ${lot.numero}</h5>`;
    modalContent.appendChild(modalHeader);

    const modalBody = dom.create('div', { className: 'modal-body' });

    // Liste des livrables existants
    if (lot.livrables.length > 0) {
      const list = dom.create('ul', { className: 'livrables-edit-list' });
      lot.livrables.forEach((livrable, livrIdx) => {
        const li = dom.create('li');
        li.innerHTML = `
          <strong>${livrable.description}</strong>
          <span>Quantité: ${livrable.quantite} ${livrable.unite}</span>
        `;
        const deleteBtn = dom.create('button', {
          type: 'button',
          className: 'btn btn-sm btn-danger',
          textContent: 'Supprimer'
        });
        deleteBtn.addEventListener('click', () => {
          lot.livrables.splice(livrIdx, 1);
          modal.remove();
          this.manageLivrables(lotIdx);
        });
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });
      modalBody.appendChild(list);
    } else {
      const empty = dom.create('p', {
        textContent: 'Aucun livrable défini',
        style: 'color: #6c757d; font-style: italic;'
      });
      modalBody.appendChild(empty);
    }

    // Formulaire d'ajout de livrable
    const form = dom.create('form', { className: 'livrable-form' });

    const descGroup = dom.create('div', { className: 'form-group' });
    descGroup.innerHTML = `
      <label>Description du livrable *</label>
      <input type="text" name="description" class="form-control" placeholder="Ex: Bâtiment administratif R+2" required>
    `;
    form.appendChild(descGroup);

    const qteGroup = dom.create('div', { className: 'form-row' });
    qteGroup.innerHTML = `
      <div class="form-group" style="flex: 1;">
        <label>Quantité *</label>
        <input type="number" name="quantite" class="form-control" placeholder="1" min="0" step="0.01" required>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Unité *</label>
        <input type="text" name="unite" class="form-control" placeholder="m², km, unité" required>
      </div>
    `;
    form.appendChild(qteGroup);

    const addBtn = dom.create('button', {
      type: 'submit',
      className: 'btn btn-primary',
      textContent: 'Ajouter le livrable'
    });
    form.appendChild(addBtn);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const newLivrable = {
        description: formData.get('description'),
        quantite: parseFloat(formData.get('quantite')),
        unite: formData.get('unite')
      };
      lot.livrables.push(newLivrable);
      modal.remove();
      this.manageLivrables(lotIdx);

      if (this.options.onChange) {
        this.options.onChange(this.lots);
      }
    });

    modalBody.appendChild(form);
    modalContent.appendChild(modalBody);

    const modalFooter = dom.create('div', { className: 'modal-footer' });
    const closeBtn = dom.create('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: 'Fermer'
    });
    closeBtn.addEventListener('click', () => {
      modal.remove();
      this.render();
    });
    modalFooter.appendChild(closeBtn);
    modalContent.appendChild(modalFooter);

    modal.appendChild(modalContent);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        this.render();
      }
    });

    return modal;
  }

  /**
   * Supprimer un lot
   */
  deleteLot(idx) {
    if (!confirm('Confirmer la suppression de ce lot ?')) {
      return;
    }

    const deleted = this.lots.splice(idx, 1)[0];
    this.render();

    if (this.options.onDelete) {
      this.options.onDelete(deleted);
    }

    if (this.options.onChange) {
      this.options.onChange(this.lots);
    }
  }

  /**
   * Formater un montant en devise
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Valider les données
   */
  validate() {
    const errors = [];

    if (this.lots.length === 0) {
      errors.push('Au moins un lot est requis');
    }

    this.lots.forEach((lot, idx) => {
      if (!lot.objet || lot.objet.trim() === '') {
        errors.push(`Lot ${lot.numero}: Objet manquant`);
      }
      if (lot.montantHT <= 0) {
        errors.push(`Lot ${lot.numero}: Montant HT invalide`);
      }
      if (lot.livrables.length === 0) {
        errors.push(`Lot ${lot.numero}: Aucun livrable défini`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Styles CSS à inclure
 */
export const LOTS_WIDGET_STYLES = `
.lots-widget {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.widget-header h4 {
  margin: 0 0 1rem 0;
  color: #0f5132;
}

.lots-summary {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  display: flex;
  gap: 2rem;
  margin-top: 0.5rem;
}

.lots-summary > div {
  font-size: 0.95rem;
}

.lots-list {
  margin: 1rem 0;
}

.lot-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  overflow: hidden;
}

.lot-card-header {
  background: linear-gradient(135deg, #0f5132 0%, #198754 100%);
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lot-montant {
  font-size: 1.1rem;
  font-weight: bold;
}

.lot-card-body {
  padding: 1rem;
}

.lot-card-body > div {
  margin-bottom: 0.75rem;
}

.lot-montants {
  display: flex;
  gap: 2rem;
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
}

.lot-livrables, .lot-soumissionnaires {
  border-top: 1px solid #dee2e6;
  padding-top: 0.75rem;
}

.livrables-list, .soums-list {
  margin: 0.5rem 0 0 1.5rem;
}

.livrables-list li, .soums-list li {
  margin-bottom: 0.25rem;
}

.lot-actions {
  padding: 0.75rem 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  gap: 0.5rem;
  background: #f8f9fa;
}

.lot-form-container {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 2px dashed #0f5132;
  margin-top: 1rem;
}

.lot-form-container h5 {
  margin: 0 0 1rem 0;
  color: #0f5132;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h5 {
  margin: 0;
  color: #0f5132;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.livrables-edit-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
}

.livrables-edit-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.livrables-edit-list li span {
  color: #6c757d;
  font-size: 0.9rem;
}

.livrable-form {
  border-top: 2px dashed #0f5132;
  padding-top: 1rem;
}

.btn-info {
  background: #0dcaf0;
  color: #000;
}

.btn-info:hover {
  background: #0aa2c0;
}
`;
