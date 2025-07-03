#!/usr/bin/env node

/**
 * Script pour corriger directement le paymentStatus
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function fixPaymentStatus() {
  console.log('🔧 Correction directe du paymentStatus...');
  
  try {
    // Ouvrir la base de données
    const dbPath = path.join(__dirname, '.tmp', 'data.db');
    const db = new sqlite3.Database(dbPath);
    
    console.log('📂 Base de données ouverte:', dbPath);
    
    // Vérifier la structure de la table
    db.all("PRAGMA table_info(commandes)", (err, columns) => {
      if (err) {
        console.error('❌ Erreur lors de la vérification de la structure:', err);
        return;
      }
      
      console.log('📋 Structure de la table commandes:');
      columns.forEach(col => {
        console.log(`   ${col.name} (${col.type})`);
      });
      
      // Vérifier les commandes existantes
      db.all("SELECT id, paymentStatus, payment_status, state, amount, payment_intent FROM commandes", (err, rows) => {
        if (err) {
          console.error('❌ Erreur lors de la récupération des commandes:', err);
          return;
        }
        
        console.log('\n📊 Commandes existantes:');
        rows.forEach(row => {
          console.log(`   ID: ${row.id}`);
          console.log(`     paymentStatus: ${row.paymentStatus}`);
          console.log(`     payment_status: ${row.payment_status}`);
          console.log(`     payment_intent: ${row.payment_intent}`);
          console.log(`     state: ${row.state}`);
          console.log(`     amount: ${row.amount}`);
          console.log('');
        });
        
        // Mettre à jour la commande avec le Payment Intent spécifique
        const paymentIntentId = 'pi_3RgaLYE1w45AmrOW1Zy06T5D';
        
        console.log(`🔄 Mise à jour de la commande avec Payment Intent: ${paymentIntentId}`);
        
        // Essayer avec payment_status
        db.run(`
          UPDATE commandes 
          SET payment_status = 'succeeded', state = 'Validée', amount = 150.00, updated_at = datetime('now')
          WHERE payment_intent = ?
        `, [paymentIntentId], function(err) {
          if (err) {
            console.error('❌ Erreur lors de la mise à jour avec payment_status:', err);
          } else {
            console.log(`✅ Mise à jour réussie avec payment_status. ${this.changes} ligne(s) modifiée(s)`);
          }
          
          // Essayer aussi avec paymentStatus
          db.run(`
            UPDATE commandes 
            SET paymentStatus = 'succeeded', state = 'Validée', amount = 150.00, updated_at = datetime('now')
            WHERE payment_intent = ?
          `, [paymentIntentId], function(err) {
            if (err) {
              console.error('❌ Erreur lors de la mise à jour avec paymentStatus:', err);
            } else {
              console.log(`✅ Mise à jour réussie avec paymentStatus. ${this.changes} ligne(s) modifiée(s)`);
            }
            
            // Vérifier le résultat
            db.get("SELECT id, paymentStatus, payment_status, state, amount, payment_intent FROM commandes WHERE payment_intent = ?", [paymentIntentId], (err, row) => {
              if (err) {
                console.error('❌ Erreur lors de la vérification:', err);
              } else if (row) {
                console.log('\n✅ Résultat après mise à jour:');
                console.log(`   ID: ${row.id}`);
                console.log(`   paymentStatus: ${row.paymentStatus}`);
                console.log(`   payment_status: ${row.payment_status}`);
                console.log(`   payment_intent: ${row.payment_intent}`);
                console.log(`   state: ${row.state}`);
                console.log(`   amount: ${row.amount}`);
              } else {
                console.log('⚠️ Aucune commande trouvée avec ce Payment Intent');
              }
              
              db.close();
            });
          });
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter la correction
fixPaymentStatus(); 