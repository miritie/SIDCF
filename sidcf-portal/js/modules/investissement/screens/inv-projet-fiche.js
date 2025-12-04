/* ============================================
   Fiche Projet Investissement
   ============================================
   Détails complets d'un projet avec onglets:
   - Signalétique
   - Budget & Budget éclaté
   - Transferts & Lettres d'avance
   - PTBA & Composantes
   - Suivi physique
   - Suivi financier & glissements
   - GAR
   - Gouvernance & documents
   ============================================ */

import { el, mount, qs } from '../../../lib/dom.js';
import { money, date, percent, abbreviate } from '../../../lib/format.js';
import router from '../../../router.js';
import logger from '../../../lib/logger.js';
import { INV_SIDEBAR_MENU, getCurrentYear, createSidebarMenuItems, getMenuIcon } from '../inv-constants.js';

// Aliases pour compatibilité
const formatMontant = (amount, short = false) => short ? abbreviate(amount) : money(amount);
const formatDate = (d) => date(d);
const formatPourcent = (val) => percent(val);

// Mock data for a project
const MOCK_PROJET = {
  id: 'p1',
  code: 'PAPSE-II',
  nom: 'Programme d\'Appui au Plan Sectoriel Éducation II',
  description: 'Programme visant à améliorer l\'accès et la qualité de l\'éducation de base en Côte d\'Ivoire',
  typeProjet: 'TRANSFERT',
  natureProjet: 'RECURRENT',
  isOpe: false,
  isPrioritaire: true,
  statut: 'EN_COURS',
  phase: 'EXECUTE',

  // Entité
  typeEntite: 'UCP',
  entiteExecutante: 'UCP-PAPSE',
  entiteCode: 'UCP001',

  // Cadre institutionnel
  ministere: 'Ministère de l\'Éducation Nationale',
  ministereCode: 'MEN',
  secteur: 'Éducation',
  secteurCode: 'EDUCATION',
  domaine: 'Construction et équipement d\'écoles',

  // Localisation
  district: 'District d\'Abidjan',
  region: 'Abidjan',
  departement: 'Abidjan',
  commune: 'Cocody',

  // Financier
  coutTotal: 75000000000,
  devise: 'XOF',
  dureePrevueMois: 60,
  dateDebutPrevue: '2021-01-01',
  dateFinPrevue: '2025-12-31',

  // Sources de financement
  partEtat: 15000000000,
  partBailleur: 55000000000,
  partContrepartie: 5000000000,
  bailleurs: [
    { code: 'BM', nom: 'Banque Mondiale', montant: 40000000000, devise: 'XOF' },
    { code: 'AFD', nom: 'AFD', montant: 15000000000, devise: 'XOF' }
  ],

  // Acteurs
  controleurFinancier: 'M. KOUASSI Yao',
  coordonnateur: 'Dr. N\'GUESSAN Aka',
  responsableFinancier: 'Mme KOFFI Adjoua',
  specialisteMarche: 'M. TRAORE Moussa',

  // Données année courante
  budget2024: {
    montantNotifie: 45000000000,
    montantEclate: 44500000000,
    revisions: [
      { date: '2024-03-15', ancien: 42000000000, nouveau: 45000000000, motif: 'Ajustement LF complémentaire' }
    ]
  },

  budgetEclate: [
    { ua: 'UA-EDU-01', uaLib: 'Direction Infrastructure Scolaire', activite: 'ACT-001', activiteLib: 'Construction salles de classe', ligne: 'L-INV-01', montantPrevu: 25000000000, montantEngage: 22000000000 },
    { ua: 'UA-EDU-02', uaLib: 'Direction Équipement', activite: 'ACT-002', activiteLib: 'Équipement mobilier scolaire', ligne: 'L-INV-02', montantPrevu: 12000000000, montantEngage: 10500000000 },
    { ua: 'UA-EDU-03', uaLib: 'Direction Formation', activite: 'ACT-003', activiteLib: 'Formation des enseignants', ligne: 'L-INV-03', montantPrevu: 7500000000, montantEngage: 6800000000 }
  ],

  transferts: [
    { annee: 2024, trimestre: 1, montantPrevu: 12000000000, montantTransfere: 12000000000, dateOp: '2024-01-15', statut: 'TRANSFERE' },
    { annee: 2024, trimestre: 2, montantPrevu: 11500000000, montantTransfere: 11500000000, dateOp: '2024-04-10', statut: 'TRANSFERE' },
    { annee: 2024, trimestre: 3, montantPrevu: 11000000000, montantTransfere: 10000000000, dateOp: '2024-07-20', statut: 'PARTIEL' },
    { annee: 2024, trimestre: 4, montantPrevu: 10000000000, montantTransfere: 5000000000, dateOp: null, statut: 'EN_ATTENTE' }
  ],

  lettresAvance: [
    { reference: 'LA-2024-001', montant: 2500000000, dateEmission: '2024-02-20', dateEcheance: '2024-05-20', modalite: 'RESERVE', montantRegularise: 2500000000, dateRegularisation: '2024-05-15', statut: 'REGULARISEE' },
    { reference: 'LA-2024-002', montant: 1800000000, dateEmission: '2024-08-10', dateEcheance: '2024-11-10', modalite: 'RALLONGE', montantRegularise: 500000000, dateRegularisation: null, statut: 'PARTIELLE' }
  ],

  composantes: [
    { code: 'C1', nom: 'Infrastructure scolaire', coutPrevu: 40000000000, coutActuel: 38000000000, zone: 'National', livrables: ['500 salles de classe', '50 blocs sanitaires'] },
    { code: 'C2', nom: 'Équipement et matériel', coutPrevu: 20000000000, coutActuel: 19500000000, zone: 'National', livrables: ['25 000 tables-bancs', '5 000 kits enseignants'] },
    { code: 'C3', nom: 'Renforcement des capacités', coutPrevu: 15000000000, coutActuel: 15000000000, zone: 'National', livrables: ['10 000 enseignants formés', '500 directeurs formés'] }
  ],

  activitesPTBA: [
    { code: 'A1.1', libelle: 'Construction salles de classe', composante: 'C1', dateDebut: '2024-01-15', dateFin: '2024-12-31', budget: 25000000000, statut: 'EN_COURS', tauxRealisation: 72 },
    { code: 'A1.2', libelle: 'Construction blocs sanitaires', composante: 'C1', dateDebut: '2024-03-01', dateFin: '2024-11-30', budget: 8000000000, statut: 'EN_COURS', tauxRealisation: 65 },
    { code: 'A2.1', libelle: 'Acquisition mobilier scolaire', composante: 'C2', dateDebut: '2024-02-01', dateFin: '2024-10-31', budget: 12000000000, statut: 'EN_COURS', tauxRealisation: 80 },
    { code: 'A3.1', libelle: 'Formation continue enseignants', composante: 'C3', dateDebut: '2024-04-01', dateFin: '2024-12-15', budget: 7500000000, statut: 'PLANIFIE', tauxRealisation: 45 }
  ],

  suiviPhysique: [
    { date: '2024-09-15', type: 'MISSION_TERRAIN', typeMission: 'PERIODIQUE', localisation: 'Bouaké', resultat: 'CONFORME', observations: 'Construction en bonne progression, 85% des travaux terminés', photos: 3 },
    { date: '2024-08-01', type: 'RSF', classeRsf: 2, localisation: 'Abidjan', resultat: 'CONFORME', observations: 'RSF validé - Pièces justificatives conformes' },
    { date: '2024-06-20', type: 'MISSION_TERRAIN', typeMission: 'PONCTUELLE', localisation: 'Korhogo', resultat: 'ECART_MINEUR', observations: 'Retard mineur sur livraison équipements (2 semaines)', photos: 5 }
  ],

  situationFinanciere: {
    montantNotifie: 45000000000,
    montantEclate: 44500000000,
    montantTransfere: 38500000000,
    montantExecute: 32100000000,
    rae: 6400000000,
    rab: 12900000000,
    tauxExecution: 83.4,
    tauxAbsorption: 71.3
  },

  glissements: [
    { anneeOrigine: 2023, anneeDestination: 2024, montantInitial: 42000000000, montantRealise: 35000000000, montantGlisse: 7000000000, ecartPourcentage: -16.7, categorieMotif: 'ADMINISTRATIF', motif: 'Retard procédures marché' },
    { anneeOrigine: 2022, anneeDestination: 2023, montantInitial: 38000000000, montantRealise: 32000000000, montantGlisse: 6000000000, ecartPourcentage: -15.8, categorieMotif: 'TECHNIQUE', motif: 'Difficultés terrain' }
  ],

  indicateursGAR: [
    { code: 'IND-01', niveau: 'OUTPUT', libelle: 'Nombre de salles de classe construites', unite: 'Nombre', baseline: 0, cibles: [{ annee: 2024, valeur: 300 }, { annee: 2025, valeur: 500 }], valeurActuelle: 245, statut: 'EN_BONNE_VOIE' },
    { code: 'IND-02', niveau: 'OUTPUT', libelle: 'Nombre d\'enseignants formés', unite: 'Nombre', baseline: 0, cibles: [{ annee: 2024, valeur: 5000 }, { annee: 2025, valeur: 10000 }], valeurActuelle: 4200, statut: 'EN_BONNE_VOIE' },
    { code: 'IND-03', niveau: 'OUTCOME', libelle: 'Taux de scolarisation primaire', unite: '%', baseline: 78.5, cibles: [{ annee: 2024, valeur: 82 }, { annee: 2025, valeur: 85 }], valeurActuelle: 80.2, statut: 'A_RISQUE' },
    { code: 'IND-04', niveau: 'IMPACT', libelle: 'Taux d\'achèvement du primaire', unite: '%', baseline: 65.0, cibles: [{ annee: 2025, valeur: 75 }], valeurActuelle: 68.5, statut: 'EN_BONNE_VOIE' }
  ],

  documents: [
    { categorie: 'FICHE_VIE', titre: 'Fiche de vie du projet', reference: 'FV-PAPSE-2024', date: '2024-01-15', statut: 'VALIDE' },
    { categorie: 'PTBA', titre: 'PTBA 2024', reference: 'PTBA-2024-001', date: '2024-01-10', statut: 'VALIDE' },
    { categorie: 'DECISION_CF', titre: 'Avis CF sur avenant n°2', reference: 'DCF-2024-045', date: '2024-06-20', statut: 'VALIDE' },
    { categorie: 'RAPPORT', titre: 'Rapport d\'avancement T3 2024', reference: 'RAP-Q3-2024', date: '2024-10-05', statut: 'DRAFT' }
  ],

  alertes: [
    { type: 'LETTRE_AVANCE_NON_REGULARISEE', priorite: 'MAJEURE', titre: 'Lettre d\'avance partiellement régularisée', description: 'LA-2024-002: 1,3 Mds restant à régulariser' }
  ]
};

