'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Building2,
  Phone,
  Globe,
  FileText,
  User,
} from 'lucide-react';
import Link from 'next/link';

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
  updatedAt: string;
};

const statusConfig = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
    label: 'Under Review',
    description:
      'Your application has been received and is being reviewed by our team. This usually takes 1–2 business days.',
  },
  APPROVED: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
    label: 'Approved',
    description:
      'Congratulations! Your organizer application has been approved. You can now create and manage events.',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/20',
    label: 'Not Approved',
    description:
      'Unfortunately, your application was not approved at this time. You are welcome to re-apply.',
  },
};

export default function ApplicationStatusPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApplication = () => {
    setLoading(true);
    fetch('/api/organizer-application')
      .then((r) => r.json())
      .then((data) => {
        setApplication(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/organizer/application-status');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN') {
        router.push('/organizer/dashboard');
        return;
      }
      fetchApplication();
    }
  }, [status, session, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold">No Application Found</h1>
          <p className="text-zinc-400">You haven&apos;t submitted an organizer application yet.</p>
          <Link href="/organizer/apply">
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
              Apply Now <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[application.status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Status Card */}
        <div className={`rounded-2xl border ${config.border} ${config.bg} p-8`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${config.bg}`}>
              <StatusIcon className={`w-8 h-8 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Application {config.label}</h1>
                <button
                  onClick={fetchApplication}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Refresh status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-zinc-400 mt-2">{config.description}</p>

              {application.adminNote && (
                <div className="mt-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">Admin note: </span>
                    {application.adminNote}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                Submitted {new Date(application.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {application.updatedAt !== application.createdAt && (
                  <> · Updated {new Date(application.updatedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}</>
                )}
              </div>
            </div>
          </div>

          {application.status === 'APPROVED' && (
            <div className="mt-6">
              <Link href="/organizer/events/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  Create Your First Event <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}

          {application.status === 'REJECTED' && (
            <div className="mt-6">
              <Link href="/organizer/apply">
                <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                  Re-apply <RefreshCw className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Application Details */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="font-semibold text-lg">Your Application Details</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            <DetailRow icon={User} label="Full Name" value={application.fullName} />
            <DetailRow icon={Building2} label="Organization" value={application.organizationName} />
            <DetailRow icon={Phone} label="Phone Number" value={application.phoneNumber} />
            <DetailRow
              icon={Globe}
              label="Website / Social"
              value={application.websiteOrSocial}
              isLink
            />
            <div className="px-6 py-4">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-zinc-500 mb-1">Event Description</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{application.eventDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="px-6 py-4 flex items-center gap-3">
      <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-400 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-zinc-300 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
