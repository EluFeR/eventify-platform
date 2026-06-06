'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, LogOut, Plus, Shield, ClipboardList, Ticket } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();

  const isOrganizer = session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN';
  const isAdmin = session?.user?.role === 'ADMIN';
  const hostHref = isOrganizer ? '/organizer/events/new' : '/organizer/apply';

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="font-semibold text-2xl tracking-tight">EventFlow</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/events" className="hover:text-violet-400 transition-colors">Browse Events</Link>
            {session && (
              <Link href="/tickets" className="hover:text-violet-400 transition-colors">My Tickets</Link>
            )}
            {isOrganizer ? (
              <Link href="/organizer/dashboard" className="hover:text-violet-400 transition-colors">My Events</Link>
            ) : (
              <Link href="/organizer/apply" className="hover:text-violet-400 transition-colors">Become Organizer</Link>
            )}
            {isAdmin && (
              <Link href="/admin/applications" className="hover:text-violet-400 transition-colors flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              {isOrganizer && (
                <Link href="/organizer/dashboard">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={session.user?.image || ''} />
                    <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{session.user?.name || session.user?.email}</p>
                    <p className="text-xs text-zinc-500 capitalize">{session.user?.role?.toLowerCase()}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tickets" className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" /> My Tickets
                    </Link>
                  </DropdownMenuItem>
                  {!isOrganizer && (
                    <DropdownMenuItem asChild>
                      <Link href="/organizer/application-status" className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" /> Application Status
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/applications" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-400 focus:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700">Sign up</Button>
              </Link>
            </>
          )}
          {session && (
            <Link href={hostHref}>
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Plus className="w-4 h-4" /> {isOrganizer ? 'Create Event' : 'Host Event'}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
