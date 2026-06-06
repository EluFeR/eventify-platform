'use client';

import { use, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, MapPin, User, Ticket, Minus, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type TicketType = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
};

type EventDetail = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  image: string | null;
  category: string;
  status: string;
  ticketTypes: TicketType[];
  organizer: { name: string | null };
};

const FALLBACK_IMAGE = 'https://picsum.photos/seed/eventflow/1200/500';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data: EventDetail | null) => {
        if (!data) return;
        setEvent(data);
        const firstAvailable = data.ticketTypes.find((t) => t.sold < t.quantity);
        setSelectedTicket(firstAvailable?.id ?? data.ticketTypes[0]?.id ?? null);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const ticket = event?.ticketTypes.find((t) => t.id === selectedTicket) ?? null;
  const remaining = ticket ? ticket.quantity - ticket.sold : 0;
  const maxQty = Math.min(remaining, 20);
  const total = ticket ? ticket.price * quantity : 0;

  const handleGetTickets = async () => {
    if (authStatus !== 'authenticated') {
      router.push(`/login?callbackUrl=/events/${id}`);
      return;
    }
    if (!ticket) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketTypeId: ticket.id, quantity }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(typeof json.error === 'string' ? json.error : 'Could not start booking');
        return;
      }
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl; // off to Chapa
      } else if (json.redirectUrl) {
        router.push(json.redirectUrl); // free ticket, already confirmed
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link href="/events">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Button>
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to events
      </Link>

      {/* Hero */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.image || FALLBACK_IMAGE} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 p-6 sm:p-8">
          <span className="inline-block bg-violet-600 text-white text-xs px-3 py-1 rounded-full mb-3">
            {event.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{event.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-6 text-sm text-zinc-300">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              {format(new Date(event.startDate), 'EEE, MMM d, yyyy • p')}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400" />
              {event.location}
            </span>
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" />
              {event.organizer?.name ?? 'Organizer'}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">About this event</h2>
            <p className="text-zinc-400 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        </div>

        {/* Booking panel */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4 sticky top-24">
            <h3 className="font-semibold flex items-center gap-2">
              <Ticket className="w-4 h-4 text-violet-400" /> Select a ticket
            </h3>

            {event.ticketTypes.length === 0 ? (
              <p className="text-sm text-zinc-500">No tickets available.</p>
            ) : (
              <div className="space-y-2">
                {event.ticketTypes.map((t) => {
                  const left = t.quantity - t.sold;
                  const soldOut = left <= 0;
                  const active = selectedTicket === t.id;
                  return (
                    <button
                      key={t.id}
                      disabled={soldOut}
                      onClick={() => {
                        setSelectedTicket(t.id);
                        setQuantity(1);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${
                        active ? 'border-violet-500 bg-violet-500/10' : 'border-zinc-800 hover:border-zinc-700'
                      } ${soldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-emerald-400 font-mono text-sm">
                          {t.price === 0 ? 'Free' : `ETB ${t.price}`}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {soldOut ? 'Sold out' : `${left} left`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {ticket && remaining > 0 && (
              <>
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      className="w-8 h-8 rounded-lg border border-zinc-700 flex items-center justify-center hover:bg-zinc-800"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
                  <span className="text-sm text-zinc-400">Total</span>
                  <span className="text-xl font-semibold">
                    {total === 0 ? 'Free' : `ETB ${total}`}
                  </span>
                </div>

                <Button
                  onClick={handleGetTickets}
                  disabled={submitting}
                  className="w-full bg-violet-600 hover:bg-violet-700 py-6 rounded-xl"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : total === 0 ? (
                    'Get Free Ticket'
                  ) : (
                    'Get Tickets'
                  )}
                </Button>
                {total > 0 && (
                  <p className="text-xs text-zinc-600 text-center">
                    You&apos;ll be redirected to Chapa to complete payment securely.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
