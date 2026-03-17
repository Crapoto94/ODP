const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');
const path = require('path');

async function checkSchema() {
    try {
        const dbPath = 'C:/dev/APM/backend/database.sqlite';
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        const schema = await db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='proxy_logs'");
        console.log('SCHEMA:', schema.sql);
        
        // Also check if columns exist
        const columns = await db.all("PRAGMA table_info(proxy_logs)");
        console.log('COLUMNS:', JSON.stringify(columns, null, 2));
        
        await db.close();
    } catch (e) {
        console.error('Check failed:', e.message);
    }
}

checkSchema();
