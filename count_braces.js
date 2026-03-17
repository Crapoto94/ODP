const fs = require('fs');
const content = fs.readFileSync('C:/dev/APM/backend/routes/proxy.js', 'utf8');
let open = 0;
let closed = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') open++;
  if (content[i] === '}') closed++;
}
console.log('Open:', open);
console.log('Closed:', closed);
