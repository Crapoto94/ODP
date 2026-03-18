const fs = require('fs');
const content = fs.readFileSync('c:\\dev\\ODP\\app\\dashboard\\gabarit\\page.tsx', 'utf8');

let lines = content.split('\n');
let stack = [];

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let re = /<div|<\/div/g;
    let match;
    while ((match = re.exec(line)) !== null) {
        if (match[0] === '<div') {
            // Check if self-closing
            let rest = line.substring(match.index);
            if (!rest.includes('/>') || rest.indexOf('>') < rest.indexOf('/>')) {
               stack.push(i + 1);
            }
        } else {
            if (stack.length === 0) {
                console.log(`Extra </div> at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}

while (stack.length > 0) {
    console.log(`Unclosed <div> from line ${stack.pop()}`);
}
