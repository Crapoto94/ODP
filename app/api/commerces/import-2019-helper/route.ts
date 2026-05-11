import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const tiers = await (prisma as any).tiers.findMany({
            select: { id: true, nom: true, adresse: true, siret: true }
        });

        const articles2019 = await (prisma as any).article.findMany({
            where: { annee: 2019 },
            select: { id: true, designation: true, montant: true, modeTaxation: { select: { nom: true } } }
        });

        return Response.json({ tiers, articles2019 });
    } catch (err: any) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
