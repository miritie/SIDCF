#!/usr/bin/env node

/**
 * Script de génération de données seed cohérentes pour PostgreSQL
 * Crée un jeu de données réaliste pour le SIDCF Portal
 */

import pg from 'pg';

const { Client } = pg;

// Configuration de connexion Neon Database
const connectionString = 'postgresql://neondb_owner:npg_mSJIP0W2lLfw@ep-icy-wildflower-ah7opo0w-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Helper pour générer un UUID v4
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function seedDatabase() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connexion à la base de données PostgreSQL...');
    await client.connect();
    console.log('✅ Connecté !');

    // ============================================
    // 1. ENTREPRISES
    // ============================================
    console.log('\n📦 Création des entreprises...');

    const entreprises = [
      {
        id: uuid(),
        ncc: 'CI-ABJ-2020-001234',
        rccm: 'CI-ABJ-2020-M-12345',
        raison_sociale: 'SOGEFIM BTP',
        sigle: 'SOGEFIM',
        ifu: 'IFU1234567890',
        adresse: 'Avenue Marchand, Plateau, Abidjan',
        telephone: '+225 27 20 30 40 50',
        email: 'contact@sogefim.ci',
        contacts: JSON.stringify([
          { nom: 'KONE Mamadou', fonction: 'Directeur Général', tel: '+225 07 07 07 07 07', email: 'kone@sogefim.ci' }
        ]),
        banque: JSON.stringify({ code: 'SGBCI', libelle: 'Société Générale de Banques en Côte d\'Ivoire', agence: 'Plateau' }),
        compte: JSON.stringify({ type: 'IBAN', numero: 'CI93 SGCI 0123 4567 8901 2345 67', intitule: 'SOGEFIM BTP' }),
        actif: true
      },
      {
        id: uuid(),
        ncc: 'CI-ABJ-2019-005678',
        rccm: 'CI-ABJ-2019-M-54321',
        raison_sociale: 'COVEC SARL',
        sigle: 'COVEC',
        ifu: 'IFU9876543210',
        adresse: 'Zone Industrielle, Yopougon, Abidjan',
        telephone: '+225 27 20 40 50 60',
        email: 'info@covec.ci',
        contacts: JSON.stringify([
          { nom: 'YAO N\'guessan', fonction: 'Directeur Technique', tel: '+225 05 05 05 05 05', email: 'yao@covec.ci' }
        ]),
        banque: JSON.stringify({ code: 'BICICI', libelle: 'Banque Internationale pour le Commerce et l\'Industrie de la Côte d\'Ivoire', agence: 'Yopougon' }),
        compte: JSON.stringify({ type: 'IBAN', numero: 'CI93 BICI 9876 5432 1098 7654 32', intitule: 'COVEC SARL' }),
        actif: true
      },
      {
        id: uuid(),
        ncc: 'CI-ABJ-2021-007890',
        rccm: 'CI-ABJ-2021-M-78901',
        raison_sociale: 'ENTREPRISE KOUASSI ET FILS',
        sigle: 'EKF',
        ifu: 'IFU5551112222',
        adresse: 'Boulevard VGE, Cocody, Abidjan',
        telephone: '+225 27 22 33 44 55',
        email: 'contact@ekf.ci',
        contacts: JSON.stringify([
          { nom: 'KOUASSI Jean-Claude', fonction: 'Gérant', tel: '+225 01 02 03 04 05', email: 'jc.kouassi@ekf.ci' }
        ]),
        banque: JSON.stringify({ code: 'BIAO', libelle: 'Banque Internationale pour l\'Afrique Occidentale', agence: 'Cocody' }),
        compte: JSON.stringify({ type: 'IBAN', numero: 'CI93 BIAO 5551 1122 2233 3344 45', intitule: 'ENTREPRISE KOUASSI ET FILS' }),
        actif: true
      }
    ];

    for (const e of entreprises) {
      await client.query(`
        INSERT INTO entreprise (id, ncc, rccm, raison_sociale, sigle, ifu, adresse, telephone, email, contacts, banque, compte, actif)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13)
      `, [e.id, e.ncc, e.rccm, e.raison_sociale, e.sigle, e.ifu, e.adresse, e.telephone, e.email, e.contacts, e.banque, e.compte, e.actif]);
    }

    console.log(`✅ ${entreprises.length} entreprises créées`);

    // ============================================
    // 2. PPM PLAN
    // ============================================
    console.log('\n📋 Création du plan PPM...');

    const ppmPlanId = uuid();
    await client.query(`
      INSERT INTO ppm_plan (id, unite, exercice, source, auteur)
      VALUES ($1, $2, $3, $4, $5)
    `, [ppmPlanId, 'DCF', 2024, 'UNITAIRE', 'ADMIN']);

    console.log('✅ Plan PPM créé');

    // ============================================
    // 3. BUDGET LINES
    // ============================================
    console.log('\n💰 Création des lignes budgétaires...');

    const budgetLines = [
      {
        id: uuid(),
        section: '4',
        section_lib: 'Investissements',
        programme: '440',
        programme_lib: 'Infrastructures routières',
        grande_nature: '4',
        ua_code: '440-AGEROUTE',
        ua_lib: 'Agence de Gestion des Routes',
        zone_code: '01',
        zone_lib: 'District Autonome d\'Abidjan',
        action_code: '440-01',
        action_lib: 'Entretien routier urbain',
        activite_code: '440-01-001',
        activite_lib: 'Réhabilitation routes principales',
        type_financement: 'ETAT',
        source_financement: 'Trésor Public',
        ligne_code: '440.4.01.001',
        ligne_lib: 'Travaux de réhabilitation',
        ae: 5000000000,
        cp: 3000000000
      },
      {
        id: uuid(),
        section: '4',
        section_lib: 'Investissements',
        programme: '520',
        programme_lib: 'Enseignement et Formation',
        grande_nature: '4',
        ua_code: '520-MENA',
        ua_lib: 'Ministère de l\'Education Nationale',
        zone_code: '03',
        zone_lib: 'Région des Lagunes',
        action_code: '520-03',
        action_lib: 'Construction d\'établissements scolaires',
        activite_code: '520-03-005',
        activite_lib: 'Construction lycées et collèges',
        type_financement: 'DON',
        source_financement: 'BAD',
        ligne_code: '520.4.03.005',
        ligne_lib: 'Travaux de construction',
        ae: 8000000000,
        cp: 5000000000
      }
    ];

    for (const bl of budgetLines) {
      await client.query(`
        INSERT INTO budget_line (
          id, section, section_lib, programme, programme_lib, grande_nature,
          ua_code, ua_lib, zone_code, zone_lib, action_code, action_lib,
          activite_code, activite_lib, type_financement, source_financement,
          ligne_code, ligne_lib, ae, cp
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        bl.id, bl.section, bl.section_lib, bl.programme, bl.programme_lib, bl.grande_nature,
        bl.ua_code, bl.ua_lib, bl.zone_code, bl.zone_lib, bl.action_code, bl.action_lib,
        bl.activite_code, bl.activite_lib, bl.type_financement, bl.source_financement,
        bl.ligne_code, bl.ligne_lib, bl.ae, bl.cp
      ]);
    }

    console.log(`✅ ${budgetLines.length} lignes budgétaires créées`);

    // ============================================
    // 4. OPERATIONS (Marchés)
    // ============================================
    console.log('\n🏗️  Création des opérations (marchés)...');

    const operations = [
      {
        id: uuid(),
        plan_id: ppmPlanId,
        budget_line_id: budgetLines[0].id,
        unite: 'DCF',
        exercice: 2024,
        objet: 'Réhabilitation de la voie express de l\'aéroport',
        type_marche: 'TRAVAUX',
        mode_passation: 'AOI',
        categorie_procedure: 'INTERNATIONALE',
        nature_prix: 'FORFAITAIRE',
        revue: 'POSTERIORI',
        montant_previsionnel: 2500000000,
        montant_actuel: 2500000000,
        devise: 'XOF',
        type_financement: 'ETAT',
        source_financement: 'Trésor Public',
        duree_previsionnelle: 18,
        delai_execution: 540,
        categorie_prestation: 'INFRASTRUCTURE',
        beneficiaire: 'Usagers de l\'aéroport',
        livrables: JSON.stringify([]),
        chaine_budgetaire: JSON.stringify({
          section: '4',
          programme: '440',
          activite: '440-01-001',
          activiteCode: '440-01-001',
          nature: '4',
          ligneBudgetaire: '440.4.01.001',
          bailleur: 'ETAT'
        }),
        localisation: JSON.stringify({
          region: 'Abidjan',
          regionCode: '01',
          departement: 'Abidjan',
          departementCode: '01',
          sousPrefecture: 'Plateau',
          sousPrefectureCode: '01-01',
          localite: 'Aéroport FHB',
          longitude: -3.9269,
          latitude: 5.2612,
          coordsOK: true
        }),
        timeline: JSON.stringify(['PLANIF', 'PROC', 'ATTR']),
        etat: 'EN_PROC',
        proc_derogation: null
      },
      {
        id: uuid(),
        plan_id: ppmPlanId,
        budget_line_id: budgetLines[1].id,
        unite: 'DCF',
        exercice: 2024,
        objet: 'Construction de 5 lycées de proximité dans la région des Lagunes',
        type_marche: 'TRAVAUX',
        mode_passation: 'AON',
        categorie_procedure: 'NATIONALE',
        nature_prix: 'UNITAIRE',
        revue: 'POSTERIORI',
        montant_previsionnel: 4200000000,
        montant_actuel: 4200000000,
        devise: 'XOF',
        type_financement: 'DON',
        source_financement: 'BAD',
        duree_previsionnelle: 24,
        delai_execution: 720,
        categorie_prestation: 'INFRASTRUCTURE',
        beneficiaire: 'Élèves et enseignants',
        livrables: JSON.stringify([]),
        chaine_budgetaire: JSON.stringify({
          section: '4',
          programme: '520',
          activite: '520-03-005',
          activiteCode: '520-03-005',
          nature: '4',
          ligneBudgetaire: '520.4.03.005',
          bailleur: 'BAD'
        }),
        localisation: JSON.stringify({
          region: 'Lagunes',
          regionCode: '03',
          departement: 'Agnéby-Tiassa',
          departementCode: '03',
          sousPrefecture: 'Agboville',
          sousPrefectureCode: '03-01',
          localite: 'Agboville',
          longitude: -4.2144,
          latitude: 5.9328,
          coordsOK: true
        }),
        timeline: JSON.stringify(['PLANIF']),
        etat: 'PLANIFIE',
        proc_derogation: null
      }
    ];

    for (const op of operations) {
      await client.query(`
        INSERT INTO operation (
          id, plan_id, budget_line_id, unite, exercice, objet,
          type_marche, mode_passation, categorie_procedure, nature_prix, revue,
          montant_previsionnel, montant_actuel, devise, type_financement, source_financement,
          duree_previsionnelle, delai_execution, categorie_prestation, beneficiaire,
          livrables, chaine_budgetaire, localisation, timeline, etat, proc_derogation
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21::jsonb, $22::jsonb, $23::jsonb, $24::jsonb, $25, $26)
      `, [
        op.id, op.plan_id, op.budget_line_id, op.unite, op.exercice, op.objet,
        op.type_marche, op.mode_passation, op.categorie_procedure, op.nature_prix, op.revue,
        op.montant_previsionnel, op.montant_actuel, op.devise, op.type_financement, op.source_financement,
        op.duree_previsionnelle, op.delai_execution, op.categorie_prestation, op.beneficiaire,
        op.livrables, op.chaine_budgetaire, op.localisation, op.timeline, op.etat, op.proc_derogation
      ]);
    }

    console.log(`✅ ${operations.length} opérations créées`);

    // ============================================
    // 5. PROCEDURE pour première opération
    // ============================================
    console.log('\n📄 Création de la procédure...');

    const procedureId = uuid();
    await client.query(`
      INSERT INTO procedure (
        id, operation_id, commission, mode_passation, categorie,
        type_dossier_appel, dates, nb_offres_recues, nb_offres_classees, pv
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb)
    `, [
      procedureId,
      operations[0].id,
      'COJO',
      'AOI',
      'INTERNATIONALE',
      'DAO',
      JSON.stringify({
        ouverture: '2024-03-15T10:00:00Z',
        analyse: '2024-04-10T14:00:00Z',
        jugement: '2024-05-05T09:00:00Z'
      }),
      8,
      3,
      JSON.stringify({
        ouverture: 'doc_pv_ouverture_001.pdf',
        analyse: 'doc_pv_analyse_001.pdf',
        jugement: 'doc_pv_jugement_001.pdf'
      })
    ]);

    console.log('✅ Procédure créée');

    // ============================================
    // 6. ATTRIBUTION
    // ============================================
    console.log('\n🏆 Création de l\'attribution...');

    const attributionId = uuid();
    await client.query(`
      INSERT INTO attribution (
        id, operation_id, attributaire, montants, garanties, dates, decision_cf
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb)
    `, [
      attributionId,
      operations[0].id,
      JSON.stringify({
        singleOrGroup: 'SIMPLE',
        groupType: null,
        entrepriseId: entreprises[0].id,
        groupementId: null,
        entreprises: [entreprises[0].id]
      }),
      JSON.stringify({
        ht: 2450000000,
        ttc: 2891000000,
        confidentiel: false
      }),
      JSON.stringify({
        garantieAvance: { existe: true, montant: 490000000, dateEmission: '2024-05-20', dateEcheance: '2025-11-20', docRef: 'garantie_avance_001.pdf' },
        garantieBonneExec: { existe: true, montant: 245000000, dateEmission: '2024-05-20', dateEcheance: '2026-11-20', docRef: 'garantie_exec_001.pdf' },
        cautionnement: { existe: false, montant: 0, dateEmission: null, dateEcheance: null, docRef: null }
      }),
      JSON.stringify({
        signatureTitulaire: '2024-05-18',
        signatureAC: '2024-05-22',
        approbation: '2024-05-25',
        decisionCF: '2024-06-01'
      }),
      JSON.stringify({
        aReserves: false,
        typeReserve: null,
        motifReserve: '',
        commentaire: 'Contrat conforme aux dispositions réglementaires'
      })
    ]);

    console.log('✅ Attribution créée');

    // ============================================
    // Statistiques finales
    // ============================================
    console.log('\n📊 Statistiques finales :');

    const stats = await client.query('SELECT * FROM v_stats_global');
    console.log(stats.rows[0]);

    console.log('\n🎉 Seed data créées avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création du seed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée.');
  }
}

seedDatabase();
