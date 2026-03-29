import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import { PaginationUtil } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        preferredLanguage: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        timezone: true,
        preferredLanguage: true,
      },
    });

    return user;
  }

  /**
   * List organization members
   */
  async getOrganizationMembers(
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Verify user belongs to organization
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied');
    }

    const { skip, take } = PaginationUtil.getPaginationParams(page, limit);

    const [members, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where: { organizationId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              createdAt: true,
            },
          },
          role: { select: { id: true, name: true } },
        },
        skip,
        take,
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.organizationMember.count({
        where: { organizationId },
      }),
    ]);

    return PaginationUtil.buildPaginatedResponse(members, total, page, limit);
  }

  /**
   * Remove member from organization
   */
  async removeOrganizationMember(
    organizationId: string,
    userId: string,
    targetUserId: string,
  ) {
    // Verify user is admin
    const userMember = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: true },
    });

    if (userMember?.role?.isSystem !== true) {
      throw new ForbiddenException('Only admins can remove members');
    }

    // Prevent removing yourself
    if (userId === targetUserId) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    await this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(userId: string) {
    const organizations = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            tier: true,
            createdAt: true,
          },
        },
        role: { select: { name: true } },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return organizations.map((m) => ({
      organization: m.organization,
      role: m.role.name,
      joinedAt: m.joinedAt,
    }));
  }
}
