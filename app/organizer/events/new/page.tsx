'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Loader2,
  CalendarPlus,
  Type,
  FileText,
  MapPin,
  Tag,
  ImageIcon,
  Calendar,
  Ticket,
  Plus,
  Trash2,
} from 'lucide-react';

const CATEGORIES = ['Music', 'Tech', 'Business', 'Sports', 'Arts', 'Food', 'Education', 'Other'];

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Required'),
  price: z.coerce.number().int().min(0, 'Min 0'),
  quantity: z.coerce.number().int().min(1, 'Min 1'),
});

const schema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    location: z.string().min(2, 'Location is required'),
    category: z.string().min(1, 'Please choose a category'),
    image: z.string().url('Enter a valid URL').optional().or(z.literal('')),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    ticketTypes: z.array(ticketTypeSchema).min(1, 'Add at least one ticket type'),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: 'End date must be after the start date',
    path: ['endDate'],
  });

type FormData = z.infer<typeof schema>;

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600';

export default function NewEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ticketTypes: [{ name: 'Normal', price: 0, quantity: 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'ticketTypes' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/organizer/events/new');
      return;
    }
    if (
      status === 'authenticated' &&
      session?.user?.role !== 'ORGANIZER' &&
      session?.user?.role !== 'ADMIN'
    ) {
      router.push('/organizer/apply');
    }
  }, [status, session, router]);

  const onSubmit = async (data: FormData) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(typeof json.error === 'string' ? json.error : 'Could not create event');
      return;
    }
    toast.success('Event created! It\'s saved as a draft.');
    router.push('/organizer/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full text-sm mb-4">
            <CalendarPlus className="w-4 h-4" />
            New Event
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Create an Event</h1>
          <p className="text-zinc-400 text-lg">
            Fill in the details below. Your event starts as a draft so you can review it before publishing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Type className="w-4 h-4 text-violet-400" /> Event Title
            </label>
            <input {...register('title')} placeholder="e.g. Summer Music Festival 2026" className={inputClass} />
            {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" /> Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Tell attendees what your event is about..."
              className={`${inputClass} resize-none`}
            />
            {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
          </div>

          {/* Category + Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-400" /> Category
              </label>
              <select {...register('category')} defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Select a category
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-400">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-400" /> Location
              </label>
              <input {...register('location')} placeholder="City, venue, or 'Online'" className={inputClass} />
              {errors.location && <p className="text-xs text-red-400">{errors.location.message}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" /> Starts
              </label>
              <input type="datetime-local" {...register('startDate')} className={inputClass} />
              {errors.startDate && <p className="text-xs text-red-400">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" /> Ends
              </label>
              <input type="datetime-local" {...register('endDate')} className={inputClass} />
              {errors.endDate && <p className="text-xs text-red-400">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-violet-400" /> Cover Image URL <span className="text-zinc-600">(optional)</span>
            </label>
            <input {...register('image')} placeholder="https://example.com/cover.jpg" className={inputClass} />
            {errors.image && <p className="text-xs text-red-400">{errors.image.message}</p>}
          </div>

          {/* Ticket Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Ticket className="w-4 h-4 text-violet-400" /> Ticket Tiers
              </label>
              <div className="flex items-center gap-1.5">
                {(['Normal', 'VIP', 'VVIP', 'Custom'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() =>
                      append({ name: tier === 'Custom' ? '' : tier, price: 0, quantity: 50 })
                    }
                    className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 hover:border-violet-500/60 rounded-full px-2.5 py-1 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> {tier}
                  </button>
                ))}
              </div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Ticket #{index + 1}</span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-zinc-500 hover:text-red-400"
                      aria-label="Remove ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <input
                      {...register(`ticketTypes.${index}.name`)}
                      placeholder="Name (e.g. VIP)"
                      className={inputClass}
                    />
                    {errors.ticketTypes?.[index]?.name && (
                      <p className="text-xs text-red-400">{errors.ticketTypes[index]?.name?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={0}
                      {...register(`ticketTypes.${index}.price`)}
                      placeholder="Price"
                      className={inputClass}
                    />
                    {errors.ticketTypes?.[index]?.price && (
                      <p className="text-xs text-red-400">{errors.ticketTypes[index]?.price?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="number"
                      min={1}
                      {...register(`ticketTypes.${index}.quantity`)}
                      placeholder="Quantity"
                      className={inputClass}
                    />
                    {errors.ticketTypes?.[index]?.quantity && (
                      <p className="text-xs text-red-400">{errors.ticketTypes[index]?.quantity?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {errors.ticketTypes?.message && (
              <p className="text-xs text-red-400">{errors.ticketTypes.message}</p>
            )}
            <p className="text-xs text-zinc-600">Each tier has its own price &amp; quantity. Price is in ETB (e.g. 250 = 250 Birr). Use 0 for free tickets.</p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-base rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
              </>
            ) : (
              <>
                Create Event <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
