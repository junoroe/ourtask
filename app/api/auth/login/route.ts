import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { verifyPassword, generateToken } from '../../../../lib/auth';

const MAX_ATTEMPTS = 10;
const LOCKOUT_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Check for lockout
    const attempts = await query(
      `SELECT COUNT(*) as count FROM login_attempts
       WHERE email = $1 AND success = false
       AND attempted_at > NOW() - INTERVAL '${LOCKOUT_MINUTES} minutes'`,
      [normalizedEmail]
    );

    if (parseInt(attempts.rows[0].count) >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const result = await query('SELECT id, email, name, password_hash FROM users WHERE email = $1', [normalizedEmail]);
    
    if (result.rows.length === 0) {
      // Log failed attempt (unknown email — use consistent timing)
      await query(
        'INSERT INTO login_attempts (email, success) VALUES ($1, false)',
        [normalizedEmail]
      );
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);

    if (!valid) {
      await query(
        'INSERT INTO login_attempts (email, success) VALUES ($1, false)',
        [normalizedEmail]
      );
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Successful login — log it and clear old failures
    await query(
      'INSERT INTO login_attempts (email, success) VALUES ($1, true)',
      [normalizedEmail]
    );

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
