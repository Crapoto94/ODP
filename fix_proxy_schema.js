const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function fixSchema() {
    try {
        const dbPath = 'C:/dev/APM/backend/database.sqlite';
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        console.log('Adding payload column...');
        await db.run("ALTER TABLE proxy_logs ADD COLUMN payload TEXT");
        console.log('Schema fixed successfully');
        
        await db.close();
    } catch (e) {
        console.error('Fix failed:', e.message);
    }
}

fixSchema();
