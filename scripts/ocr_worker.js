const { createWorker } = require('tesseract.js');
const fs = require('fs');

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('File not found');
    process.exit(1);
  }

  try {
    const worker = await createWorker('fra');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    process.stdout.write(text);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
