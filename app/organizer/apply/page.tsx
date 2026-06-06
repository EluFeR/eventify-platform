'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Building2, Phone, Globe, FileText, User } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
  websiteOrSocial: z.string().url('Please enter a valid URL (e.g. https://yoursite.com)'),
  eventDescription: z.string().min(50, 'Please describe your events in at least 50 characters'),
});

type FormData = z.infer<typeof schema>;

export default function OrganizerApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [existing, setExisting] = useState<null | { status: string; adminNote?: string }>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const description = watch('eventDescription') ?? '';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/organizer/apply');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role === 'ORGANIZER' || session?.user?.role === 'ADMIN') {
        router.push('/organizer/dashboard');
        return;
      }
      fetch('/api/organizer-application')
        .then((r) => r.json())
        .then((data) => {
          setExisting(data);
          setLoading(false);
        });
    }
  }, [status, session, router]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const res = await fetch('/api/organizer-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      toast.error(typeof json.error === 'string' ? json.error : 'Submission failed');
      return;
    }
    toast.success('Application submitted! We\'ll review it shortly.');
    router.push('/organizer/application-status');
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  // Already has a pending or approved application
  if (existing && existing.status !== 'REJECTED') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold">Application {existing.status === 'PENDING' ? 'Under Review' : 'Approved'}</h1>
          <p className="text-zinc-400">
            {existing.status === 'PENDING'
              ? 'Your organizer application is currently being reviewed. Check back soon!'
              : 'Your application has been approved. You can now create events.'}
          </p>
          <Link href="/organizer/application-status">
            <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
              View Application Status <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full text-sm mb-4">
            <Building2 className="w-4 h-4" />
            Organizer Application
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Become an Organizer</h1>
          <p className="text-zinc-400 text-lg">
            Tell us about yourself and the events you plan to host. Our team reviews every application within 2 business days.
          </p>
          {existing?.status === 'REJECTED' && (
            <div className="mt-4 p-4 rounded-xl border border-red-500/30 bg-red-500/10">
              <p className="text-sm font-medium text-red-400">Your previous application was rejected.</p>
              {existing.adminNote && (
                <p className="text-sm text-zinc-400 mt-1">Admin note: {existing.adminNote}</p>
              )}
              <p className="text-sm text-zinc-400 mt-1">You may re-apply below.</p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" /> Full Name
            </label>
            <input
              {...register('fullName')}
              placeholder="Your legal full name"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
            />
            {errors.fullName && <p className="text-xs text-red-400">{errors.fullName.message}</p>}
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" /> Business / Organization Name
            </label>
            <input
              {...register('organizationName')}
              placeholder="Your business or organization name"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
            />
            {errors.organizationName && (
              <p className="text-xs text-red-400">{errors.organizationName.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-400" /> Phone Number
            </label>
            <input
              {...register('phoneNumber')}
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
            />
            {errors.phoneNumber && <p className="text-xs text-red-400">{errors.phoneNumber.message}</p>}
          </div>

          {/* Website / Social */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" /> Website or Social Media Link
            </label>
            <input
              {...register('websiteOrSocial')}
              placeholder="https://yourwebsite.com or https://instagram.com/yourprofile"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
            />
            {errors.websiteOrSocial && (
              <p className="text-xs text-red-400">{errors.websiteOrSocial.message}</p>
            )}
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" /> Describe the Events You Plan to Host
            </label>
            <textarea
              {...register('eventDescription')}
              rows={5}
              placeholder="Tell us about the types of events, expected audience size, frequency, and any past experience organizing events..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600 resize-none"
            />
            <div className="flex justify-between">
              {errors.eventDescription ? (
                <p className="text-xs text-red-400">{errors.eventDescription.message}</p>
              ) : (
                <span />
              )}
              <p className={`text-xs ${description.length < 50 ? 'text-zinc-600' : 'text-emerald-400'}`}>
                {description.length} / 50 min
              </p>
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-base rounded-xl"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <>Submit Application <ArrowRight className="ml-2 w-4 h-4" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
