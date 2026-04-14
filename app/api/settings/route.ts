import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await (prisma.appSettings as any).findFirst();
    if (!settings) {
      settings = await (prisma.appSettings as any).create({
        data: {
          id: 1,
          financeEmail: 'finances@mairie-65k.fr',
          appUrl: 'http://localhost:3000',
          apmUrl: 'http://localhost:8001/api/v1',
          apmToken: 'DSIHUB-ODP-KEY-2026',
          senderName: 'ODP Console',
          senderEmail: 'dsihub@fbc.fr',
          filienOrga: '01',
          filienBudget: 'BA',
          filienExercice: new Date().getFullYear(),
          filienAvancement: '5',
          filienRejetDispo: true,
          filienRejetCA: false,
          filienRejetMarche: false,
          filienMouvement: "1",
          filienType: 'R',
          filienLibelle: '',
          filienCalendrier: '01',
          filienMonnaie: 'E',
          filienMouvementEx: 'N',
          filienPreBordereau: '1235',
          filienPoste: '0001',
          filienBordereau: '0001',
          filienObjet: '',
          filienChapitre: '',
          filienNature: '',
          filienFonction: '',
          filienCodeInterne: '',
          filienTypeMouvement: '',
          filienSens: '',
          filienStructure: '',
          filienGestionnaire: '',
          filienUncPj: '',
          filienUncUser: '',
          filienUncPass: '',
          filienUncDomain: 'WORKGROUP',
          signataireRole: "Le Maire d'Ivry-sur-Seine,",
          signataireDelegation: "et par délégation,",
          signataireNom: "Dominique Montet - Directrice Générale Adjointe"
        }
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { 
      financeEmail, appUrl, apmUrl, apmToken, senderName, senderEmail,
      filienOrga, filienBudget, filienExercice, filienAvancement,
      filienRejetDispo, filienRejetCA, filienRejetMarche,
      filienMouvement, filienType, filienLibelle, filienCalendrier,
      filienMonnaie, filienMouvementEx, filienPreBordereau,
      filienPoste,
      filienBordereau,
      filienObjet,
      filienChapitre,
      filienNature,
      filienFonction,
      filienCodeInterne,
      filienTypeMouvement,
      filienSens,
      filienStructure,
      filienGestionnaire,
      filienUncPj,
      filienUncUser,
      filienUncPass,
      filienUncDomain,
      signataireRole,
      signataireDelegation,
      signataireNom,
      footer1,
      footer2,
      footer3,
      footerColor,
      adDomain
    } = body;

    // Use Raw SQL to bypass Prisma Client sync issues (due to locked files during generate)
    // We use parameterized queries to prevent SQL Injection
    
    // 1. Check if it exists
    const existing = await (prisma as any).$queryRaw`SELECT id FROM AppSettings WHERE id = 1`;
    
    if (existing && existing.length > 0) {
      await (prisma as any).$executeRaw`
        UPDATE AppSettings 
        SET 
          financeEmail = ${financeEmail},
          appUrl = ${appUrl},
          apmUrl = ${apmUrl},
          apmToken = ${apmToken},
          senderName = ${senderName},
          senderEmail = ${senderEmail},
          filienOrga = ${filienOrga},
          filienBudget = ${filienBudget},
          filienExercice = ${parseInt(filienExercice) || new Date().getFullYear()},
          filienAvancement = ${filienAvancement},
          filienRejetDispo = ${filienRejetDispo ? 1 : 0},
          filienRejetCA = ${filienRejetCA ? 1 : 0},
          filienRejetMarche = ${filienRejetMarche ? 1 : 0},
          filienMouvement = ${filienMouvement},
          filienType = ${filienType},
          filienLibelle = ${filienLibelle},
          filienCalendrier = ${filienCalendrier},
          filienMonnaie = ${filienMonnaie},
          filienMouvementEx = ${filienMouvementEx},
          filienPreBordereau = ${filienPreBordereau},
          filienPoste = ${filienPoste},
          filienBordereau = ${filienBordereau},
          filienObjet = ${filienObjet},
          filienChapitre = ${filienChapitre},
          filienNature = ${filienNature},
          filienFonction = ${filienFonction},
          filienCodeInterne = ${filienCodeInterne},
          filienTypeMouvement = ${filienTypeMouvement},
          filienSens = ${filienSens},
          filienStructure = ${filienStructure},
          filienGestionnaire = ${filienGestionnaire},
          filienUncPj = ${filienUncPj},
          filienUncUser = ${filienUncUser},
          filienUncPass = ${filienUncPass},
          filienUncDomain = ${filienUncDomain},
          signataireRole = ${signataireRole},
          signataireDelegation = ${signataireDelegation},
          signataireNom = ${signataireNom},
          footer1 = ${footer1 || null},
          footer2 = ${footer2 || null},
          footer3 = ${footer3 || null},
          footerColor = ${footerColor || null},
          adDomain = ${adDomain || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `;
    } else {
      await (prisma as any).$executeRaw`
        INSERT INTO AppSettings (
          id, financeEmail, appUrl, apmUrl, apmToken, senderName, senderEmail,
          filienOrga, filienBudget, filienExercice, filienAvancement,
          filienRejetDispo, filienRejetCA, filienRejetMarche,
          filienMouvement, filienType, filienLibelle, filienCalendrier,
          filienMonnaie, filienMouvementEx, filienPreBordereau,
          filienPoste, filienBordereau, filienObjet,
          filienTypeMouvement, filienSens, filienStructure, filienGestionnaire,
          filienUncPj, filienUncUser, filienUncPass, filienUncDomain, signataireRole, signataireDelegation, signataireNom,
          footer1, footer2, footer3, footerColor, updated_at
        ) VALUES (
          1, ${financeEmail}, ${appUrl}, ${apmUrl}, ${apmToken}, ${senderName}, ${senderEmail},
          ${filienOrga}, ${filienBudget}, ${parseInt(filienExercice) || new Date().getFullYear()}, ${filienAvancement},
          ${filienRejetDispo}, ${filienRejetCA}, ${filienRejetMarche},
          ${filienMouvement}, ${filienType}, ${filienLibelle}, ${filienCalendrier}, ${filienMonnaie}, ${filienMouvementEx}, ${filienPreBordereau},
          ${filienPoste}, ${filienBordereau}, ${filienObjet},
          ${filienChapitre}, ${filienNature}, ${filienFonction}, ${filienCodeInterne},
          ${filienTypeMouvement}, ${filienSens}, ${filienStructure}, ${filienGestionnaire},
          ${filienUncPj}, ${filienUncUser}, ${filienUncPass}, ${filienUncDomain}, ${signataireRole}, ${signataireDelegation}, ${signataireNom},
          ${footer1 || null}, ${footer2 || null}, ${footer3 || null}, ${footerColor || null}, CURRENT_TIMESTAMP
        )
      `;
    }

    const results = await (prisma as any).$queryRaw`SELECT * FROM AppSettings WHERE id = 1`;
    return NextResponse.json(results[0] || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
