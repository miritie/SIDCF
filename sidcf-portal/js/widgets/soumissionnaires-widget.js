/**
 * Widget Soumissionnaires - Gestion complète des soumissionnaires
 *
 * Permet la saisie et la gestion des soumissionnaires avec :
 * - NCC (Numéro Compte Contribuable)
 * - Raison sociale
 * - Nature groupement (Individuel, Groupement solidaire, Groupement conjoint)
 * - Statut sanctionné (avec alerte)
 * - Informations bancaires
 *
 * Usage:
 *   import { SoumissionnairesWidget } from './widgets/soumissionnaires-widget.js';
 *   const widget = new SoumissionnairesWidget(containerId, options);
 *
 * @version 1.0.0
 */

import { dom } from '../lib/dom.js';
import { renderEntreprisePicker } from '../ui/widgets/entreprise-picker-mp.js';

const NATURE_GROUPEMENT = [
  { value: 'INDIVIDUEL', label: 'Individuel' },
  { value: 'GROUPEMENT_SOLIDAIRE', label: 'Groupement solidaire' },
  { value: 'GROUPEMENT_CONJOINT', label: 'Groupement conjoint' }
];

export class SoumissionnairesWidget {
  constructor(containerId, options = {}) {
    this.container = dom.id(containerId);
    if (!this.container) {
      throw new Error(`Container #${containerId} not found`);
    }

    this.options = {
      allowAdd: true,
      allowEdit: true,
      allowDelete: true,
      showBankInfo: true,
      showSanctionStatus: true,
      maxSoumissionnaires: 50,
      onAdd: null,
      onChange: null,
      onDelete: null,
      ...options
    };

    this.soumissionnaires = [];
    this.render();
  }

  /**
   * Charge les soumissionnaires depuis les données
   */
  loadData(soumissionnaires = []) {
    this.soumissionnaires = soumissionnaires.map((s, idx) => ({
      id: s.id || `soum_${Date.now()}_${idx}`,
      // Modif #43.b — lien vers le référentiel mp_entreprise (peut être null sur données legacy)
      entrepriseId: s.entrepriseId || null,
      ncc: s.ncc || '',
      raisonSociale: s.raisonSociale || '',
      natureGroupement: s.natureGroupement || 'INDIVIDUEL',
      sanctionne: s.sanctionne || false,
      motifSanction: s.motifSanction || '',
      banque: s.banque || '',
      numeroCompte: s.numeroCompte || '',
      estTitulaire: s.estTitulaire || false
    }));
    this.render();
  }

  /**
   * Récupère les données actuelles
   */
  getData() {
    return this.soumissionnaires;
  }

  /**
   * Rendu principal du widget
   */
  render() {
    this.container.innerHTML = '';

    const wrapper = dom.create('div', { className: 'soumissionnaires-widget' });

    // En-tête
    const header = this.renderHeader();
    wrapper.appendChild(header);

    // Liste des soumissionnaires
    const list = this.renderList();
    wrapper.appendChild(list);

    // Formulaire d'ajout (si activé)
    if (this.options.allowAdd) {
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
      textContent: `Soumissionnaires (${this.soumissionnaires.length})`
    });

    header.appendChild(title);

    if (this.soumissionnaires.some(s => s.sanctionne)) {
      const alert = dom.create('div', {
        className: 'alert alert-warning',
        innerHTML: '<strong>⚠️ Attention :</strong> Au moins un soumissionnaire est sanctionné'
      });
      header.appendChild(alert);
    }

