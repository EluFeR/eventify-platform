'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
  Shield,
  Wallet,
  TrendingUp,
  Ticket,
} from 'lucide-react';

type Application = {
  id: string;
  fullName: string;
  organizationName: string;
  phoneNumber: string;
  websiteOrSocial: string;
  eventDescription: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    createdAt: string;
  };
};

const statusBadge: Record<string, string> = {
  PENDING: 'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  APPROVED: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
  REJECTED: 'bg-red-400/10 text-red-400 border border-red-400/20',
};

const statusIcon = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

export default function AdminApplicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, boolean>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [revenue, setRevenue] = useState<{
    gross: number;
    platformProfit: number;
    organizerPayouts: number;
    ticketsSold: number;
    feePercent: number;
    currency: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      fetchApplications();
      fetch('/api/admin/revenue')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setRevenue(data))
        .catch(() => {});
    }
  }, [status, session, router]);

  const fetchApplications = async () => {
    setLoading(true);
    const url =
      filter === 'ALL'
        ? '/api/admin/applications'
        : `/api/admin/applications?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setApplications(data);
    setLoading(false);
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setActionState((s) => ({ ...s, [id]: true }));
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, adminNote: noteInputs[id] || undefined }),
    });
    setActionState((s) => ({ ...s, [id]: false }));
    if (!res.ok) {
      toast.error('Action failed. Please try again.');
      return;
    }
    toast.success(`Application ${action.toLowerCase()} successfully.`);
    fetchApplications();
    setExpanded(null);
  };

  const counts = {
    ALL: applications.length,
    PENDING: applications.filter((a) => a.status === 'PENDING').length,
    APPROVED: applications.filter((a) => a.status === 'APPROVED').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
  };

  if (loading && status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Platform revenue & organizer applications</p>
          </div>
        </div>

        {/* Platform revenue */}
        {revenue && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Wallet className="w-4 h-4 text-emerald-400" /> Platform profit
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {revenue.currency} {revenue.platformProfit.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-500 mt-1">{revenue.feePercent}% commission</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <TrendingUp className="w-4 h-4 text-violet-400" /> Gross sales
              </div>
              <p className="text-2xl font-bold">
                {revenue.currency} {revenue.gross.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Users className="w-4 h-4 text-zinc-300" /> Owed to organizers
              </div>
              <p className="text-2xl font-bold">
                {revenue.currency} {revenue.organizerPayouts.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                <Ticket className="w-4 h-4 text-zinc-300" /> Tickets sold
              </div>
              <p className="text-2xl font-bold">{revenue.ticketsSold.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => {
            const Icon = statusIcon[s];
            return (
              <div key={s} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${s === 'PENDING' ? 'text-amber-400' : s === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'}`} />
                <div>
                  <p className="text-2xl font-bold">{counts[s]}</p>
                  <p className="text-xs text-zinc-500 capitalize">{s.toLowerCase()}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 p-16 text-center">
            <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No {filter !== 'ALL' ? filter.toLowerCase() : ''} applications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const isExpanded = expanded === app.id;
              const isActing = actionState[app.id];
              const StatusIcon = statusIcon[app.status];

              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                >
                  {/* Row Header */}
                  <button
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors text-left"
                    onClick={() => setExpanded(isExpanded ? null : app.id)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-violet-300 font-semibold text-sm">
                      {app.fullName[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{app.fullName}</p>
                      <p className="text-xs text-zinc-500 truncate">{app.user.email} · {app.organizationName}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[app.status]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {app.status.charAt(0) + app.status.slice(1).toLowerCase()}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-zinc-800 pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <InfoItem label="Phone" value={app.phoneNumber} />
                        <InfoItem
                          label="Website / Social"
                          value={app.websiteOrSocial}
                          isLink
                        />
                        <InfoItem label="Account Created" value={new Date(app.user.createdAt).toLocaleDateString()} />
                        <InfoItem label="User ID" value={app.user.id} mono />
                      </div>

                      <div>
                        <p className="text-xs text-zinc-500 mb-1.5">Event Description</p>
                        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 rounded-xl p-3">
                          {app.eventDescription}
                        </p>
                      </div>

                      {app.adminNote && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1.5">Previous Admin Note</p>
                          <p className="text-sm text-zinc-400 italic">{app.adminNote}</p>
                        </div>
                      )}

                      {/* Actions (only for non-resolved) */}
                      {app.status === 'PENDING' && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="text-xs text-zinc-500 mb-1.5 block">
                              Admin Note (optional — shown to applicant if rejected)
                            </label>
                            <textarea
                              rows={2}
                              value={noteInputs[app.id] ?? ''}
                              onChange={(e) =>
                                setNoteInputs((n) => ({ ...n, [app.id]: e.target.value }))
                              }
                              placeholder="e.g. Insufficient event description, please provide more detail..."
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600 resize-none"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleAction(app.id, 'APPROVED')}
                              disabled={isActing}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                              {isActing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleAction(app.id, 'REJECTED')}
                              disabled={isActing}
                              variant="outline"
                              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                            >
                              {isActing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Re-action for approved/rejected */}
                      {app.status !== 'PENDING' && (
                        <div className="pt-2 flex gap-3">
                          {app.status === 'REJECTED' && (
                            <Button
                              size="sm"
                              onClick={() => handleAction(app.id, 'APPROVED')}
                              disabled={isActing}
                              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Anyway
                            </Button>
                          )}
                          {app.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(app.id, 'REJECTED')}
                              disabled={isActing}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Revoke Access
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  isLink,
  mono,
}: {
  label: string;
  value: string;
  isLink?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-violet-400 hover:underline flex items-center gap-1 truncate"
        >
          {value} <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      ) : (
        <p className={`text-sm text-zinc-300 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      )}
    </div>
  );
}