// Tab state
let activeTab = 'signaletique';

/**
 * Render Investissement sidebar
 */
function renderInvSidebar(activeRoute) {
  return el('aside', { className: 'sidebar inv-sidebar' }, [
    el('div', { className: 'sidebar-header' }, [
      el('h2', { className: 'sidebar-title' }, 'Investissement'),
      el('button', {
        className: 'btn btn-sm btn-ghost',
        onclick: () => router.navigate('/portal')
      }, 'Portail')
    ]),
    el('nav', { className: 'sidebar-nav' },
      createSidebarMenuItems(el, activeRoute)
    )
  ]);
}

/**
 * Render project header
 */
function renderProjetHeader(projet) {
  return el('div', { className: 'projet-header' }, [
    el('div', { className: 'projet-header-main' }, [
      el('div', { className: 'projet-badges' }, [
        el('span', { className: `badge badge-${getTypeBadgeColor(projet.typeProjet)}` }, projet.typeProjet),
        el('span', { className: `badge badge-${getStatutBadgeColor(projet.statut)}` }, projet.statut),
        el('span', { className: `badge badge-${getPhaseBadgeColor(projet.phase)}` }, projet.phase),
        projet.isOpe && el('span', { className: 'badge badge-warning' }, 'OPE'),
        projet.isPrioritaire && el('span', { className: 'badge badge-info' }, 'PRIORITAIRE')
      ]),
      el('h1', { className: 'projet-title' }, [
        el('span', { className: 'projet-code' }, projet.code),
        el('span', { className: 'projet-sep' }, ' — '),
        el('span', { className: 'projet-nom' }, projet.nom)
      ]),
      el('p', { className: 'projet-description' }, projet.description)
    ]),
    el('div', { className: 'projet-header-stats' }, [
      el('div', { className: 'stat-item' }, [
        el('div', { className: 'stat-value' }, formatMontant(projet.coutTotal)),
        el('div', { className: 'stat-label' }, 'Coût total')
      ]),
      el('div', { className: 'stat-item' }, [
        el('div', { className: 'stat-value' }, formatMontant(projet.situationFinanciere.montantExecute)),
        el('div', { className: 'stat-label' }, 'Exécuté ' + getCurrentYear())
      ]),
      el('div', { className: 'stat-item' }, [
        el('div', { className: `stat-value ${getTauxClass(projet.situationFinanciere.tauxExecution)}` },
          formatPourcent(projet.situationFinanciere.tauxExecution)),
        el('div', { className: 'stat-label' }, 'Taux d\'exécution')
      ]),
      projet.alertes.length > 0 && el('div', { className: 'stat-item stat-alertes' }, [
        el('div', { className: 'stat-value' }, String(projet.alertes.length)),
        el('div', { className: 'stat-label' }, 'Alerte(s)')
      ])
    ])
  ]);
}

