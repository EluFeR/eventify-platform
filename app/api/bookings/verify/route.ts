import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { settleBooking } from '@/lib/bookings';

// Chapa webhook + return handler. Confirms the booking, then redirects the
// browser to the booking page. (On localhost the webhook can't reach the dev
// server, so the booking page also settles on load — see /api/bookings/[id].)
export async function GET(req: NextRequest) {
  const txRef = new URL(req.url).searchParams.get('tx_ref');
  if (!txRef) {
    return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { txRef } });
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  try {
    await settleBooking(booking);
  } catch (err) {
    console.error('[bookings/verify] settle failed:', err);
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  return NextResponse.redirect(`${baseUrl}/bookings/${booking.id}`);
}
