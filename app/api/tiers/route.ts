import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSiretInfo } from '@/lib/insee';
import { sendApmMail } from '@/lib/apm';
import { getContextualMessageData } from '@/lib/contextual-messages';

function mapNatureJuridique(apiNature: string): string {
  if (!apiNature) return '';
  const nature = apiNature.toLowerCase();
  
  if (nature.includes('entrepreneur individuel') || nature.includes('libérale')) {
    return 'AUTO_ENTREPRENEUR';
  }
  if (nature.includes('société') || nature.includes('arl') || nature.includes('sas') || nature.includes('sasu') || nature.includes('eurl') || nature.includes('sa')) {
    return 'SOCIETE';
  }
  if (nature.includes('association')) {
    return 'ASSOCIATION';
  }
  if (nature.includes('public') || nature.includes('mairie') || nature.includes('collectivité') || nature.includes('administration') || nature.includes('commune') || nature.includes('etat')) {
    return 'PUBLIC';
  }
  
  return ''; // Fallback to empty if no clear match
}

export async function GET() {
  try {
    const tiers = await (prisma as any).tiers.findMany({
      orderBy: { nom: 'asc' },
      include: {
        contacts: true,
        _count: {
          select: { occupations: true }
        }
      }
    });
    return NextResponse.json(tiers);
  } catch (error: any) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, nom, natureJuridique, siret, email, adresse, code_sedit, isRhRequest, isSeditRequest } = body;

    if (!nom) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    let finalNom = nom;
    let finalAdresse = adresse;

    // Auto-fetch info if SIRET is provided and name is generic or missing
    const cleanSiret = (siret && siret.trim() !== '') ? siret.replace(/\s+/g, '') : null;
    if (cleanSiret && cleanSiret.length === 14 && !id) {
      const info = await fetchSiretInfo(cleanSiret);
      if (info) {
        finalNom = info.nom;
        finalAdresse = info.adresse;
        if (!natureJuridique && info.categorie_juridique) {
          body.natureJuridique = mapNatureJuridique(info.categorie_juridique);
        }
      }
    }

    const { natureJuridique: updatedNature } = body;

    // Duplicate checks
    if (!id) {
      if (cleanSiret) {
        const existingSiret = await (prisma as any).tiers.findUnique({
          where: { siret: cleanSiret }
        });
        if (existingSiret) {
          return NextResponse.json({ error: 'Un tiers avec ce SIRET existe déjà' }, { status: 400 });
        }
      }
      if (code_sedit) {
        const existingSedit = await (prisma as any).tiers.findUnique({
          where: { code_sedit }
        });
        if (existingSedit) {
          return NextResponse.json({ error: 'Ce code tiers SEDIT est déjà utilisé par un autre tiers' }, { status: 400 });
        }
      }
      const existingNom = await (prisma as any).tiers.findFirst({
        where: { nom: finalNom }
      });
      if (existingNom) {
        return NextResponse.json({ error: 'Un tiers avec ce nom existe déjà' }, { status: 400 });
      }
    } else {
      // For updates via POST (if used that way)
      if (cleanSiret) {
         const existingSiret = await (prisma as any).tiers.findFirst({
           where: { siret: cleanSiret, NOT: { id: Number(id) } }
         });
         if (existingSiret) {
           return NextResponse.json({ error: 'Un tiers avec ce SIRET existe déjà' }, { status: 400 });
         }
      }
      if (code_sedit) {
        const existingSedit = await (prisma as any).tiers.findFirst({
          where: { code_sedit, NOT: { id: Number(id) } }
        });
        if (existingSedit) {
          return NextResponse.json({ error: 'Ce code tiers SEDIT est déjà utilisé par un autre tiers' }, { status: 400 });
        }
      }
      const existingNom = await (prisma as any).tiers.findFirst({
        where: { nom: finalNom, NOT: { id: Number(id) } }
      });
      if (existingNom) {
        return NextResponse.json({ error: 'Un tiers avec ce nom existe déjà' }, { status: 400 });
      }
    }

    // Upsert or Create/Update
    let tiers;
    if (id) {
        tiers = await (prisma as any).tiers.update({
          where: { id: Number(id) },
          data: {
            nom: finalNom,
            natureJuridique: updatedNature || natureJuridique,
            siret: cleanSiret,
            email,
            adresse: finalAdresse,
            code_sedit: code_sedit || undefined
          }
        });
    } else {
        tiers = await (prisma as any).tiers.create({
          data: {
            nom: finalNom,
            natureJuridique: updatedNature || natureJuridique,
            siret: cleanSiret,
            email,
            adresse: finalAdresse,
            code_sedit
          }
        });
    }

    // Handle SEDIT/RH requests
    if (isSeditRequest || isRhRequest) {
      const settings = await (prisma as any).appSettings.findFirst();
      const targetEmail = isSeditRequest ? settings?.financeEmail : 'ressources.humaines@mairie-65k.fr';
      
      if (targetEmail) {
        const typeLabel = isSeditRequest ? 'SEDIT' : 'RH';
        const baseUrl = settings?.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verifyUrl = `${baseUrl}/dashboard/tiers/verify/${tiers.id}`;
        
        const { html: mailContent, subject: mailSubject } = await getContextualMessageData('MSG_TIERS', {
          NOM: finalNom,
          EMAIL: email || 'N/A',
          SIRET: siret || 'N/A',
          ADRESSE: finalAdresse || 'N/A',
          TYPE: typeLabel,
          LIEN_VALIDATION: verifyUrl,
        });

        try {
          await sendApmMail(
            targetEmail,
            mailSubject || `[ODP] Demande création tiers ${typeLabel} : ${finalNom}`,
            mailContent,
            'Console ODP'
          );
        } catch (e) {
          console.warn(`[TIERS] Mail ${typeLabel} failed.`, e);
        }
      }
    }

    return NextResponse.json(tiers);
  } catch (error: any) {
    console.error('[TIERS POST ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, nom, natureJuridique, siret, email, adresse, code_sedit } = body;

    if (!id) {
      return NextResponse.json({ error: "L'ID est requis pour la modification" }, { status: 400 });
    }

    // Check duplicates before update
    if (nom) {
      const existingNom = await (prisma as any).tiers.findFirst({
        where: { nom: nom, NOT: { id: Number(id) } }
      });
      if (existingNom) {
        return NextResponse.json({ error: 'Un tiers avec ce nom existe déjà' }, { status: 400 });
      }
    }

    if (siret) {
      const cleanSiret = siret.replace(/\s+/g, '');
      const existingSiret = await (prisma as any).tiers.findFirst({
        where: { siret: cleanSiret, NOT: { id: Number(id) } }
      });
      if (existingSiret) {
        return NextResponse.json({ error: 'Un tiers avec ce SIRET existe déjà' }, { status: 400 });
      }
    }

    if (code_sedit) {
      const existingSedit = await (prisma as any).tiers.findFirst({
        where: { code_sedit: code_sedit, NOT: { id: Number(id) } }
      });
      if (existingSedit) {
        return NextResponse.json({ error: 'Ce code tiers SEDIT est déjà utilisé par un autre tiers' }, { status: 400 });
      }
    }

    const finalCleanSiret = (siret && siret.trim() !== '') ? siret.replace(/\s+/g, '') : null;

    const tiers = await (prisma as any).tiers.update({
      where: { id: Number(id) },
      data: {
        nom,
        natureJuridique,
        siret: finalCleanSiret,
        email,
        adresse,
        code_sedit: code_sedit || null
      }
    });

    return NextResponse.json(tiers);
  } catch (error: any) {
    if (error.code === 'P2002') {
       const target = error.meta?.target || '';
       const field = target.includes('siret') ? 'SIRET' : (target.includes('code_sedit') ? 'Code SEDIT' : 'donnée unique');
       return NextResponse.json({ error: `La valeur de ${field} est déjà utilisée par un autre tiers.` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "L'ID est requis pour la suppression" }, { status: 400 });
    }

    // Check if tiers has associated occupations
    const occupationsCount = await (prisma as any).occupation.count({
      where: { tiersId: Number(id) }
    });

    if (occupationsCount > 0) {
      return NextResponse.json({ 
        error: "Impossible de supprimer ce tiers car il possède des dossiers associés." 
      }, { status: 400 });
    }

    await (prisma as any).tiers.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
