import { NextResponse } from 'next/server';
import { sendWeeklyDigest } from '../../../../lib/email';

// GET /api/cron/digest — trigger weekly digest (called by cron)
export async function GET(req: Request) {
  try {
    // Simple auth: check for cron secret
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sentCount = await sendWeeklyDigest();
    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error: any) {
    console.error('Digest cron error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
