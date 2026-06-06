import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
  websiteOrSocial: z.string().url('Please enter a valid URL'),
  eventDescription: z.string().min(50, 'Please describe your events in at least 50 characters'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Already an organizer or admin
  if (session.user.role === 'ORGANIZER' || session.user.role === 'ADMIN') {
    return NextResponse.json({ error: 'You already have organizer access' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  // Check for existing application
  const existing = await prisma.organizerApplication.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    if (existing.status === 'PENDING') {
      return NextResponse.json(
        { error: 'You already have a pending application' },
        { status: 400 }
      );
    }
    if (existing.status === 'APPROVED') {
      return NextResponse.json({ error: 'Your application has already been approved' }, { status: 400 });
    }
    // REJECTED — allow re-application by updating
    const updated = await prisma.organizerApplication.update({
      where: { userId: session.user.id },
      data: { ...parsed.data, status: 'PENDING', adminNote: null },
    });
    return NextResponse.json(updated, { status: 200 });
  }

  const application = await prisma.organizerApplication.create({
    data: {
      userId: session.user.id,
      ...parsed.data,
    },
  });

  return NextResponse.json(application, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const application = await prisma.organizerApplication.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(application ?? null);
}
