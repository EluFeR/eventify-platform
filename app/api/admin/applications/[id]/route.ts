import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const actionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  adminNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 422 });
  }

  const application = await prisma.organizerApplication.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const { action, adminNote } = parsed.data;

  // Update application status
  const updatedApplication = await prisma.organizerApplication.update({
    where: { id },
    data: { status: action, adminNote: adminNote ?? null },
  });

  // If approved, promote user role to ORGANIZER
  if (action === 'APPROVED') {
    await prisma.user.update({
      where: { id: application.userId },
      data: { role: 'ORGANIZER' },
    });
  }

  // If rejected after previously being approved, demote role back to ATTENDEE
  if (action === 'REJECTED' && application.user.role === 'ORGANIZER') {
    await prisma.user.update({
      where: { id: application.userId },
      data: { role: 'ATTENDEE' },
    });
  }

  return NextResponse.json(updatedApplication);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const application = await prisma.organizerApplication.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
    },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  return NextResponse.json(application);
}
