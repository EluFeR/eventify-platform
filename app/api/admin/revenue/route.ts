import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLATFORM_FEE_PERCENT } from '@/lib/fees';

// Platform-wide revenue: gross ticket sales, platform profit (commission),
// and total owed to organizers. Admin only.
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const agg = await prisma.booking.aggregate({
    where: { status: 'CONFIRMED' },
    _sum: { totalAmount: true, platformFee: true, quantity: true },
    _count: true,
  });

  const gross = agg._sum.totalAmount ?? 0;
  const platformProfit = agg._sum.platformFee ?? 0;

  return NextResponse.json({
    gross,
    platformProfit,
    organizerPayouts: gross - platformProfit,
    ticketsSold: agg._sum.quantity ?? 0,
    orders: agg._count,
    feePercent: PLATFORM_FEE_PERCENT,
    currency: 'ETB',
  });
}
