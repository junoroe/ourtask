import { query } from './db';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BASE_URL = process.env.BASE_URL || 'https://ourtask.org';
const FROM_EMAIL = 'hello@ourtask.org';
const FROM_NAME = 'OurTask';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹', green: '🌱', fix: '🔧', feed: '🍱', build: '🏗️', serve: '👐',
};

interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<string | null> {
  if (!BREVO_API_KEY) {
    console.log('[Email] Brevo API key not set, skipping:', options.subject);
    return null;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: options.to, name: options.toName || options.to }],
        subject: options.subject,
        htmlContent: options.html,
      }),
    });

    const data = await res.json();
    return data.messageId || null;
  } catch (error: any) {
    console.error('[Email] Send failed:', error.message);
    return null;
  }
}

function emailTemplate(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFF8F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0;">
          <span style="font-size: 28px;">✦</span>
          <h1 style="color: #1A1A1A; font-size: 22px; margin: 8px 0 0;">${escapeHtml(title)}</h1>
        </div>
        
        <!-- Content -->
        <div style="background: white; border-radius: 16px; padding: 24px; margin: 16px 0; border: 1px solid #e5e7eb;">
          ${body}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 16px 0; color: #9CA3AF; font-size: 12px;">
          <p>✦ OurTask — Physical action for shared spaces</p>
          <p style="margin-top: 8px;">
            <a href="${BASE_URL}" style="color: #E8855B; text-decoration: none;">ourtask.org</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// --- Notification Functions ---

export async function notifyVolunteerJoined(taskId: number, volunteerName: string, volunteerMessage: string | null) {
  // Notify the task creator that someone volunteered
  const result = await query(
    `SELECT t.title, t.slug, t.volunteers_count, t.volunteers_needed,
            u.email, u.name, u.notify_email
     FROM tasks t
     JOIN users u ON t.user_id = u.id
     WHERE t.id = $1`,
    [taskId]
  );

  if (result.rows.length === 0) return;
  const { title, slug, volunteers_count, volunteers_needed, email, name, notify_email } = result.rows[0];

  if (!notify_email) return;

  const icon = '🙋';
  const subject = `${volunteerName} volunteered for "${title}"`;
  const html = emailTemplate('New Volunteer!', `
    <p style="color: #374151; line-height: 1.6;">
      Hey ${escapeHtml(name)},
    </p>
    <p style="color: #374151; line-height: 1.6;">
      <strong>${escapeHtml(volunteerName)}</strong> just signed up for your task:
    </p>
    <div style="background: #FFF0E5; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <h3 style="margin: 0 0 4px; color: #1A1A1A;">${escapeHtml(title)}</h3>
      <p style="margin: 0; color: #6B7280; font-size: 14px;">
        👥 ${volunteers_count}/${volunteers_needed} volunteers signed up
      </p>
      ${volunteerMessage ? `<p style="margin: 8px 0 0; color: #374151; font-size: 14px; font-style: italic;">"${escapeHtml(volunteerMessage)}"</p>` : ''}
    </div>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${BASE_URL}/task/${slug}" style="display: inline-block; background: #1A1A1A; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        View Task
      </a>
    </div>
  `);

  const messageId = await sendEmail({ to: email, toName: name, subject, html });

  // Log notification
  await query(
    'INSERT INTO notifications (user_id, type, task_id, subject, email_id) VALUES ((SELECT user_id FROM tasks WHERE id = $1), $2, $1, $3, $4)',
    [taskId, 'volunteer_joined', subject, messageId]
  );
}

export async function notifyTaskCompleted(taskId: number) {
  // Notify all volunteers that the task was completed
  const taskResult = await query(
    `SELECT t.title, t.slug, t.photo_after_url, u.name as creator_name
     FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.id = $1`,
    [taskId]
  );

  if (taskResult.rows.length === 0) return;
  const task = taskResult.rows[0];

  const volunteers = await query(
    `SELECT u.email, u.name, u.id, u.notify_email
     FROM volunteers v JOIN users u ON v.user_id = u.id
     WHERE v.task_id = $1 AND v.status = 'completed'`,
    [taskId]
  );

  for (const vol of volunteers.rows) {
    if (!vol.notify_email) continue;

    const subject = `✅ "${task.title}" is complete!`;
    const html = emailTemplate('Task Completed!', `
      <p style="color: #374151; line-height: 1.6;">
        Hey ${escapeHtml(vol.name)},
      </p>
      <p style="color: #374151; line-height: 1.6;">
        The task you volunteered for has been marked as complete by ${escapeHtml(task.creator_name)}. Thank you for showing up and making a difference! 🎉
      </p>
      <div style="background: #FFF0E5; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 4px; color: #1A1A1A;">✅ ${escapeHtml(task.title)}</h3>
      </div>
      ${task.photo_after_url ? `<img src="${BASE_URL}${task.photo_after_url}" alt="After" style="width: 100%; border-radius: 12px; margin: 16px 0;" />` : ''}
      <div style="text-align: center; margin-top: 20px;">
        <a href="${BASE_URL}/task/${task.slug}" style="display: inline-block; background: #1A1A1A; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          See the Result
        </a>
      </div>
    `);

    const messageId = await sendEmail({ to: vol.email, toName: vol.name, subject, html });
    await query(
      'INSERT INTO notifications (user_id, type, task_id, subject, email_id) VALUES ($1, $2, $3, $4, $5)',
      [vol.id, 'task_completed', taskId, subject, messageId]
    );
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const subject = 'Welcome to OurTask! ✦';
  const html = emailTemplate('Welcome to OurTask', `
    <p style="color: #374151; line-height: 1.6;">
      Hey ${escapeHtml(name)},
    </p>
    <p style="color: #374151; line-height: 1.6;">
      Welcome to OurTask — a community of people who show up and make things better. No committees, no bureaucracy, just action.
    </p>
    <p style="color: #374151; line-height: 1.6;">
      Here's how it works:
    </p>
    <div style="margin: 16px 0; padding-left: 16px; border-left: 3px solid #E8855B;">
      <p style="color: #374151; margin: 8px 0;"><strong>1.</strong> Browse the map for tasks near you</p>
      <p style="color: #374151; margin: 8px 0;"><strong>2.</strong> Click "I'm In" to volunteer</p>
      <p style="color: #374151; margin: 8px 0;"><strong>3.</strong> Show up and do it</p>
      <p style="color: #374151; margin: 8px 0;"><strong>4.</strong> See your impact on the Impact Wall ✨</p>
    </div>
    <p style="color: #374151; line-height: 1.6;">
      Or, if you see something that needs fixing — post a task and rally people to help.
    </p>
    <div style="text-align: center; margin-top: 24px;">
      <a href="${BASE_URL}" style="display: inline-block; background: #1A1A1A; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
        Explore Tasks Near You
      </a>
    </div>
  `);

  await sendEmail({ to: email, toName: name, subject, html });
}

export async function sendWeeklyDigest() {
  // Get users who want notifications and haven't received a digest in 6+ days
  const users = await query(`
    SELECT id, email, name, notify_nearby_radius, notify_categories
    FROM users
    WHERE notify_email = true
    AND (last_digest_at IS NULL OR last_digest_at < NOW() - INTERVAL '6 days')
  `);

  const CATEGORY_ICONS: Record<string, string> = {
    clean: '🧹', green: '🌱', fix: '🔧', feed: '🍱', build: '🏗️', serve: '👐',
  };

  let sentCount = 0;

  for (const user of users.rows) {
    // Get recent tasks (created in last 7 days)
    const tasks = await query(`
      SELECT t.title, t.slug, t.category, t.address, t.event_date,
             t.volunteers_needed, t.volunteers_count, t.created_at
      FROM tasks t
      WHERE t.is_approved = true
      AND t.status IN ('open', 'scheduled')
      AND t.created_at > NOW() - INTERVAL '7 days'
      ORDER BY t.created_at DESC
      LIMIT 8
    `);

    if (tasks.rows.length === 0) continue;

    // Get community stats for the week
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM tasks WHERE created_at > NOW() - INTERVAL '7 days') as new_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '7 days') as completed,
        (SELECT COUNT(*) FROM volunteers WHERE created_at > NOW() - INTERVAL '7 days') as new_volunteers
    `);
    const weekStats = stats.rows[0];

    const taskListHtml = tasks.rows.map((t: any) => `
      <div style="padding: 12px; background: #FFF8F2; border-radius: 10px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 16px;">${CATEGORY_ICONS[t.category] || '📌'}</span>
          <a href="${BASE_URL}/task/${t.slug}" style="font-weight: 600; color: #1A1A1A; text-decoration: none; font-size: 14px;">
            ${escapeHtml(t.title)}
          </a>
        </div>
        ${t.address ? `<p style="font-size: 12px; color: #6B7280; margin: 2px 0;">📍 ${escapeHtml(t.address)}</p>` : ''}
        <p style="font-size: 12px; color: #6B7280; margin: 2px 0;">
          👥 ${t.volunteers_count}/${t.volunteers_needed} volunteers
          ${t.event_date ? ` · 📅 ${new Date(t.event_date).toLocaleDateString()}` : ''}
        </p>
      </div>
    `).join('');

    const subject = `✦ This week on OurTask: ${tasks.rows.length} tasks need your help`;
    const html = emailTemplate('Your Weekly Round-Up', `
      <p style="color: #374151; line-height: 1.6;">
        Hey ${escapeHtml(user.name)},
      </p>
      <p style="color: #374151; line-height: 1.6;">
        Here's what's happening in your community this week:
      </p>

      <!-- Week stats -->
      <div style="display: flex; gap: 12px; margin: 16px 0; text-align: center;">
        <div style="flex: 1; background: #FFF0E5; border-radius: 10px; padding: 12px;">
          <p style="font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0;">${weekStats.new_tasks}</p>
          <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0;">New Tasks</p>
        </div>
        <div style="flex: 1; background: #FFF0E5; border-radius: 10px; padding: 12px;">
          <p style="font-size: 20px; font-weight: 700; color: #E8855B; margin: 0;">${weekStats.completed}</p>
          <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0;">Completed</p>
        </div>
        <div style="flex: 1; background: #FFF0E5; border-radius: 10px; padding: 12px;">
          <p style="font-size: 20px; font-weight: 700; color: #8B6914; margin: 0;">${weekStats.new_volunteers}</p>
          <p style="font-size: 11px; color: #6B7280; margin: 4px 0 0;">Volunteers</p>
        </div>
      </div>

      <h3 style="color: #1A1A1A; font-size: 15px; margin: 20px 0 12px;">Tasks Looking for Help</h3>
      ${taskListHtml}

      <div style="text-align: center; margin-top: 24px;">
        <a href="${BASE_URL}" style="display: inline-block; background: #1A1A1A; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          View All Tasks
        </a>
      </div>
    `);

    const messageId = await sendEmail({ to: user.email, toName: user.name, subject, html });

    // Update last digest timestamp
    await query('UPDATE users SET last_digest_at = NOW() WHERE id = $1', [user.id]);

    // Log notification
    await query(
      'INSERT INTO notifications (user_id, type, subject, email_id) VALUES ($1, $2, $3, $4)',
      [user.id, 'weekly_digest', subject, messageId]
    );

    sentCount++;
  }

  return sentCount;
}
