'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Mail, Lock } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!res || res.error) {
        toast.error('Invalid email or password');
        return;
      }
      toast.success('Welcome back!');
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-zinc-400">Sign in to your EventFlow account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="w-4 h-4 text-violet-400" /> Email
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-400" /> Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className={inputClass}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-base rounded-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign in <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-zinc-400 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
