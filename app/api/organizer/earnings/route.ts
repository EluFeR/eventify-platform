import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLATFORM_FEE_PERCENT } from '@/lib/fees';

// Organizer's earnings across their confirmed bookings (after platform fee).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const agg = await prisma.booking.aggregate({
    where: { status: 'CONFIRMED', event: { organizerId: session.user.id } },
    _sum: { totalAmount: true, platformFee: true, quantity: true },
    _count: true,
  });

  const gross = agg._sum.totalAmount ?? 0;
  const platformFee = agg._sum.platformFee ?? 0;

  return NextResponse.json({
    gross,
    platformFee,
    net: gross - platformFee,
    ticketsSold: agg._sum.quantity ?? 0,
    orders: agg._count,
    feePercent: PLATFORM_FEE_PERCENT,
    currency: 'ETB',
  });
}
