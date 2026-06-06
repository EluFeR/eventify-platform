'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

type FeaturedEvent = {
  id: string;
  title: string;
  startDate: string;
  location: string;
  image: string | null;
  ticketTypes: { price: number }[];
};

const FALLBACK_IMAGE = 'https://picsum.photos/seed/eventflow/800/400';

export default function Home() {
  const { data: session } = useSession();

  const isOrganizer = session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN';
  const hostEventHref = isOrganizer ? '/organizer/events/new' : '/organizer/apply';

  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);

  useEffect(() => {
    fetch('/api/events/public')
      .then((r) => r.json())
      .then((data: FeaturedEvent[]) => setFeaturedEvents(Array.isArray(data) ? data.slice(0, 2) : []))
      .catch(() => setFeaturedEvents([]));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="event-hero min-h-[90vh] flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm uppercase tracking-widest">Live Events Worldwide</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-6">
            Your Next<br />Unforgettable<br />Experience
          </h1>
          <p className="text-xl text-zinc-300 max-w-md mx-auto mb-10">
            Discover epic events. Book tickets instantly. Create memories that last forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events">
              <Button size="lg" className="text-lg px-10 py-7 rounded-2xl bg-white text-black hover:bg-white/90 font-semibold">
                Browse Events
              </Button>
            </Link>
            <Link href={hostEventHref}>
              <Button size="lg" variant="outline" className="text-lg px-10 py-7 rounded-2xl border-white text-white hover:bg-white/10">
                Host Your Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-5xl font-bold tracking-tight">Featured Events</h2>
              <p className="text-zinc-400 mt-3">Handpicked experiences you don&apos;t want to miss</p>
            </div>
            <Link href="/events" className="text-violet-400 hover:underline flex items-center gap-2">
              View all <span aria-hidden="true">→</span>
            </Link>
          </div>

          {featuredEvents.length === 0 ? (
            <p className="text-zinc-500">No events published yet — check back soon.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {featuredEvents.map((event) => {
                const minPrice = event.ticketTypes.length
                  ? Math.min(...event.ticketTypes.map((t) => t.price))
                  : 0;
                return (
                  <Link key={event.id} href={`/events/${event.id}`} className="group">
                    <div className="ticket-card relative overflow-hidden rounded-3xl bg-zinc-900 h-[420px] flex flex-col">
                      <img
                        src={event.image || FALLBACK_IMAGE}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

                      <div className="absolute bottom-0 p-8 w-full">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-3xl font-semibold mb-1">{event.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              <Calendar className="w-4 h-4" /> {format(new Date(event.startDate), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 font-mono text-xl font-semibold">
                              {minPrice === 0 ? 'Free' : `From ETB ${minPrice}`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl font-bold tracking-tight text-center mb-4">Want to Host Events?</h2>
          <p className="text-zinc-400 text-center mb-12">Become a verified organizer in 3 simple steps</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-violet-400 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-lg">Apply</h3>
              <p className="text-zinc-400 text-sm">Fill out the organizer application with your details and event plans.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-violet-400 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-lg">Get Verified</h3>
              <p className="text-zinc-400 text-sm">Our team reviews your application within 1–2 business days.</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-violet-400 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-lg">Create Events</h3>
              <p className="text-zinc-400 text-sm">Once approved, publish events and start selling tickets instantly.</p>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link href={hostEventHref}>
              <Button className="bg-violet-600 hover:bg-violet-700 px-8 py-6 text-base rounded-xl">
                Start Your Application
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-t border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-5xl font-semibold text-violet-400">12k+</div>
            <div className="text-zinc-400 mt-2">Events Hosted</div>
          </div>
          <div>
            <div className="text-5xl font-semibold text-violet-400">248k</div>
            <div className="text-zinc-400 mt-2">Tickets Sold</div>
          </div>
          <div>
            <div className="text-5xl font-semibold text-violet-400">98</div>
            <div className="text-zinc-400 mt-2">Countries</div>
          </div>
          <div>
            <div className="text-5xl font-semibold text-violet-400">4.98</div>
            <div className="text-zinc-400 mt-2">Average Rating</div>
          </div>
        </div>
      </section>
    </div>
  );
}
