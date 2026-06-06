'use client';

import { useEffect, useState } from 'react';
import EventCard from '@/components/EventCard';
import { Loader2, CalendarX } from 'lucide-react';

type TicketType = { price: number };
type ApiEvent = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  location: string;
  image: string | null;
  category: string;
  ticketTypes: TicketType[];
};

const FALLBACK_IMAGE = 'https://picsum.photos/seed/eventflow/600/400';

export default function EventsPage() {
  const [events, setEvents] = useState<ApiEvent[] | null>(null);

  useEffect(() => {
    fetch('/api/events/public')
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-5xl font-bold tracking-tight">All Events</h1>
      </div>

      {events === null ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-zinc-800 rounded-3xl">
          <CalendarX className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No events yet</h2>
          <p className="text-zinc-400">Check back soon — new events are published regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event) => {
            const minPrice = event.ticketTypes.length
              ? Math.min(...event.ticketTypes.map((t) => t.price))
              : 0;
            return (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  startDate: new Date(event.startDate),
                  location: event.location,
                  image: event.image || FALLBACK_IMAGE,
                  category: event.category,
                  price: minPrice,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
