import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export class AuthService {
  async register(email: string, password: string) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hashedPassword, 'user']
    );
    return result.rows[0];
  }

  async login(email: string, password: string) {
    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const { password_hash, ...safeUser } = user;
    const tokens = this.generateTokens(safeUser);
    await pool.query('UPDATE users SET current_refresh_token = $1 WHERE id = $2', [
      tokens.refreshToken,
      user.id,
    ]);
    return tokens;
  }

  private generateTokens(user: any) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    } as SignOptions);

    // jti guarantees each refresh token is unique even if issued within the
    // same second (JWT signing is otherwise deterministic for identical
    // payload+iat), which the rotation reuse-check in refreshToken() depends on.
    const refreshToken = jwt.sign({ ...payload, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    } as SignOptions);

    return { accessToken, refreshToken, user };
  }

  async refreshToken(refreshToken: string) {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }

    const result = await pool.query(
      'SELECT id, email, role, current_refresh_token FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // Reject reused/stale refresh tokens: only the most recently issued token
    // for this user is valid. A mismatch means the token was already rotated
    // away (or possibly stolen), so wipe the stored token and force re-login.
    if (user.current_refresh_token !== refreshToken) {
      await pool.query('UPDATE users SET current_refresh_token = NULL WHERE id = $1', [user.id]);
      throw new Error('Invalid refresh token');
    }

    const tokens = this.generateTokens({ id: user.id, email: user.email, role: user.role });
    await pool.query('UPDATE users SET current_refresh_token = $1 WHERE id = $2', [
      tokens.refreshToken,
      user.id,
    ]);
    return tokens;
  }

  async logout(userId: number) {
    await pool.query('UPDATE users SET current_refresh_token = NULL WHERE id = $1', [userId]);
  }
}
