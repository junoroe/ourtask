import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
    }

    // Validate magic bytes match claimed MIME type
    const bytes = await file.arrayBuffer();
    const header = new Uint8Array(bytes).slice(0, 12);
    const isJpeg = header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
    const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
                && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: 'File content does not match an allowed image format' }, { status: 400 });
    }

    // Determine extension from actual content, not claimed MIME
    const ext = isJpeg ? 'jpg' : isPng ? 'png' : 'webp';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

    // Ensure upload dir exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Write file with path containment check
    const buffer = Buffer.from(bytes);
    const filepath = path.resolve(UPLOAD_DIR, filename);
    if (!filepath.startsWith(path.resolve(UPLOAD_DIR))) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Upload error:', error.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
