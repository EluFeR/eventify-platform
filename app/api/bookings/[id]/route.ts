import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { settleBooking } from '@/lib/bookings';

// Owner-only: fetch a booking with event + ticket details. If the booking is
// still PENDING (buyer just returned from Chapa), settle it on the fly.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (booking.status === 'PENDING' && booking.txRef) {
    try {
      booking = await settleBooking(booking);
    } catch (err) {
      console.error('[bookings/[id]] settle failed:', err);
    }
  }

  const full = await prisma.booking.findUnique({
    where: { id },
    include: {
      event: { select: { id: true, title: true, startDate: true, location: true, image: true } },
      ticketType: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json(full);
}