/**
 * Render tabs navigation
 */
function renderTabs() {
  const tabs = [
    { id: 'signaletique', label: 'Signalétique', icon: '📋' },
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'transferts', label: 'Transferts', icon: '➡️' },
    { id: 'ptba', label: 'PTBA', icon: '📅' },
    { id: 'physique', label: 'Suivi physique', icon: '🏗️' },
    { id: 'financier', label: 'Suivi financier', icon: '📊' },
    { id: 'gar', label: 'GAR', icon: '🎯' },
    { id: 'documents', label: 'Documents', icon: '📁' }
  ];

  return el('div', { className: 'tabs-nav' },
    tabs.map(tab =>
      el('button', {
        className: `tab-btn ${activeTab === tab.id ? 'active' : ''}`,
        onclick: () => {
          activeTab = tab.id;
          updateTabContent(MOCK_PROJET);
        }
      }, [
        el('span', { className: 'tab-icon' }, tab.icon),
        el('span', { className: 'tab-label' }, tab.label)
      ])
    )
  );
}

/**
 * Render tab content
 */
function renderTabContent(projet) {
  switch (activeTab) {
    case 'signaletique': return renderSignaletique(projet);
    case 'budget': return renderBudget(projet);
    case 'transferts': return renderTransferts(projet);
    case 'ptba': return renderPTBA(projet);
    case 'physique': return renderSuiviPhysique(projet);
    case 'financier': return renderSuiviFinancier(projet);
    case 'gar': return renderGAR(projet);
    case 'documents': return renderDocuments(projet);
    default: return renderSignaletique(projet);
  }
}

// ============================================
// TAB: Signalétique
// ============================================
function renderSignaletique(projet) {
  return el('div', { className: 'tab-content' }, [
    // Identification
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Identification'),
      el('div', { className: 'info-grid' }, [
        renderInfoItem('Code', projet.code),
        renderInfoItem('Type', projet.typeProjet),
        renderInfoItem('Nature', projet.natureProjet),
        renderInfoItem('OPE', projet.isOpe ? 'Oui' : 'Non'),
        renderInfoItem('Prioritaire', projet.isPrioritaire ? 'Oui' : 'Non'),
        renderInfoItem('Statut', projet.statut),
        renderInfoItem('Phase', projet.phase)
      ])
    ]),

    // Cadre institutionnel
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Cadre institutionnel'),
      el('div', { className: 'info-grid' }, [
        renderInfoItem('Ministère', projet.ministere),
        renderInfoItem('Secteur', projet.secteur),
        renderInfoItem('Domaine', projet.domaine)
      ])
    ]),

    // Entité exécutante
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Entité exécutante'),
      el('div', { className: 'info-grid' }, [
        renderInfoItem('Type', projet.typeEntite),
        renderInfoItem('Nom', projet.entiteExecutante),
        renderInfoItem('Code', projet.entiteCode)
      ])
    ]),

    // Localisation
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Localisation'),
      el('div', { className: 'info-grid' }, [
        renderInfoItem('District', projet.district),
        renderInfoItem('Région', projet.region),
        renderInfoItem('Département', projet.departement),
        renderInfoItem('Commune', projet.commune)
      ])
    ]),

    // Acteurs
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Acteurs'),
      el('div', { className: 'info-grid' }, [
        renderInfoItem('Contrôleur Financier', projet.controleurFinancier),
        renderInfoItem('Coordonnateur', projet.coordonnateur),
        renderInfoItem('Responsable Financier', projet.responsableFinancier),
        renderInfoItem('Spécialiste Marché', projet.specialisteMarche)
      ])
    ]),

    // Financement
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Sources de financement'),
      el('div', { className: 'info-grid' }, [
        renderInfoItem('Coût total', formatMontant(projet.coutTotal)),
        renderInfoItem('Part État', formatMontant(projet.partEtat)),
        renderInfoItem('Part Bailleur(s)', formatMontant(projet.partBailleur)),
        renderInfoItem('Contrepartie', formatMontant(projet.partContrepartie))
      ]),
      el('div', { className: 'bailleurs-list' }, [
        el('h4', {}, 'Bailleurs'),
        el('ul', {},
          projet.bailleurs.map(b =>
            el('li', {}, `${b.nom} (${b.code}): ${formatMontant(b.montant)}`)
          )
        )
      ])
    ])
  ]);
}

