/* ============================================
   Widget: Affichage de la chaîne programmatique
   Affiche les informations de planification (héritées de ECR01)
   qui suivent le marché tout au long du processus
   ============================================ */

import { el } from '../../lib/dom.js';
import { money } from '../../lib/format.js';

/**
 * Affiche la chaîne programmatique d'une opération
 * @param {Object} operation - Obération complète
 * @param {Object} registries - Registres de référence
 * @param {Object} options - Options d'affichage
 * @returns {HTMLElement} Élément DOM
 */
export function renderChaineProgrammatique(operation, registries = {}, options = {}) {
  const {
    title = '🔗 Chaîne programmatique',
    collapsible = true,
    defaultExpanded = false,
    showFinancialDetails = true,
    compact = false
  } = options;

  if (!operation) {
    return el('div', { className: 'alert alert-warning' }, 'Aucune information de chaîne programmatique disponible');
  }

  // Extraire les labels depuis les registres
  const getLabel = (registryName, code) => {
    const registry = registries[registryName];
    if (!registry || !Array.isArray(registry)) return code || '-';
    const item = registry.find(r => r.code === code);
    return item ? item.label : (code || '-');
  };

  // Récupérer les labels des sections/programmes/unités
  const getSectionLabel = (sectionCode) => {
    const sections = registries.CHAINE_BUDGETAIRE?.sections || [];
    const section = sections.find(s => s.code === sectionCode);
    return section ? section.label : sectionCode;
  };

  const getProgrammeLabel = (sectionCode, programmeCode) => {
    const sections = registries.CHAINE_BUDGETAIRE?.sections || [];
    const section = sections.find(s => s.code === sectionCode);
    if (!section) return programmeCode;
    const programme = section.programmes?.find(p => p.code === programmeCode);
    return programme ? programme.label : programmeCode;
  };

  const getUniteLabel = (sectionCode, programmeCode, uniteCode) => {
    const sections = registries.CHAINE_BUDGETAIRE?.sections || [];
    const section = sections.find(s => s.code === sectionCode);
    if (!section) return uniteCode;
    const programme = section.programmes?.find(p => p.code === programmeCode);
    if (!programme) return uniteCode;
    const unite = programme.unites?.find(u => u.code === uniteCode);
    return unite ? unite.label : uniteCode;
  };

  // Construire les données à afficher
  const data = [
    {
      section: 'Identification budgétaire',
      items: [
        { label: 'Exercice', value: operation.exercice || '-' },
        { label: 'Section (Ministère)', value: getSectionLabel(operation.section) },
        { label: 'Programme', value: getProgrammeLabel(operation.section, operation.programme) },
        { label: 'Unité Administrative', value: getUniteLabel(operation.section, operation.programme, operation.unite) },
        { label: 'Activité', value: operation.activite || '-' },
        { label: 'Ligne budgétaire', value: operation.ligneBudgetaire || '-' }
      ]
    },
    {
      section: 'Classification',
      items: [
        { label: 'Type de marché', value: getLabel('TYPE_MARCHE', operation.typeMarche) },
        { label: 'Mode de passation', value: getLabel('MODE_PASSATION', operation.modePassation) },
        { label: 'Nature des prix', value: getLabel('NATURE_PRIX', operation.naturePrix) },
        { label: 'Catégorie prestation', value: getLabel('CATEGORIE_PRESTATION', operation.categoriePrestation) }
      ]
    }
  ];

  // Section financière (optionnelle)
  if (showFinancialDetails) {
    data.push({
      section: 'Financement',
      items: [
        { label: 'Montant prévisionnel', value: money(operation.montantPrevisionnel) },
        { label: 'Type de financement', value: getLabel('TYPE_FINANCEMENT', operation.typeFinancement) },
        { label: 'Bailleur', value: getLabel('BAILLEUR', operation.sourceFinancement) || operation.sourceFinancement },
        { label: 'Nature économique', value: operation.natureEconomique || '-' }
      ]
    });
  }

  // Construction du widget
  const contentId = `chaine-prog-${Math.random().toString(36).substr(2, 9)}`;
  const isExpanded = !collapsible || defaultExpanded;

  const content = el('div', {
    id: contentId,
    style: { display: isExpanded ? 'block' : 'none' }
  }, [
    ...data.map(section => {
      if (compact) {
        // Mode compact : affichage en colonnes
        return el('div', { style: { marginBottom: '16px' } }, [
          el('div', {
            style: {
              fontSize: '13px',
              fontWeight: 'bold',
              color: '#495057',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          }, section.section),
          el('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }
          }, section.items.map(item =>
            el('div', { style: { fontSize: '13px' } }, [
              el('span', { style: { color: '#6c757d', marginRight: '4px' } }, `${item.label}:`),
              el('span', { style: { fontWeight: '500' } }, item.value)
            ])
          ))
        ]);
      } else {
        // Mode standard : tableau
        return el('div', { style: { marginBottom: '20px' } }, [
          el('h4', {
            style: {
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#495057',
              marginBottom: '12px',
              borderBottom: '2px solid #e9ecef',
              paddingBottom: '6px'
            }
          }, section.section),
          el('table', {
            style: {
              width: '100%',
              fontSize: '13px',
              borderCollapse: 'collapse'
            }
          }, [
            el('tbody', {}, section.items.map(item =>
              el('tr', {}, [
                el('td', {
                  style: {
                    padding: '8px 12px',
                    color: '#6c757d',
                    borderBottom: '1px solid #f1f3f5',
                    width: '40%'
                  }
                }, item.label),
                el('td', {
                  style: {
                    padding: '8px 12px',
                    fontWeight: '500',
                    borderBottom: '1px solid #f1f3f5'
                  }
                }, item.value)
              ])
            ))
          ])
        ]);
      }
    })
  ]);

  const widget = el('div', { className: 'card', style: { marginBottom: '24px' } }, [
    el('div', {
      className: 'card-header',
      style: collapsible ? { cursor: 'pointer', userSelect: 'none' } : {}
    }, [
      el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
        el('h3', { className: 'card-title' }, title),
        collapsible ? el('span', {
          id: `toggle-${contentId}`,
          style: { fontSize: '18px', transition: 'transform 0.2s' }
        }, isExpanded ? '▼' : '▶') : null
      ])
    ]),
    el('div', { className: 'card-body' }, [content])
  ]);

  // Ajouter le comportement de collapse si activé
  if (collapsible) {
    const header = widget.querySelector('.card-header');
    const toggle = document.getElementById(`toggle-${contentId}`);

    header.addEventListener('click', () => {
      const contentEl = document.getElementById(contentId);
      const isCurrentlyExpanded = contentEl.style.display !== 'none';

      contentEl.style.display = isCurrentlyExpanded ? 'none' : 'block';
      if (toggle) {
        toggle.textContent = isCurrentlyExpanded ? '▶' : '▼';
      }
    });
  }

  return widget;
}

