#!/usr/bin/env node

/**
 * Script pour déboguer la structure de la base de données
 */

const axios = require('axios');

async function debugDatabase() {
  console.log('🔍 Débogage de la structure de la base de données...');
  
  try {
    // Simuler un webhook pour voir les logs détaillés
    const webhookData = {
      id: 'evt_debug_' + Date.now(),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3RgaLYE1w45AmrOW1Zy06T5D', // Payment Intent existant
          amount: 15000,
          currency: 'eur',
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000)
        }
      }
    };
    
    console.log('📤 Envoi du webhook de debug...');
    console.log('💳 Payment Intent ID:', webhookData.data.object.id);
    
    const response = await axios.post('http://localhost:1337/api/commandes/stripe-webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe-Webhook-Debug'
      },
      timeout: 5000
    });
    
    console.log('✅ Webhook envoyé avec succès');
    console.log('📊 Réponse:', response.status, response.data);
    
    // Attendre un peu pour que le traitement asynchrone se termine
    console.log('⏳ Attente du traitement asynchrone...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📋 Instructions de vérification :');
    console.log('1. Vérifiez les logs du serveur pour voir les détails de la mise à jour');
    console.log('2. Allez dans l\'admin Strapi : http://localhost:1337/admin');
    console.log('3. Vérifiez la commande avec ID 55');
    console.log('4. Regardez si paymentStatus a changé de "pending" à "succeeded"');
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
    if (error.response) {
      console.error('📊 Réponse d\'erreur:', error.response.status, error.response.data);
    }
  }
}

// Exécuter le debug
debugDatabase(); 