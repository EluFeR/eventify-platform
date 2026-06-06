import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Ticket name is required'),
  price: z.coerce.number().int().min(0, 'Price cannot be negative'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

const eventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    location: z.string().min(2, 'Location is required'),
    category: z.string().min(1, 'Category is required'),
    image: z.string().url('Image must be a valid URL').optional().or(z.literal('')),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    ticketTypes: z.array(ticketTypeSchema).min(1, 'Add at least one ticket type'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after the start date',
    path: ['endDate'],
  });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only organizers can create events' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { ticketTypes, image, ...rest } = parsed.data;

  const event = await prisma.event.create({
    data: {
      ...rest,
      image: image || null,
      organizerId: session.user.id,
      ticketTypes: {
        create: ticketTypes.map((t) => ({
          name: t.name,
          price: t.price,
          quantity: t.quantity,
        })),
      },
    },
    include: { ticketTypes: true },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only organizers can view their events' }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    include: {
      ticketTypes: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(events);
}
