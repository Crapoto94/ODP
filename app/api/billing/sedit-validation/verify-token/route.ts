import { NextRequest, NextResponse } from 'next/server';
import { validateSeditValidationToken } from '@/lib/sedit-validation-token';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    // Validate the token
    const payload = await validateSeditValidationToken(token);

    if (!payload) {
      return NextResponse.json(
        { valid: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      data: {
        billingRunId: payload.billingRunId,
        agentEmail: payload.agentEmail,
        agentName: payload.agentName,
        dossiersCount: payload.dossiersCount,
      }
    });

  } catch (err: any) {
    console.error('[Token Verification Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
