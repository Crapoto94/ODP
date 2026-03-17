const axios = require('axios');

async function testApi() {
  try {
    console.log('Testing /api/tiers/map...');
    const res = await axios.get('http://localhost:3000/api/tiers/map');
    console.log('Success:', res.data.length, 'tiers found');
  } catch (err) {
    console.error('Error /api/tiers/map:', err.response?.status, err.response?.data || err.message);
  }

  try {
    console.log('Testing /api/occupations...');
    const res = await axios.get('http://localhost:3000/api/occupations');
    console.log('Success:', res.data.length, 'occupations found');
  } catch (err) {
    console.error('Error /api/occupations:', err.response?.status, err.response?.data || err.message);
  }
}

testApi();
