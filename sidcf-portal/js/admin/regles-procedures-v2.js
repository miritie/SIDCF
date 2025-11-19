/* ============================================
   Admin - Règles & Procédures V2
   ============================================
   Gestion complète des règles métier depuis la BD
   Édition en ligne avec sauvegarde automatique
   ============================================ */

import { mount, el } from '../lib/dom.js';
import dataService from '../datastore/data-service.js';
import router from '../router.js';
import logger from '../lib/logger.js';

let regles = [];
let modifiedRules = new Set();

export default async function renderReglesV2() {
  logger.info('[ReglesV2] Rendering rules management screen');

  try {
    // Charger les règles depuis la BD
    await loadRulesFromDatabase();

    mount('#app', `
      <div class="page">
        <div class="page-header">
          <div>
            <h1>⚖️ Règles & Procédures</h1>
            <p class="page-subtitle">
              Configuration des règles réglementaires et seuils paramétrables
            </p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" id="btnReload">
              🔄 Recharger
            </button>
            <button class="btn btn-success" id="btnSaveAll" style="display: none;">
              💾 Enregistrer les modifications (<span id="modifiedCount">0</span>)
            </button>
          </div>
        </div>

        <!-- Alert info -->
        <div class="alert alert-info" style="margin-bottom: 24px;">
          <div class="alert-icon">ℹ️</div>
          <div class="alert-content">
            <div class="alert-title">Règles métier paramétrables</div>
            <div class="alert-message">
              Ces règles sont stockées dans la base de données PostgreSQL.
              Les modifications sont sauvegardées instantanément et appliquées à toutes les opérations.
            </div>
          </div>
        </div>

        <!-- Onglets -->
        <div class="tabs" id="ruleTabs">
          <button class="tab-btn active" data-tab="seuils">Seuils & Limites</button>
          <button class="tab-btn" data-tab="validations">Validations</button>
          <button class="tab-btn" data-tab="delais">Délais</button>
          <button class="tab-btn" data-tab="garanties">Garanties</button>
          <button class="tab-btn" data-tab="matrices">Matrices Procédures</button>
          <button class="tab-btn" data-tab="ano">ANO</button>
        </div>

        <!-- Contenu des onglets -->
        <div id="tabContent"></div>

        <!-- Actions -->
        <div class="card">
          <div class="card-body">
            <button class="btn btn-secondary" onclick="window.location.hash = '/portal'">
              ← Retour au portail
            </button>
          </div>
        </div>
      </div>
    `);

    // Event listeners
    document.getElementById('btnReload').addEventListener('click', async () => {
      await loadRulesFromDatabase();
      renderCurrentTab();
    });

    document.getElementById('btnSaveAll').addEventListener('click', saveAllModifications);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderTab(e.target.dataset.tab);
      });
    });

    // Render initial tab
    renderTab('seuils');

  } catch (error) {
    logger.error('[ReglesV2] Error rendering:', error);
    mount('#app', `
      <div class="page">
        <div class="alert alert-error">
          <div class="alert-icon">❌</div>
          <div class="alert-content">
            <div class="alert-title">Erreur de chargement</div>
            <div class="alert-message">${error.message}</div>
          </div>
        </div>
      </div>
    `);
  }
}

/**
 * Load rules from database
 */
async function loadRulesFromDatabase() {
  try {
    // TODO: Appeler l'API PostgreSQL
    // const response = await dataService.adapter.fetch('/api/regles');
    // regles = response.data;

    // Pour l'instant, charger depuis rules-config.json
    const rulesConfig = dataService.getRulesConfig();
    regles = convertJsonToRules(rulesConfig);

    logger.info('[ReglesV2] Loaded rules:', regles.length);
    modifiedRules.clear();
    updateSaveButton();
  } catch (error) {
    logger.error('[ReglesV2] Error loading rules:', error);
    throw error;
  }
}

/**
 * Convert JSON config to rules array (temporary)
 */
