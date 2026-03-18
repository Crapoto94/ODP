const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function extract() {
    try {
        const dataBuffer = fs.readFileSync('SEDITGF_Interface FILIEN 2023.1.pdf');
        // Let's see if PDFParse has a parse method or similar
        console.log('PDFParse keys:', Object.keys(PDFParse));
        console.log('PDFParse prototype keys:', Object.keys(PDFParse.prototype));
        
        // Typical structure for such libs:
        const instance = new PDFParse();
        const result = await instance.parse(dataBuffer);
        console.log(result.text);
    } catch (err) {
        console.error('Error during extraction:', err);
    }
}

extract();
