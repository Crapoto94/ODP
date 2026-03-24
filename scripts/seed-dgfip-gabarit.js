const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const elements = [
  // LOGO / HEADER
  {
    id: "header_logo",
    type: "TEXT",
    x: 40,
    y: 40,
    width: 250,
    height: 40,
    value: "VILLE D'IVRY-SUR-SEINE",
    style: {
      fontSize: 18,
      fontFamily: "helvetica",
      fontWeight: "bold",
      color: "#003366",
      textAlign: "left"
    }
  },
  {
    id: "header_address",
    type: "TEXT",
    x: 350,
    y: 40,
    width: 200,
    height: 80,
    value: "Esplanade Georges Marrane\n94200 Ivry-sur-Seine\nSIRET: 219 400 413 00010\nservice.facturation@ivry94.fr",
    style: {
      fontSize: 9,
      fontFamily: "helvetica",
      fontWeight: "normal",
      color: "#333333",
      textAlign: "right"
    }
  },

  // TITLE
  {
    id: "invoice_title",
    type: "TEXT",
    x: 40,
    y: 130,
    width: 515,
    height: 30,
    value: "FACTURE N° {numeroFacture}",
    style: {
      fontSize: 20,
      fontFamily: "helvetica",
      fontWeight: "bold",
      color: "#000000",
      textAlign: "center"
    }
  },

  // CLIENT BLOCK
  {
    id: "client_box_bg",
    type: "RECT",
    x: 300,
    y: 180,
    width: 255,
    height: 100,
    style: {
      backgroundColor: "#f8f9fa",
      borderWidth: 0.5,
      borderColor: "#cccccc"
    }
  },
  {
    id: "client_label",
    type: "TEXT",
    x: 310,
    y: 190,
    width: 100,
    height: 20,
    value: "DESTINATAIRE :",
    style: {
      fontSize: 8,
      fontFamily: "helvetica",
      fontWeight: "bold",
      color: "#666666"
    }
  },
  {
    id: "client_details",
    type: "VARIABLE",
    x: 310,
    y: 205,
    width: 235,
    height: 60,
    value: "{tiers.nom}\n{adresse}",
    style: {
      fontSize: 11,
      fontFamily: "helvetica",
      fontWeight: "bold",
      color: "#000000"
    }
  },

  // INVOICE META
  {
    id: "meta_date",
    type: "VARIABLE",
    x: 40,
    y: 180,
    width: 250,
    height: 20,
    value: "Date d'émission : {today}",
    style: { fontSize: 10, fontFamily: "helvetica" }
  },
  {
    id: "meta_occ",
    type: "VARIABLE",
    x: 40,
    y: 200,
    width: 250,
    height: 20,
    value: "Dossier : {nom} (#{id})",
    style: { fontSize: 10, fontFamily: "helvetica" }
  },
  {
    id: "meta_period",
    type: "VARIABLE",
    x: 40,
    y: 220,
    width: 250,
    height: 20,
    value: "Période : {dateDebut} - {dateFin}",
    style: { fontSize: 10, fontFamily: "helvetica" }
  },

  // TABLE HEADER
  {
    id: "table_head_bg",
    type: "RECT",
    x: 40,
    y: 300,
    width: 515,
    height: 25,
    style: {
      backgroundColor: "#003366",
      borderWidth: 0
    }
  },
  {
    id: "th_designation",
    type: "TEXT",
    x: 50,
    y: 307,
    width: 250,
    height: 20,
    value: "DÉSIGNATION DES PRESTATIONS",
    style: { fontSize: 9, fontWeight: "bold", color: "#ffffff" }
  },
  {
    id: "th_pu",
    type: "TEXT",
    x: 320,
    y: 307,
    width: 70,
    height: 20,
    value: "P.U. HT",
    style: { fontSize: 9, fontWeight: "bold", color: "#ffffff", textAlign: "right" }
  },
  {
    id: "th_qty",
    type: "TEXT",
    x: 400,
    y: 307,
    width: 50,
    height: 20,
    value: "QTÉ",
    style: { fontSize: 9, fontWeight: "bold", color: "#ffffff", textAlign: "right" }
  },
  {
    id: "th_total",
    type: "TEXT",
    x: 460,
    y: 307,
    width: 85,
    height: 20,
    value: "MONTANT HT",
    style: { fontSize: 9, fontWeight: "bold", color: "#ffffff", textAlign: "right" }
  },

  // REPEATED ARTICLES
  {
    id: "art_full_desc",
    type: "VARIABLE",
    x: 50,
    y: 335,
    width: 260,
    height: 60,
    value: "{article.full_description}",
    isArticleRepeated: true,
    verticalPitch: 50,
    style: { fontSize: 9, color: "#333333" }
  },
  {
    id: "art_pu",
    type: "VARIABLE",
    x: 320,
    y: 335,
    width: 70,
    height: 20,
    value: "{article.pu}",
    isArticleRepeated: true,
    verticalPitch: 50,
    style: { fontSize: 10, color: "#000000", textAlign: "right" }
  },
  {
    id: "art_qty",
    type: "VARIABLE",
    x: 400,
    y: 335,
    width: 50,
    height: 20,
    value: "{article.quantite}",
    isArticleRepeated: true,
    verticalPitch: 50,
    style: { fontSize: 10, color: "#000000", textAlign: "right" }
  },
  {
    id: "art_total",
    type: "VARIABLE",
    x: 460,
    y: 335,
    width: 85,
    height: 20,
    value: "{article.totalHT}",
    isArticleRepeated: true,
    verticalPitch: 50,
    style: { fontSize: 10, fontWeight: "bold", color: "#000000", textAlign: "right" }
  },

  // FOOTER TOTAL
  {
    id: "total_bg",
    type: "RECT",
    x: 380,
    y: 650,
    width: 175,
    height: 40,
    style: { backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#003366" }
  },
  {
    id: "total_label",
    type: "TEXT",
    x: 390,
    y: 660,
    width: 80,
    height: 20,
    value: "TOTAL À PAYER",
    style: { fontSize: 10, fontWeight: "bold" }
  },
  {
    id: "total_value",
    type: "VARIABLE",
    x: 470,
    y: 658,
    width: 75,
    height: 25,
    value: "{totalTTC}",
    style: { fontSize: 14, fontWeight: "bold", color: "#003366", textAlign: "right" }
  },

  // LEGAL MENTIONS
  {
    id: "vat_mention",
    type: "TEXT",
    x: 40,
    y: 720,
    width: 515,
    height: 20,
    value: "Opération exonérée de TVA en vertu de l'article 256 B du Code Général des Impôts.",
    style: { fontSize: 8, italic: true, color: "#666666" }
  },
  {
    id: "legal_footer",
    type: "TEXT",
    x: 40,
    y: 740,
    width: 515,
    height: 50,
    value: "Règlement à réception. En cas de retard de paiement, une indemnité forfaitaire de 40 € pour frais de recouvrement sera due (décret n°2012-1115). Des pénalités de retard calculées sur la base de 3 fois le taux de l'intérêt légal seront également appliquées.",
    style: { fontSize: 7, color: "#666666", textAlign: "center" }
  }
];

async function seed() {
  console.log('Seeding DGFIP Gabarit...');
  
  // Disable current default
  await prisma.gabarit.updateMany({
    where: { isDefault: true },
    data: { isDefault: false }
  });

  const gabarit = await prisma.gabarit.create({
    data: {
      nom: "Facture Officielle Ivry (DGFIP)",
      isDefault: true,
      contenu: JSON.stringify({ elements })
    }
  });

  console.log(`Created gabarit: ${gabarit.nom} (ID: ${gabarit.id})`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
