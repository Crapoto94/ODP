const fs = require('fs');
const content = fs.readFileSync('c:\\dev\\ODP\\app\\dashboard\\gabarit\\page.tsx', 'utf8');

// Simple tag counter
let stack = [];
let re = /<(\/?)([a-zA-Z0-9]+)(\s|>)/g;
let match;

while ((match = re.exec(content)) !== null) {
    let isClose = match[1] === '/';
    let tagName = match[2];
    
    // Ignore self-closing or certain tags if needed, but here let's just track opens/closes
    if (isClose) {
        if (stack.length === 0) {
            console.log(`Extra closing tag </${tagName}> found`);
        } else {
            let last = stack.pop();
            if (last !== tagName) {
                console.log(`Mismatched closing tag </${tagName}>, expected </${last}>`);
            }
        }
    } else {
        // Check if it's self-closing (naively)
        let restOfTag = content.substring(match.index, content.indexOf('>', match.index) + 1);
        if (!restOfTag.endsWith('/>')) {
            stack.push(tagName);
        }
    }
}

while (stack.length > 0) {
    console.log(`Unclosed tag <${stack.pop()}>`);
}
