import { prisma } from './prisma';

export async function initializeTypeDossierConfigs() {
  try {
    const count = await (prisma as any).typeDossierConfig.count();
    if (count > 0) return;

    console.log('[Init] No configurations found. Starting initialization...');

    const settings = await (prisma as any).appSettings.findFirst();
    const defaultGabarit = await (prisma as any).gabarit.findFirst({
      where: { isDefault: true }
    });

    const types = ['COMMERCE', 'CHANTIER', 'TOURNAGE', 'TLPE'];

    const baseConfig = {
      invoiceTemplateId: defaultGabarit?.id?.toString() || '',
      filienObjet: settings?.filienLibelle || 'Occupation du Domaine Public',
      filienChapitre: (settings as any)?.filienChapitre || '70',
      filienNature: (settings as any)?.filienNature || '70323',
      filienFonction: (settings as any)?.filienFonction || '020',
      filienFonctionEnseignes: (settings as any)?.filienFonction || '020',
      filienFonctionAutres: (settings as any)?.filienFonction || '020',
      filienCodeInterne: (settings as any)?.filienCodeInterne || '',
      filienTypeMouvement: (settings as any)?.filienTypeMouvement || 'F',
      filienSens: (settings as any)?.filienSens || '1',
      filienStructure: (settings as any)?.filienStructure || 'O',
      filienGestionnaire: (settings as any)?.filienGestionnaire || 'DS'
    };

    for (const type of types) {
      console.log(`[Init] Creating config for ${type}`);
      await (prisma as any).typeDossierConfig.create({
        data: {
          type,
          ...baseConfig,
          ...(type === 'TLPE' ? { filienObjet: 'TLPE - Taxation Annuelle' } : {})
        }
      });
    }

    console.log('[Init] Successfully initialized TypeDossierConfigs');
  } catch (error) {
    console.error('[Init] Error initializing TypeDossierConfigs:', error);
    // throw error; // Optional: depending on if we want to fail the whole request
  }
}
