'use strict';

/**
 * Migration pour corriger les données de la table commandes
 * (sans modifier la structure de la table)
 */

async function up(knex) {
  console.log('🔄 Correction des données de la table commandes...');
  
  try {
    // Vérifier si la table existe
    const tableExists = await knex.schema.hasTable('commandes');
    if (!tableExists) {
      console.log('❌ Table commandes n\'existe pas');
      return;
    }
    
    console.log('✅ Table commandes existe');
    
    // Vérifier les colonnes existantes (méthode compatible PostgreSQL)
    const columns = await knex.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'commandes' 
      AND table_schema = 'public'
    `);
    const columnNames = columns.rows.map(col => col.column_name);
    
    console.log('📋 Colonnes existantes:', columnNames);
    
    // Mettre à jour les commandes sans paymentStatus
    try {
      const commandesWithoutStatus = await knex.raw(`
        SELECT COUNT(*) as count 
        FROM commandes 
        WHERE "paymentStatus" IS NULL OR "paymentStatus" = ''
      `);
      
      if (commandesWithoutStatus.rows[0].count > 0) {
        console.log(`🔄 Mise à jour de ${commandesWithoutStatus.rows[0].count} commandes sans paymentStatus...`);
        
        await knex.raw(`
          UPDATE commandes 
          SET "paymentStatus" = 'pending' 
          WHERE "paymentStatus" IS NULL OR "paymentStatus" = ''
        `);
        
        console.log('✅ Commandes mises à jour avec paymentStatus par défaut');
      } else {
        console.log('ℹ️ Toutes les commandes ont déjà un paymentStatus');
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la mise à jour des paymentStatus:', error.message);
    }
    
    // Mettre à jour les commandes sans updated_at
    try {
      const commandesWithoutUpdatedAt = await knex.raw(`
        SELECT COUNT(*) as count 
        FROM commandes 
        WHERE updated_at IS NULL
      `);
      
      if (commandesWithoutUpdatedAt.rows[0].count > 0) {
        console.log(`🔄 Mise à jour de ${commandesWithoutUpdatedAt.rows[0].count} commandes sans updated_at...`);
        
        await knex.raw(`
          UPDATE commandes 
          SET updated_at = NOW() 
          WHERE updated_at IS NULL
        `);
        
        console.log('✅ Commandes mises à jour avec updated_at');
      } else {
        console.log('ℹ️ Toutes les commandes ont déjà un updated_at');
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la mise à jour des updated_at:', error.message);
    }
    
    // Compter le nombre total de commandes
    const totalCommandes = await knex.raw('SELECT COUNT(*) as count FROM commandes');
    console.log(`📊 Nombre total de commandes: ${totalCommandes.rows[0].count}`);
    
    console.log('✅ Correction des données terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction des données:', error);
    throw error;
  }
}

async function down(knex) {
  console.log('🔄 Annulation de la correction des données...');
  
  // Cette migration ne peut pas être annulée car elle ne fait que des corrections de données
  console.log('ℹ️ Cette migration ne peut pas être annulée (corrections de données)');
}

module.exports = { up, down }; 