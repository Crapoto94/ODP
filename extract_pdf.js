const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function run() {
    try {
        const buffer = fs.readFileSync('SEDITGF_Interface FILIEN 2023.1.pdf');
        const parser = new PDFParse({ data: buffer });

        const result = await parser.getText();
        fs.writeFileSync('filien_spec.txt', result.text, 'utf8');
        console.log('Successfully written to filien_spec.txt');
        await parser.destroy();
    } catch (err) {
        console.error(err);
    }
}

run();
