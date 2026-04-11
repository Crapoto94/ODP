import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier n'a été fourni." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(bytes, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Le fichier Excel est vide." }, { status: 400 });
    }

    // Helper to find column by multiple possible names
    const findValue = (row: any, candidates: string[]) => {
      for (const cand of candidates) {
        if (row[cand] !== undefined) return row[cand];
        // Try exact match, then case insensitive
        const key = Object.keys(row).find(k => k.trim().toUpperCase() === cand.toUpperCase());
        if (key) return row[key];
      }
      return null;
    };

    const stats = { new: 0, updated: 0, unchanged: 0, errors: 0 };
    const details: any[] = [];

    for (const row of rows) {
      try {
        const code_sedit = findValue(row, ['CODE_TIERS', 'TIERS', 'CODE', 'C_TIERS', 'Code Sedit']);
        const nom = findValue(row, ['NOM', 'LIBELLE', 'L_TIERS', 'RAISON SOCIALE', 'Nom']);
        const email = findValue(row, ['EMAIL', 'E-MAIL', 'MAIL', 'Email']);
        const adresse = findValue(row, ['Adresse (Usuelle)', 'ADRESSE', 'ADR1', 'ADRESSE 1', 'Adresse']);
        const natureJuridique = findValue(row, ['NATURE', 'NATURE_JURIDIQUE', 'NATURE JURIDIQUE', 'Type']);
        const siret = findValue(row, ['SIRET', 'SIREN']);

        if (!nom || !code_sedit) {
          stats.errors++;
          continue;
        }

        const stringCodeSedit = code_sedit.toString();

        // 1. Find existing tier by code_sedit
        const existing = await (prisma as any).tiers.findFirst({
          where: { code_sedit: stringCodeSedit }
        });

        if (existing) {
          // Compare and Update
          const updates: any = {};
          if (nom && nom !== existing.nom) updates.nom = nom;
          if (siret && siret !== existing.siret) updates.siret = siret.toString();
          if (email && email !== existing.email) updates.email = email;
          if (adresse && adresse !== existing.adresse) updates.adresse = adresse;
          
          // Nature juridique management: prioritize Excel if present, otherwise handle SIRET change
          const newNature = natureJuridique ? natureJuridique.toString() : (siret ? (existing.natureJuridique || '03') : '01');
          if (newNature !== existing.natureJuridique) updates.natureJuridique = newNature;

          if (Object.keys(updates).length > 0) {
            await (prisma as any).tiers.update({
              where: { id: existing.id },
              data: updates
            });
            stats.updated++;
            details.push({
              type: 'UPDATE',
              nom: existing.nom,
              changes: updates
            });
          } else {
            stats.unchanged++;
          }
        } else {
          // 2. Fallback check by SIRET or Name+Address to avoid duplicates
          let matchedOther = null;
          
          if (siret) {
            matchedOther = await (prisma as any).tiers.findUnique({ where: { siret: siret.toString() } });
          } else {
            // Dedup by Name + Address for individuals
            matchedOther = await (prisma as any).tiers.findFirst({
              where: { 
                nom,
                adresse: adresse || ''
              }
            });
          }

          if (matchedOther) {
             // Link the existing tier with the new code_sedit and other info
             const updates: any = { 
               code_sedit: stringCodeSedit, 
               nom, 
               adresse, 
               email 
             };
             const newNature = natureJuridique ? natureJuridique.toString() : (siret ? (matchedOther.natureJuridique || '03') : '01');
             if (newNature !== matchedOther.natureJuridique) updates.natureJuridique = newNature;

             await (prisma as any).tiers.update({
               where: { id: matchedOther.id },
               data: updates
             });
             stats.updated++;
             details.push({
               type: 'LINKED_SEDIT',
               nom: nom,
               changes: { code_sedit: stringCodeSedit }
             });
          } else {
            // Create New
            await (prisma as any).tiers.create({
              data: {
                nom,
                code_sedit: stringCodeSedit,
                siret: siret?.toString() || null,
                email,
                adresse,
                natureJuridique: natureJuridique?.toString() || (siret ? '03' : '01'),
                statut: 'VALIDE'
              }
            });
            stats.new++;
            details.push({ type: 'NEW', nom });
          }
        }
      } catch (e: any) {
        console.error("Row error:", e.message);
        stats.errors++;
      }
    }

    return NextResponse.json({ stats, details });
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
