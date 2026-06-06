import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { verifyTransaction, isPaid } from '@/lib/chapa';
import type { Booking } from '@prisma/client';

/**
 * Given a booking, if it's still PENDING and has a Chapa txRef, verify the
 * payment with Chapa. On success: mark CONFIRMED, increment sold, and generate
 * a QR code — all in a single transaction. Returns the (possibly) updated booking.
 *
 * This is called both from the Chapa webhook and when the buyer lands back on
 * the booking page, so payment is settled even when the webhook can't reach a
 * localhost dev server.
 */
export async function settleBooking(booking: Booking): Promise<Booking> {
  if (booking.status !== 'PENDING' || !booking.txRef) {
    return booking;
  }

  const verify = await verifyTransaction(booking.txRef);
  if (!isPaid(verify)) {
    return booking;
  }

  const qrCode = await QRCode.toDataURL(
    JSON.stringify({ bookingId: booking.id, txRef: booking.txRef })
  );

  return prisma.$transaction(async (tx) => {
    // Re-read inside the transaction to avoid double-incrementing sold if two
    // requests settle the same booking concurrently.
    const fresh = await tx.booking.findUnique({ where: { id: booking.id } });
    if (!fresh || fresh.status !== 'PENDING') {
      return fresh ?? booking;
    }
    await tx.ticketType.update({
      where: { id: fresh.ticketTypeId },
      data: { sold: { increment: fresh.quantity } },
    });
    return tx.booking.update({
      where: { id: fresh.id },
      data: { status: 'CONFIRMED', qrCode },
    });
  });
}
