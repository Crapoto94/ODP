const fs = require('fs');
const content = fs.readFileSync('c:\\dev\\ODP\\app\\dashboard\\gabarit\\page.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        if (char === '{') stack.push({char, line: i + 1});
        if (char === '}') {
            if (stack.length === 0) {
                console.log(`Unmatched } at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
        if (char === '(') stack.push({char, line: i + 1});
        if (char === ')') {
            if (stack.length === 0) {
                console.log(`Unmatched ) at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}

while (stack.length > 0) {
    let s = stack.pop();
    console.log(`Unclosed ${s.char} from line ${s.line}`);
}
