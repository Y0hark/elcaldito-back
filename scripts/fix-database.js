#!/usr/bin/env node

/**
 * Script utilitaire pour diagnostiquer et corriger les problèmes de base de données
 */

const fs = require('fs');
const path = require('path');

async function diagnoseDatabase() {
  console.log('🔍 Diagnostic de la base de données...');
  
  try {
    // Charger Strapi
    const strapi = require('@strapi/strapi');
    const app = await strapi().load();
    
    const db = app.db.connection;
    
    // Vérifier si la table commandes existe
    const tableExists = await db.schema.hasTable('commandes');
    if (!tableExists) {
      console.log('❌ Table commandes n\'existe pas');
      return;
    }
    
    console.log('✅ Table commandes existe');
    
    // Vérifier les colonnes
    const columns = await db.raw("PRAGMA table_info(commandes)");
    const columnNames = columns.map(col => col.name);
    
    console.log('📋 Colonnes existantes:', columnNames);
    
    // Vérifier les colonnes requises
    const requiredColumns = ['id', 'paymentStatus', 'updatedAt', 'createdAt', 'publishedAt'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('⚠️ Colonnes manquantes:', missingColumns);
      
      // Ajouter les colonnes manquantes
      for (const column of missingColumns) {
        console.log(`🔄 Ajout de la colonne ${column}...`);
        
        try {
          switch (column) {
            case 'id':
              await db.raw(`
                ALTER TABLE commandes 
                ADD COLUMN id INTEGER PRIMARY KEY AUTOINCREMENT
              `);
              break;
            case 'paymentStatus':
              await db.raw(`
                ALTER TABLE commandes 
                ADD COLUMN paymentStatus TEXT DEFAULT 'pending'
              `);
              break;
            case 'updatedAt':
              await db.raw(`
                ALTER TABLE commandes 
                ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
              `);
              break;
            case 'createdAt':
              await db.raw(`
                ALTER TABLE commandes 
                ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
              `);
              break;
            case 'publishedAt':
              await db.raw(`
                ALTER TABLE commandes 
                ADD COLUMN publishedAt DATETIME
              `);
              break;
          }
          
          console.log(`✅ Colonne ${column} ajoutée`);
        } catch (error) {
          console.log(`❌ Erreur lors de l'ajout de ${column}:`, error.message);
        }
      }
    } else {
      console.log('✅ Toutes les colonnes requises sont présentes');
    }
    
    // Vérifier les données existantes
    const commandes = await db.raw('SELECT COUNT(*) as count FROM commandes');
    console.log(`📊 Nombre de commandes: ${commandes[0].count}`);
    
    // Vérifier les commandes sans paymentStatus
    const commandesWithoutStatus = await db.raw(`
      SELECT COUNT(*) as count 
      FROM commandes 
      WHERE paymentStatus IS NULL OR paymentStatus = ''
    `);
    
    if (commandesWithoutStatus[0].count > 0) {
      console.log(`⚠️ ${commandesWithoutStatus[0].count} commandes sans paymentStatus`);
      
      // Mettre à jour les commandes sans paymentStatus
      await db.raw(`
        UPDATE commandes 
        SET paymentStatus = 'pending' 
        WHERE paymentStatus IS NULL OR paymentStatus = ''
      `);
      
      console.log('✅ Commandes mises à jour avec paymentStatus par défaut');
    }
    
    // Vérifier les commandes sans updatedAt
    const commandesWithoutUpdatedAt = await db.raw(`
      SELECT COUNT(*) as count 
      FROM commandes 
      WHERE updatedAt IS NULL
    `);
    
    if (commandesWithoutUpdatedAt[0].count > 0) {
      console.log(`⚠️ ${commandesWithoutUpdatedAt[0].count} commandes sans updatedAt`);
      
      // Mettre à jour les commandes sans updatedAt
      await db.raw(`
        UPDATE commandes 
        SET updatedAt = datetime('now') 
        WHERE updatedAt IS NULL
      `);
      
      console.log('✅ Commandes mises à jour avec updatedAt');
    }
    
    console.log('✅ Diagnostic terminé');
    
    // Afficher un exemple de commande
    const exampleCommande = await db.raw('SELECT * FROM commandes LIMIT 1');
    if (exampleCommande.length > 0) {
      console.log('📋 Exemple de commande:', exampleCommande[0]);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    process.exit(0);
  }
}

// Exécuter le diagnostic
diagnoseDatabase(); 