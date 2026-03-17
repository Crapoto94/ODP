const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function check() {
    try {
        const db = await open({
            filename: 'C:/dev/APM/backend/database.sqlite',
            driver: sqlite3.Database
        });
        
        const apps = await db.all('SELECT * FROM external_apps');
        console.log('APPS:', JSON.stringify(apps, null, 2));
        await db.close();
    } catch (e) {
        console.error('Check failed:', e.message);
    }
}
check();
