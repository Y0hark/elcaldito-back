const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:1337';
const ADMIN_TOKEN = process.env.STRAPI_ADMIN_TOKEN || 'your-admin-token-here';

// Test data - let's get a real order ID first
async function getTestOrderId() {
  try {
    const response = await axios.get(`${BASE_URL}/api/commandes?pagination[limit]=1`);
    if (response.data?.data?.[0]?.id) {
      return response.data.data[0].id;
    }
  } catch (error) {
    console.log('Could not fetch test order ID:', error.message);
  }
  return 'w06m809zdsyujjayyi0jj5ks'; // Fallback
}

async function testAdminUpdate() {
  console.log('🧪 Testing admin panel updates...\n');

  const testOrderId = await getTestOrderId();
  console.log(`📋 Using test order ID: ${testOrderId}\n`);

  const headers = {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // Test 1: Update payment status only
  console.log('1️⃣ Testing payment status update...');
  try {
    const response = await axios.put(
      `${BASE_URL}/content-manager/collection-types/api::commande.commande/${testOrderId}`,
      {
        paymentStatus: 'succeeded'
      },
      { headers }
    );
    console.log('✅ Payment status update successful:', response.status);
  } catch (error) {
    console.log('❌ Payment status update failed:', error.response?.status, error.response?.data);
  }

  // Test 2: Update comment only
  console.log('\n2️⃣ Testing comment update...');
  try {
    const response = await axios.put(
      `${BASE_URL}/content-manager/collection-types/api::commande.commande/${testOrderId}`,
      {
        commentaire: 'Test comment from admin panel'
      },
      { headers }
    );
    console.log('✅ Comment update successful:', response.status);
  } catch (error) {
    console.log('❌ Comment update failed:', error.response?.status, error.response?.data);
  }

  // Test 3: Update state to cancelled
  console.log('\n3️⃣ Testing state update to cancelled...');
  try {
    const response = await axios.put(
      `${BASE_URL}/content-manager/collection-types/api::commande.commande/${testOrderId}`,
      {
        state: 'Annulée'
      },
      { headers }
    );
    console.log('✅ State update successful:', response.status);
  } catch (error) {
    console.log('❌ State update failed:', error.response?.status, error.response?.data);
  }

  // Test 4: Update multiple fields
  console.log('\n4️⃣ Testing multiple fields update...');
  try {
    const response = await axios.put(
      `${BASE_URL}/content-manager/collection-types/api::commande.commande/${testOrderId}`,
      {
        paymentStatus: 'succeeded',
        commentaire: 'Updated via admin panel',
        amount: 25.50
      },
      { headers }
    );
    console.log('✅ Multiple fields update successful:', response.status);
  } catch (error) {
    console.log('❌ Multiple fields update failed:', error.response?.status, error.response?.data);
  }

  console.log('\n🎯 Admin panel update tests completed!');
}

// Run the test
testAdminUpdate().catch(console.error); 