// ============================================
// TAB: Budget
// ============================================
function renderBudget(projet) {
  const budget = projet.budget2024;
  const ecart = budget.montantNotifie - budget.montantEclate;

  return el('div', { className: 'tab-content' }, [
    // Budget global
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Budget ' + getCurrentYear()),
      el('div', { className: 'budget-summary' }, [
        el('div', { className: 'budget-item' }, [
          el('div', { className: 'budget-label' }, 'Montant notifié (LF)'),
          el('div', { className: 'budget-value' }, formatMontant(budget.montantNotifie))
        ]),
        el('div', { className: 'budget-item' }, [
          el('div', { className: 'budget-label' }, 'Montant éclaté'),
          el('div', { className: 'budget-value' }, formatMontant(budget.montantEclate))
        ]),
        el('div', { className: `budget-item ${ecart !== 0 ? 'budget-alert' : ''}` }, [
          el('div', { className: 'budget-label' }, 'Écart Notifié/Éclaté'),
          el('div', { className: 'budget-value' }, formatMontant(ecart))
        ])
      ])
    ]),

    // Historique révisions
    budget.revisions.length > 0 && el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Historique des révisions'),
      el('table', { className: 'table table-sm' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Date'),
            el('th', { className: 'text-right' }, 'Ancien'),
            el('th', { className: 'text-right' }, 'Nouveau'),
            el('th', {}, 'Motif')
          ])
        ]),
        el('tbody', {},
          budget.revisions.map(rev =>
            el('tr', {}, [
              el('td', {}, formatDate(rev.date)),
              el('td', { className: 'text-right' }, formatMontant(rev.ancien)),
              el('td', { className: 'text-right' }, formatMontant(rev.nouveau)),
              el('td', {}, rev.motif)
            ])
          )
        )
      ])
    ]),

    // Budget éclaté
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Budget éclaté par ligne'),
      projet.typeProjet === 'TRANSFERT' && projet.budgetEclate.length === 0 &&
        el('div', { className: 'alert alert-error' }, [
          el('strong', {}, 'Alerte: '),
          'Projet en transfert sans budget éclaté. Le second transfert ne peut être effectué.'
        ]),
      el('table', { className: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'UA'),
            el('th', {}, 'Activité'),
            el('th', {}, 'Ligne'),
            el('th', { className: 'text-right' }, 'Prévu'),
            el('th', { className: 'text-right' }, 'Engagé'),
            el('th', { className: 'text-right' }, '% Eng.')
          ])
        ]),
        el('tbody', {},
          projet.budgetEclate.map(line =>
            el('tr', {}, [
              el('td', {}, [
                el('div', {}, line.ua),
                el('div', { className: 'text-sm text-muted' }, line.uaLib)
              ]),
              el('td', {}, line.activiteLib),
              el('td', {}, line.ligne),
              el('td', { className: 'text-right' }, formatMontant(line.montantPrevu)),
              el('td', { className: 'text-right' }, formatMontant(line.montantEngage)),
              el('td', { className: 'text-right' }, formatPourcent(line.montantEngage / line.montantPrevu * 100))
            ])
          )
        )
      ])
    ])
  ]);
}

// ============================================
// TAB: Transferts & Lettres d'avance
// ============================================
function renderTransferts(projet) {
  const totalPrevu = projet.transferts.reduce((s, t) => s + t.montantPrevu, 0);
  const totalTransfere = projet.transferts.reduce((s, t) => s + t.montantTransfere, 0);

  return el('div', { className: 'tab-content' }, [
    // Transferts trimestriels
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Transferts ' + getCurrentYear()),
      el('table', { className: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Trimestre'),
            el('th', { className: 'text-right' }, 'Prévu'),
            el('th', { className: 'text-right' }, 'Transféré'),
            el('th', {}, 'Date OP'),
            el('th', { className: 'text-right' }, 'Écart'),
            el('th', {}, 'Statut')
          ])
        ]),
        el('tbody', {}, [
          ...projet.transferts.map(t =>
            el('tr', {}, [
              el('td', {}, `T${t.trimestre}`),
              el('td', { className: 'text-right' }, formatMontant(t.montantPrevu)),
              el('td', { className: 'text-right' }, formatMontant(t.montantTransfere)),
              el('td', {}, t.dateOp ? formatDate(t.dateOp) : '-'),
              el('td', { className: `text-right ${t.montantTransfere < t.montantPrevu ? 'text-error' : ''}` },
                formatMontant(t.montantTransfere - t.montantPrevu)),
              el('td', {}, [
                el('span', { className: `badge badge-${getTransfertBadgeColor(t.statut)}` }, t.statut)
              ])
            ])
          ),
          el('tr', { className: 'total-row' }, [
            el('td', {}, 'Total'),
            el('td', { className: 'text-right font-bold' }, formatMontant(totalPrevu)),
            el('td', { className: 'text-right font-bold' }, formatMontant(totalTransfere)),
            el('td', {}, ''),
            el('td', { className: 'text-right font-bold' }, formatMontant(totalTransfere - totalPrevu)),
            el('td', {}, formatPourcent(totalTransfere / totalPrevu * 100))
          ])
        ])
      ])
    ]),

    // Lettres d'avance
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Lettres d\'avance'),
      projet.lettresAvance.length === 0
        ? el('p', { className: 'text-muted' }, 'Aucune lettre d\'avance')
        : el('table', { className: 'table' }, [
            el('thead', {}, [
              el('tr', {}, [
                el('th', {}, 'Référence'),
                el('th', { className: 'text-right' }, 'Montant'),
                el('th', {}, 'Émission'),
                el('th', {}, 'Échéance'),
                el('th', {}, 'Modalité'),
                el('th', { className: 'text-right' }, 'Régularisé'),
                el('th', {}, 'Statut')
              ])
            ]),
            el('tbody', {},
              projet.lettresAvance.map(la => {
                const isOverdue = la.statut !== 'REGULARISEE' && new Date(la.dateEcheance) < new Date();
                return el('tr', { className: isOverdue ? 'row-warning' : '' }, [
                  el('td', {}, la.reference),
                  el('td', { className: 'text-right' }, formatMontant(la.montant)),
                  el('td', {}, formatDate(la.dateEmission)),
                  el('td', { className: isOverdue ? 'text-error' : '' }, formatDate(la.dateEcheance)),
                  el('td', {}, la.modalite),
                  el('td', { className: 'text-right' }, formatMontant(la.montantRegularise)),
                  el('td', {}, [
                    el('span', { className: `badge badge-${getLettreAvanceBadgeColor(la.statut)}` }, la.statut)
                  ])
                ]);
              })
            )
          ])
    ])
  ]);
}

