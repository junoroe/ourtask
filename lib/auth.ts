import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_EXPIRES = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: Missing required environment variable: JWT_SECRET');
  }
  return secret;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES }
  );
}

export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as User;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await query(
    'SELECT 1 FROM token_blacklist WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP LIMIT 1',
    [tokenHash]
  );
  return result.rows.length > 0;
}

export async function getCurrentUser(req: Request): Promise<User | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const user = verifyToken(token);
  if (!user) return null;

  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) return null;

  return user;
}
