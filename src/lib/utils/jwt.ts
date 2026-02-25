import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me-in-production';

export interface TokenPayload {
  userId: string;
  role: string;
}

/**
 * Generate a JWT token for the user payload.
 *
 * @param {TokenPayload} payload - The user payload to encode
 * @param {string} expiresIn - Expiration time string (e.g. '1h', '7d')
 * @returns {string} The signed JWT token
 */
export const signToken = (payload: TokenPayload, expiresIn: string | number = '1h'): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
};

/**
 * Verify a JWT token and return the decoded payload.
 *
 * @param {string} token - The token to verify
 * @returns {TokenPayload | null} The decoded payload if valid, or null if invalid
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
     
    return null;
  }
};
