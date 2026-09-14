/*
 * Espace libre d'un partage SMB via le protocole SMB2 (QUERY_INFO /
 * FileFsFullSizeInformation), sans dépendre du système d'exploitation.
 *
 * Le paquet `smb2` ne fournit pas cette information et ses modules internes ne
 * sont pas extensibles via l'API publique. On intercepte donc, à l'exécution,
 * les `require('../messages/query_info')` / `require('../structures/query_info')`
 * émis par la bibliothèque pour leur fournir nos propres modules (en mémoire),
 * puis on ajoute une méthode `statfs` au prototype du client SMB2.
 *
 * C'est la seule méthode fiable en production (conteneur Linux) où ni
 * `fs.statfs` sur un chemin UNC ni `net use` ne sont disponibles.
 */

const path = require('path');

// `eval('require')` empêche Turbopack/Webpack d'analyser statiquement les
// require dynamiques vers les modules internes de `smb2` (qui doivent rester
// résolus à l'exécution depuis node_modules).
const nodeRequire = eval('require');
const Module = require('module');

const smb2MessagePath = nodeRequire.resolve('smb2/lib/tools/smb2-message');
const toolsDir = path.resolve(path.dirname(smb2MessagePath));
const SMB2Message = nodeRequire(smb2MessagePath);
const messageWrap = nodeRequire(path.join(toolsDir, 'message.js'));
const SMB2Forge = nodeRequire(path.join(toolsDir, 'smb2-forge.js'));
const SMB2Connection = nodeRequire(path.join(toolsDir, 'smb2-connection.js'));

function readUInt64LE(buffer, offset) {
  return Number(buffer.readBigUInt64LE(offset));
}

// Structure SMB2 QUERY_INFO Request/Response (MS-SMB2 2.2.37 / 2.2.38)
const queryInfoStructure = {
  request: [
    ['StructureSize', 2, 41],
    ['InfoType', 1, 0x02], // SMB2_0_INFO_FILESYSTEM
    ['FileInfoClass', 1, 0x07],
    ['OutputBufferLength', 4, 0x40],
    ['InputBufferOffset', 2, 0],
    ['Reserved', 2, 0],
    ['InputBufferLength', 4, 0],
    ['AdditionalInformation', 4, 0],
    ['Flags', 4, 0],
    ['FileId', 16],
  ],
  response: [
    ['StructureSize', 2],
    ['OutputBufferOffset', 2],
    ['OutputBufferLength', 4],
    ['Buffer', 'OutputBufferLength'],
  ],
};

const queryInfoMessage = messageWrap({
  generate(connection, params) {
    return new SMB2Message({
      headers: {
        Command: 'QUERY_INFO',
        SessionId: connection.SessionId,
        TreeId: connection.TreeId,
        ProcessId: connection.ProcessId,
      },
      request: {
        FileId: params.FileId,
        FileInfoClass: params.FileInfoClass || 0x07,
        OutputBufferLength: 0x40,
      },
    });
  },
  parseResponse(response) {
    const buffer = response.getResponse().Buffer;
    // FileFsFullSizeInformation (32 octets)
    if (buffer.length >= 32) {
      const totalUnits = readUInt64LE(buffer, 0);
      const callerAvail = readUInt64LE(buffer, 8);
      const actualAvail = readUInt64LE(buffer, 16);
      const sectorsPerUnit = buffer.readUInt32LE(24);
      const bytesPerSector = buffer.readUInt32LE(28);
      const unit = sectorsPerUnit * bytesPerSector;
      return {
        total: totalUnits * unit,
        free: actualAvail * unit,
        callerFree: callerAvail * unit,
      };
    }
    // FileFsSizeInformation (24 octets)
    const totalUnits = readUInt64LE(buffer, 0);
    const availUnits = readUInt64LE(buffer, 8);
    const sectorsPerUnit = buffer.readUInt32LE(16);
    const bytesPerSector = buffer.readUInt32LE(20);
    const unit = sectorsPerUnit * bytesPerSector;
    return {
      total: totalUnits * unit,
      free: availUnits * unit,
      callerFree: availUnits * unit,
    };
  },
});

// Fournit les modules `query_info` manquants à la bibliothèque smb2.
const originalRequire = Module.prototype.require;
Module.prototype.require = function (request) {
  const filename = (this && this.filename ? this.filename : '').replace(/\\/g, '/');
  if (filename.includes('/smb2/lib/')) {
    if (request === '../structures/query_info') return queryInfoStructure;
    if (request === '../messages/query_info') return queryInfoMessage;
  }
  return originalRequire.apply(this, arguments);
};

const SMB2 = require('smb2');

if (!SMB2.prototype.statfs) {
  SMB2.prototype.statfs = SMB2Connection.requireConnect(function (dirPath, cb) {
    const connection = this;
    const target = dirPath || '';

    SMB2Forge.request('open_folder', { path: target }, connection, function (err, file) {
      if (err) return cb(err);

      const finish = (err2, info) =>
        SMB2Forge.request('close', file, connection, function () {
          cb(err2 || null, info);
        });

      // FileFsFullSizeInformation (7) puis repli sur FileFsSizeInformation (3)
      SMB2Forge.request(
        'query_info',
        { FileId: file.FileId, FileInfoClass: 0x07 },
        connection,
        function (err7, info7) {
          if (!err7) return finish(null, info7);
          SMB2Forge.request(
            'query_info',
            { FileId: file.FileId, FileInfoClass: 0x03 },
            connection,
            function (err3, info3) {
              finish(err3, info3);
            }
          );
        }
      );
    });
  });
}

module.exports = { installed: !!SMB2.prototype.statfs };