    return header;
  }

  /**
   * Rendu de la liste des soumissionnaires
   */
  renderList() {
    const list = dom.create('div', { className: 'soumissionnaires-list' });

    if (this.soumissionnaires.length === 0) {
      const empty = dom.create('div', {
        className: 'empty-state',
        textContent: 'Aucun soumissionnaire enregistré'
      });
      list.appendChild(empty);
      return list;
    }

    this.soumissionnaires.forEach((soum, idx) => {
      const card = this.renderSoumissionnaireCard(soum, idx);
      list.appendChild(card);
    });

    return list;
  }

  /**
   * Rendu d'une carte soumissionnaire
   */
  renderSoumissionnaireCard(soum, idx) {
    const card = dom.create('div', {
      className: `soumissionnaire-card ${soum.sanctionne ? 'sanctionne' : ''} ${soum.estTitulaire ? 'titulaire' : ''}`
    });

    // Badge titulaire
    if (soum.estTitulaire) {
      const badge = dom.create('span', {
        className: 'badge badge-success',
        textContent: '🏆 Titulaire'
      });
      card.appendChild(badge);
    }

    // Badge sanctionné
    if (soum.sanctionne) {
      const badge = dom.create('span', {
        className: 'badge badge-danger',
        textContent: '⚠️ Sanctionné'
      });
      card.appendChild(badge);
    }

    // Informations principales
    const info = dom.create('div', { className: 'soum-info' });

    const ncc = dom.create('div', {
      className: 'soum-ncc',
      innerHTML: `<strong>NCC:</strong> ${soum.ncc || 'Non renseigné'}`
    });
    info.appendChild(ncc);

    const raisonSociale = dom.create('div', {
      className: 'soum-raison-sociale',
      innerHTML: `<strong>Raison sociale:</strong> ${soum.raisonSociale || 'Non renseignée'}`
    });
    info.appendChild(raisonSociale);

    const nature = dom.create('div', {
      className: 'soum-nature',
      innerHTML: `<strong>Nature:</strong> ${this.getNatureLabel(soum.natureGroupement)}`
    });
    info.appendChild(nature);

    if (this.options.showBankInfo && (soum.banque || soum.numeroCompte)) {
      const bank = dom.create('div', {
        className: 'soum-bank',
        innerHTML: `<strong>Banque:</strong> ${soum.banque} - ${soum.numeroCompte}`
      });
      info.appendChild(bank);
    }

    if (soum.sanctionne && soum.motifSanction) {
      const motif = dom.create('div', {
        className: 'soum-sanction-motif',
        innerHTML: `<strong>Motif sanction:</strong> ${soum.motifSanction}`
      });
      info.appendChild(motif);
    }

    card.appendChild(info);

    // Actions
    if (this.options.allowEdit || this.options.allowDelete) {
      const actions = dom.create('div', { className: 'soum-actions' });

      if (this.options.allowEdit) {
        const editBtn = dom.create('button', {
          type: 'button',
          className: 'btn btn-sm btn-secondary',
          textContent: 'Modifier'
        });
        editBtn.addEventListener('click', () => this.editSoumissionnaire(idx));
        actions.appendChild(editBtn);
      }

      if (this.options.allowDelete) {
        const deleteBtn = dom.create('button', {
          type: 'button',
          className: 'btn btn-sm btn-danger',
          textContent: 'Supprimer'
        });
        deleteBtn.addEventListener('click', () => this.deleteSoumissionnaire(idx));
        actions.appendChild(deleteBtn);
      }

      // Toggle titulaire
      const titulaireBtn = dom.create('button', {
        type: 'button',
        className: `btn btn-sm ${soum.estTitulaire ? 'btn-warning' : 'btn-success'}`,
        textContent: soum.estTitulaire ? 'Retirer titulaire' : 'Marquer titulaire'
      });
      titulaireBtn.addEventListener('click', () => this.toggleTitulaire(idx));
      actions.appendChild(titulaireBtn);

      card.appendChild(actions);
    }

    return card;
  }

  /**
   * Rendu du formulaire d'ajout/modification
   */
  renderForm() {
    const formContainer = dom.create('div', { className: 'soumissionnaire-form-container' });

    const formTitle = dom.create('h5', { textContent: 'Ajouter un soumissionnaire' });
    formContainer.appendChild(formTitle);

    const form = dom.create('form', { className: 'soumissionnaire-form' });

    // Modif #43.b — Picker entreprise (lookup typeahead + autofill + création inline)
    const pickerLabel = dom.create('label', { textContent: 'Identité du soumissionnaire *', className: 'form-label' });
    form.appendChild(pickerLabel);
    const pickerHost = dom.create('div', { className: 'form-group', style: 'margin-bottom: 12px;' });
    pickerHost.appendChild(renderEntreprisePicker({
      onChange: (entreprise) => {
        // Mirror vers les hidden inputs lus par FormData au submit
        const setVal = (name, val) => {
          const i = form.querySelector(`input[name="${name}"]`);
          if (i) i.value = val || '';
        };
        setVal('entrepriseId',  entreprise?.entrepriseId || '');
        setVal('ncc',           entreprise?.ncc || '');
        setVal('raisonSociale', entreprise?.raisonSociale || '');
        // Pré-remplit banque + numéro compte si renseignés sur la fiche maître
        if (entreprise?.banque?.libelle) setVal('banque', entreprise.banque.libelle);
        if (entreprise?.compte?.numero)  setVal('numeroCompte', entreprise.compte.numero);
      }
    }));
    form.appendChild(pickerHost);

    // Inputs cachés — mirorrés depuis le picker, lus par FormData au submit
    form.appendChild(dom.create('input', { type: 'hidden', name: 'entrepriseId' }));
    form.appendChild(dom.create('input', { type: 'hidden', name: 'ncc' }));
    form.appendChild(dom.create('input', { type: 'hidden', name: 'raisonSociale' }));

    // Nature groupement
    const natureGroup = dom.create('div', { className: 'form-group' });
    const natureLabel = dom.create('label', { textContent: 'Nature groupement *' });
    const natureSelect = dom.create('select', {
      name: 'natureGroupement',
      className: 'form-control',
      required: true
    });

    NATURE_GROUPEMENT.forEach(opt => {
      const option = dom.create('option', {
        value: opt.value,
        textContent: opt.label
      });
      natureSelect.appendChild(option);
    });

    natureGroup.appendChild(natureLabel);
    natureGroup.appendChild(natureSelect);
    form.appendChild(natureGroup);

    // Statut sanctionné
    if (this.options.showSanctionStatus) {
      const sanctionGroup = dom.create('div', { className: 'form-group' });
      const sanctionLabel = dom.create('label');
      const sanctionCheckbox = dom.create('input', {
        type: 'checkbox',
        name: 'sanctionne',
        id: 'sanctionne-checkbox'
      });
      sanctionLabel.appendChild(sanctionCheckbox);
      sanctionLabel.appendChild(document.createTextNode(' Soumissionnaire sanctionné'));
      sanctionGroup.appendChild(sanctionLabel);

      // Motif sanction (affiché si sanctionné)
      const motifGroup = this.createFormGroup('Motif sanction', 'text', 'motifSanction', 'Ex: Non-respect délais contractuels');
      motifGroup.style.display = 'none';
      motifGroup.dataset.conditional = 'sanctionne';

      sanctionCheckbox.addEventListener('change', (e) => {
        motifGroup.style.display = e.target.checked ? 'block' : 'none';
      });

      form.appendChild(sanctionGroup);
      form.appendChild(motifGroup);
    }

    // Informations bancaires
    if (this.options.showBankInfo) {
      const bankGroup = this.createFormGroup('Banque', 'text', 'banque', 'Ex: SGBCI');
      form.appendChild(bankGroup);

      const compteGroup = this.createFormGroup('Numéro compte', 'text', 'numeroCompte', 'Ex: CI93 SGCI 01 01 123456789012 34');
      form.appendChild(compteGroup);
    }

    // Boutons
    const btnGroup = dom.create('div', { className: 'form-group form-actions' });

    const addBtn = dom.create('button', {
      type: 'submit',
      className: 'btn btn-primary',
      textContent: 'Ajouter'
    });

    const resetBtn = dom.create('button', {
      type: 'button',
      className: 'btn btn-secondary',
      textContent: 'Réinitialiser'
    });
    resetBtn.addEventListener('click', () => form.reset());

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

    const newSoumissionnaire = {
      id: `soum_${Date.now()}`,
      // Modif #43.b — entrepriseId issu du picker (lien vers le référentiel mp_entreprise)
      entrepriseId: formData.get('entrepriseId') || null,
      ncc: formData.get('ncc'),
      raisonSociale: formData.get('raisonSociale'),
      natureGroupement: formData.get('natureGroupement'),
      sanctionne: formData.get('sanctionne') === 'on',
      motifSanction: formData.get('motifSanction') || '',
      banque: formData.get('banque') || '',
      numeroCompte: formData.get('numeroCompte') || '',
      estTitulaire: false
    };

    // Validation NCC
    if (!this.validateNCC(newSoumissionnaire.ncc)) {
      alert('Le NCC doit être au format valide (CI-XXX-YYYY-NNNNNN)');
      return;
    }

    // Vérifier doublons NCC
    if (this.soumissionnaires.some(s => s.ncc === newSoumissionnaire.ncc)) {
      alert('Un soumissionnaire avec ce NCC existe déjà');
      return;
    }

    this.soumissionnaires.push(newSoumissionnaire);
    form.reset();
    this.render();

    if (this.options.onAdd) {
      this.options.onAdd(newSoumissionnaire);
    }

    if (this.options.onChange) {
      this.options.onChange(this.soumissionnaires);
    }
  }

  /**
   * Validation du NCC
   */
  validateNCC(ncc) {
    // Format: CI-XXX-YYYY-NNNNNN
    const pattern = /^CI-[A-Z]{3}-\d{4}-\d{6,}$/;
    return pattern.test(ncc);
  }

  /**
   * Récupère le label de la nature de groupement
   */
  getNatureLabel(value) {
    const found = NATURE_GROUPEMENT.find(n => n.value === value);
    return found ? found.label : value;
  }

  /**
   * Éditer un soumissionnaire
   */
  editSoumissionnaire(idx) {
    const soum = this.soumissionnaires[idx];
    // TODO: Implémenter modal d'édition ou formulaire inline
    console.log('Edit soumissionnaire', soum);
  }

  /**
   * Supprimer un soumissionnaire
   */
  deleteSoumissionnaire(idx) {
    if (!confirm('Confirmer la suppression de ce soumissionnaire ?')) {
      return;
    }

    const deleted = this.soumissionnaires.splice(idx, 1)[0];
    this.render();

    if (this.options.onDelete) {
      this.options.onDelete(deleted);
    }

    if (this.options.onChange) {
      this.options.onChange(this.soumissionnaires);
    }
  }

  /**
   * Toggle statut titulaire
   */
  toggleTitulaire(idx) {
    // Un seul titulaire possible
    this.soumissionnaires.forEach((s, i) => {
      s.estTitulaire = (i === idx) ? !s.estTitulaire : false;
    });

    this.render();

    if (this.options.onChange) {
      this.options.onChange(this.soumissionnaires);
    }
  }

  /**
   * Valider les données
   */
  validate() {
    const errors = [];

    if (this.soumissionnaires.length === 0) {
      errors.push('Au moins un soumissionnaire est requis');
    }

    const hasTitulaire = this.soumissionnaires.some(s => s.estTitulaire);
    if (!hasTitulaire) {
      errors.push('Aucun titulaire désigné');
    }

    const sanctionnes = this.soumissionnaires.filter(s => s.sanctionne);
    if (sanctionnes.length > 0 && hasTitulaire && sanctionnes.some(s => s.estTitulaire)) {
      errors.push('Le titulaire est sanctionné - vérification requise');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Styles CSS à inclure
 */
export const SOUMISSIONNAIRES_WIDGET_STYLES = `
.soumissionnaires-widget {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.widget-header h4 {
  margin: 0 0 1rem 0;
  color: #0f5132;
}

.soumissionnaires-list {
  margin: 1rem 0;
}

.soumissionnaire-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  position: relative;
}

.soumissionnaire-card.sanctionne {
  border-left: 4px solid #dc3545;
}

.soumissionnaire-card.titulaire {
  border-left: 4px solid #198754;
  background: #f0f8f5;
}

.soumissionnaire-card .badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.soum-info > div {
  margin-bottom: 0.5rem;
}

.soum-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.soumissionnaire-form-container {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 2px dashed #0f5132;
  margin-top: 1rem;
}

.soumissionnaire-form-container h5 {
  margin: 0 0 1rem 0;
  color: #0f5132;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #0f5132;
  box-shadow: 0 0 0 0.2rem rgba(15, 81, 50, 0.25);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #0f5132;
  color: white;
}

.btn-primary:hover {
  background: #0a3d26;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-success {
  background: #198754;
  color: white;
}

.btn-success:hover {
  background: #157347;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #bb2d3b;
}

.btn-warning {
  background: #ffc107;
  color: #000;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #664d03;
}

.badge-success {
  background: #198754;
  color: white;
}

.badge-danger {
  background: #dc3545;
  color: white;
}
`;
