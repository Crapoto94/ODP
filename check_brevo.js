const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function check() {
    try {
        const db = await open({
            filename: 'C:/dev/APM/backend/database.sqlite',
            driver: sqlite3.Database
        });
        
        const s = await db.get('SELECT * FROM mail_settings WHERE id = 1');
        console.log('BREVO_API_KEY:', s.api_key);
        console.log('SENDER_EMAIL:', s.sender_email);
        console.log('GLOBAL_ENABLE:', s.global_enable);
        console.log('USE_API:', s.use_api);
        await db.close();
    } catch (e) {
        console.error('Check failed:', e.message);
    }
}
check();