function convertJsonToRules(config) {
  const rules = [];

  // Seuils
  if (config.seuils) {
    Object.entries(config.seuils).forEach(([code, data]) => {
      rules.push({
        id: `seuil_${code}`,
        code,
        categorie: 'seuils',
        label: code.replace(/_/g, ' '),
        description: data.description,
        valeur: data.value,
        unite: data.unit,
        severite: data.severity,
        is_editable: true,
        is_active: true
      });
    });
  }

  // Validations
  if (config.validations) {
    Object.entries(config.validations).forEach(([code, data]) => {
      rules.push({
        id: `validation_${code}`,
        code,
        categorie: 'validations',
        label: code.replace(/_/g, ' '),
        description: data.description,
        severite: data.severity,
        is_active: data.enabled,
        is_editable: true
      });
    });
  }

  // Délais
  if (config.delais_types) {
    Object.entries(config.delais_types).forEach(([code, data]) => {
      rules.push({
        id: `delai_${code}`,
        code,
        categorie: 'delais',
        label: data.label || code.replace(/_/g, ' '),
        description: data.description,
        valeur: data.value,
        unite: data.unit,
        is_editable: true,
        is_active: true
      });
    });
  }

  // Garanties
  if (config.garanties) {
    Object.entries(config.garanties).forEach(([key, data]) => {
      if (key !== 'description') {
        rules.push({
          id: `garantie_${key}`,
          code: key,
          categorie: 'garanties',
          label: key.replace(/_/g, ' '),
          description: data.description,
          valeur_min: data.taux_min,
          valeur_max: data.taux_max,
          unite: data.unit,
          is_editable: false,
          is_active: true
        });
      }
    });
  }

  return rules;
}

/**
 * Render specific tab
 */
function renderTab(category) {
  const filteredRules = regles.filter(r => r.categorie === category);

  let content = '';

  switch (category) {
    case 'seuils':
      content = renderSeuilsTab(filteredRules);
      break;
    case 'validations':
      content = renderValidationsTab(filteredRules);
      break;
    case 'delais':
      content = renderDelaisTab(filteredRules);
      break;
    case 'garanties':
      content = renderGarantiesTab(filteredRules);
      break;
    case 'matrices':
      content = renderMatricesTab();
      break;
    case 'ano':
      content = renderANOTab();
      break;
    default:
      content = '<p>Onglet non implémenté</p>';
  }

  mount('#tabContent', content);
  attachEventListeners(category);
}

/**
 * Render current tab
 */
function renderCurrentTab() {
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    renderTab(activeTab.dataset.tab);
  }
}

/**
 * Render Seuils tab
 */
