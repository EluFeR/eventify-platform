'use client';

import Link from 'next/link';
import { Calendar, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    startDate: Date;
    location: string;
    image: string;
    category: string;
    price: number;
  };
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="ticket-card group bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 hover:border-violet-500/50">
      <div className="relative h-56">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
          {event.category}
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold text-2xl mb-2 line-clamp-2">{event.title}</h3>
        
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
          <Calendar className="w-4 h-4" />
          {format(event.startDate, 'MMM dd, yyyy')}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
          <MapPin className="w-4 h-4" />
          {event.location}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-emerald-400 font-mono text-xl font-semibold">
              {event.price === 0 ? 'Free' : `From ETB ${event.price}`}
            </span>
          </div>
          <Link href={`/events/${event.id}`}>
            <Button className="rounded-xl">Get Tickets</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
