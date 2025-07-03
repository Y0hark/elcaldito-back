#!/usr/bin/env node

/**
 * Script de test pour vérifier le webhook Stripe
 */

const axios = require('axios');

async function testWebhook() {
  console.log('🧪 Test du webhook Stripe...');
  
  try {
    // Simuler un webhook de paiement réussi
    const webhookData = {
      id: 'evt_test_' + Date.now(),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_' + Date.now(),
          amount: 15000,
          currency: 'eur',
          status: 'succeeded',
          created: Math.floor(Date.now() / 1000)
        }
      }
    };
    
    console.log('📤 Envoi du webhook...');
    console.log('📋 Données:', JSON.stringify(webhookData, null, 2));
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Test terminé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('📊 Réponse d\'erreur:', error.response.status, error.response.data);
    }
  }
}

// Exécuter le test
testWebhook(); 