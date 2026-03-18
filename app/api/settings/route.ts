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
          filienGestionnaire: ''
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
      filienGestionnaire
    } = body;

    const settings = await (prisma.appSettings as any).upsert({
      where: { id: 1 },
      update: { 
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
        filienGestionnaire
      },
      create: { 
        id: 1, 
        filienCalendrier: filienCalendrier || '01',
        filienMonnaie: filienMonnaie || 'E',
        filienMouvementEx: filienMouvementEx || 'N',
        filienPreBordereau: filienPreBordereau || '1235',
        filienPoste: filienPoste || '0001',
        filienBordereau: filienBordereau || '0001',
        filienObjet: filienObjet || ''
      }
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
