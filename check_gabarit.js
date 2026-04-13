const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./prisma/dev.db', (err) => {
  if (err) console.error(err);
  db.all("SELECT id, nom, type, contenu FROM Gabarit LIMIT 3", (err, rows) => {
    if (err) console.error(err);
    rows.forEach(row => {
      console.log(`\n[${row.id}] ${row.nom} (${row.type})`);
      if (row.contenu) {
        const content = JSON.parse(row.contenu);
        const elements = content.elements || [];
        console.log(`  ${elements.length} éléments`);
        // Show first 5 elements with their values
        elements.slice(0, 5).forEach(el => {
          console.log(`    - ${el.type}: ${(el.value || '').substring(0, 60)}`);
        });
      }
    });
    db.close();
  });
});
