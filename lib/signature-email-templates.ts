/**
 * Email templates for digital signature workflow
 */

export interface SignatureEmailContext {
  signatorName: string;
  signatorEmail: string;
  occupationRef: string;
  occupationType: string;
  signatureLink: string;
  expirationDate: string;
  appName?: string;
}

export interface SignatureConfirmationContext {
  adminEmail: string;
  signatorName: string;
  occupationRef: string;
  signedAt: string;
  downloadLink?: string;
}

export interface SignatureRejectionContext {
  adminEmail: string;
  signatorName: string;
  occupationRef: string;
  rejectedAt: string;
  rejectionComment?: string;
}

/**
 * Generate HTML for signature request email
 */
export function generateSignatureRequestEmail(context: SignatureEmailContext): string {
  const {
    signatorName,
    occupationRef,
    occupationType,
    signatureLink,
    expirationDate,
    appName = 'ODP Console',
  } = context;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .field { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #667eea; }
    .field-label { font-weight: bold; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { margin-top: 5px; font-size: 16px; }
    .cta-button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; font-size: 16px; }
    .cta-button:hover { background: #764ba2; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .expiration { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .expiration-icon { font-size: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Signature Requise</h1>
    </div>
    <div class="content">
      <p>Bonjour <strong>${signatorName}</strong>,</p>

      <p>Un document d'arrêté d'occupation du domaine public a été soumis pour votre signature électronique.</p>

      <div class="field">
        <div class="field-label">Référence du dossier</div>
        <div class="field-value">#${occupationRef}</div>
      </div>

      <div class="field">
        <div class="field-label">Type de document</div>
        <div class="field-value">${occupationType}</div>
      </div>

      <p style="text-align: center;">
        <a href="${signatureLink}" class="cta-button">Consulter et Signer</a>
      </p>

      <div class="expiration">
        <p><span class="expiration-icon">⏰</span> <strong>Attention :</strong> Ce lien sera valide jusqu'au <strong>${expirationDate}</strong>.</p>
      </div>

      <p>Si vous n'avez pas demandé cette signature ou si vous avez des questions, veuillez contacter l'administrateur du système.</p>

      <div class="footer">
        <p>${appName} - Domaine Public Ivry-sur-Seine</p>
        <p>Ce document a été généré automatiquement. Veuillez ne pas répondre à cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for signature acceptance confirmation email
 */
export function generateSignatureAcceptanceEmail(
  context: SignatureConfirmationContext
): string {
  const {
    signatorName,
    occupationRef,
    signedAt,
    downloadLink,
  } = context;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-box { background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .success-box h3 { color: #059669; margin-top: 0; }
    .field { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #10b981; }
    .field-label { font-weight: bold; color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { margin-top: 5px; font-size: 16px; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Document Signé</h1>
    </div>
    <div class="content">
      <div class="success-box">
        <h3>Signature Confirmée</h3>
        <p>Le document a été signé avec succès par <strong>${signatorName}</strong>.</p>
      </div>

      <div class="field">
        <div class="field-label">Référence du dossier</div>
        <div class="field-value">#${occupationRef}</div>
      </div>

      <div class="field">
        <div class="field-label">Signé le</div>
        <div class="field-value">${signedAt}</div>
      </div>

      ${
        downloadLink
          ? `
      <div class="field" style="text-align: center;">
        <a href="${downloadLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">📥 Télécharger le document signé</a>
      </div>
      `
          : ''
      }

      <p>Le processus de signature est maintenant terminé. Le document peut être archivé ou transmis selon vos procédures.</p>

      <div class="footer">
        <p>ODP Console - Domaine Public Ivry-sur-Seine</p>
        <p>Ce document a été généré automatiquement. Veuillez ne pas répondre à cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML for signature rejection notification email
 */
export function generateSignatureRejectionEmail(
  context: SignatureRejectionContext
): string {
  const {
    signatorName,
    occupationRef,
    rejectedAt,
    rejectionComment,
  } = context;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning-box { background: #fee2e2; border: 1px solid #ef4444; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .warning-box h3 { color: #dc2626; margin-top: 0; }
    .field { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #ef4444; }
    .field-label { font-weight: bold; color: #ef4444; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { margin-top: 5px; font-size: 16px; }
    .comment-box { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; font-style: italic; color: #666; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Signature Refusée</h1>
    </div>
    <div class="content">
      <div class="warning-box">
        <h3>Rejet de Signature</h3>
        <p>Le document a été rejeté par <strong>${signatorName}</strong>.</p>
      </div>

      <div class="field">
        <div class="field-label">Référence du dossier</div>
        <div class="field-value">#${occupationRef}</div>
      </div>

      <div class="field">
        <div class="field-label">Rejeté le</div>
        <div class="field-value">${rejectedAt}</div>
      </div>

      ${
        rejectionComment
          ? `
      <div class="field">
        <div class="field-label">Commentaire du signataire</div>
        <div class="comment-box">"${rejectionComment}"</div>
      </div>
      `
          : ''
      }

      <p style="color: #dc2626; font-weight: bold;">⚠️ Action Requise</p>
      <p>Veuillez adresser les concerns mentionnées et resoumettez le document pour signature.</p>

      <div class="footer">
        <p>ODP Console - Domaine Public Ivry-sur-Seine</p>
        <p>Ce document a été généré automatiquement. Veuillez ne pas répondre à cet email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
