const axios = require('axios');
async function test() {
  const url = 'http://127.0.0.1:8001/api/v1/mail/send';
  const token = 'DSIHUB-ODP-KEY-2026';
  try {
    const res = await axios.post(url, {
      to: 'test@mairie-65k.fr',
      subject: 'Test Diagnostic ODP',
      content: 'Ce mail confirme que l\'authentification X-API-KEY fonctionne.',
      from_name: 'ODP Console',
      from_email: 'dsihub@fbc.fr',
      is_raw: true
    }, {
      headers: {
        'X-API-KEY': token
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (e) {
    console.error('FAILED:', e.response?.status, e.response?.data || e.message);
  }
}
test();
