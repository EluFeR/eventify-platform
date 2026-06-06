'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

type AppData = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
  updatedAt: string;
} | null;

/**
 * Notifies a logged-in user when their organizer application has been decided.
 * Fires a one-time toast per decision (keyed by application updatedAt in
 * localStorage) so it isn't shown again on every page load.
 */
export default function ApprovalNotice() {
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;

    let cancelled = false;
    fetch('/api/organizer-application')
      .then((r) => r.json())
      .then((data: AppData) => {
        if (cancelled || !data || data.status === 'PENDING') return;

        const key = `appNotice:${data.id}:${data.updatedAt}`;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');

        if (data.status === 'APPROVED') {
          toast.success('🎉 You\'re approved as an organizer!', {
            description: 'You can now create events. If you don\'t see "Create Event", sign out and back in.',
            duration: 10000,
            action: {
              label: 'Create event',
              onClick: () => {
                window.location.href = '/organizer/events/new';
              },
            },
          });
        } else if (data.status === 'REJECTED') {
          toast.error('Your organizer application was not approved', {
            description: data.adminNote
              ? `Note: ${data.adminNote}`
              : 'You can update your details and re-apply anytime.',
            duration: 10000,
            action: {
              label: 'Re-apply',
              onClick: () => {
                window.location.href = '/organizer/apply';
              },
            },
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [status, session]);

  return null;
}
