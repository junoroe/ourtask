import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';
import { isValidEmail } from '../../../lib/validation';

// GET /api/orgs — list organizations
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const verified = url.searchParams.get('verified');

    let sql = `
      SELECT o.id, o.name, o.slug, o.description, o.website, o.logo_url,
             o.category, o.is_verified, o.verified_at, o.created_at,
             COUNT(DISTINCT t.id) as task_count,
             COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_count
      FROM organizations o
      LEFT JOIN tasks t ON t.org_id = o.id
    `;

    const params: any[] = [];
    if (verified === 'true') {
      sql += ' WHERE o.is_verified = true';
    }

    sql += ' GROUP BY o.id ORDER BY o.is_verified DESC, o.name ASC';

    const result = await query(sql, params);
    return NextResponse.json({ organizations: result.rows });
  } catch (error: any) {
    console.error('List orgs error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/orgs — register an organization
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, website, contact_email, contact_phone, address, category } = await req.json();

    if (!name || !contact_email) {
      return NextResponse.json({ error: 'Organization name and contact email are required' }, { status: 400 });
    }

    if (name.length < 3 || name.length > 255) {
      return NextResponse.json({ error: 'Name must be 3-255 characters' }, { status: 400 });
    }

    if (!isValidEmail(contact_email)) {
      return NextResponse.json({ error: 'Invalid contact email address' }, { status: 400 });
    }

    if (description && description.length > 2000) {
      return NextResponse.json({ error: 'Description must be under 2000 characters' }, { status: 400 });
    }

    if (website && (website.length > 500 || !/^https?:\/\//i.test(website))) {
      return NextResponse.json({ error: 'Website must be a valid URL' }, { status: 400 });
    }

    const validCategories = ['nonprofit', 'government', 'community', 'religious', 'other'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid organization category' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)
      + '-' + crypto.randomBytes(3).toString('hex');

    const result = await query(
      `INSERT INTO organizations (name, slug, description, website, contact_email, contact_phone, address, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, slug`,
      [name, slug, description || null, website || null, contact_email, contact_phone || null, address || null, category || 'community']
    );

    // Make the creating user an admin of the org
    await query(
      'INSERT INTO org_members (org_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, user.id, 'admin']
    );

    return NextResponse.json({ organization: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Create org error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
