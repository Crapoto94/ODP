const { PDFParse, VerbosityLevel } = require('pdf-parse');
const fs = require('fs');

async function extract() {
    try {
        const dataBuffer = fs.readFileSync('SEDITGF_Interface FILIEN 2023.1.pdf');
        
        // Try with options
        const options = {
            verbosity: VerbosityLevel ? VerbosityLevel.ERRORS : 0
        };
        const instance = new PDFParse(options);
        
        console.log('Instance keys:', Object.keys(instance));
        // Check for common methods
        const methods = ['parse', 'load', 'getText', 'extractText'];
        for (const m of methods) {
            if (typeof instance[m] === 'function') {
                console.log(`Found method: ${m}`);
            }
        }

        // Try load/parse
        if (typeof instance.load === 'function') {
            await instance.load(dataBuffer);
            if (typeof instance.getText === 'function') {
                const text = await instance.getText();
                console.log('Extracted text (first 500 chars):', text.substring(0, 500));
            }
        } else if (typeof instance.parse === 'function') {
            const result = await instance.parse(dataBuffer);
            console.log('Extracted text (first 500 chars):', result.text.substring(0, 500));
        }

    } catch (err) {
        console.error('Error during extraction:', err);
        // If it fails, let's just log the instance to see what's inside
        try {
            const instance = new PDFParse({ verbosity: 0 });
            console.log('Instance structure:', instance);
        } catch (e) {}
    }
}

extract();
