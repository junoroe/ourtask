import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

// GET /api/tasks/nearby?lat=X&lng=Y&radius=Z — tasks near a location
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get('lat') || '47.5650');  // Default: Kitsap County center
    const lng = parseFloat(url.searchParams.get('lng') || '-122.6270');
    const radius = Math.min(parseFloat(url.searchParams.get('radius') || '50'), 200); // km, max 200
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    // Use subquery to filter by distance
    let innerWhere = `t.is_approved = true`;
    const params: any[] = [lat, lng];
    let paramIndex = 3;

    if (status === 'completed') {
      innerWhere += ` AND t.status = 'completed'`;
    } else {
      innerWhere += ` AND t.status IN ('open', 'scheduled', 'in_progress')`;
    }

    if (category) {
      innerWhere += ` AND t.category = $${paramIndex++}`;
      params.push(category);
    }

    params.push(radius);

    const sql = `
      SELECT * FROM (
        SELECT t.id, t.title, t.slug, t.category, t.status,
               t.latitude, t.longitude, t.address, t.event_date,
               t.volunteers_needed, t.volunteers_count,
               t.photo_url, t.photo_after_url, t.created_at,
               u.name as creator_name,
               (6371 * acos(
                 LEAST(1.0, cos(radians($1)) * cos(radians(t.latitude)) *
                 cos(radians(t.longitude) - radians($2)) +
                 sin(radians($1)) * sin(radians(t.latitude)))
               )) AS distance_km
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        WHERE ${innerWhere}
      ) AS nearby
      WHERE nearby.distance_km < $${paramIndex}
      ORDER BY nearby.distance_km ASC
      LIMIT 100
    `;

    const result = await query(sql, params);
    return NextResponse.json({ tasks: result.rows });
  } catch (error: any) {
    console.error('Nearby tasks error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
