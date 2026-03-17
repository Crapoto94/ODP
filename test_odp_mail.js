const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:3100/api/settings/test-mail');
    console.log('SUCCESS:', res.data);
  } catch (e) {
    console.error('FAILED:', e.response?.status, e.response?.data || e.message);
  }
}
test();
