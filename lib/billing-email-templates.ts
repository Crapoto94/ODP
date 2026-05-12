/**
 * Email templates for billing and SEDIT integration workflow
 */

export interface BillingNotificationContext {
  financeEmail: string;
  billingRunId: string;
  dossiersCount: number;
  dossierTypes: Record<string, number>; // { 'CHANTIER': 5, 'TOURNAGE': 3 }
  agentName: string;
  timestamp: string;
  validationLink: string;
  appName?: string;
  folderPath?: string; // Path to NAS folder with invoices
}

export interface SeditIntegrationConfirmationContext {
  agentEmail: string;
  agentName: string;
  billingRunId: string;
  dossiersCount: number;
  dossierTypes: Record<string, number>;
  validatedAt: string;
  appName?: string;
}

/**
 * Generate HTML for billing notification email to finance team
 */
export function generateBillingNotificationEmail(context: BillingNotificationContext): string {
  const {
    billingRunId,
    dossiersCount,
    dossierTypes,
    agentName,
    timestamp,
    validationLink,
    folderPath,
    appName = 'ODP Console',
  } = context;

  const typesList = Object.entries(dossierTypes)
    .map(([type, count]) => `<li>${type}: ${count} dossier${count > 1 ? 's' : ''}</li>`)
    .join('');

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
    .nas-button { display: inline-block; background: #fbbf24; color: #78350f; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; border: 1px solid #f59e0b; }
    .nas-button:hover { background: #f59e0b; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .info-box { background: #f0f4ff; border: 1px solid #e0e7ff; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .info-box ul { margin: 0; padding-left: 20px; }
    .info-box li { margin: 8px 0; }
    .highlight { background: #fff3cd; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Nouveau Filien Disponible</h1>
    </div>
    <div class="content">
      <p>Bonjour,</p>

      <p>Un nouveau train de facturation a été généré et est prêt pour intégration dans SEDIT.</p>

      <div class="field">
        <div class="field-label">Identifiant du train</div>
        <div class="field-value">${billingRunId}</div>
      </div>

      <div class="field">
        <div class="field-label">Nombre de dossiers</div>
        <div class="field-value">${dossiersCount} dossier${dossiersCount > 1 ? 's' : ''}</div>
      </div>

      <div class="field">
        <div class="field-label">Composition par type</div>
        <div class="info-box">
          <ul>
            ${typesList}
          </ul>
        </div>
      </div>

      <div class="field">
        <div class="field-label">Demandé par</div>
        <div class="field-value">${agentName}</div>
      </div>

      <div class="field">
        <div class="field-label">Date de génération</div>
        <div class="field-value">${timestamp}</div>
      </div>

      ${folderPath ? `
      <div class="field" style="border-left: 4px solid #f59e0b; background: #fffbeb;">
        <div class="field-label" style="color: #f59e0b;">📁 Dossier avec les données</div>
        <div class="field-value" style="margin-top: 10px; text-align: center;">
          <a href="${folderPath}" class="nas-button">
            🗂️ Ouvrir le dossier NAS
          </a>
          <div style="margin-top: 12px; font-size: 12px; color: #92400e; word-break: break-all;">
            <code style="background: white; padding: 4px 8px; border-radius: 3px; border: 1px solid #fed7aa;">${folderPath}</code>
          </div>
        </div>
      </div>
      ` : ''}

      <p style="text-align: center;">
        <a href="${validationLink}" class="cta-button">Valider l'intégration dans SEDIT</a>
      </p>

      <p style="background: #e8f4f8; padding: 15px; border-left: 4px solid #0284c7; border-radius: 4px; font-size: 14px;">
        <strong>ℹ️ Information :</strong> En cliquant sur le bouton ci-dessus, vous confirmerez que le train de facturation a été intégré avec succès dans SEDIT.
      </p>

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
 * Generate HTML for SEDIT integration confirmation email to agent
 */
export function generateSeditIntegrationConfirmationEmail(context: SeditIntegrationConfirmationContext): string {
  const {
    agentName,
    billingRunId,
    dossiersCount,
    dossierTypes,
    validatedAt,
    appName = 'ODP Console',
  } = context;

  const typesList = Object.entries(dossierTypes)
    .map(([type, count]) => `<li>${type}: ${count} dossier${count > 1 ? 's' : ''}</li>`)
    .join('');

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
    .field { margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #10b981; }
    .field-label { font-weight: bold; color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { margin-top: 5px; font-size: 16px; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .success-box { background: #d1fae5; border: 1px solid #6ee7b7; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .success-box ul { margin: 0; padding-left: 20px; }
    .success-box li { margin: 8px 0; }
    .checkmark { color: #10b981; font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Intégration SEDIT Confirmée</h1>
    </div>
    <div class="content">
      <p>Bonjour ${agentName},</p>

      <p>Votre train de facturation a été intégré avec succès dans SEDIT. Les dossiers passent maintenant à l'état <span class="highlight">Titré</span>.</p>

      <div class="field">
        <div class="field-label">Identifiant du train</div>
        <div class="field-value">${billingRunId}</div>
      </div>

      <div class="field">
        <div class="field-label">Nombre de dossiers traités</div>
        <div class="field-value">${dossiersCount} dossier${dossiersCount > 1 ? 's' : ''}</div>
      </div>

      <div class="field">
        <div class="field-label">Composition par type</div>
        <div class="success-box">
          <ul>
            ${typesList}
          </ul>
        </div>
      </div>

      <div class="field">
        <div class="field-label">Confirmé le</div>
        <div class="field-value">${validatedAt}</div>
      </div>

      <p style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; border-radius: 4px; font-size: 14px;">
        <strong><span class="checkmark">✓</span> Récapitulatif :</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Tous les dossiers ont été facturés</li>
          <li>Le fichier FILIEN a été généré</li>
          <li>L'intégration SEDIT est confirmée</li>
          <li>Les dossiers sont maintenant à l'état Titré</li>
        </ul>
      </p>

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
