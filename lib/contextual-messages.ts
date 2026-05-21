import { prisma } from './prisma';
import { CONTEXTUAL_MESSAGE_DEFS } from './contextual-messages-defs';

export { CONTEXTUAL_MESSAGE_DEFS };

// ---------------------------------------------------------------------------
// Résolution d'un message : DB → fallback défaut → substitution des variables
// ---------------------------------------------------------------------------

export async function getContextualMessageData(
  cle: string,
  vars: Record<string, string> = {}
): Promise<{ html: string; subject: string }> {
  let html = '';
  let subject = '';

  try {
    const row = await (prisma as any).contextualMessage.findUnique({
      where: { cle }
    });
    if (row?.disabled) {
      return { html: '', subject: '' };
    }
    html = row?.valeur || '';
    subject = row?.sujet || '';
  } catch {
    html = '';
    subject = '';
  }

  if (!html) html = CONTEXTUAL_MESSAGE_DEFS[cle]?.default || '';
  if (!subject) subject = CONTEXTUAL_MESSAGE_DEFS[cle]?.defaultSubject || '';

  // Substitution des variables {{VAR}}
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value ?? '');
    subject = subject.replaceAll(`{{${key}}}`, value ?? '');
  }

  return { html, subject };
}

// Compatibilité : retourne uniquement le HTML
export async function getContextualMessage(
  cle: string,
  vars: Record<string, string> = {}
): Promise<string> {
  return (await getContextualMessageData(cle, vars)).html;
}
