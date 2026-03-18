const path = require('path');
const sqlite3 = require('C:/dev/APM/backend/node_modules/sqlite3').verbose();
const { open } = require('C:/dev/APM/backend/node_modules/sqlite');

async function fixPermissions() {
    try {
        const dbPath = 'C:/dev/APM/backend/database.sqlite';
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        
        const key = 'DSIHUB-ODP-KEY-2026';
        let app = await db.get('SELECT * FROM external_apps WHERE api_key = ?', [key]);
        
        if (!app) {
            console.error('App not found for key:', key);
            return;
        }

        console.log('Current permissions:', app.authorized_routes);
        
        const required = ['o365_read', 'o365_harvest', 'mail_send'];
        let perms = [];
        try {
            perms = JSON.parse(app.authorized_routes || '[]');
        } catch (e) {
            if (app.authorized_routes === '*') perms = ['*'];
        }

        if (perms.includes('*')) {
            console.log('Already has total access');
        } else {
            let updated = false;
            for (const r of required) {
                if (!perms.includes(r)) {
                    perms.push(r);
                    updated = true;
                }
            }
            if (updated) {
                const newPerms = JSON.stringify(perms);
                await db.run('UPDATE external_apps SET authorized_routes = ? WHERE api_key = ?', [newPerms, key]);
                console.log('Permissions updated to:', newPerms);
            } else {
                console.log('Permissions already up to date');
            }
        }

        await db.close();
    } catch (e) {
        console.error('Fix failed:', e.message);
    }
}

fixPermissions();
