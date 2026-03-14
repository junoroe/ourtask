import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { hashPassword, generateToken } from '../../../../lib/auth';
import { isValidEmail, isStrongPassword } from '../../../../lib/validation';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be 8-128 characters with at least one uppercase, lowercase, and number' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2 || name.length > 255) {
      return NextResponse.json({ error: 'Name must be 2-255 characters' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Unable to create account. Please try a different email or log in.' },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), password_hash, name.trim()]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error: any) {
    console.error('Signup error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
