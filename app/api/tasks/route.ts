import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';
import { isValidCategory, isValidLatLng, sanitizeText } from '../../../lib/validation';

// GET /api/tasks — list tasks (with optional filters)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status') || 'open';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const myTasks = url.searchParams.get('my') === 'true';

    // If requesting user's own tasks, require auth
    if (myTasks) {
      const user = await getCurrentUser(req);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const result = await query(
        `SELECT t.id, t.title, t.slug, t.description, t.category, t.status,
                t.latitude, t.longitude, t.address, t.event_date,
                t.estimated_duration, t.volunteers_needed, t.volunteers_count,
                t.photo_url, t.photo_after_url, t.created_at, t.completed_at,
                u.name as creator_name, u.id as creator_id
         FROM tasks t
         JOIN users u ON t.user_id = u.id
         WHERE t.user_id = $1
         ORDER BY t.created_at DESC LIMIT $2 OFFSET $3`,
        [user.id, limit, offset]
      );

      return NextResponse.json({ tasks: result.rows });
    }

    let sql = `
      SELECT t.id, t.title, t.slug, t.description, t.category, t.status,
             t.latitude, t.longitude, t.address, t.event_date,
             t.estimated_duration, t.volunteers_needed, t.volunteers_count,
             t.photo_url, t.photo_after_url, t.created_at, t.completed_at,
             u.name as creator_name, u.id as creator_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_approved = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category && isValidCategory(category)) {
      sql += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }

    if (status === 'completed') {
      sql += ` AND t.status = 'completed'`;
    } else {
      sql += ` AND t.status IN ('open', 'scheduled', 'in_progress')`;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return NextResponse.json({ tasks: result.rows });
  } catch (error: any) {
    console.error('List tasks error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks — create a new task
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, latitude, longitude, address, event_date, estimated_duration, volunteers_needed, photo_url } = body;

    // Validation
    if (!title || !description || !category || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Title, description, category, and location are required' }, { status: 400 });
    }

    if (title.length < 5 || title.length > 255) {
      return NextResponse.json({ error: 'Title must be 5-255 characters' }, { status: 400 });
    }

    if (description.length < 20 || description.length > 5000) {
      return NextResponse.json({ error: 'Description must be 20-5000 characters' }, { status: 400 });
    }

    if (!isValidCategory(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!isValidLatLng(latitude, longitude)) {
      return NextResponse.json({ error: 'Invalid location coordinates' }, { status: 400 });
    }

    const slug = sanitizeText(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 60)
      + '-' + crypto.randomBytes(4).toString('hex');

    const result = await query(
      `INSERT INTO tasks (user_id, title, slug, description, category, latitude, longitude, address, event_date, estimated_duration, volunteers_needed, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, slug`,
      [user.id, sanitizeText(title), slug, sanitizeText(description), category, latitude, longitude, address || null, event_date || null, estimated_duration || null, volunteers_needed || 1, photo_url || null]
    );

    // Update user's task count
    await query('UPDATE users SET tasks_created = tasks_created + 1 WHERE id = $1', [user.id]);

    return NextResponse.json({ task: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Create task error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
