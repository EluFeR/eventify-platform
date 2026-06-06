'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Mail, Lock, User } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600';

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(typeof json.error === 'string' ? json.error : 'Could not create account');
        return;
      }

      // Auto sign-in after successful registration
      const signInRes = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!signInRes || signInRes.error) {
        toast.success('Account created! Please sign in.');
        router.push('/login');
        return;
      }
      toast.success('Account created. Welcome to EventFlow!');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Something went wrong. Is the database running and migrated?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create your account</h1>
          <p className="text-zinc-400">Join EventFlow to discover and host events.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-violet-400" /> Name
            </label>
            <input
              {...register('name')}
              placeholder="Your name"
              autoComplete="name"
              className={inputClass}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...
              </>
            ) : (
              <>
                Create account <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-zinc-400 text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
