'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Calendar,
  MapPin,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  TicketX,
} from 'lucide-react';

type Booking = {
  id: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
  createdAt: string;
  event: { id: string; title: string; startDate: string; location: string; image: string | null };
  ticketType: { name: string };
};

const STATUS = {
  CONFIRMED: { icon: CheckCircle2, cls: 'bg-emerald-500/15 text-emerald-400', label: 'Confirmed' },
  PENDING: { icon: Clock, cls: 'bg-amber-500/15 text-amber-400', label: 'Pending' },
  CANCELLED: { icon: XCircle, cls: 'bg-red-500/15 text-red-400', label: 'Cancelled' },
  REFUNDED: { icon: XCircle, cls: 'bg-red-500/15 text-red-400', label: 'Refunded' },
};

export default function MyTicketsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/tickets');
      return;
    }
    if (authStatus !== 'authenticated') return;

    fetch('/api/bookings')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]));
  }, [authStatus, router]);

  if (!bookings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-8">My Tickets</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl">
          <TicketX className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No tickets yet</h2>
          <p className="text-zinc-400 mb-6">When you book an event, your tickets will appear here.</p>
          <Link href="/events">
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
              Browse events <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const s = STATUS[b.status];
            const StatusIcon = s.icon;
            return (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-violet-500/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                  {b.event.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.event.image} alt={b.event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      <Ticket className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{b.event.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(b.event.startDate), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{b.event.location}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5" />
                      {b.quantity}× {b.ticketType.name}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                    <StatusIcon className="w-3 h-3" /> {s.label}
                  </span>
                  <p className="text-sm text-zinc-400 mt-1">
                    {b.totalAmount === 0 ? 'Free' : `${b.currency} ${b.totalAmount}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
