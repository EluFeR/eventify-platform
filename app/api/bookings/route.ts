import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initializeTransaction } from '@/lib/chapa';
import { calcPlatformFee } from '@/lib/fees';
import { z } from 'zod';

const bookingSchema = z.object({
  ticketTypeId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'You must be signed in to book tickets' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid booking request' }, { status: 422 });
  }
  const { ticketTypeId, quantity } = parsed.data;

  const ticketType = await prisma.ticketType.findUnique({
    where: { id: ticketTypeId },
    include: { event: true },
  });
  if (!ticketType) {
    return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });
  }
  if (ticketType.event.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'This event is not available for booking' }, { status: 400 });
  }
  if (ticketType.sold + quantity > ticketType.quantity) {
    const remaining = ticketType.quantity - ticketType.sold;
    return NextResponse.json(
      { error: remaining > 0 ? `Only ${remaining} ticket(s) left` : 'Sold out' },
      { status: 409 }
    );
  }

  const totalAmount = ticketType.price * quantity;
  const platformFee = calcPlatformFee(totalAmount);
  const txRef = `tx-${randomUUID()}`;

  // Free tickets: confirm immediately, no payment needed.
  if (totalAmount === 0) {
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          userId: session.user!.id,
          eventId: ticketType.eventId,
          ticketTypeId: ticketType.id,
          quantity,
          totalAmount: 0,
          platformFee: 0,
          currency: 'ETB',
          txRef,
          status: 'CONFIRMED',
        },
      });
      await tx.ticketType.update({
        where: { id: ticketType.id },
        data: { sold: { increment: quantity } },
      });
      return created;
    });
    return NextResponse.json({ redirectUrl: `/bookings/${booking.id}` }, { status: 201 });
  }

  // Paid tickets: create a PENDING booking and hand off to Chapa.
  const booking = await prisma.booking.create({
    data: {
      userId: session.user.id,
      eventId: ticketType.eventId,
      ticketTypeId: ticketType.id,
      quantity,
      totalAmount,
      platformFee,
      currency: 'ETB',
      txRef,
      status: 'PENDING',
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const [firstName, ...rest] = (session.user.name ?? 'Guest').split(' ');

  try {
    const checkoutUrl = await initializeTransaction({
      amount: totalAmount,
      currency: 'ETB',
      email: session.user.email,
      firstName: firstName || 'Guest',
      lastName: rest.join(' ') || 'User',
      txRef,
      callbackUrl: `${baseUrl}/api/bookings/verify?tx_ref=${txRef}`,
      returnUrl: `${baseUrl}/bookings/${booking.id}`,
      title: 'Event Ticket',
      description: ticketType.event.title,
    });
    return NextResponse.json({ checkoutUrl }, { status: 201 });
  } catch (err) {
    // Roll back the pending booking if Chapa couldn't be reached.
    await prisma.booking.delete({ where: { id: booking.id } }).catch(() => {});
    console.error('[bookings] chapa init failed:', err);
    const message = err instanceof Error ? err.message : 'Payment initialization failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// List the logged-in user's bookings (newest first).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      event: { select: { id: true, title: true, startDate: true, location: true, image: true } },
      ticketType: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(bookings);
}
