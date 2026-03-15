import { query } from './db';

interface Badge {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

// Check and award badges after a user action
export async function checkAndAwardBadges(userId: number): Promise<Badge[]> {
  const awarded: Badge[] = [];

  // Get user stats
  const userStats = await query(
    `SELECT
       (SELECT COUNT(*) FROM volunteers WHERE user_id = $1 AND status IN ('confirmed', 'completed')) as volunteer_count,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1) as tasks_created,
       (SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND status = 'completed') as tasks_completed,
       (SELECT COUNT(DISTINCT category) FROM volunteers v JOIN tasks t ON t.id = v.task_id WHERE v.user_id = $1) as categories_volunteered
    `,
    [userId]
  );

  const stats = userStats.rows[0];

  // Get badges user doesn't have yet
  const unearned = await query(
    `SELECT b.* FROM badges b
     WHERE b.id NOT IN (SELECT badge_id FROM user_badges WHERE user_id = $1)`,
    [userId]
  );

  for (const badge of unearned.rows) {
    let earned = false;

    switch (badge.slug) {
      case 'first-volunteer':
        earned = parseInt(stats.volunteer_count) >= 1;
        break;
      case 'five-tasks':
        earned = parseInt(stats.volunteer_count) >= 5;
        break;
      case 'ten-tasks':
        earned = parseInt(stats.volunteer_count) >= 10;
        break;
      case 'twenty-five-tasks':
        earned = parseInt(stats.volunteer_count) >= 25;
        break;
      case 'first-post':
        earned = parseInt(stats.tasks_created) >= 1;
        break;
      case 'five-posts':
        earned = parseInt(stats.tasks_created) >= 5;
        break;
      case 'first-complete':
        earned = parseInt(stats.tasks_completed) >= 1;
        break;
      case 'ten-completes':
        earned = parseInt(stats.tasks_completed) >= 10;
        break;
      case 'all-categories':
        earned = parseInt(stats.categories_volunteered) >= 6;
        break;
      case 'early-adopter':
        earned = true; // Everyone during pilot gets this
        break;
    }

    if (earned) {
      try {
        await query(
          'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, badge.id]
        );
        awarded.push({ id: badge.id, slug: badge.slug, name: badge.name, icon: badge.icon });
      } catch (err) {
        // Ignore duplicate
      }
    }
  }

  return awarded;
}

// Get all badges for a user
export async function getUserBadges(userId: number) {
  const result = await query(
    `SELECT b.slug, b.name, b.description, b.icon, b.category, ub.earned_at
     FROM user_badges ub
     JOIN badges b ON b.id = ub.badge_id
     WHERE ub.user_id = $1
     ORDER BY ub.earned_at DESC`,
    [userId]
  );
  return result.rows;
}

// Leaderboard
export async function getLeaderboard(limit: number = 20) {
  const result = await query(
    `SELECT u.name, u.volunteer_count, u.tasks_created,
            (SELECT COUNT(*) FROM tasks WHERE user_id = u.id AND status = 'completed') as completed_count,
            (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count
     FROM users u
     WHERE u.volunteer_count > 0 OR u.tasks_created > 0
     ORDER BY u.volunteer_count DESC, completed_count DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
