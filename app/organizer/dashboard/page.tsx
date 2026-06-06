'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Calendar, MapPin, Ticket, Users, CalendarPlus, Eye, EyeOff, Wallet, TrendingUp } from 'lucide-react';

type TicketType = { id: string; name: string; price: number; quantity: number; sold: number };

type OrganizerEvent = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  image: string | null;
  status: string;
  ticketTypes: TicketType[];
  _count: { bookings: number };
};

type Earnings = {
  gross: number;
  platformFee: number;
  net: number;
  ticketsSold: number;
  feePercent: number;
  currency: string;
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-zinc-500/15 text-zinc-300',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-400',
  ONGOING: 'bg-violet-500/15 text-violet-400',
  COMPLETED: 'bg-blue-500/15 text-blue-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
};

export default function OrganizerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<OrganizerEvent[] | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadEvents = () => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch('/api/organizer/earnings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setEarnings(data))
      .catch(() => {});
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/organizer/dashboard');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ORGANIZER' && session?.user?.role !== 'ADMIN') {
        router.push('/organizer/apply');
        return;
      }
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  const handleStatusChange = async (id: string, newStatus: 'PUBLISHED' | 'DRAFT') => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error('Could not update event');
        return;
      }
      toast.success(newStatus === 'PUBLISHED' ? 'Event published — now live on /events' : 'Event unpublished');
      loadEvents();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Events</h1>
            <p className="text-zinc-400">Manage the events you&apos;re hosting.</p>
          </div>
          <Link href="/organizer/events/new">
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </Link>
        </div>

        {/* Earnings summary */}
        {earnings && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Wallet className="w-4 h-4 text-emerald-400" /> Your earnings
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {earnings.currency} {earnings.net.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500 mt-1">After {earnings.feePercent}% platform fee</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <TrendingUp className="w-4 h-4 text-violet-400" /> Gross sales
              </div>
              <p className="text-2xl font-bold">
                {earnings.currency} {earnings.gross.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Total ticket revenue</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Ticket className="w-4 h-4 text-zinc-300" /> Tickets sold
              </div>
              <p className="text-2xl font-bold">{earnings.ticketsSold.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Users className="w-4 h-4 text-zinc-300" /> Platform fee
              </div>
              <p className="text-2xl font-bold text-zinc-300">
                {earnings.currency} {earnings.platformFee.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Kept by EventFlow</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {events && events.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl">
            <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarPlus className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No events yet</h2>
            <p className="text-zinc-400 mb-6">Create your first event to start selling tickets.</p>
            <Link href="/organizer/events/new">
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Plus className="w-4 h-4" /> Create your first event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event) => {
              const totalCapacity = event.ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
              const minPrice = event.ticketTypes.length
                ? Math.min(...event.ticketTypes.map((t) => t.price))
                : 0;
              return (
                <div
                  key={event.id}
                  className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-violet-500/50 transition-colors"
                >
                  <div className="relative h-40 bg-zinc-800">
                    {event.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Calendar className="w-10 h-10" />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-medium ${
                        STATUS_STYLES[event.status] ?? 'bg-zinc-500/15 text-zinc-300'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="text-xs text-violet-400 mb-1">{event.category}</div>
                    <h3 className="font-semibold text-xl mb-3 line-clamp-1">{event.title}</h3>

                    <div className="space-y-1.5 text-sm text-zinc-400 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(event.startDate), 'MMM dd, yyyy • p')}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4 text-sm">
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Ticket className="w-4 h-4" /> {totalCapacity} tickets
                      </span>
                      <span className="flex items-center gap-1.5 text-zinc-400">
                        <Users className="w-4 h-4" /> {event._count.bookings} booked
                      </span>
                      <span className="text-emerald-400 font-mono">
                        {minPrice === 0 ? 'Free' : `From ETB ${minPrice}`}
                      </span>
                    </div>

                    {(event.status === 'DRAFT' || event.status === 'PUBLISHED') && (
                      <div className="mt-4 flex gap-2">
                        <Link href={`/events/${event.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                        {event.status === 'DRAFT' ? (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(event.id, 'PUBLISHED')}
                            disabled={updatingId === event.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                          >
                            {updatingId === event.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(event.id, 'DRAFT')}
                            disabled={updatingId === event.id}
                            className="flex-1 gap-1.5"
                          >
                            {updatingId === event.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5" />
                            )}
                            Unpublish
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
