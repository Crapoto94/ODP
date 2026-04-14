import { prisma } from './prisma';

// ---------------------------------------------------------------------------
// Définition des messages contextuels : clé, libellé, variables, HTML par défaut
// ---------------------------------------------------------------------------

export const CONTEXTUAL_MESSAGE_DEFS: Record<string, {
  label: string;
  description: string;
  vars: string[];
  defaultSubject: string;
  default: string;
}> = {
  MSG_SIGNATURE_REQUEST: {
    label: 'Demande de signature',
    description: 'Envoyé au signataire pour lui demander de signer un AOT.',
    vars: ['{{SIGNATAIRE}}', '{{AOT_REF}}', '{{AOT_TYPE}}', '{{LIEN_SIGNATURE}}', '{{DATE_EXPIRATION}}'],
    defaultSubject: 'Signature requise — AOT #{{AOT_REF}}',
    default: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6}
  .container{max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center}
  .header h1{margin:0;font-size:24px}
  .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
  .field{margin:20px 0;padding:15px;background:white;border-left:4px solid #667eea}
  .field-label{font-weight:bold;color:#667eea;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
  .field-value{margin-top:5px;font-size:16px}
  .cta-button{display:inline-block;background:#667eea;color:white;padding:15px 40px;border-radius:6px;text-decoration:none;font-weight:bold;margin:20px 0;font-size:16px}
  .expiration{background:#fff3cd;border:1px solid #ffc107;padding:15px;border-radius:6px;margin:20px 0}
  .footer{color:#666;font-size:12px;text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #ddd}
</style></head>
<body><div class="container">
  <div class="header"><h1>📋 Signature Requise</h1></div>
  <div class="content">
    <p>Bonjour <strong>{{SIGNATAIRE}}</strong>,</p>
    <p>Un document d'arrêté d'occupation du domaine public a été soumis pour votre signature électronique.</p>
    <div class="field"><div class="field-label">Référence du dossier</div><div class="field-value">#{{AOT_REF}}</div></div>
    <div class="field"><div class="field-label">Type de document</div><div class="field-value">{{AOT_TYPE}}</div></div>
    <p style="text-align:center"><a href="{{LIEN_SIGNATURE}}" class="cta-button">Consulter et Signer</a></p>
    <div class="expiration"><p>⏰ <strong>Attention :</strong> Ce lien sera valide jusqu'au <strong>{{DATE_EXPIRATION}}</strong>.</p></div>
    <p>Si vous n'avez pas demandé cette signature ou si vous avez des questions, veuillez contacter l'administrateur du système.</p>
    <div class="footer"><p>ODP Console - Domaine Public</p><p>Ce document a été généré automatiquement. Veuillez ne pas répondre à cet email.</p></div>
  </div>
</div></body></html>`,
  },

  MSG_SIGNATURE_REJET: {
    label: 'Rejet de signature',
    description: 'Envoyé à l\'administrateur quand un signataire refuse de signer.',
    vars: ['{{SIGNATAIRE}}', '{{AOT_REF}}', '{{DATE_REJET}}', '{{COMMENTAIRE}}'],
    defaultSubject: 'Signature refusée — AOT #{{AOT_REF}}',
    default: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6}
  .container{max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center}
  .header h1{margin:0;font-size:24px}
  .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
  .warning-box{background:#fee2e2;border:1px solid #ef4444;padding:20px;border-radius:6px;margin:20px 0}
  .warning-box h3{color:#dc2626;margin-top:0}
  .field{margin:20px 0;padding:15px;background:white;border-left:4px solid #ef4444}
  .field-label{font-weight:bold;color:#ef4444;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
  .field-value{margin-top:5px;font-size:16px}
  .comment-box{background:white;padding:15px;border-left:4px solid #f59e0b;margin:20px 0;font-style:italic;color:#666}
  .footer{color:#666;font-size:12px;text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #ddd}
</style></head>
<body><div class="container">
  <div class="header"><h1>❌ Signature Refusée</h1></div>
  <div class="content">
    <div class="warning-box"><h3>Rejet de Signature</h3><p>Le document a été rejeté par <strong>{{SIGNATAIRE}}</strong>.</p></div>
    <div class="field"><div class="field-label">Référence du dossier</div><div class="field-value">#{{AOT_REF}}</div></div>
    <div class="field"><div class="field-label">Rejeté le</div><div class="field-value">{{DATE_REJET}}</div></div>
    <div class="field"><div class="field-label">Commentaire du signataire</div><div class="comment-box">"{{COMMENTAIRE}}"</div></div>
    <p style="color:#dc2626;font-weight:bold">⚠️ Action Requise</p>
    <p>Veuillez adresser les points mentionnés et resoumettre le document pour signature.</p>
    <div class="footer"><p>ODP Console - Domaine Public</p><p>Ce document a été généré automatiquement. Veuillez ne pas répondre à cet email.</p></div>
  </div>
</div></body></html>`,
  },

  MSG_AOT_SIGNE: {
    label: 'AOT signé — notification au demandeur',
    description: 'Envoyé à l\'agent qui a demandé la signature, une fois l\'AOT signé.',
    vars: ['{{DEMANDEUR}}', '{{TIERS}}', '{{LIEN_DOSSIER}}', '{{SIGNATAIRE}}', '{{DATE_SIGNATURE}}'],
    defaultSubject: '✅ AOT signé — {{TIERS}}',
    default: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6}
  .container{max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center}
  .header h1{margin:0;font-size:24px}
  .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
  .success-box{background:#d1fae5;border:1px solid #10b981;padding:20px;border-radius:6px;margin:20px 0}
  .success-box h3{color:#059669;margin-top:0}
  .field{margin:20px 0;padding:15px;background:white;border-left:4px solid #10b981}
  .field-label{font-weight:bold;color:#10b981;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
  .field-value{margin-top:5px;font-size:16px}
  .cta-button{display:inline-block;background:#10b981;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:20px 0;font-size:14px}
  .footer{color:#666;font-size:12px;text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #ddd}
</style></head>
<body><div class="container">
  <div class="header"><h1>✅ AOT Signé</h1></div>
  <div class="content">
    <p>Bonjour <strong>{{DEMANDEUR}}</strong>,</p>
    <div class="success-box"><h3>Signature confirmée</h3><p>L'arrêté que vous avez soumis à signature a été signé avec succès par <strong>{{SIGNATAIRE}}</strong>.</p></div>
    <div class="field"><div class="field-label">Tiers</div><div class="field-value">{{TIERS}}</div></div>
    <div class="field"><div class="field-label">Signé le</div><div class="field-value">{{DATE_SIGNATURE}}</div></div>
    <p style="text-align:center"><a href="{{LIEN_DOSSIER}}" class="cta-button">Consulter le dossier</a></p>
    <div class="footer"><p>ODP Console - Domaine Public</p><p>Ce message a été généré automatiquement.</p></div>
  </div>
</div></body></html>`,
  },

  MSG_AOT_REFUSE: {
    label: 'AOT refusé — notification au demandeur',
    description: 'Envoyé à l\'agent qui a demandé la signature, quand le signataire refuse.',
    vars: ['{{DEMANDEUR}}', '{{TIERS}}', '{{LIEN_DOSSIER}}', '{{SIGNATAIRE}}', '{{DATE_REJET}}', '{{COMMENTAIRE}}'],
    defaultSubject: '⚠️ AOT refusé — {{TIERS}}',
    default: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#333;line-height:1.6}
  .container{max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;padding:30px;border-radius:8px 8px 0 0;text-align:center}
  .header h1{margin:0;font-size:24px}
  .content{background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px}
  .warning-box{background:#fef3c7;border:1px solid #f59e0b;padding:20px;border-radius:6px;margin:20px 0}
  .warning-box h3{color:#d97706;margin-top:0}
  .field{margin:20px 0;padding:15px;background:white;border-left:4px solid #f59e0b}
  .field-label{font-weight:bold;color:#d97706;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
  .field-value{margin-top:5px;font-size:16px}
  .comment-box{background:white;padding:15px;border-left:4px solid #ef4444;margin:20px 0;font-style:italic;color:#666}
  .cta-button{display:inline-block;background:#f59e0b;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:20px 0;font-size:14px}
  .footer{color:#666;font-size:12px;text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #ddd}
</style></head>
<body><div class="container">
  <div class="header"><h1>⚠️ Signature Refusée</h1></div>
  <div class="content">
    <p>Bonjour <strong>{{DEMANDEUR}}</strong>,</p>
    <div class="warning-box"><h3>Rejet de signature</h3><p>L'arrêté que vous avez soumis a été refusé par <strong>{{SIGNATAIRE}}</strong>.</p></div>
    <div class="field"><div class="field-label">Tiers</div><div class="field-value">{{TIERS}}</div></div>
    <div class="field"><div class="field-label">Refusé le</div><div class="field-value">{{DATE_REJET}}</div></div>
    <div class="field"><div class="field-label">Motif</div><div class="comment-box">"{{COMMENTAIRE}}"</div></div>
    <p style="text-align:center"><a href="{{LIEN_DOSSIER}}" class="cta-button">Consulter le dossier</a></p>
    <p style="color:#d97706;font-weight:bold">⚠️ Veuillez corriger le document et relancer la procédure de signature.</p>
    <div class="footer"><p>ODP Console - Domaine Public</p><p>Ce message a été généré automatiquement.</p></div>
  </div>
</div></body></html>`,
  },

  MSG_TIERS: {
    label: 'Demande de création de tiers',
    description: 'Envoyé au service RH ou SEDIT lors de la création d\'un nouveau tiers.',
    vars: ['{{NOM}}', '{{EMAIL}}', '{{SIRET}}', '{{ADRESSE}}', '{{TYPE}}', '{{LIEN_VALIDATION}}'],
    defaultSubject: 'Nouveau tiers à créer — {{NOM}}',
    default: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
  <div style="background-color:#0f172a;color:white;padding:30px;text-align:center">
    <h2 style="margin:0;font-size:20px;letter-spacing:-.5px">Demande de création de tiers {{TYPE}}</h2>
  </div>
  <div style="padding:30px;color:#334155">
    <p>Un nouveau tiers a été identifié par le service ODP :</p>
    <div style="background-color:#f8fafc;padding:20px;border-radius:12px;margin:20px 0">
      <p style="margin:5px 0"><strong>Nom :</strong> {{NOM}}</p>
      <p style="margin:5px 0"><strong>Email :</strong> {{EMAIL}}</p>
      <p style="margin:5px 0"><strong>SIRET :</strong> {{SIRET}}</p>
      <p style="margin:5px 0"><strong>Adresse :</strong> {{ADRESSE}}</p>
    </div>
    <div style="text-align:center;margin-top:30px">
      <a href="{{LIEN_VALIDATION}}" style="background-color:#2563eb;color:white;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:bold;display:inline-block;font-size:14px">
        Saisir le code SEDIT &amp; Valider
      </a>
    </div>
    <p style="font-size:11px;color:#94a3b8;text-align:center;margin-top:20px">
      Cliquer sur ce bouton pour passer le tiers en définitif dans l'application ODP.
    </p>
  </div>
</div>`,
  },
};

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
    const rows = await (prisma as any).$queryRaw`
      SELECT valeur, sujet, disabled FROM ContextualMessage WHERE cle = ${cle}
    `;
    const row = (rows as any[])[0];
    if (row?.disabled === true || row?.disabled === 1) {
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
