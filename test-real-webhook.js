#!/usr/bin/env node

/**
 * Script de test avec un vrai Payment Intent existant
 */

const axios = require('axios');

async function testRealWebhook() {
  console.log('🧪 Test du webhook avec un vrai Payment Intent...');
  
  try {
    // Utiliser le Payment Intent qui existe dans la base (d'après les logs)
    const realPaymentIntentId = 'pi_3RgaFUE1w45AmrOW0e2WLmML';
    
    const webhookData = {
      id: 'evt_real_' + Date.now(),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: realPaymentIntentId,
          amount: 15000,
          currency: 'eur',
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000)
        }
      }
    };
    
    console.log('📤 Envoi du webhook avec Payment Intent réel...');
    console.log('💳 Payment Intent ID:', realPaymentIntentId);
    
    const response = await axios.post('http://localhost:1337/api/commandes/stripe-webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe-Webhook-Test'
      },
      timeout: 5000
    });
    
    console.log('✅ Webhook envoyé avec succès');
    console.log('📊 Réponse:', response.status, response.data);
    
    // Attendre un peu pour que le traitement asynchrone se termine
    console.log('⏳ Attente du traitement asynchrone...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Test terminé');
    console.log('📋 Vérifiez les logs pour voir la mise à jour de la commande');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('📊 Réponse d\'erreur:', error.response.status, error.response.data);
    }
  }
}

// Exécuter le test
testRealWebhook(); 