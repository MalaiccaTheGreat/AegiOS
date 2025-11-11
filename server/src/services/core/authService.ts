import { compare, hash } from 'bcryptjs';
import { sign, verify, VerifyErrors } from 'jsonwebtoken';
import { db } from '../../../db';
import { users } from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  businessId: string;
  email: string;
  role: string;
}

export class AuthService {
  static async register(email: string, password: string, firstName: string, lastName: string) {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hash(password, SALT_ROUNDS);

      // Create user
      const [newUser] = await db.insert(users).values({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'user',
        isActive: true
      }).returning();

      // Generate tokens
      const tokens = await this.generateTokens({
        userId: newUser.id,
        businessId: newUser.businessId || '',
        email: newUser.email,
        role: newUser.role
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          businessId: newUser.businessId
        },
        tokens
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw new Error('Registration failed');
    }
  }

  static async login(email: string, password: string) {
    try {
      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens({
        userId: user.id,
        businessId: user.businessId || '',
        email: user.email,
        role: user.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businessId: user.businessId
        },
        tokens
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw new Error('Login failed');
    }
  }

  static async refreshToken(refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify refresh token
      const decoded = await new Promise<TokenPayload>((resolve, reject) => {
        verify(refreshToken, env.JWT_REFRESH_SECRET, (err: VerifyErrors | null, decoded: any) => {
          if (err) {
            return reject(new Error('Invalid refresh token'));
          }
          resolve(decoded as TokenPayload);
        });
      });

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId)
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens({
        userId: user.id,
        businessId: user.businessId || '',
        email: user.email,
        role: user.role
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          businessId: user.businessId
        },
        tokens
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  static async generateTokens(payload: TokenPayload) {
    const accessToken = sign(payload, env.JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });

    return { accessToken, refreshToken };
  }

  static async verifyToken(token: string): Promise<TokenPayload> {
    return new Promise((resolve, reject) => {
      verify(token, env.JWT_SECRET, (err: VerifyErrors | null, decoded: any) => {
        if (err) {
          return reject(new Error('Invalid or expired token'));
        }
        resolve(decoded as TokenPayload);
      });
    });
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, SALT_ROUNDS);

      // Update password
      await db.update(users)
        .set({ passwordHash: hashedPassword })
        .where(eq(users.id, userId));

      return { success: true };
    } catch (error) {
      logger.error('Password change failed:', error);
      throw error;
    }
  }
}
