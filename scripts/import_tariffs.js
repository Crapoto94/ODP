const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join('c:', 'dev', 'ODP', 'Tarifs 2025.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const header = data[0];
    const rows = data.slice(1);

    const ANNEE = 2025;

    let lastCat1 = null;
    let lastCat2 = null;
    let lastCat3 = null;

    for (const row of rows) {
        let [type, sousType, sousSousType, numArticle, designation, modeTaxation, tarif, notes] = row;

        if (!designation && !type && !sousType && !sousSousType) continue;

        // Handle Categories
        if (type && type.trim()) {
            lastCat1 = await prisma.categorie.findFirst({ where: { nom: type.trim(), niveau: 1 } });
            if (!lastCat1) {
                lastCat1 = await prisma.categorie.create({ data: { nom: type.trim(), niveau: 1 } });
            }
            lastCat2 = null;
            lastCat3 = null;
        }

        if (sousType && sousType.trim()) {
            lastCat2 = await prisma.categorie.findFirst({
                where: { nom: sousType.trim(), niveau: 2, parentId: lastCat1?.id }
            });
            if (!lastCat2 && lastCat1) {
                lastCat2 = await prisma.categorie.create({
                    data: { nom: sousType.trim(), niveau: 2, parentId: lastCat1.id }
                });
            }
            lastCat3 = null;
        }

        if (sousSousType && sousSousType.trim()) {
            lastCat3 = await prisma.categorie.findFirst({
                where: { nom: sousSousType.trim(), niveau: 3, parentId: lastCat2?.id }
            });
            if (!lastCat3 && lastCat2) {
                lastCat3 = await prisma.categorie.create({
                    data: { nom: sousSousType.trim(), niveau: 3, parentId: lastCat2.id }
                });
            }
        }

        const currentCategorieId = lastCat3?.id || lastCat2?.id || lastCat1?.id;

        // Handle Mode de Taxation
        let modeTaxationId = null;
        if (modeTaxation && modeTaxation.trim()) {
            let mtName = modeTaxation.trim();
            let mt = await prisma.modeTaxation.findUnique({ where: { nom: mtName } });
            if (!mt) {
                mt = await prisma.modeTaxation.create({ data: { nom: mtName } });
            }
            modeTaxationId = mt.id;
        }

        // Handle Article
        if (designation && designation.trim()) {
            const article = await prisma.article.create({
                data: {
                    numero: numArticle ? String(numArticle).trim() : null,
                    designation: String(designation).trim(),
                    annee: ANNEE,
                    categorieId: currentCategorieId
                }
            });

            // Handle Tarif
            if (tarif !== undefined && tarif !== null && tarif !== '') {
                let montantString = String(tarif).replace(',', '.');
                let montant = parseFloat(montantString);
                if (!isNaN(montant)) {
                    await prisma.tarif.create({
                        data: {
                            articleId: article.id,
                            modeTaxationId: modeTaxationId,
                            annee: ANNEE,
                            montant: montant,
                            notes: notes ? String(notes).trim() : null
                        }
                    });
                }
            }
        }
    }

    console.log('Import completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