// ============================================
// TAB: PTBA & Composantes
// ============================================
function renderPTBA(projet) {
  return el('div', { className: 'tab-content' }, [
    // Composantes
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Composantes du projet'),
      el('div', { className: 'composantes-grid' },
        projet.composantes.map(comp =>
          el('div', { className: 'composante-card' }, [
            el('div', { className: 'composante-header' }, [
              el('span', { className: 'composante-code' }, comp.code),
              el('span', { className: 'composante-nom' }, comp.nom)
            ]),
            el('div', { className: 'composante-body' }, [
              el('div', { className: 'composante-budget' }, [
                el('div', {}, `Prévu: ${formatMontant(comp.coutPrevu)}`),
                el('div', {}, `Actuel: ${formatMontant(comp.coutActuel)}`)
              ]),
              el('div', { className: 'composante-zone' }, `Zone: ${comp.zone}`),
              el('div', { className: 'composante-livrables' }, [
                el('strong', {}, 'Livrables:'),
                el('ul', {}, comp.livrables.map(l => el('li', {}, l)))
              ])
            ])
          ])
        )
      )
    ]),

    // Activités PTBA
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Activités PTBA ' + getCurrentYear()),
      el('table', { className: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Code'),
            el('th', {}, 'Activité'),
            el('th', {}, 'Composante'),
            el('th', {}, 'Période'),
            el('th', { className: 'text-right' }, 'Budget'),
            el('th', {}, 'Statut'),
            el('th', { className: 'text-center' }, '% Réal.')
          ])
        ]),
        el('tbody', {},
          projet.activitesPTBA.map(act =>
            el('tr', {}, [
              el('td', {}, act.code),
              el('td', {}, act.libelle),
              el('td', {}, act.composante),
              el('td', {}, `${formatDate(act.dateDebut)} → ${formatDate(act.dateFin)}`),
              el('td', { className: 'text-right' }, formatMontant(act.budget)),
              el('td', {}, [
                el('span', { className: `badge badge-${getStatutActiviteBadgeColor(act.statut)}` }, act.statut)
              ]),
              el('td', { className: 'text-center' }, [
                el('div', { className: 'progress-bar' }, [
                  el('div', {
                    className: 'progress-fill',
                    style: `width: ${act.tauxRealisation}%`
                  }),
                  el('span', { className: 'progress-label' }, `${act.tauxRealisation}%`)
                ])
              ])
            ])
          )
        )
      ])
    ])
  ]);
}

// ============================================
// TAB: Suivi physique
// ============================================
function renderSuiviPhysique(projet) {
  return el('div', { className: 'tab-content' }, [
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Suivi physique et missions terrain'),
      el('table', { className: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Date'),
            el('th', {}, 'Type'),
            el('th', {}, 'Localisation'),
            el('th', {}, 'Résultat'),
            el('th', {}, 'Observations'),
            el('th', { className: 'text-center' }, 'Photos')
          ])
        ]),
        el('tbody', {},
          projet.suiviPhysique.map(suivi =>
            el('tr', {}, [
              el('td', {}, formatDate(suivi.date)),
              el('td', {}, [
                el('span', { className: 'badge badge-info' }, suivi.type),
                suivi.classeRsf && el('span', { className: 'text-sm' }, ` (Classe ${suivi.classeRsf})`),
                suivi.typeMission && el('span', { className: 'text-sm' }, ` - ${suivi.typeMission}`)
              ]),
              el('td', {}, suivi.localisation),
              el('td', {}, [
                el('span', { className: `badge badge-${getResultatBadgeColor(suivi.resultat)}` }, suivi.resultat)
              ]),
              el('td', {}, suivi.observations),
              el('td', { className: 'text-center' }, suivi.photos ? `${suivi.photos} 📷` : '-')
            ])
          )
        )
      ])
    ]),

    // Règles de suivi
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Règles de suivi'),
      el('div', { className: 'rules-info' }, [
        el('div', { className: 'rule-item' }, [
          el('strong', {}, 'Classe 2: '),
          'RSF systématiques obligatoires avec preuves physiques'
        ]),
        el('div', { className: 'rule-item' }, [
          el('strong', {}, 'Classe 6: '),
          'RSF non systématiques (suivi possible mais sans obligation image)'
        ]),
        el('div', { className: 'rule-item' }, [
          el('strong', {}, 'Mission baseline: '),
          'Obligatoire après OS de démarrage'
        ]),
        el('div', { className: 'rule-item' }, [
          el('strong', {}, 'Missions périodiques: '),
          'Par défaut tous les 2 mois pour opérations dans le temps'
        ])
      ])
    ])
  ]);
}

