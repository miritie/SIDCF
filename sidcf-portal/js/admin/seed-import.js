/**
 * Page d'administration pour l'import du seed data
 */

import { el, mount } from '../lib/dom.js';
import importSeedData from '../datastore/import-seed.js';

// Helper pour créer un bouton
function createButton(className, text, onClick, options = {}) {
  const btn = el('button', { className, ...options }, text);
  if (onClick) {
    btn.addEventListener('click', onClick);
  }
  return btn;
}

export async function renderSeedImport() {
  const container = el('div', { className: 'page' }, [
    // Header
    el('div', { className: 'page-header' }, [
      el('h1', { className: 'page-title' }, [
        el('span', {}, '🗄️ '),
        'Import Seed Data'
      ]),
      el('p', { className: 'page-subtitle' }, 'Charger les données de test complètes')
    ]),

    // Instructions
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h2', { className: 'card-title' }, '📋 Instructions')
      ]),
      el('div', { className: 'card-content' }, [
        el('div', { className: 'alert alert-info', style: { marginBottom: '16px' } }, [
          el('div', { className: 'alert-icon' }, 'ℹ️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Que fait cette action ?'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, 'Cette opération va :'),
              el('ul', {}, [
                el('li', {}, 'Supprimer toutes les données existantes dans localStorage'),
                el('li', {}, 'Charger le fichier seed-comprehensive.json (128 KB)'),
                el('li', {}, 'Importer 20 opérations complètes avec toutes leurs entités associées'),
                el('li', {}, 'Créer un jeu de données réaliste couvrant 3 années (2023-2025)')
              ])
            ])
          ])
        ]),

        el('div', { className: 'alert alert-warning' }, [
          el('div', { className: 'alert-icon' }, '⚠️'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Attention'),
            el('div', { className: 'alert-message' }, 'Cette action supprimera toutes les données actuelles. Assurez-vous d\'avoir sauvegardé vos données importantes avant de continuer.')
          ])
        ])
      ])
    ]),

    // Statistiques attendues
    el('div', { className: 'card', style: { marginBottom: '24px' } }, [
      el('div', { className: 'card-header' }, [
        el('h2', { className: 'card-title' }, '📊 Données qui seront importées')
      ]),
      el('div', { className: 'card-content' }, [
        el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
          createStatCard('PPM_PLAN', '3', 'Plans de passation'),
          createStatCard('OPERATION', '20', 'Opérations'),
          createStatCard('BUDGET_LINE', '20', 'Lignes budgétaires'),
          createStatCard('ENTREPRISE', '15', 'Entreprises'),
          createStatCard('GROUPEMENT', '5', 'Groupements'),
          createStatCard('PROCEDURE', '17', 'Procédures'),
          createStatCard('ATTRIBUTION', '14', 'Attributions'),
          createStatCard('VISA_CF', '11', 'Visas CF'),
          createStatCard('ORDRE_SERVICE', '3', 'Ordres de service'),
          createStatCard('AVENANT', '3', 'Avenants'),
          createStatCard('RESILIATION', '2', 'Résiliations'),
          createStatCard('GARANTIE', '13', 'Garanties'),
          createStatCard('CLOTURE', '5', 'Clôtures'),
          createStatCard('ANO', '12', 'ANO'),
          createStatCard('RECOURS', '2', 'Recours')
        ])
      ])
    ]),

    // Zone de résultat
    el('div', { id: 'import-result', style: { marginBottom: '24px' } }),

    // Boutons d'action
    el('div', { className: 'card' }, [
      el('div', { className: 'card-content', style: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
        createButton('btn btn-primary btn-lg', '🚀 Importer le Seed Data', handleImport),
        createButton('btn btn-secondary btn-lg', '← Retour', () => window.history.back())
      ])
    ])
  ]);

  mount('#app', container);
}

function createStatCard(label, value, description) {
  return el('div', {
    style: {
      padding: '16px',
      border: '1px solid var(--color-gray-300)',
      borderRadius: '8px',
      backgroundColor: 'var(--color-gray-50)',
      textAlign: 'center'
    }
  }, [
    el('div', { style: { fontSize: '24px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '4px' } }, value),
    el('div', { style: { fontSize: '11px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '2px' } }, label),
    el('div', { style: { fontSize: '10px', color: 'var(--color-text-muted)' } }, description)
  ]);
}

async function handleImport() {
  const resultDiv = document.getElementById('import-result');

  // Confirmation
  const confirmed = confirm(
    '⚠️ ATTENTION ⚠️\n\n' +
    'Cette action va SUPPRIMER toutes les données existantes et les remplacer par le seed data.\n\n' +
    'Voulez-vous vraiment continuer ?'
  );

  if (!confirmed) {
    return;
  }

  // Afficher le loader
  mount(resultDiv, el('div', { className: 'card' }, [
    el('div', { className: 'card-content', style: { textAlign: 'center', padding: '32px' } }, [
      el('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '⏳'),
      el('div', { style: { fontSize: '16px', fontWeight: '500', marginBottom: '8px' } }, 'Import en cours...'),
      el('div', { style: { fontSize: '14px', color: 'var(--color-text-muted)' } }, 'Veuillez patienter, cela peut prendre quelques secondes')
    ])
  ]));

  try {
    // Exécuter l'import
    const result = await importSeedData();

    if (result.success) {
      // Afficher le succès
      mount(resultDiv, el('div', { className: 'card' }, [
        el('div', { className: 'card-content' }, [
          el('div', { className: 'alert alert-success' }, [
            el('div', { className: 'alert-icon' }, '✅'),
            el('div', { className: 'alert-content' }, [
              el('div', { className: 'alert-title' }, 'Import réussi !'),
              el('div', { className: 'alert-message' }, [
                el('p', {}, result.message),
                el('p', { style: { marginTop: '12px' } }, 'Vous pouvez maintenant naviguer dans l\'application pour visualiser les données importées.')
              ])
            ])
          ]),
          el('div', { style: { marginTop: '16px', textAlign: 'center' } }, [
            createButton('btn btn-primary', '🏠 Aller au Dashboard', () => window.location.hash = '#/dashboard'),
            createButton('btn btn-secondary', '📋 Voir les opérations', () => window.location.hash = '#/ppm-list', { style: { marginLeft: '12px' } })
          ])
        ])
      ]));
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error('Erreur import:', error);

    // Afficher l'erreur
    mount(resultDiv, el('div', { className: 'card' }, [
      el('div', { className: 'card-content' }, [
        el('div', { className: 'alert alert-error' }, [
          el('div', { className: 'alert-icon' }, '❌'),
          el('div', { className: 'alert-content' }, [
            el('div', { className: 'alert-title' }, 'Erreur lors de l\'import'),
            el('div', { className: 'alert-message' }, [
              el('p', {}, error.message),
              el('p', { style: { marginTop: '8px', fontSize: '12px' } }, 'Consultez la console pour plus de détails.')
            ])
          ])
        ]),
        el('div', { style: { marginTop: '16px', textAlign: 'center' } }, [
          createButton('btn btn-primary', '🔄 Réessayer', handleImport)
        ])
      ])
    ]));
  }
}

export default renderSeedImport;
