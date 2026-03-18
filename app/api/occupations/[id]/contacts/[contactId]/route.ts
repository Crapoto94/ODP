import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, contactId: string }> }) {
  try {
    const { contactId } = await params;
    const id = parseInt(contactId);
    
    await (prisma as any).contact.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, contactId: string }> }) {
  try {
    const { contactId } = await params;
    const id = parseInt(contactId);
    const body = await req.json();
    
    const contact = await (prisma as any).contact.update({
      where: { id },
      data: body
    });
    
    return NextResponse.json(contact);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
