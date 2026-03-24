const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function diag() {
    const settings = await prisma.appSettings.findFirst();
    const rawUrl = settings?.apmUrl || 'http://localhost:8001/api/v1';
    const token = settings?.apmToken || 'DSIHUB-ODP-KEY-2026';
    
    console.log('--- APM MAIL DIAGNOSTIC ---');
    const baseUrl = rawUrl.trim().replace(/\/$/, '');
    
    // We remove /api or /v1 to start from the root if necessary
    const rootUrl = baseUrl.replace(/\/api\/v1$/, '').replace(/\/v1$/, '').replace(/\/api$/, '');

    const candidates = [
        rootUrl + '/api/v1/mail/send',
        rootUrl + '/api/mail/send',
        rootUrl + '/v1/mail/send',
        rootUrl + '/mail/send'
    ];
    
    for (const url of candidates) {
        try {
            const res = await axios.post(url, { test: 1 }, {
                headers: { 'X-API-KEY': token },
                httpsAgent,
                timeout: 3000
            });
            console.log(`[OK] ${url} -> ${res.status}`);
        } catch (e) {
            console.log(`[FAIL] ${url} -> ${e.response?.status || e.message}`);
        }
    }
}

diag().finally(() => prisma.$disconnect());
