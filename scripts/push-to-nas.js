const SMB2 = require('smb2');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const filenames = process.argv.slice(2);
if (filenames.length === 0) {
  // Default: push all files in public/uploads
  const dir = path.join(__dirname, '..', 'public', 'uploads');
  const all = fs.readdirSync(dir).filter(f => !f.endsWith('.tmp'));
  filenames.push(...all);
}

console.log('Files to push:', filenames);

const smb = new SMB2({
  share: '\\\\nas-syno05\\editions$',
  domain: 'IVRY',
  username: 'machevalier',
  password: "J'aime bien le ski",
  autoCloseTimeout: 10000
});

const smbExists = promisify(smb.exists.bind(smb));
const smbMkdir = promisify(smb.mkdir.bind(smb));
const smbWriteFile = promisify(smb.writeFile.bind(smb));

async function ensureDir(d) {
  const ex = await smbExists(d).catch(() => false);
  if (!ex) {
    await smbMkdir(d).catch(e => { if (e.code !== 'STATUS_OBJECT_NAME_COLLISION') throw e; });
    console.log('Created dir:', d);
  }
}

async function run() {
  await ensureDir('SMPROD');
  await ensureDir('SMPROD\\ODP');
  await ensureDir('SMPROD\\ODP\\uploads');

  for (const filename of filenames) {
    const localPath = path.join(__dirname, '..', 'public', 'uploads', filename);
    if (!fs.existsSync(localPath)) {
      console.warn('Not found locally:', filename);
      continue;
    }
    const buffer = fs.readFileSync(localPath);
    await smbWriteFile('SMPROD\\ODP\\uploads\\' + filename, buffer);
    console.log('OK:', filename, '(' + buffer.length + ' bytes)');
  }

  smb.close();
  console.log('Done.');
}

run().catch(e => { console.error('ERROR:', e.message, e.stack); smb.close(); });