// ============================================
// TAB: Suivi financier & glissements
// ============================================
function renderSuiviFinancier(projet) {
  const sf = projet.situationFinanciere;

  return el('div', { className: 'tab-content' }, [
    // Situation financière
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Situation financière ' + getCurrentYear()),
      el('div', { className: 'finance-grid' }, [
        el('div', { className: 'finance-item' }, [
          el('div', { className: 'finance-label' }, 'Notifié'),
          el('div', { className: 'finance-value' }, formatMontant(sf.montantNotifie))
        ]),
        el('div', { className: 'finance-item' }, [
          el('div', { className: 'finance-label' }, 'Éclaté'),
          el('div', { className: 'finance-value' }, formatMontant(sf.montantEclate))
        ]),
        el('div', { className: 'finance-item' }, [
          el('div', { className: 'finance-label' }, 'Transféré'),
          el('div', { className: 'finance-value' }, formatMontant(sf.montantTransfere))
        ]),
        el('div', { className: 'finance-item finance-highlight' }, [
          el('div', { className: 'finance-label' }, 'Exécuté'),
          el('div', { className: 'finance-value' }, formatMontant(sf.montantExecute))
        ]),
        el('div', { className: 'finance-item' }, [
          el('div', { className: 'finance-label' }, 'RAE'),
          el('div', { className: 'finance-value' }, formatMontant(sf.rae))
        ]),
        el('div', { className: 'finance-item' }, [
          el('div', { className: 'finance-label' }, 'RAB'),
          el('div', { className: 'finance-value' }, formatMontant(sf.rab))
        ])
      ]),
      el('div', { className: 'taux-grid' }, [
        el('div', { className: 'taux-item' }, [
          el('div', { className: 'taux-label' }, 'Taux d\'exécution'),
          el('div', { className: `taux-value ${getTauxClass(sf.tauxExecution)}` }, formatPourcent(sf.tauxExecution))
        ]),
        el('div', { className: 'taux-item' }, [
          el('div', { className: 'taux-label' }, 'Taux d\'absorption'),
          el('div', { className: `taux-value ${getTauxClass(sf.tauxAbsorption)}` }, formatPourcent(sf.tauxAbsorption))
        ])
      ])
    ]),

    // Glissements
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Glissements budgétaires'),
      el('table', { className: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Année origine'),
            el('th', {}, 'Année dest.'),
            el('th', { className: 'text-right' }, 'Initial'),
            el('th', { className: 'text-right' }, 'Réalisé'),
            el('th', { className: 'text-right' }, 'Glissé'),
            el('th', { className: 'text-right' }, 'Écart %'),
            el('th', {}, 'Motif')
          ])
        ]),
        el('tbody', {},
          projet.glissements.map(g => {
            const isCritique = Math.abs(g.ecartPourcentage) > 30;
            return el('tr', { className: isCritique ? 'row-error' : '' }, [
              el('td', {}, String(g.anneeOrigine)),
              el('td', {}, String(g.anneeDestination)),
              el('td', { className: 'text-right' }, formatMontant(g.montantInitial)),
              el('td', { className: 'text-right' }, formatMontant(g.montantRealise)),
              el('td', { className: 'text-right' }, formatMontant(g.montantGlisse)),
              el('td', { className: `text-right ${isCritique ? 'text-error font-bold' : ''}` },
                `${g.ecartPourcentage > 0 ? '+' : ''}${g.ecartPourcentage.toFixed(1)}%`),
              el('td', {}, [
                el('span', { className: 'badge badge-default' }, g.categorieMotif),
                el('div', { className: 'text-sm' }, g.motif)
              ])
            ]);
          })
        )
      ]),
      el('div', { className: 'alert alert-warning' }, [
        el('strong', {}, 'Règle: '),
        'Variation du coût > 30% implique des nouveaux marchés et déclenche une alerte critique.'
      ])
    ])
  ]);
}

// ============================================
// TAB: GAR
// ============================================
function renderGAR(projet) {
  const byNiveau = {
    OUTPUT: projet.indicateursGAR.filter(i => i.niveau === 'OUTPUT'),
    OUTCOME: projet.indicateursGAR.filter(i => i.niveau === 'OUTCOME'),
    IMPACT: projet.indicateursGAR.filter(i => i.niveau === 'IMPACT')
  };

  return el('div', { className: 'tab-content' }, [
    Object.entries(byNiveau).map(([niveau, indicateurs]) =>
      indicateurs.length > 0 && el('div', { className: 'section' }, [
        el('h3', { className: 'section-title' }, getNiveauLabel(niveau)),
        el('table', { className: 'table' }, [
          el('thead', {}, [
            el('tr', {}, [
              el('th', {}, 'Code'),
              el('th', {}, 'Indicateur'),
              el('th', { className: 'text-center' }, 'Baseline'),
              el('th', { className: 'text-center' }, `Cible ${getCurrentYear()}`),
              el('th', { className: 'text-center' }, 'Valeur actuelle'),
              el('th', { className: 'text-center' }, 'Écart'),
              el('th', {}, 'Statut')
            ])
          ]),
          el('tbody', {},
            indicateurs.map(ind => {
              const cibleAnnee = ind.cibles.find(c => c.annee === getCurrentYear());
              const cible = cibleAnnee ? cibleAnnee.valeur : '-';
              const ecart = cible !== '-' && ind.valeurActuelle
                ? ((ind.valeurActuelle - cible) / cible * 100).toFixed(1)
                : null;

              return el('tr', {}, [
                el('td', {}, ind.code),
                el('td', {}, [
                  el('div', {}, ind.libelle),
                  el('div', { className: 'text-sm text-muted' }, `Unité: ${ind.unite}`)
                ]),
                el('td', { className: 'text-center' }, ind.baseline !== null ? String(ind.baseline) : '-'),
                el('td', { className: 'text-center' }, String(cible)),
                el('td', { className: 'text-center font-bold' }, ind.valeurActuelle !== null ? String(ind.valeurActuelle) : '-'),
                el('td', { className: `text-center ${ecart && parseFloat(ecart) < 0 ? 'text-error' : ''}` },
                  ecart ? `${ecart > 0 ? '+' : ''}${ecart}%` : '-'),
                el('td', {}, [
                  el('span', { className: `badge badge-${getGARStatutBadgeColor(ind.statut)}` }, ind.statut.replace('_', ' '))
                ])
              ]);
            })
          )
        ])
      ])
    )
  ]);
}

