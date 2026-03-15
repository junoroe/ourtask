import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';

// GET /api/sponsors — list active sponsors
export async function GET() {
  try {
    const result = await query(
      `SELECT s.id, s.name, s.slug, s.logo_url, s.website, s.description,
              COUNT(ts.id) as tasks_sponsored
       FROM sponsors s
       LEFT JOIN task_sponsors ts ON ts.sponsor_id = s.id
       WHERE s.is_active = true
       GROUP BY s.id
       ORDER BY tasks_sponsored DESC, s.name ASC`
    );
    return NextResponse.json({ sponsors: result.rows });
  } catch (error: any) {
    console.error('Sponsors error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sponsors — register a sponsor (admin only)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users (user ID 1 for now; proper admin role system later)
    const adminCheck = await query('SELECT is_admin FROM users WHERE id = $1', [user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, website, description, contact_email, logo_url } = await req.json();

    if (!name || !contact_email) {
      return NextResponse.json({ error: 'Name and contact email required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60)
      + '-' + crypto.randomBytes(3).toString('hex');

    const result = await query(
      `INSERT INTO sponsors (name, slug, logo_url, website, description, contact_email)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, slug`,
      [name, slug, logo_url || null, website || null, description || null, contact_email]
    );

    return NextResponse.json({ sponsor: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Create sponsor error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
