import { and, eq } from 'drizzle-orm';
import { db } from '../../../db';
import { businesses, users, userBusinesses } from '../../../shared/schema';
import { logger } from '../../utils/logger';

export class BusinessService {
  static async createBusiness(userId: string, businessData: {
    name: string;
    industry: string;
    address?: string;
    phone?: string;
    email?: string;
  }) {
    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Create business
        const [business] = await tx.insert(businesses).values({
          name: businessData.name,
          industry: businessData.industry,
          address: businessData.address,
          phone: businessData.phone,
          email: businessData.email,
        }).returning();

        // Add user as business admin
        await tx.insert(userBusinesses).values({
          userId,
          businessId: business.id,
          role: 'admin',
          status: 'active',
        });

        // Update user's current business
        await tx.update(users)
          .set({ businessId: business.id })
          .where(eq(users.id, userId));

        return business;
      });
    } catch (error) {
      logger.error('Failed to create business:', error);
      throw new Error('Failed to create business');
    }
  }

  static async getUserBusinesses(userId: string) {
    try {
      return await db
        .select({
          id: businesses.id,
          name: businesses.name,
          industry: businesses.industry,
          role: userBusinesses.role,
          status: userBusinesses.status,
          joinedAt: userBusinesses.createdAt,
        })
        .from(userBusinesses)
        .innerJoin(
          businesses,
          eq(userBusinesses.businessId, businesses.id)
        )
        .where(eq(userBusinesses.userId, userId));
    } catch (error) {
      logger.error('Failed to get user businesses:', error);
      throw new Error('Failed to get user businesses');
    }
  }

  static async getBusinessDetails(businessId: string, userId: string) {
    try {
      const [business] = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.id, businessId),
            // Ensure user has access to this business
            db.select()
              .from(userBusinesses)
              .where(
                and(
                  eq(userBusinesses.userId, userId),
                  eq(userBusinesses.businessId, businessId)
                )
              )
          )
        )
        .limit(1);

      if (!business) {
        throw new Error('Business not found or access denied');
      }

      return business;
    } catch (error) {
      logger.error('Failed to get business details:', error);
      throw new Error('Failed to get business details');
    }
  }

  static async updateBusiness(
    businessId: string,
    userId: string,
    updateData: {
      name?: string;
      industry?: string;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      logoUrl?: string | null;
    }
  ) {
    try {
      // Verify user has admin access to the business
      const [userBusiness] = await db
        .select()
        .from(userBusinesses)
        .where(
          and(
            eq(userBusinesses.userId, userId),
            eq(userBusinesses.businessId, businessId),
            eq(userBusinesses.role, 'admin')
          )
        )
        .limit(1);

      if (!userBusiness) {
        throw new Error('Unauthorized: Admin access required');
      }

      const [updatedBusiness] = await db
        .update(businesses)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(businesses.id, businessId))
        .returning();

      return updatedBusiness;
    } catch (error) {
      logger.error('Failed to update business:', error);
      throw new Error('Failed to update business');
    }
  }

  static async inviteUserToBusiness(
    businessId: string,
    inviterId: string,
    email: string,
    role: 'admin' | 'manager' | 'member' = 'member'
  ) {
    try {
      // Verify inviter has admin access to the business
      const [inviterBusiness] = await db
        .select()
        .from(userBusinesses)
        .where(
          and(
            eq(userBusinesses.userId, inviterId),
            eq(userBusinesses.businessId, businessId),
            eq(userBusinesses.role, 'admin')
          )
        )
        .limit(1);

      if (!inviterBusiness) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Get user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // User doesn't exist yet - create an invitation
        // In a real app, you would send an email invitation
        return {
          invited: true,
          message: 'Invitation sent to user',
          userId: null,
        };
      }

      // Check if user already has access to the business
      const [existingAccess] = await db
        .select()
        .from(userBusinesses)
        .where(
          and(
            eq(userBusinesses.userId, user.id),
            eq(userBusinesses.businessId, businessId)
          )
        )
        .limit(1);

      if (existingAccess) {
        throw new Error('User already has access to this business');
      }

      // Add user to business
      await db.insert(userBusinesses).values({
        userId: user.id,
        businessId,
        role,
        status: 'active',
        invitedBy: inviterId,
      });

      // TODO: Send notification to user

      return {
        invited: true,
        message: 'User added to business',
        userId: user.id,
      };
    } catch (error) {
      logger.error('Failed to invite user to business:', error);
      throw new Error('Failed to invite user to business');
    }
  }

  static async removeUserFromBusiness(
    businessId: string,
    adminId: string,
    userIdToRemove: string
  ) {
    try {
      // Verify admin has access to the business
      const [adminBusiness] = await db
        .select()
        .from(userBusinesses)
        .where(
          and(
            eq(userBusinesses.userId, adminId),
            eq(userBusinesses.businessId, businessId),
            eq(userBusinesses.role, 'admin')
          )
        )
        .limit(1);

      if (!adminBusiness) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Don't allow removing the last admin
      if (adminId === userIdToRemove) {
        const [otherAdmins] = await db
          .select()
          .from(userBusinesses)
          .where(
            and(
              eq(userBusinesses.businessId, businessId),
              eq(userBusinesses.role, 'admin'),
              eq(userBusinesses.userId, userIdToRemove)
            )
          )
          .limit(1);

        if (!otherAdmins) {
          throw new Error('Cannot remove the only admin of the business');
        }
      }

      // Remove user from business
      await db
        .delete(userBusinesses)
        .where(
          and(
            eq(userBusinesses.userId, userIdToRemove),
            eq(userBusinesses.businessId, businessId)
          )
        );

      // If this was the user's current business, update their current business
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userIdToRemove))
        .limit(1);

      if (user?.businessId === businessId) {
        // Find another business the user belongs to
        const [otherBusiness] = await db
          .select()
          .from(userBusinesses)
          .where(eq(userBusinesses.userId, userIdToRemove))
          .limit(1);

        await db
          .update(users)
          .set({
            businessId: otherBusiness?.businessId || null,
          })
          .where(eq(users.id, userIdToRemove));
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to remove user from business:', error);
      throw new Error('Failed to remove user from business');
    }
  }

  static async getBusinessUsers(businessId: string, userId: string) {
    try {
      // Verify user has access to the business
      const [userBusiness] = await db
        .select()
        .from(userBusinesses)
        .where(
          and(
            eq(userBusinesses.userId, userId),
            eq(userBusinesses.businessId, businessId)
          )
        )
        .limit(1);

      if (!userBusiness) {
        throw new Error('Unauthorized: Access to business required');
      }

      // Get all users in the business
      return await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: userBusinesses.role,
          status: userBusinesses.status,
          joinedAt: userBusinesses.createdAt,
        })
        .from(userBusinesses)
        .innerJoin(users, eq(userBusinesses.userId, users.id))
        .where(eq(userBusinesses.businessId, businessId));
    } catch (error) {
      logger.error('Failed to get business users:', error);
      throw new Error('Failed to get business users');
    }
  }
}
