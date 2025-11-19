/* ============================================
   ECR06 - Dashboard Contrôle Financier
   Design BOLD & Impactant - Data-Driven
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
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1);
  } else if (amount >= 1000000) {
    return (amount / 1000000).toFixed(0);
  }
  return amount.toLocaleString('fr-FR');
}

function formatMoneyUnit(amount) {
  if (amount >= 1000000000) return 'Md XOF';
  if (amount >= 1000000) return 'M XOF';
  return 'XOF';
}

export async function renderDashboardCF(params) {
  try {
    const operations = await dataService.query(ENTITIES.OPERATION);
    const garanties = await dataService.query(ENTITIES.GARANTIE);
    const avenants = await dataService.query(ENTITIES.AVENANT);

    const metrics = calculateMetrics(operations, garanties, avenants);

    // Dark theme dashboard
    const page = el('div', {
      className: 'page',
      style: {
        background: '#0f172a',
        minHeight: '100vh',
        padding: '32px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }
    }, [
      // Top Bar
      renderTopBar(),

      // Hero Section - Big Numbers
      renderHeroSection(metrics),

      // Main Grid
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' } }, [
        // Donut Chart - États
        renderDonutChart(metrics),
        // Gauge - Engagement
        renderGaugeCard(metrics.tauxEngagement, 'Engagement', '#10b981'),
        // Gauge - Exécution
        renderGaugeCard(metrics.tauxExecution, 'Exécution', '#3b82f6')
      ]),

      // Second Row
      el('div', { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' } }, [
        // Bar Chart - Bailleurs
        renderBailleursBarChart(metrics),
        // Stats Cards
        renderStatsColumn(metrics)
      ]),

      // Bottom Row
      el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } }, [
        // Activity Timeline
        renderActivityTimeline(metrics),
        // Quick Actions
        renderQuickActionsGrid()
      ])
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

    const bailleur = op.chaineBudgetaire?.bailleur || op.chaine_budgetaire?.bailleur || 'TRESOR';
    byBailleur[bailleur] = byBailleur[bailleur] || { count: 0, montant: 0 };
    byBailleur[bailleur].count++;
    byBailleur[bailleur].montant += op.montantPrevisionnel || op.montant_previsionnel || 0;

    const montant = op.montantPrevisionnel || op.montant_previsionnel || 0;
    totalMontant += montant;

    if (['ATTRIBUE', 'VISE', 'EN_EXEC', 'CLOS'].includes(etat)) {
      montantEngaged += montant;
    }
    if (['EN_EXEC', 'CLOS'].includes(etat)) {
      montantExecuted += montant;
    }
  });

  return {
    total: operations.length,
    byState,
    byType,
    byMode,
    byBailleur,
    totalMontant,
    montantEngaged,
    montantExecuted,
    tauxEngagement: totalMontant > 0 ? (montantEngaged / totalMontant * 100) : 0,
    tauxExecution: montantEngaged > 0 ? (montantExecuted / montantEngaged * 100) : 0,
    garanties: {
      actives: garanties.filter(g => g.etat === 'ACTIVE').length,
      liberees: garanties.filter(g => g.etat === 'LIBEREE').length
    },
    avenants: {
      count: avenants.length
    }
  };
}

function renderTopBar() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  return el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' } }, [
    el('div', {}, [
      el('h1', { style: { fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.5px' } },
        'CONTRÔLE FINANCIER'),
      el('p', { style: { color: '#64748b', margin: 0, fontSize: '14px' } }, 'Tableau de bord stratégique')
    ]),
    el('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } }, [
      el('div', { style: { textAlign: 'right' } }, [
        el('div', { style: { fontSize: '24px', fontWeight: '700', color: '#ffffff' } }, timeStr),
        el('div', { style: { fontSize: '12px', color: '#64748b', textTransform: 'uppercase' } }, dateStr)
      ]),
      el('div', {
        style: {
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          cursor: 'pointer'
        },
        onclick: () => location.reload()
      }, '↻')
    ])
  ]);
}

function renderHeroSection(metrics) {
  const cards = [
    {
      value: metrics.total,
      label: 'OPÉRATIONS',
      sublabel: 'au PPM 2025',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      icon: '📊'
    },
    {
      value: formatMoney(metrics.totalMontant),
      label: formatMoneyUnit(metrics.totalMontant),
      sublabel: 'Enveloppe globale',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      icon: '💰'
    },
    {
      value: formatMoney(metrics.montantEngaged),
      label: formatMoneyUnit(metrics.montantEngaged),
      sublabel: 'Engagé',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      icon: '📝'
    },
    {
      value: formatMoney(metrics.montantExecuted),
      label: formatMoneyUnit(metrics.montantExecuted),
      sublabel: 'Exécuté',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      icon: '✅'
    }
  ];

  return el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' } },
    cards.map(card =>
      el('div', {
        style: {
          background: card.gradient,
          borderRadius: '20px',
          padding: '28px 24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }
      }, [
        // Big number
        el('div', { style: { fontSize: '48px', fontWeight: '900', color: '#ffffff', lineHeight: '1', marginBottom: '8px' } },
          String(card.value)),
        // Label
        el('div', { style: { fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' } },
          card.label),
        // Sublabel
        el('div', { style: { fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' } },
          card.sublabel),
        // Background icon
        el('div', {
          style: {
            position: 'absolute',
            right: '16px',
            bottom: '16px',
            fontSize: '64px',
            opacity: '0.2'
          }
        }, card.icon)
      ])
    )
  );
}

function renderDonutChart(metrics) {
  const total = metrics.total || 1;
  const segments = [
    { label: 'Planifié', count: metrics.byState.PLANIFIE.length, color: '#6366f1' },
    { label: 'Procédure', count: metrics.byState.EN_PROC.length, color: '#f59e0b' },
    { label: 'Attribué', count: metrics.byState.ATTRIBUE.length, color: '#8b5cf6' },
    { label: 'Visé', count: metrics.byState.VISE.length, color: '#06b6d4' },
    { label: 'Exécution', count: metrics.byState.EN_EXEC.length, color: '#10b981' },
    { label: 'Clôturé', count: metrics.byState.CLOS.length, color: '#64748b' }
  ];

  // Calculate SVG donut segments
  let currentAngle = 0;
  const radius = 80;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  return el('div', {
    style: {
      background: '#1e293b',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, [
    el('h3', { style: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' } },
      'Pipeline'),

    el('div', { style: { display: 'flex', alignItems: 'center', gap: '24px' } }, [
      // SVG Donut
      el('div', { style: { position: 'relative', width: '180px', height: '180px' } }, [
        (() => {
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '180');
          svg.setAttribute('height', '180');
          svg.setAttribute('viewBox', '0 0 200 200');

          segments.forEach(seg => {
            if (seg.count === 0) return;
            const pct = seg.count / total;
            const dashLength = pct * circumference;
            const dashOffset = -currentAngle * circumference / 360;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '100');
            circle.setAttribute('cy', '100');
            circle.setAttribute('r', String(radius));
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', seg.color);
            circle.setAttribute('stroke-width', String(strokeWidth));
            circle.setAttribute('stroke-dasharray', `${dashLength} ${circumference}`);
            circle.setAttribute('stroke-dashoffset', String(dashOffset));
            circle.setAttribute('transform', 'rotate(-90 100 100)');
            svg.appendChild(circle);

            currentAngle += pct * 360;
          });

          return svg;
        })(),
        // Center text
        el('div', {
          style: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }
        }, [
          el('div', { style: { fontSize: '36px', fontWeight: '900', color: '#ffffff' } }, String(total)),
          el('div', { style: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' } }, 'Total')
        ])
      ]),

      // Legend
      el('div', { style: { flex: 1 } },
        segments.map(seg =>
          el('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' } }, [
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
              el('div', { style: { width: '12px', height: '12px', borderRadius: '3px', background: seg.color } }),
              el('span', { style: { fontSize: '12px', color: '#cbd5e1' } }, seg.label)
            ]),
            el('span', { style: { fontSize: '14px', fontWeight: '700', color: '#ffffff' } }, String(seg.count))
          ])
        )
      )
    ])
  ]);
}

function renderGaugeCard(value, label, color) {
  const angle = (value / 100) * 180;

  return el('div', {
    style: {
      background: '#1e293b',
      borderRadius: '20px',
      padding: '24px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, [
    el('h3', { style: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' } },
      label),

    // Gauge SVG
    el('div', { style: { position: 'relative', width: '160px', height: '100px', margin: '0 auto' } }, [
      (() => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '160');
        svg.setAttribute('height', '100');
        svg.setAttribute('viewBox', '0 0 160 100');

        // Background arc
        const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        bgPath.setAttribute('d', 'M 20 90 A 60 60 0 0 1 140 90');
        bgPath.setAttribute('fill', 'none');
        bgPath.setAttribute('stroke', '#334155');
        bgPath.setAttribute('stroke-width', '12');
        bgPath.setAttribute('stroke-linecap', 'round');
        svg.appendChild(bgPath);

        // Value arc
        const valuePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const endX = 80 + 60 * Math.cos((180 - angle) * Math.PI / 180);
        const endY = 90 - 60 * Math.sin((180 - angle) * Math.PI / 180);
        const largeArc = angle > 90 ? 1 : 0;
        valuePath.setAttribute('d', `M 20 90 A 60 60 0 ${largeArc} 1 ${endX} ${endY}`);
        valuePath.setAttribute('fill', 'none');
        valuePath.setAttribute('stroke', color);
        valuePath.setAttribute('stroke-width', '12');
        valuePath.setAttribute('stroke-linecap', 'round');
        svg.appendChild(valuePath);

        return svg;
      })()
    ]),

    // Value display
    el('div', { style: { marginTop: '12px' } }, [
      el('span', { style: { fontSize: '42px', fontWeight: '900', color: '#ffffff' } }, value.toFixed(0)),
      el('span', { style: { fontSize: '24px', fontWeight: '700', color: '#64748b' } }, '%')
    ])
  ]);
}

function renderBailleursBarChart(metrics) {
  const sortedBailleurs = Object.entries(metrics.byBailleur)
    .sort((a, b) => b[1].montant - a[1].montant);

  const maxMontant = sortedBailleurs.length > 0 ? sortedBailleurs[0][1].montant : 1;

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

  return el('div', {
    style: {
      background: '#1e293b',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, [
    el('h3', { style: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', margin: '0 0 24px 0', textTransform: 'uppercase', letterSpacing: '1px' } },
      'Financement par Bailleur'),

    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
      sortedBailleurs.map(([bailleur, data], i) => {
        const pct = (data.montant / maxMontant * 100);
        const color = colors[i % colors.length];
        const isExternal = bailleur !== 'TRESOR';

        return el('div', {}, [
          el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
            el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
              el('span', { style: { fontSize: '14px', fontWeight: '600', color: '#ffffff' } }, bailleur),
              isExternal ? el('span', {
                style: {
                  fontSize: '9px',
                  padding: '3px 6px',
                  background: '#3b82f620',
                  color: '#60a5fa',
                  borderRadius: '4px',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }
              }, 'PTF') : null
            ]),
            el('div', { style: { textAlign: 'right' } }, [
              el('span', { style: { fontSize: '16px', fontWeight: '800', color: '#ffffff' } },
                `${formatMoney(data.montant)}`),
              el('span', { style: { fontSize: '11px', color: '#64748b', marginLeft: '4px' } },
                formatMoneyUnit(data.montant))
            ])
          ]),
          // Bar
          el('div', { style: { background: '#0f172a', borderRadius: '8px', height: '12px', overflow: 'hidden' } }, [
            el('div', {
              style: {
                width: `${pct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
                borderRadius: '8px',
                transition: 'width 0.8s ease'
              }
            })
          ])
        ]);
      })
    )
  ]);
}

function renderStatsColumn(metrics) {
  const stats = [
    {
      icon: '🔒',
      label: 'Garanties actives',
      value: metrics.garanties.actives,
      color: '#f59e0b'
    },
    {
      icon: '✓',
      label: 'Garanties libérées',
      value: metrics.garanties.liberees,
      color: '#10b981'
    },
    {
      icon: '📝',
      label: 'Avenants',
      value: metrics.avenants.count,
      color: '#8b5cf6'
    },
    {
      icon: '⏳',
      label: 'En attente visa',
      value: metrics.byState.VISE.length,
      color: '#06b6d4'
    }
  ];

  return el('div', {
    style: {
      background: '#1e293b',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, [
    el('h3', { style: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' } },
      'Indicateurs'),

    el('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
      stats.map(stat =>
        el('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: '#0f172a',
            borderRadius: '12px',
            borderLeft: `4px solid ${stat.color}`
          }
        }, [
          el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
            el('span', { style: { fontSize: '20px' } }, stat.icon),
            el('span', { style: { fontSize: '13px', color: '#cbd5e1' } }, stat.label)
          ]),
          el('span', { style: { fontSize: '24px', fontWeight: '800', color: '#ffffff' } }, String(stat.value))
        ])
      )
    )
  ]);
}

function renderActivityTimeline(metrics) {
  const activities = [
    { time: 'Aujourd\'hui', event: `${metrics.byState.EN_EXEC.length} marchés en exécution`, color: '#10b981' },
    { time: 'Cette semaine', event: `${metrics.byState.VISE.length} visas CF en attente d\'OS`, color: '#f59e0b' },
    { time: 'Ce mois', event: `${metrics.byState.CLOS.length} marchés clôturés`, color: '#6366f1' },
    { time: '2025', event: `${metrics.total} opérations au PPM`, color: '#8b5cf6' }
  ];

  return el('div', {
    style: {
      background: '#1e293b',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, [
    el('h3', { style: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' } },
      'Activité'),

    el('div', { style: { position: 'relative', paddingLeft: '24px' } }, [
      // Timeline line
      el('div', {
        style: {
          position: 'absolute',
          left: '6px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: '#334155'
        }
      }),

      el('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
        activities.map(activity =>
          el('div', { style: { position: 'relative' } }, [
            // Dot
            el('div', {
              style: {
                position: 'absolute',
                left: '-22px',
                top: '4px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: activity.color,
                border: '3px solid #1e293b'
              }
            }),
            el('div', { style: { fontSize: '11px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' } },
              activity.time),
            el('div', { style: { fontSize: '14px', color: '#ffffff', fontWeight: '500' } },
              activity.event)
          ])
        )
      )
    ])
  ]);
}

function renderQuickActionsGrid() {
  const actions = [
    { icon: '📋', label: 'Liste PPM', route: '/ppm-list', color: '#6366f1' },
    { icon: '➕', label: 'Nouvelle op.', route: '/ppm-create', color: '#10b981' },
    { icon: '📊', label: 'Rapports', route: '/rapports', color: '#f59e0b' },
    { icon: '⚙️', label: 'Config', route: '/admin/config-etapes', color: '#8b5cf6' }
  ];

  return el('div', {
    style: {
      background: '#1e293b',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, [
    el('h3', { style: { fontSize: '14px', fontWeight: '700', color: '#94a3b8', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '1px' } },
      'Actions'),

    el('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
      actions.map(action => {
        const btn = el('div', {
          style: {
            padding: '20px 16px',
            background: '#0f172a',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '2px solid transparent'
          }
        }, [
          el('div', { style: { fontSize: '28px', marginBottom: '8px' } }, action.icon),
          el('div', { style: { fontSize: '12px', fontWeight: '600', color: '#cbd5e1' } }, action.label)
        ]);

        btn.addEventListener('click', () => router.navigate(action.route));
        btn.addEventListener('mouseenter', () => {
          btn.style.borderColor = action.color;
          btn.style.transform = 'translateY(-4px)';
          btn.style.boxShadow = `0 8px 24px ${action.color}40`;
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.borderColor = 'transparent';
          btn.style.transform = 'translateY(0)';
          btn.style.boxShadow = 'none';
        });

        return btn;
      })
    )
  ]);
}

export default renderDashboardCF;
