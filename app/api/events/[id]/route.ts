import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Public: fetch a single event with its ticket types + organizer name.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: true,
      organizer: { select: { name: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json(event);
}

const patchSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
});

// Owner/admin: update an event's status (e.g. publish a draft).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 422 });
  }

  const updated = await prisma.event.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
