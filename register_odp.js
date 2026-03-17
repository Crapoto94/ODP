const path = require('path');
const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function register() {
    try {
        const dbPath = 'C:/dev/APM/backend/database.sqlite';
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        const key = 'DSIHUB-ODP-KEY-2026';
        const exists = await db.get('SELECT * FROM external_apps WHERE api_key = ?', [key]);
        
        if (!exists) {
            await db.run('INSERT INTO external_apps (name, api_key, is_active) VALUES (?, ?, ?)', ['ODP Console', key, 1]);
            console.log('App registered successfully');
        } else {
            console.log('App already registered:', exists.name);
            await db.run('UPDATE external_apps SET is_active = 1 WHERE api_key = ?', [key]);
            console.log('App status forced to active');
        }
        await db.close();
    } catch (e) {
        console.error('Registration failed:', e.message);
    }
}

register();
