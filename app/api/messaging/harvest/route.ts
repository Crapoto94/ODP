import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

export async function POST(req: Request) {
  try {
    const settings = await (prisma.appSettings as any).findFirst();
    if (!settings?.apmUrl) {
      return NextResponse.json({ error: 'Settings APM non configurés' }, { status: 400 });
    }

    const apmUrl = settings.apmUrl;
    const apmToken = settings.apmToken || 'DSIHUB-ODP-KEY-2026';
    const mailbox = 'odp@ivry94.fr';

    // 1. Fetch messages from APM Proxy
    // Note: The proxy endpoint is /o365/messages (GET) and doesn't take mailbox in URL
    const harvestUrl = `${apmUrl}/o365/messages`;
    console.log(`[Harvest] Fetching from: ${harvestUrl}`);
    
    const response = await axios.get(harvestUrl, {
      headers: { 'X-API-KEY': apmToken }
    });

    const messages = response.data.messages || response.data;
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Format de réponse APM invalide' }, { status: 500 });
    }

    const results = {
      total: messages.length,
      imported: 0,
      matched: 0,
      skipped: 0
    };

    const harvestRegex = /\[ODP-#(\d+)\]/i;

    for (const msg of messages) {
      // - id, subject, from { emailAddress { address, name } }, bodyPreview, receivedDateTime
      const externalId = msg.id;
      const subject = msg.subject || '';
      const fromEmail = msg.from?.emailAddress?.address || msg.fromEmail;
      const fromName = msg.from?.emailAddress?.name || msg.fromName;
      const content = msg.bodyPreview || msg.body?.content || '';
      const receivedAt = new Date(msg.receivedDateTime || msg.receivedAt);

      // Skip if already imported
      const existing = await (prisma.note as any).findFirst({
        where: { externalId }
      });
      if (existing) {
        results.skipped++;
        continue;
      }

      let occupationId: number | null = null;

      // Match Strategy 1: Subject Tag [ODP-#123]
      const match = subject.match(harvestRegex);
      if (match && match[1]) {
        occupationId = parseInt(match[1]);
      }

      // Match Strategy 2: Sender Email (if Strategy 1 failed)
      if (!occupationId && fromEmail) {
        const contacts = await (prisma.contact as any).findMany({
          where: { email: fromEmail },
          select: { occupationId: true }
        });
        
        // Only match if unique to avoid ambiguity
        if (contacts.length === 1) {
          occupationId = contacts[0].occupationId;
        }
      }

      if (occupationId) {
        results.matched++;
        // Create Note
        await (prisma.note as any).create({
          data: {
            occupationId,
            content,
            author: fromName || fromEmail,
            fromEmail,
            isEmail: true,
            externalId,
            created_at: receivedAt
          }
        });
        results.imported++;
      } else {
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('[Harvest] Error:', error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
