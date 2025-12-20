
import { Clerk } from '@clerk/clerk-sdk-node';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export async function authenticate(req: VercelRequest, res: VercelResponse, optional = false): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (optional) return null;
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const { sub: userId } = await clerkClient.verifyToken(token);
    return userId;
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Invalid token' });
    return null;
  }
}
