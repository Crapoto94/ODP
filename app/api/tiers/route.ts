import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchSiretInfo } from '@/lib/insee';
import { sendApmMail } from '@/lib/apm';

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
      orderBy: { created_at: 'desc' },
      include: {
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
    const cleanSiret = siret?.replace(/\s+/g, '');
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
           siret,
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
           siret,
           email,
           adresse: finalAdresse,
           code_sedit,
           statut: 'PROVISOIRE'
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
        
        const mailContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background-color: #0f172a; color: white; padding: 30px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; letter-spacing: -0.5px;">Demande de création de tiers ${typeLabel}</h2>
            </div>
            <div style="padding: 30px; color: #334155;">
              <p>Un nouveau tiers a été identifié par le service ODP :</p>
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Nom :</strong> ${finalNom}</p>
                <p style="margin: 5px 0;"><strong>Email :</strong> ${email || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>SIRET :</strong> ${siret || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${finalAdresse || 'N/A'}</p>
              </div>
              
              ${isSeditRequest ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">
                  Saisir le code SEDIT & Valider
                </a>
              </div>
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px;">
                Cliquer sur ce bouton pour passer le tiers en définitif dans l'application ODP.
              </p>
              ` : '<p style="color: #64748b; font-style: italic;">Veuillez procéder à son intégration dans le référentiel RH.</p>'}
            </div>
          </div>
        `;
        
        try {
          await sendApmMail(
            targetEmail,
            `[ODP] Demande création tiers ${typeLabel} : ${finalNom}`,
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

    const tiers = await (prisma as any).tiers.update({
      where: { id: Number(id) },
      data: {
        nom,
        natureJuridique,
        siret,
        email,
        adresse,
        code_sedit
      }
    });

    return NextResponse.json(tiers);
  } catch (error: any) {
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