// ============================================
// TAB: Documents
// ============================================
function renderDocuments(projet) {
  return el('div', { className: 'tab-content' }, [
    el('div', { className: 'section' }, [
      el('h3', { className: 'section-title' }, 'Documents du projet'),
      el('table', { className: 'table' }, [
        el('thead', {}, [
          el('tr', {}, [
            el('th', {}, 'Catégorie'),
            el('th', {}, 'Titre'),
            el('th', {}, 'Référence'),
            el('th', {}, 'Date'),
            el('th', {}, 'Statut'),
            el('th', {}, '')
          ])
        ]),
        el('tbody', {},
          projet.documents.map(doc =>
            el('tr', {}, [
              el('td', {}, [
                el('span', { className: 'badge badge-default' }, doc.categorie)
              ]),
              el('td', {}, doc.titre),
              el('td', {}, doc.reference),
              el('td', {}, formatDate(doc.date)),
              el('td', {}, [
                el('span', { className: `badge badge-${getDocStatutBadgeColor(doc.statut)}` }, doc.statut)
              ]),
              el('td', {}, [
                el('button', { className: 'btn btn-sm btn-ghost' }, '📄 Voir')
              ])
            ])
          )
        )
      ])
    ])
  ]);
}

// ============================================
// Helper functions
// ============================================
function renderInfoItem(label, value) {
  return el('div', { className: 'info-item' }, [
    el('div', { className: 'info-label' }, label),
    el('div', { className: 'info-value' }, value || '-')
  ]);
}

function getTypeBadgeColor(type) {
  const colors = { 'SIGOBE': 'primary', 'TRANSFERT': 'warning', 'HORS_SIGOBE': 'info' };
  return colors[type] || 'default';
}

function getStatutBadgeColor(statut) {
  const colors = {
    'PLANIFIE': 'info',
    'EN_COURS': 'primary',
    'SUSPENDU': 'warning',
    'TERMINE': 'success',
    'ABANDONNE': 'error'
  };
  return colors[statut] || 'default';
}

function getPhaseBadgeColor(phase) {
  const colors = { 'NOTIFIE': 'info', 'TRANSFERE': 'warning', 'ECLATE': 'primary', 'EXECUTE': 'success' };
  return colors[phase] || 'default';
}

function getTransfertBadgeColor(statut) {
  const colors = { 'PREVU': 'info', 'EN_ATTENTE': 'warning', 'TRANSFERE': 'success', 'PARTIEL': 'warning' };
  return colors[statut] || 'default';
}

function getLettreAvanceBadgeColor(statut) {
  const colors = { 'EMISE': 'info', 'PARTIELLE': 'warning', 'REGULARISEE': 'success', 'EXPIREE': 'error' };
  return colors[statut] || 'default';
}

function getStatutActiviteBadgeColor(statut) {
  const colors = { 'PLANIFIE': 'info', 'EN_COURS': 'primary', 'TERMINE': 'success', 'REPORTE': 'warning', 'ANNULE': 'error' };
  return colors[statut] || 'default';
}

function getResultatBadgeColor(resultat) {
  const colors = { 'CONFORME': 'success', 'ECART_MINEUR': 'info', 'ECART_MAJEUR': 'warning', 'NON_CONFORME': 'error' };
  return colors[resultat] || 'default';
}

function getGARStatutBadgeColor(statut) {
  const colors = { 'EN_BONNE_VOIE': 'success', 'A_RISQUE': 'warning', 'NON_ATTEINT': 'error', 'DEPASSE': 'primary' };
  return colors[statut] || 'default';
}

function getDocStatutBadgeColor(statut) {
  const colors = { 'DRAFT': 'info', 'VALIDE': 'success', 'REJETE': 'error', 'ARCHIVE': 'default' };
  return colors[statut] || 'default';
}

function getTauxClass(taux) {
  if (taux > 100) return 'taux-over';
  if (taux >= 80) return 'taux-good';
  if (taux >= 50) return 'taux-medium';
  return 'taux-low';
}

function getNiveauLabel(niveau) {
  const labels = {
    'OUTPUT': 'Produits (Outputs)',
    'OUTCOME': 'Effets (Outcomes)',
    'IMPACT': 'Impacts'
  };
  return labels[niveau] || niveau;
}

/**
 * Update tab content without full re-render
 */
function updateTabContent(projet) {
  const container = qs('#tab-content-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(renderTabContent(projet));
  }

  // Update tab buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    const tabId = btn.getAttribute('data-tab') || btn.textContent.toLowerCase().replace(/[^a-z]/g, '');
    btn.classList.toggle('active', btn.querySelector('.tab-label')?.textContent.toLowerCase().includes(activeTab.slice(0, 4)));
  });
  // Re-render tabs to update active state
  const tabsNav = qs('.tabs-nav');
  if (tabsNav) {
    tabsNav.parentNode.replaceChild(renderTabs(), tabsNav);
  }
}

