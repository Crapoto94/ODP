const axios = require('axios');

async function debug() {
    try {
        const res = await axios.post('http://localhost:8001/api/v1/mail/send', {
            to: 'test@example.com',
            subject: 'test',
            content: 'test'
        }, {
            headers: { 'X-API-KEY': 'DSIHUB-ODP-KEY-2026' }
        });
        console.log('SUCCESS:', res.data);
    } catch (e) {
        console.log('STATUS:', e.response?.status);
        console.log('BODY:', JSON.stringify(e.response?.data));
    }
}

debug();
