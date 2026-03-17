const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function check() {
    try {
        const db = await open({
            filename: 'C:/dev/APM/backend/database.sqlite',
            driver: sqlite3.Database
        });
        
        const apps = await db.all('SELECT * FROM external_apps');
        apps.forEach(app => {
          console.log(`APP_ID: ${app.id}`);
          console.log(`NAME: ${app.name}`);
          console.log(`KEY: ${app.api_key}`);
          console.log(`ACTIVE: ${app.is_active}`);
          console.log('---');
        });
        await db.close();
    } catch (e) {
        console.error('Check failed:', e.message);
    }
}
check();
