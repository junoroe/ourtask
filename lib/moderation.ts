import { query } from './db';

// Moderation rules based on the OurTask charter:
// "Would someone on both ends of the political spectrum agree this makes the place better?"

const BLOCKED_PATTERNS = [
  // Political content
  /\b(democrat|republican|liberal|conservative|maga|woke|left-?wing|right-?wing|socialist|marxist|fascist)\b/i,
  /\b(trump|biden|obama|vote|voting|election|ballot|campaign|petition|lobby|protest|rally|march)\b/i,
  /\b(defund|abolish|ban|mandate|regulation)\b/i,
  // Religious proselytizing (organizing is fine, converting isn't)
  /\b(convert|salvation|repent|sinner|infidel|crusade)\b/i,
  // Hate/discrimination
  /\b(hate|supremac|racist|bigot)\b/i,
  // Commercial/spam
  /\b(buy now|limited offer|discount code|click here|subscribe|mlm|crypto|nft)\b/i,
  // Fundraising (OurTask is about action, not money)
  /\b(donate|donation|gofundme|fundrais|venmo|cashapp|paypal)\b/i,
];

const WARNING_PATTERNS = [
  // Potentially political but context-dependent
  /\b(policy|government|city council|county|commissioner|legislation)\b/i,
  // Could be legitimate or commercial
  /\b(business|company|brand|sponsor)\b/i,
  // Safety concerns
  /\b(chainsaw|chemical|hazardous|demolish|electrical|asbestos)\b/i,
];

export interface ModerationResult {
  approved: boolean;
  autoApproved: boolean;
  flags: string[];
  warnings: string[];
  score: number; // 0-100, higher = more likely problematic
  reason?: string;
}

export function moderateTask(title: string, description: string): ModerationResult {
  const combined = `${title} ${description}`.toLowerCase();
  const flags: string[] = [];
  const warnings: string[] = [];

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      flags.push(`Blocked term: "${match[0]}"`);
    }
  }

  // Check warning patterns
  for (const pattern of WARNING_PATTERNS) {
    const match = combined.match(pattern);
    if (match) {
      warnings.push(`Review term: "${match[0]}"`);
    }
  }

  // Content quality checks
  if (title.length < 10) {
    warnings.push('Title is very short');
  }
  if (description.length < 20) {
    warnings.push('Description is very short');
  }
  if (title === title.toUpperCase() && title.length > 5) {
    warnings.push('Title is ALL CAPS');
  }
  if ((combined.match(/!/g) || []).length > 3) {
    warnings.push('Excessive exclamation marks');
  }
  if ((combined.match(/https?:\/\//g) || []).length > 2) {
    warnings.push('Multiple URLs detected');
  }

  // Calculate score
  let score = 0;
  score += flags.length * 30;
  score += warnings.length * 10;
  score = Math.min(100, score);

  // Decision
  const approved = flags.length === 0;
  const autoApproved = flags.length === 0 && warnings.length <= 1;

  return {
    approved,
    autoApproved,
    flags,
    warnings,
    score,
    reason: flags.length > 0
      ? `Task flagged for review: ${flags.join(', ')}`
      : warnings.length > 1
        ? `Task needs manual review: ${warnings.join(', ')}`
        : undefined,
  };
}

// Store moderation result
export async function logModeration(taskId: number, result: ModerationResult) {
  await query(
    `INSERT INTO moderation_log (task_id, approved, auto_approved, score, flags, warnings, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [taskId, result.approved, result.autoApproved, result.score,
     JSON.stringify(result.flags), JSON.stringify(result.warnings), result.reason || null]
  );
}

// Admin: list flagged tasks
export async function getFlaggedTasks() {
  return query(`
    SELECT t.id, t.title, t.slug, t.description, t.category, t.created_at,
           u.name as creator_name, u.email as creator_email,
           m.score, m.flags, m.warnings, m.reason, m.reviewed_at, m.reviewed_by
    FROM moderation_log m
    JOIN tasks t ON t.id = m.task_id
    JOIN users u ON u.id = t.user_id
    WHERE m.auto_approved = false
    ORDER BY m.created_at DESC
  `);
}
