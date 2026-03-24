const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function diag() {
    const settings = await prisma.appSettings.findFirst();
    const rawUrl = settings?.apmUrl || 'http://localhost:8001/api/v1';
    const token = settings?.apmToken || 'DSIHUB-ODP-KEY-2026';
    
    console.log('--- APM DIAGNOSTIC ---');
    console.log('Configured URL:', rawUrl);
    
    const baseUrl = rawUrl.trim().replace(/\/$/, '');
    
    const candidates = [
        baseUrl + '/mail/send',
        baseUrl + '/api/mail/send',
        baseUrl + '/api/v1/mail/send',
        baseUrl + '/api/v2/mail/send',
        baseUrl + '/v1/mail/send'
    ];
    
    for (const url of candidates) {
        console.log(`\nTesting: ${url}`);
        try {
            // We use a dummy request; we just want to see if it 404s or 401s
            const res = await axios.post(url, { test: true }, {
                headers: { 'X-API-KEY': token },
                httpsAgent,
                timeout: 5000
            });
            console.log(`RESULT: ${res.status} (Success/Other)`);
        } catch (e) {
            if (e.response) {
                console.log(`RESULT: ${e.response.status} - ${JSON.stringify(e.response.data).substring(0, 100)}`);
            } else {
                console.log(`RESULT: Error - ${e.message}`);
            }
        }
    }
    
    console.log('\n--- STATUS CHECK ---');
    const statusCandidates = [
        baseUrl + '/status',
        baseUrl + '/api/status',
        baseUrl.replace(/\/v1$/, '') + '/status'
    ];
    for (const url of statusCandidates) {
        console.log(`Testing Status: ${url}`);
        try {
            const res = await axios.get(url, { httpsAgent, timeout: 5000 });
            console.log(`RESULT: ${res.status} - ${JSON.stringify(res.data)}`);
        } catch (e) {
             console.log(`RESULT: Failed - ${e.message}`);
        }
    }
}

diag().finally(() => prisma.$disconnect());
