import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

// GET /api/cities — city dashboard stats
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const city = url.searchParams.get('city');

    if (city) {
      // Single city detail
      const stats = await query(`
        SELECT
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
          SUM(volunteers_count) as total_volunteers,
          COUNT(DISTINCT category) as categories_active
        FROM tasks
        WHERE city = $1 AND is_approved = true
      `, [city]);

      const tasks = await query(`
        SELECT t.id, t.title, t.slug, t.category, t.status, t.address,
               t.volunteers_needed, t.volunteers_count, t.photo_url,
               t.created_at, t.completed_at, u.name as creator_name
        FROM tasks t JOIN users u ON u.id = t.user_id
        WHERE t.city = $1 AND t.is_approved = true
        ORDER BY t.created_at DESC
      `, [city]);

      const categories = await query(`
        SELECT category, COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM tasks WHERE city = $1 AND is_approved = true
        GROUP BY category ORDER BY total DESC
      `, [city]);

      return NextResponse.json({
        city,
        stats: stats.rows[0],
        tasks: tasks.rows,
        categories: categories.rows,
      });
    }

    // All cities summary
    const cities = await query(`
      SELECT city,
             COUNT(*) as total_tasks,
             COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
             SUM(volunteers_count) as total_volunteers
      FROM tasks
      WHERE city IS NOT NULL AND is_approved = true
      GROUP BY city
      ORDER BY total_tasks DESC
    `);

    return NextResponse.json({ cities: cities.rows });
  } catch (error: any) {
    console.error('Cities error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
