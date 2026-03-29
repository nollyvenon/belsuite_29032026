import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all roles for organization
   */
  async getOrganizationRoles(organizationId: string) {
    const roles = await this.prisma.role.findMany({
      where: { organizationId },
      include: {
        permissions: {
          select: {
            action: true,
            resource: true,
          },
        },
        members: {
          select: {
            id: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return roles;
  }

  /**
   * Create custom role
   */
  async createRole(
    organizationId: string,
    userId: string,
    name: string,
    description?: string,
  ) {
    // Verify user is admin
    const admin = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: true },
    });

    if (!admin?.role?.isSystem) {
      throw new ForbiddenException('Only admins can create roles');
    }

    // Check role name doesn't exist
    const existingRole = await this.prisma.role.findFirst({
      where: { organizationId, name },
    });

    if (existingRole) {
      throw new ForbiddenException('Role name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        organizationId,
        name,
        description,
        isSystem: false,
      },
      include: { permissions: true },
    });

    return role;
  }

  /**
   * Add permission to role
   */
  async addPermissionToRole(
    organizationId: string,
    userId: string,
    roleId: string,
    action: string,
    resource: string,
  ) {
    // Verify user is admin
    await this.verifyOrgAdmin(organizationId, userId);

    // Verify role belongs to organization
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }

    // Check permission doesn't already exist
    const existingPermission = await this.prisma.permission.findFirst({
      where: { roleId, action, resource },
    });

    if (existingPermission) {
      return existingPermission;
    }

    const permission = await this.prisma.permission.create({
      data: {
        roleId,
        action,
        resource,
      },
    });

    return permission;
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(
    organizationId: string,
    userId: string,
    roleId: string,
    permissionId: string,
  ) {
    // Verify user is admin
    await this.verifyOrgAdmin(organizationId, userId);

    // Verify role belongs to organization
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role || role.organizationId !== organizationId) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.permission.delete({
      where: { id: permissionId },
    });

    return { success: true };
  }

  /**
   * Get user permissions for organization
   */
  async getUserPermissions(userId: string, organizationId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!member) {
      return [];
    }

    return member.role.permissions.map((p) => `${p.action}:${p.resource}`);
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    organizationId: string,
    action: string,
    resource: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, organizationId);
    return permissions.includes(`${action}:${resource}`);
  }

  /**
   * Verify user is organization admin
   */
  private async verifyOrgAdmin(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      include: { role: true },
    });

    if (!member?.role?.isSystem) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }
}
