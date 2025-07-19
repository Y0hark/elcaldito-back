'use strict';

/**
 * Migration pour ajouter la colonne paymentStatus à la table commandes
 */

async function up(knex) {
  console.log('🔄 Vérification et ajout des colonnes manquantes...');
  
  // Vérifier si la colonne paymentStatus existe
  const hasPaymentStatus = await knex.schema.hasColumn('commandes', 'paymentStatus');
  const hasUpdatedAt = await knex.schema.hasColumn('commandes', 'updatedAt');
  
  if (!hasPaymentStatus) {
    console.log('🔄 Ajout de la colonne paymentStatus...');
    await knex.schema.alterTable('commandes', (table) => {
      table.enum('paymentStatus', ['pending', 'succeeded', 'failed', 'canceled'])
        .defaultTo('pending')
        .notNullable();
    });
    console.log('✅ Colonne paymentStatus ajoutée');
  } else {
    console.log('ℹ️ Colonne paymentStatus existe déjà');
  }
  
  if (!hasUpdatedAt) {
    console.log('🔄 Ajout de la colonne updatedAt...');
    await knex.schema.alterTable('commandes', (table) => {
      table.text('updatedAt');
    });
    console.log('✅ Colonne updatedAt ajoutée');
  } else {
    console.log('ℹ️ Colonne updatedAt existe déjà');
  }
}

async function down(knex) {
  console.log('🔄 Suppression de la colonne paymentStatus...');
  
  await knex.schema.alterTable('commandes', (table) => {
    table.dropColumn('paymentStatus');
  });
  
  console.log('✅ Colonne paymentStatus supprimée');
}

module.exports = { up, down }; 