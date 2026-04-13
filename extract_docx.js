const JSZip = require('jszip');
const fs = require('fs');

async function extract() {
  const filePath = './public/gabarits-docx/1776097704947-AOT-Template-Default.docx';
  if (!fs.existsSync(filePath)) {
    console.log('File not found, trying alternative...');
    const files = fs.readdirSync('./public/gabarits-docx');
    console.log('Available files:', files);
    return;
  }
  
  const fileBuffer = fs.readFileSync(filePath);
  const zip = new JSZip();
  await zip.loadAsync(fileBuffer);
  
  let documentXml = await zip.file('word/document.xml')?.async('string');
  
  // Find all text with curly braces
  const parts = documentXml.split('<w:t>');
  console.log('Total w:t elements:', parts.length);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.includes('{') || part.includes('(')) {
      console.log(`\n[Element ${i}]:`);
      const text = part.substring(0, 200);
      console.log(text);
    }
  }
}

extract().catch(console.error);
