'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Clock, XCircle, Calendar, MapPin, ArrowLeft } from 'lucide-react';

type BookingDetail = {
  id: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  qrCode: string | null;
  event: { id: string; title: string; startDate: string; location: string; image: string | null };
  ticketType: { name: string; price: number };
};

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=/bookings/${id}`);
      return;
    }
    if (authStatus !== 'authenticated') return;

    fetch(`/api/bookings/${id}`)
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data: BookingDetail | null) => {
        if (!data) setError(true);
        else setBooking(data);
      })
      .catch(() => setError(true));
  }, [id, authStatus, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Booking not found</h1>
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Browse events
          </Button>
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  const statusUI = {
    CONFIRMED: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Confirmed', note: 'Your ticket is ready. Show the QR code at the entrance.' },
    PENDING: { icon: Clock, color: 'text-amber-400', label: 'Payment Pending', note: 'We haven\'t received confirmation of your payment yet. If you completed it, refresh in a moment.' },
    CANCELLED: { icon: XCircle, color: 'text-red-400', label: 'Cancelled', note: 'This booking was cancelled.' },
    REFUNDED: { icon: XCircle, color: 'text-red-400', label: 'Refunded', note: 'This booking was refunded.' },
  }[booking.status];

  const StatusIcon = statusUI.icon;

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="p-8 text-center border-b border-zinc-800">
          <StatusIcon className={`w-14 h-14 mx-auto mb-3 ${statusUI.color}`} />
          <h1 className="text-2xl font-bold mb-1">{statusUI.label}</h1>
          <p className="text-sm text-zinc-400">{statusUI.note}</p>
        </div>

        <div className="p-8 space-y-5">
          <div>
            <h2 className="text-xl font-semibold">{booking.event.title}</h2>
            <div className="mt-2 space-y-1 text-sm text-zinc-400">
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {format(new Date(booking.event.startDate), 'EEE, MMM d, yyyy • p')}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {booking.event.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-t border-zinc-800 pt-5">
            <div>
              <p className="text-zinc-500">Ticket</p>
              <p className="font-medium">{booking.ticketType.name}</p>
            </div>
            <div>
              <p className="text-zinc-500">Quantity</p>
              <p className="font-medium">{booking.quantity}</p>
            </div>
            <div>
              <p className="text-zinc-500">Total paid</p>
              <p className="font-medium">
                {booking.totalAmount === 0 ? 'Free' : `${booking.currency} ${booking.totalAmount}`}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Booking ID</p>
              <p className="font-mono text-xs">{booking.id}</p>
            </div>
          </div>

          {booking.status === 'CONFIRMED' && booking.qrCode && (
            <div className="border-t border-zinc-800 pt-5 text-center">
              <p className="text-xs text-zinc-500 mb-3">Entry QR code</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={booking.qrCode} alt="Ticket QR code" className="w-44 h-44 mx-auto rounded-xl bg-white p-2" />
            </div>
          )}

          {booking.status === 'PENDING' && (
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              Refresh status
            </Button>
          )}

          <Link href="/events" className="block">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" /> Browse more events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
