const XLSX = require('xlsx');
const workbook = XLSX.readFile('c:/dev/ODP/Tarifs 2025.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 10), null, 2));