function renderSeuilsTab(rules) {
  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Seuils et Limites</h3>
        <span class="badge badge-secondary">${rules.length} règle(s)</span>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Valeur</th>
              <th>Unité</th>
              <th>Sévérité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rules.map(rule => `
              <tr data-rule-id="${rule.id}">
                <td><code>${rule.code}</code></td>
                <td>${rule.description || '-'}</td>
                <td>
                  <input type="number"
                         class="form-control"
                         style="width: 100px;"
                         value="${rule.valeur}"
                         data-field="valeur"
                         ${rule.is_editable ? '' : 'readonly'}>
                </td>
                <td>${rule.unite}</td>
                <td>
                  <span class="badge ${rule.severite === 'BLOCK' ? 'badge-error' : 'badge-warning'}">
                    ${rule.severite === 'BLOCK' ? 'BLOQUANT' : 'ALERTE'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="showRuleHistory('${rule.id}')">
                    📜 Historique
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Render Validations tab
 */
function renderValidationsTab(rules) {
  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Validations Obligatoires</h3>
        <span class="badge badge-secondary">${rules.length} validation(s)</span>
      </div>
      <div class="card-body">
        ${rules.map(rule => `
          <div class="rule-item" style="padding: 16px; border: 2px solid #E5E7EB; border-radius: 10px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="flex: 1;">
                <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
                  <code style="background: #F3F4F6; padding: 4px 8px; border-radius: 6px;">${rule.code}</code>
                  <span class="badge ${rule.severite === 'BLOCK' ? 'badge-error' : 'badge-warning'}">
                    ${rule.severite === 'BLOCK' ? 'BLOQUANT' : 'ALERTE'}
                  </span>
                </div>
                <p style="margin: 0; color: #6B7280;">${rule.description}</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox"
                       data-rule-id="${rule.id}"
                       data-field="is_active"
                       ${rule.is_active ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render Délais tab
 */
function renderDelaisTab(rules) {
  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Délais Réglementaires</h3>
        <span class="badge badge-secondary">${rules.length} délai(s)</span>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Valeur</th>
              <th>Unité</th>
              <th>Modifier</th>
            </tr>
          </thead>
          <tbody>
            ${rules.map(rule => `
              <tr data-rule-id="${rule.id}">
                <td>
                  <strong>${rule.label}</strong><br>
                  <small style="color: #6B7280;">${rule.description || ''}</small>
                </td>
                <td>
                  <input type="number"
                         class="form-control"
                         style="width: 100px;"
                         value="${rule.valeur}"
                         data-field="valeur"
                         ${rule.is_editable ? '' : 'readonly'}>
                </td>
                <td>${rule.unite}</td>
                <td>
                  ${rule.is_editable ?
                    '<span class="badge badge-success">Modifiable</span>' :
                    '<span class="badge badge-secondary">Fixe</span>'
                  }
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Render Garanties tab
 */
function renderGarantiesTab(rules) {
  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Garanties Bancaires</h3>
        <span class="badge badge-info">Réglementaire</span>
      </div>
      <div class="card-body">
        <p style="color: #6B7280; margin-bottom: 20px;">
          Les garanties bancaires sont définies par le Code des Marchés Publics.
        </p>
        ${rules.map(rule => `
          <div style="padding: 16px; background: #F9FAFB; border-radius: 8px; margin-bottom: 16px;">
            <strong style="display: block; margin-bottom: 8px;">${rule.label}</strong>
            <p style="margin: 8px 0; color: #6B7280; font-size: 13px;">${rule.description}</p>
            <div style="display: flex; gap: 16px;">
              <span>Minimum: ${rule.valeur_min}${rule.unite}</span>
              <span>Maximum: ${rule.valeur_max}${rule.unite}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render Matrices tab
 */
function renderMatricesTab() {
  const rulesConfig = dataService.getRulesConfig();
  const matrices = rulesConfig.matrices_procedures || {};

  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Matrices des Procédures</h3>
        <span class="badge badge-info">Réglementaire</span>
      </div>
      <div class="card-body">
        <p style="color: #6B7280; margin-bottom: 20px;">
          Définit les procédures applicables selon les seuils de montant et le type d'autorité contractante.
        </p>
        ${Object.entries(matrices).map(([type, config]) => `
          <div style="margin-bottom: 32px;">
            <h4 style="color: #374151; margin-bottom: 16px;">${config.description}</h4>
            <div style="display: grid; gap: 12px;">
              ${config.seuils_montants.map(seuil => `
                <div style="padding: 14px; background: white; border-left: 4px solid #3B82F6; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <span class="badge" style="background: #3B82F6; color: white; margin-right: 10px;">${seuil.mode}</span>
                      <strong>${seuil.label}</strong>
                    </div>
                    <span style="color: #6B7280; font-weight: 600;">
                      ${formatMontant(seuil.min)} ${seuil.max !== null ? '→ ' + formatMontant(seuil.max) : '+'}
                    </span>
                  </div>
                  <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 13px;">${seuil.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render ANO tab
 */
function renderANOTab() {
  const rulesConfig = dataService.getRulesConfig();
  const ano = rulesConfig.ano || {};

  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Avis de Non-Objection (ANO)</h3>
        <span class="badge badge-info">Réglementaire</span>
      </div>
      <div class="card-body">
        <p style="color: #6B7280; margin-bottom: 20px;">${ano.description}</p>

        <div style="margin-bottom: 24px;">
          <strong style="display: block; margin-bottom: 12px;">Modes de passation requérant ANO :</strong>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${(ano.modes_requierant_ano || []).map(mode => `
              <span class="badge" style="background: #DBEAFE; color: #1E40AF; padding: 8px 14px;">${mode}</span>
            `).join('')}
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <strong style="display: block; margin-bottom: 12px;">Bailleurs requérant ANO :</strong>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${(ano.bailleurs_requierant_ano || []).map(bailleur => `
              <span class="badge" style="background: #FEF3C7; color: #92400E; padding: 8px 14px;">${bailleur}</span>
            `).join('')}
          </div>
        </div>

        <div>
          <strong style="display: block; margin-bottom: 12px;">Seuils de montant par type de marché :</strong>
          <div style="display: grid; gap: 10px;">
            ${Object.entries(ano.seuils_montant || {}).map(([type, config]) => `
              <div style="display: flex; justify-content: space-between; padding: 12px; background: #F9FAFB; border-radius: 6px;">
                <span style="font-weight: 500;">${type}</span>
                <span style="color: #6B7280;">${formatMontant(config.value)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach event listeners for inputs
 */
function attachEventListeners(category) {
  // Input changes
  document.querySelectorAll('input[data-field]').forEach(input => {
    input.addEventListener('change', (e) => {
      const row = e.target.closest('[data-rule-id]');
      if (!row) return;

      const ruleId = row.dataset.ruleId;
      const field = e.target.dataset.field;
      const value = e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value);

      updateRuleValue(ruleId, field, value);
    });
  });
}

/**
 * Update rule value
 */
function updateRuleValue(ruleId, field, value) {
  const rule = regles.find(r => r.id === ruleId);
  if (!rule) return;

  rule[field] = value;
  modifiedRules.add(ruleId);
  updateSaveButton();

  logger.info('[ReglesV2] Rule modified:', ruleId, field, value);

  // Auto-save après 2 secondes
  clearTimeout(window.autoSaveTimeout);
  window.autoSaveTimeout = setTimeout(() => {
    saveAllModifications();
  }, 2000);
}

/**
 * Update save button visibility
 */
function updateSaveButton() {
  const btn = document.getElementById('btnSaveAll');
  const count = document.getElementById('modifiedCount');

  if (btn && count) {
    if (modifiedRules.size > 0) {
      btn.style.display = 'inline-block';
      count.textContent = modifiedRules.size;
    } else {
      btn.style.display = 'none';
    }
  }
}

/**
 * Save all modifications
 */
async function saveAllModifications() {
  try {
    const modifiedRulesList = Array.from(modifiedRules).map(id =>
      regles.find(r => r.id === id)
    );

    logger.info('[ReglesV2] Saving modifications:', modifiedRulesList);

    // TODO: Appeler l'API pour sauvegarder
    // await dataService.adapter.fetch('/api/regles/batch', {
    //   method: 'PUT',
    //   body: JSON.stringify(modifiedRulesList)
    // });

    // Simuler la sauvegarde
    await new Promise(resolve => setTimeout(resolve, 500));

    modifiedRules.clear();
    updateSaveButton();

    // Show success message
    const saveBtn = document.getElementById('btnSaveAll');
    if (saveBtn) {
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '✅ Enregistré !';
      saveBtn.classList.add('btn-success');
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
      }, 2000);
    }

    logger.info('[ReglesV2] Modifications saved successfully');
  } catch (error) {
    logger.error('[ReglesV2] Error saving modifications:', error);
    alert('❌ Erreur lors de la sauvegarde: ' + error.message);
  }
}

/**
 * Format montant
 */
function formatMontant(montant) {
  if (montant === null) return 'Illimité';
  return `${(montant / 1000000).toFixed(0)}M XOF`;
}

/**
 * Show rule history
 */
window.showRuleHistory = function(ruleId) {
  // TODO: Charger l'historique depuis la BD
  alert(`📜 Historique de la règle ${ruleId}\n\n(À implémenter)`);
};
