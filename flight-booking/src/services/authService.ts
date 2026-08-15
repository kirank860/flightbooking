import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export class AuthService {
  async register(email: string, password: string) {
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
    return this.generateTokens(safeUser);
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

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    } as SignOptions);

    return { accessToken, refreshToken, user };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

      const result = await pool.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [payload.userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return this.generateTokens(result.rows[0]);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