/**
 * Main render function
 */
export async function renderInvProjetFiche(params = {}) {
  logger.info('[Investissement] Rendering Project Detail...');

  // Get project ID from URL params (passed by router)
  const projectId = params.id || 'p1';

  // For now, use mock data
  // TODO: Fetch from dataService
  const projet = MOCK_PROJET;

  const page = el('div', { className: 'page-layout inv-layout' }, [
    renderInvSidebar('/investissement/projets'),

    el('main', { className: 'page-main' }, [
      // Back button
      el('div', { className: 'page-nav' }, [
        el('a', {
          className: 'btn btn-ghost',
          href: '#/investissement/projets'
        }, '← Retour à la liste')
      ]),

      // Project header
      renderProjetHeader(projet),

      // Tabs
      renderTabs(),

      // Tab content
      el('div', { id: 'tab-content-container', className: 'tab-content-container' }, [
        renderTabContent(projet)
      ])
    ])
  ]);

  mount('#app', page);

  // Inject styles
  injectFicheStyles();

  logger.info('[Investissement] Project Detail rendered');
}

function injectFicheStyles() {
  const styleId = 'inv-fiche-styles';
  if (document.getElementById(styleId)) return;

  const styles = `
    .page-nav {
      margin-bottom: 1rem;
    }

    .projet-header {
      background: var(--color-surface);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--color-border);
    }

    .projet-header-main {
      margin-bottom: 1rem;
    }

    .projet-badges {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .projet-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .projet-code {
      color: var(--color-primary);
    }

    .projet-sep {
      color: var(--color-text-muted);
    }

    .projet-description {
      color: var(--color-text-muted);
      margin: 0;
    }

    .projet-header-stats {
      display: flex;
      gap: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      flex-wrap: wrap;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .stat-alertes .stat-value {
      color: var(--color-error);
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.25rem;
      background: var(--color-surface);
      padding: 0.5rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      overflow-x: auto;
      border: 1px solid var(--color-border);
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: var(--color-hover);
    }

    .tab-btn.active {
      background: var(--color-primary);
      color: white;
    }

    .tab-icon {
      font-size: 1rem;
    }

    /* Tab content */
    .tab-content-container {
      background: var(--color-surface);
      border-radius: 0.75rem;
      border: 1px solid var(--color-border);
    }

    .tab-content {
      padding: 1.5rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--color-border);
    }

    /* Info grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .info-item {
      padding: 0.75rem;
      background: var(--color-surface-alt);
      border-radius: 0.375rem;
    }

    .info-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-weight: 500;
    }

    /* Budget */
    .budget-summary {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .budget-item {
      padding: 1rem;
      background: var(--color-surface-alt);
      border-radius: 0.5rem;
      min-width: 200px;
    }

    .budget-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .budget-value {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .budget-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .budget-alert .budget-value {
      color: var(--color-error);
    }

    /* Finance grid */
    .finance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .finance-item {
      padding: 1rem;
      background: var(--color-surface-alt);
      border-radius: 0.5rem;
      text-align: center;
    }

    .finance-highlight {
      background: var(--color-primary);
      color: white;
    }

    .finance-label {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .finance-value {
      font-size: 1.125rem;
      font-weight: 700;
    }

    .taux-grid {
      display: flex;
      gap: 2rem;
      justify-content: center;
    }

    .taux-item {
      text-align: center;
    }

    .taux-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }

    .taux-value {
      font-size: 2rem;
      font-weight: 700;
    }

    .taux-good { color: var(--color-success); }
    .taux-medium { color: var(--color-warning); }
    .taux-low { color: var(--color-error); }
    .taux-over { color: var(--color-info); }

    /* Composantes */
    .composantes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }

    .composante-card {
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .composante-header {
      background: var(--color-surface-alt);
      padding: 0.75rem 1rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .composante-code {
      font-weight: 700;
      color: var(--color-primary);
    }

    .composante-nom {
      font-weight: 500;
    }

    .composante-body {
      padding: 1rem;
    }

    .composante-budget {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .composante-zone {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin-bottom: 0.5rem;
    }

    .composante-livrables {
      font-size: 0.875rem;
    }

    .composante-livrables ul {
      margin: 0.25rem 0 0 1rem;
      padding: 0;
    }

    /* Progress bar */
    .progress-bar {
      position: relative;
      height: 1.5rem;
      background: var(--color-border);
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: var(--color-primary);
      transition: width 0.3s;
    }

    .progress-label {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Rules info */
    .rules-info {
      background: var(--color-surface-alt);
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .rule-item {
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .rule-item:last-child {
      margin-bottom: 0;
    }

    /* Tables */
    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--color-border);
      text-align: center;
    }

    .table th {
      background: var(--color-surface-alt);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      text-align: center;
    }

    .table td:first-child,
    .table th:first-child {
      text-align: left;
    }

    .table-sm th,
    .table-sm td {
      padding: 0.5rem;
    }

    .total-row {
      background: var(--color-surface-alt);
      font-weight: 600;
    }

    .row-warning {
      background: #fffbeb;
    }

    .row-error {
      background: #fef2f2;
    }

    .text-error {
      color: var(--color-error);
    }

    .font-bold {
      font-weight: 700;
    }

    .bailleurs-list {
      margin-top: 1rem;
    }

    .bailleurs-list h4 {
      font-size: 0.875rem;
      margin: 0 0 0.5rem 0;
    }

    .bailleurs-list ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .bailleurs-list li {
      font-size: 0.875rem;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

export default renderInvProjetFiche;
