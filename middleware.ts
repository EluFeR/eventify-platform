import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // Protect organizer event creation/management — only ORGANIZER or ADMIN
  if (pathname.startsWith('/organizer/events') || pathname.startsWith('/organizer/dashboard')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (role !== 'ORGANIZER' && role !== 'ADMIN') {
      // Redirect to apply page if they're just an attendee
      return NextResponse.redirect(new URL('/organizer/apply', req.url));
    }
  }

  // Protect admin routes — only ADMIN
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Protect organizer apply & status pages — must be logged in
  if (
    pathname.startsWith('/organizer/apply') ||
    pathname.startsWith('/organizer/application-status')
  ) {
    if (!req.auth) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/organizer/events/:path*',
    '/organizer/dashboard/:path*',
    '/organizer/apply/:path*',
    '/organizer/application-status/:path*',
    '/admin/:path*',
  ],
};
