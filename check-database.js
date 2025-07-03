#!/usr/bin/env node

/**
 * Script pour vérifier l'état de la base de données
 */

const axios = require('axios');

async function checkDatabase() {
  console.log('🔍 Vérification de la base de données...');
  
  try {
    // Vérifier les statistiques webhook (si admin)
    console.log('📊 Vérification des statistiques webhook...');
    try {
      const statsResponse = await axios.get('http://localhost:1337/api/commandes/webhook-stats', {
        headers: {
          'Authorization': 'Bearer YOUR_ADMIN_TOKEN' // Remplacez par votre token admin
        }
      });
      console.log('✅ Statistiques webhook:', statsResponse.data);
    } catch (error) {
      console.log('⚠️ Impossible d\'accéder aux statistiques (token admin requis)');
    }
    
    // Vérifier les commandes via l'API publique
    console.log('📋 Vérification des commandes...');
    try {
      const commandesResponse = await axios.get('http://localhost:1337/api/commandes', {
        headers: {
          'Authorization': 'Bearer YOUR_USER_TOKEN' // Remplacez par votre token utilisateur
        }
      });
      
      console.log('📊 Commandes trouvées:', commandesResponse.data.data.length);
      
      commandesResponse.data.data.forEach((commande, index) => {
        console.log(`\n📦 Commande ${index + 1}:`);
        console.log(`   ID: ${commande.id}`);
        console.log(`   Payment Intent: ${commande.paymentIntent}`);
        console.log(`   Payment Status: ${commande.paymentStatus}`);
        console.log(`   State: ${commande.state}`);
        console.log(`   Amount: ${commande.amount}`);
        console.log(`   Created: ${commande.createdAt}`);
        console.log(`   Updated: ${commande.updatedAt}`);
      });
      
    } catch (error) {
      console.log('⚠️ Impossible d\'accéder aux commandes (token utilisateur requis)');
      console.log('💡 Vous pouvez vérifier manuellement via l\'admin Strapi');
    }
    
    console.log('\n✅ Vérification terminée');
    console.log('💡 Pour une vérification complète, connectez-vous à l\'admin Strapi');
    console.log('🌐 http://localhost:1337/admin');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécuter la vérification
checkDatabase(); 