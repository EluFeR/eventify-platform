import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const first = Object.values(fieldErrors).flat()[0];
    return NextResponse.json({ error: first ?? 'Invalid input' }, { status: 422 });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });

    const { password: _password, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (err) {
    console.error('[register] failed:', err);
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ error: `Registration failed: ${message}` }, { status: 500 });
  }
}
