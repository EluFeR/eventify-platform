import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public listing of published events — no auth required.
export async function GET() {
  const events = await prisma.event.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      ticketTypes: true,
      organizer: { select: { name: true } },
    },
    orderBy: { startDate: 'asc' },
  });

  return NextResponse.json(events);
}