/**
 * Version compacte de la chaîne programmatique (une ligne)
 * @param {Object} operation
 * @param {Object} registries
 * @returns {HTMLElement}
 */
export function renderChaineProgrammatiqueCompact(operation, registries = {}) {
  if (!operation) return el('div', {}, '-');

  const getLabel = (registryName, code) => {
    const registry = registries[registryName];
    if (!registry || !Array.isArray(registry)) return code || '-';
    const item = registry.find(r => r.code === code);
    return item ? item.label : (code || '-');
  };

  const parts = [
    `Exercice ${operation.exercice}`,
    operation.section,
    operation.programme,
    operation.unite,
    getLabel('TYPE_MARCHE', operation.typeMarche),
    getLabel('MODE_PASSATION', operation.modePassation),
    money(operation.montantPrevisionnel)
  ].filter(Boolean);

  return el('div', {
    style: {
      fontSize: '12px',
      color: '#6c757d',
      padding: '8px 12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      borderLeft: '3px solid #007bff'
    }
  }, parts.join(' • '));
}

/**
 * Affiche uniquement les informations financières de la chaîne
 * @param {Object} operation
 * @param {Object} registries
 * @returns {HTMLElement}
 */
export function renderFinancementInfo(operation, registries = {}) {
  if (!operation) return el('div', {}, '-');

  const getLabel = (registryName, code) => {
    const registry = registries[registryName];
    if (!registry || !Array.isArray(registry)) return code || '-';
    const item = registry.find(r => r.code === code);
    return item ? item.label : (code || '-');
  };

  return el('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px'
    }
  }, [
    el('div', {}, [
      el('div', { style: { fontSize: '11px', color: '#6c757d', marginBottom: '4px' } }, 'Année'),
      el('div', { style: { fontSize: '14px', fontWeight: 'bold' } }, operation.exercice || '-')
    ]),
    el('div', {}, [
      el('div', { style: { fontSize: '11px', color: '#6c757d', marginBottom: '4px' } }, 'Bailleur'),
      el('div', { style: { fontSize: '14px', fontWeight: 'bold' } }, getLabel('BAILLEUR', operation.sourceFinancement) || '-')
    ]),
    el('div', {}, [
      el('div', { style: { fontSize: '11px', color: '#6c757d', marginBottom: '4px' } }, 'Type financement'),
      el('div', { style: { fontSize: '14px', fontWeight: 'bold' } }, getLabel('TYPE_FINANCEMENT', operation.typeFinancement) || '-')
    ]),
    el('div', {}, [
      el('div', { style: { fontSize: '11px', color: '#6c757d', marginBottom: '4px' } }, 'Montant'),
      el('div', { style: { fontSize: '14px', fontWeight: 'bold', color: '#007bff' } }, money(operation.montantPrevisionnel))
    ])
  ]);
}

export default {
  renderChaineProgrammatique,
  renderChaineProgrammatiqueCompact,
  renderFinancementInfo
};
