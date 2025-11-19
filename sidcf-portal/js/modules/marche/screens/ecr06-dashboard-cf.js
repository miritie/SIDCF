/* ============================================
   ECR06 - Dashboard Contrôle Financier
   Design Professionnel - Charte Graphique SIDCF
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import logger from '../../../lib/logger.js';

function createButton(className, text, onClick) {
  const btn = el('button', { className }, text);
  btn.addEventListener('click', onClick);
  return btn;
}

function formatMoney(amount) {
  if (!amount) return '0';
  return amount.toLocaleString('fr-FR');
}

function formatMoneyCompact(amount) {
  if (!amount) return '0 XOF';
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2)} Md XOF`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(0)} M XOF`;
  }
  return `${amount.toLocaleString('fr-FR')} XOF`;
}

export async function renderDashboardCF(params) {
  try {
    const operations = await dataService.query(ENTITIES.OPERATION);
    const garanties = await dataService.query(ENTITIES.GARANTIE);
    const avenants = await dataService.query(ENTITIES.AVENANT);

    const metrics = calculateMetrics(operations, garanties, avenants);

    // Couleurs principales (charte graphique SIDCF)
    const colors = {
      primary: '#0f5132',      // Vert foncé
      secondary: '#198754',    // Vert moyen
      accent: '#f59e0b',       // Orange
      background: '#f8f9fa',
      cardBg: '#ffffff',
      text: '#212529',
      textMuted: '#6c757d',
      border: '#dee2e6'
    };

    const page = el('div', {
      className: 'page',
      style: {
        background: colors.background,
        minHeight: '100vh',
        padding: '24px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }
    }, [
      // Header avec bannière verte
      renderHeader(metrics, colors),

      // KPIs principaux
      renderKPICards(metrics, colors),

      // Grille principale
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' } }, [
        // Répartition par État
        renderStateDistribution(metrics, colors),
        // Alertes Critiques
        renderAlerts(metrics, colors)
      ]),

      // Deuxième rangée
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' } }, [
        // Répartition par Source de Financement
        renderFinancingSource(metrics, colors),
        // Taux d'exécution
        renderExecutionRate(metrics, colors)
      ]),

      // Troisième rangée
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' } }, [
        // Top 5 Marchés
        renderTopMarches(metrics, colors),
        // Activités Récentes
        renderRecentActivity(metrics, colors)
      ]),

      // Actions rapides
      renderQuickActions(colors)
    ]);

    mount('#app', page);

  } catch (error) {
    logger.error('[Dashboard CF] Error:', error);
    mount('#app', el('div', { className: 'page' }, [
      el('div', { className: 'alert alert-error' }, `Erreur: ${error.message}`)
    ]));
  }
}

function calculateMetrics(operations, garanties, avenants) {
  const byState = {
    PLANIFIE: [], EN_PROC: [], ATTRIBUE: [], VISE: [], EN_EXEC: [], CLOS: []
  };

  const byType = {};
  const byMode = {};
  const byBailleur = {};
  const byUA = {};

  let totalMontant = 0;
  let montantEngaged = 0;
  let montantExecuted = 0;

  operations.forEach(op => {
    const etat = op.etat || 'PLANIFIE';
    if (byState[etat]) byState[etat].push(op);

    const type = op.typeMarche || op.type_marche || 'AUTRE';
    byType[type] = (byType[type] || 0) + 1;

    const mode = op.modePassation || op.mode_passation || 'AUTRE';
    byMode[mode] = (byMode[mode] || 0) + 1;

    const bailleur = op.chaineBudgetaire?.bailleur || op.chaine_budgetaire?.bailleur || 'Non spécifiée';
    byBailleur[bailleur] = byBailleur[bailleur] || { count: 0, montant: 0 };
    byBailleur[bailleur].count++;
    byBailleur[bailleur].montant += op.montantPrevisionnel || op.montant_previsionnel || 0;

    const ua = op.uniteAdministrative || op.unite_administrative || 'Non spécifiée';
    byUA[ua] = (byUA[ua] || 0) + 1;

    const montant = op.montantPrevisionnel || op.montant_previsionnel || 0;
    totalMontant += montant;

    if (['ATTRIBUE', 'VISE', 'EN_EXEC', 'CLOS'].includes(etat)) {
      montantEngaged += montant;
    }
    if (['EN_EXEC', 'CLOS'].includes(etat)) {
      montantExecuted += montant;
    }
  });

  // Trier les opérations par montant pour le top 5
  const topOperations = [...operations]
    .sort((a, b) => (b.montantPrevisionnel || 0) - (a.montantPrevisionnel || 0))
    .slice(0, 5);

  // Dernières activités
  const recentOperations = [...operations]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .slice(0, 5);

  return {
    total: operations.length,
    byState,
    byType,
    byMode,
    byBailleur,
    byUA,
    totalMontant,
    montantEngaged,
    montantExecuted,
    tauxEngagement: totalMontant > 0 ? (montantEngaged / totalMontant * 100) : 0,
    tauxExecution: montantEngaged > 0 ? (montantExecuted / montantEngaged * 100) : 0,
    garanties: {
      actives: garanties.filter(g => g.etat === 'ACTIVE').length,
      liberees: garanties.filter(g => g.etat === 'LIBEREE').length,
      total: garanties.length
    },
    avenants: {
      count: avenants.length,
      total: avenants.reduce((sum, av) => sum + (av.variationMontant || 0), 0)
    },
    topOperations,
    recentOperations
  };
}

function renderHeader(metrics, colors) {
  return el('div', {
    style: {
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      borderRadius: '16px',
      padding: '24px 32px',
      marginBottom: '20px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(15, 81, 50, 0.3)'
    }
  }, [
    el('div', {}, [
      el('h1', { style: { margin: '0 0 4px 0', fontSize: '24px', fontWeight: '700' } },
        '📊 Dashboard SIDCF'),
      el('p', { style: { margin: 0, opacity: 0.9, fontSize: '14px' } },
        `Pilotage de ${metrics.total} marchés publics`)
    ]),
    el('div', { style: { display: 'flex', gap: '12px' } }, [
      createButton('btn btn-light btn-sm', '📋 PPM', () => router.navigate('/ppm-list')),
      createButton('btn btn-warning btn-sm', '✨ Import', () => router.navigate('/import-ppm'))
    ])
  ]);
}

function renderKPICards(metrics, colors) {
  const kpis = [
    {
      label: 'Total Marchés',
      value: metrics.total,
      icon: '📊',
      color: colors.primary
    },
    {
      label: 'En Exécution',
      value: metrics.byState.EN_EXEC.length,
      icon: '⚡',
      color: '#198754'
    },
    {
      label: 'Budget Prévisionnel',
      value: formatMoneyCompact(metrics.totalMontant),
      icon: '💰',
      color: '#0d6efd',
      isLarge: true
    },
    {
      label: 'Budget Actuel',
      value: formatMoneyCompact(metrics.montantEngaged),
      icon: '📈',
      color: '#6f42c1',
      isLarge: true
    },
    {
      label: 'Taux Exécution',
      value: `${metrics.tauxExecution.toFixed(0)}%`,
      icon: '🎯',
      color: colors.accent
    },
    {
      label: 'Clôturés',
      value: metrics.byState.CLOS.length,
      icon: '✅',
      color: '#6c757d'
    }
  ];

  return el('div', {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '16px',
      marginBottom: '20px'
    }
  },
    kpis.map(kpi =>
      el('div', {
        style: {
          background: colors.cardBg,
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderTop: `4px solid ${kpi.color}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          cursor: 'default'
        },
        onmouseenter: (e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
        },
        onmouseleave: (e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        }
      }, [
        el('div', { style: { fontSize: '12px', color: colors.textMuted, marginBottom: '8px', fontWeight: '500' } },
          kpi.label),
        el('div', {
          style: {
            fontSize: kpi.isLarge ? '16px' : '28px',
            fontWeight: '700',
            color: colors.text,
            lineHeight: '1.2'
          }
        }, String(kpi.value))
      ])
    )
  );
}

function renderStateDistribution(metrics, colors) {
  const states = [
    { key: 'PLANIFIE', label: 'Planifié', color: '#ffc107', count: metrics.byState.PLANIFIE.length },
    { key: 'EN_EXEC', label: 'En Exécution', color: '#198754', count: metrics.byState.EN_EXEC.length },
    { key: 'EN_PROC', label: 'EN_PROC', color: '#0dcaf0', count: metrics.byState.EN_PROC.length },
    { key: 'ATTRIBUE', label: 'ATTRIBUE', color: '#6f42c1', count: metrics.byState.ATTRIBUE.length },
    { key: 'VISE', label: 'Visé', color: '#0d6efd', count: metrics.byState.VISE.length },
    { key: 'CLOS', label: 'Clôturé', color: '#6c757d', count: metrics.byState.CLOS.length }
  ];

  const maxCount = Math.max(...states.map(s => s.count), 1);

  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  }, [
    el('h3', { style: { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Répartition par État'),

    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      states.map(state =>
        el('div', {}, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
            el('span', { style: { fontSize: '12px', color: colors.textMuted } }, state.label),
            el('span', { style: { fontSize: '14px', fontWeight: '600', color: colors.text } }, String(state.count))
          ]),
          el('div', { style: { background: '#e9ecef', borderRadius: '4px', height: '8px', overflow: 'hidden' } }, [
            el('div', {
              style: {
                width: `${(state.count / maxCount) * 100}%`,
                height: '100%',
                background: state.color,
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }
            })
          ])
        ])
      )
    ),

    // Badges résumé
    el('div', { style: { display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' } },
      states.filter(s => s.count > 0).map(state =>
        el('span', {
          style: {
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            background: `${state.color}20`,
            color: state.color
          }
        }, `${state.label}: ${state.count}`)
      )
    )
  ]);
}

function renderAlerts(metrics, colors) {
  const alerts = [];

  // Générer des alertes basées sur les métriques
  if (metrics.byState.VISE.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${metrics.byState.VISE.length} marché(s) visé(s) en attente d'OS`,
      icon: '⚠️'
    });
  }
  if (metrics.garanties.actives > 0) {
    alerts.push({
      type: 'info',
      message: `${metrics.garanties.actives} garantie(s) active(s) à suivre`,
      icon: 'ℹ️'
    });
  }
  if (metrics.tauxExecution < 50 && metrics.byState.EN_EXEC.length > 0) {
    alerts.push({
      type: 'danger',
      message: `Taux d'exécution faible (${metrics.tauxExecution.toFixed(0)}%)`,
      icon: '🚨'
    });
  }

  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  }, [
    el('h3', { style: { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Alertes Critiques'),

    el('div', { style: { marginBottom: '12px' } }, [
      el('div', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 8px',
          background: '#dc354520',
          borderRadius: '4px',
          color: '#dc3545',
          fontSize: '12px',
          fontWeight: '600'
        }
      }, [
        el('span', {}, 'Alertes'),
        el('span', { style: { marginLeft: '8px', background: '#dc3545', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' } },
          String(alerts.length))
      ])
    ]),

    alerts.length > 0
      ? el('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
          alerts.map(alert =>
            el('div', {
              style: {
                padding: '12px',
                borderRadius: '8px',
                background: alert.type === 'danger' ? '#dc354510' :
                           alert.type === 'warning' ? '#ffc10710' : '#0d6efd10',
                borderLeft: `3px solid ${alert.type === 'danger' ? '#dc3545' :
                           alert.type === 'warning' ? '#ffc107' : '#0d6efd'}`,
                fontSize: '13px',
                color: colors.text
              }
            }, [
              el('span', { style: { marginRight: '8px' } }, alert.icon),
              alert.message
            ])
          )
        )
      : el('div', { style: { textAlign: 'center', padding: '20px', color: colors.textMuted } }, [
          el('div', { style: { fontSize: '24px', marginBottom: '8px' } }, '✅'),
          el('div', { style: { fontSize: '13px' } }, 'Aucune alerte active')
        ])
  ]);
}

function renderFinancingSource(metrics, colors) {
  const sources = Object.entries(metrics.byBailleur)
    .sort((a, b) => b[1].montant - a[1].montant);

  const total = sources.reduce((sum, [, data]) => sum + data.montant, 0);

  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  }, [
    el('h3', { style: { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Répartition par Source de Financement'),

    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      sources.map(([bailleur, data], i) => {
        const pct = total > 0 ? (data.montant / total * 100) : 0;
        const sourceColors = ['#0d6efd', '#198754', '#6f42c1', '#fd7e14', '#20c997'];
        const color = sourceColors[i % sourceColors.length];

        return el('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }
        }, [
          el('div', { style: { width: '12px', height: '12px', borderRadius: '2px', background: color, flexShrink: 0 } }),
          el('div', { style: { flex: 1, minWidth: 0 } }, [
            el('div', { style: { fontSize: '13px', color: colors.text, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
              bailleur),
            el('div', { style: { fontSize: '11px', color: colors.textMuted } },
              `${formatMoneyCompact(data.montant)} (${pct.toFixed(1)}%)`)
          ])
        ]);
      })
    )
  ]);
}

function renderExecutionRate(metrics, colors) {
  const gaugeValue = metrics.tauxExecution;

  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      textAlign: 'center'
    }
  }, [
    el('h3', { style: { margin: '0 0 20px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Taux d\'Exécution Global'),

    // Gauge visuel
    el('div', { style: { position: 'relative', width: '160px', height: '80px', margin: '0 auto 16px' } }, [
      // Background arc
      el('div', {
        style: {
          position: 'absolute',
          width: '160px',
          height: '80px',
          borderRadius: '80px 80px 0 0',
          background: '#e9ecef',
          overflow: 'hidden'
        }
      }, [
        // Value arc
        el('div', {
          style: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '160px',
            height: '80px',
            borderRadius: '80px 80px 0 0',
            background: gaugeValue >= 70 ? '#198754' : gaugeValue >= 40 ? '#ffc107' : '#dc3545',
            transformOrigin: 'bottom center',
            transform: `rotate(${(gaugeValue / 100) * 180 - 180}deg)`,
            transition: 'transform 0.5s ease'
          }
        })
      ]),
      // Center circle
      el('div', {
        style: {
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120px',
          height: '60px',
          borderRadius: '60px 60px 0 0',
          background: colors.cardBg
        }
      })
    ]),

    el('div', { style: { fontSize: '36px', fontWeight: '700', color: colors.text } },
      `${gaugeValue.toFixed(0)}%`),
    el('div', { style: { fontSize: '12px', color: colors.textMuted, marginTop: '4px' } },
      'Budget exécuté / Budget engagé'),

    // Stats complémentaires
    el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` } }, [
      el('div', {}, [
        el('div', { style: { fontSize: '18px', fontWeight: '700', color: colors.primary } },
          formatMoneyCompact(metrics.montantExecuted)),
        el('div', { style: { fontSize: '11px', color: colors.textMuted } }, 'Exécuté')
      ]),
      el('div', {}, [
        el('div', { style: { fontSize: '18px', fontWeight: '700', color: colors.accent } },
          formatMoneyCompact(metrics.montantEngaged)),
        el('div', { style: { fontSize: '11px', color: colors.textMuted } }, 'Engagé')
      ])
    ])
  ]);
}

function renderTopMarches(metrics, colors) {
  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  }, [
    el('h3', { style: { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Top 5 Marchés'),

    el('div', { style: { overflowX: 'auto' } }, [
      el('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' } }, [
        el('thead', {}, [
          el('tr', { style: { borderBottom: `1px solid ${colors.border}` } }, [
            el('th', { style: { textAlign: 'left', padding: '8px 8px 8px 0', fontWeight: '600', color: colors.textMuted, fontSize: '11px' } }, 'Objet'),
            el('th', { style: { textAlign: 'right', padding: '8px 0 8px 8px', fontWeight: '600', color: colors.textMuted, fontSize: '11px' } }, 'Montant')
          ])
        ]),
        el('tbody', {},
          metrics.topOperations.map(op =>
            el('tr', {
              style: { borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' },
              onclick: () => router.navigate('/fiche-marche', { idOperation: op.id })
            }, [
              el('td', { style: { padding: '10px 8px 10px 0', color: colors.text } }, [
                el('div', { style: { fontWeight: '500', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                  op.objet || 'Sans objet'),
              ]),
              el('td', { style: { padding: '10px 0 10px 8px', textAlign: 'right', fontWeight: '600', color: colors.primary, whiteSpace: 'nowrap' } },
                formatMoneyCompact(op.montantPrevisionnel || 0))
            ])
          )
        )
      ])
    ])
  ]);
}

function renderRecentActivity(metrics, colors) {
  const stateLabels = {
    PLANIFIE: 'Planifié',
    EN_PROC: 'EN_PROC',
    ATTRIBUE: 'ATTRIBUE',
    VISE: 'Visé',
    EN_EXEC: 'En Exécution',
    CLOS: 'Clôturé'
  };

  const stateColors = {
    PLANIFIE: '#ffc107',
    EN_PROC: '#0dcaf0',
    ATTRIBUE: '#6f42c1',
    VISE: '#0d6efd',
    EN_EXEC: '#198754',
    CLOS: '#6c757d'
  };

  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  }, [
    el('h3', { style: { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Activités Récentes'),

    el('div', { style: { overflowX: 'auto' } }, [
      el('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' } }, [
        el('thead', {}, [
          el('tr', { style: { borderBottom: `1px solid ${colors.border}` } }, [
            el('th', { style: { textAlign: 'left', padding: '8px 8px 8px 0', fontWeight: '600', color: colors.textMuted, fontSize: '11px' } }, 'Date'),
            el('th', { style: { textAlign: 'left', padding: '8px', fontWeight: '600', color: colors.textMuted, fontSize: '11px' } }, 'Marché'),
            el('th', { style: { textAlign: 'right', padding: '8px 0 8px 8px', fontWeight: '600', color: colors.textMuted, fontSize: '11px' } }, 'État')
          ])
        ]),
        el('tbody', {},
          metrics.recentOperations.map(op => {
            const date = op.updatedAt || op.createdAt;
            const dateStr = date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '-';
            const etat = op.etat || 'PLANIFIE';

            return el('tr', {
              style: { borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' },
              onclick: () => router.navigate('/fiche-marche', { idOperation: op.id })
            }, [
              el('td', { style: { padding: '10px 8px 10px 0', color: colors.textMuted, fontSize: '12px' } }, dateStr),
              el('td', { style: { padding: '10px 8px', color: colors.text, maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                op.objet || 'Sans objet'),
              el('td', { style: { padding: '10px 0 10px 8px', textAlign: 'right' } }, [
                el('span', {
                  style: {
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: `${stateColors[etat]}20`,
                    color: stateColors[etat]
                  }
                }, stateLabels[etat] || etat)
              ])
            ]);
          })
        )
      ])
    ])
  ]);
}

function renderQuickActions(colors) {
  const actions = [
    { icon: '📋', label: 'Liste PPM', route: '/ppm-list', color: colors.primary },
    { icon: '➕', label: 'Nouvelle opération', route: '/ppm-create', color: '#198754' },
    { icon: '📊', label: 'Dashboard principal', route: '/dashboard', color: '#0d6efd' },
    { icon: '⚙️', label: 'Configuration', route: '/admin/config-etapes', color: '#6f42c1' }
  ];

  return el('div', {
    style: {
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }
  }, [
    el('h3', { style: { margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: colors.text } },
      'Actions Rapides'),

    el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' } },
      actions.map(action => {
        const btn = el('div', {
          style: {
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }
        }, [
          el('div', { style: { fontSize: '24px', marginBottom: '8px' } }, action.icon),
          el('div', { style: { fontSize: '12px', fontWeight: '500', color: colors.text } }, action.label)
        ]);

        btn.addEventListener('click', () => router.navigate(action.route));
        btn.addEventListener('mouseenter', () => {
          btn.style.background = `${action.color}10`;
          btn.style.borderColor = action.color;
          btn.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.background = 'transparent';
          btn.style.borderColor = colors.border;
          btn.style.transform = 'translateY(0)';
        });

        return btn;
      })
    )
  ]);
}

export default renderDashboardCF;
