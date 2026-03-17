const path = require('path');
const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function checkMailSettings() {
    try {
        const dbPath = 'C:/dev/APM/backend/database.sqlite';
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        const settings = await db.get('SELECT * FROM mail_settings WHERE id = 1');
        console.log(JSON.stringify(settings, null, 2));
        await db.close();
    } catch (e) {
        console.error('Check failed:', e.message);
    }
}

checkMailSettings();
