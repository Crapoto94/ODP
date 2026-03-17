const axios = require('axios');

async function testApm() {
    const url = 'http://localhost:8001/api/v1/mail/send';
    const token = 'DSIHUB-ODP-KEY-2026';
    
    console.log('Testing APM Status...');
    try {
        const statusRes = await axios.get('http://localhost:8001/api/status');
        console.log('Status Response:', statusRes.data);
    } catch (e) {
        console.error('Status Check Failed:', e.message);
    }

    console.log('Testing Mail Send...');
    try {
        const res = await axios.post(url, {
            to: 'test@mairie-65k.fr',
            subject: 'Test Diagnostic',
            content: 'Test content',
            is_raw: true
        }, {
            headers: { 'X-API-KEY': token }
        });
        console.log('Mail Send Success:', res.data);
    } catch (e) {
        console.error('Mail Send Failed:', e.response?.status, e.response?.data || e.message);
    }
}

testApm();
