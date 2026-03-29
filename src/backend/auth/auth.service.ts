import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { HashUtil } from '../common/utils/hash.util';
import { AppConfig } from '../config/app.config';
import { RegisterDto, LoginDto, JwtPayload } from './dto/auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private config: AppConfig,
  ) {}

  /**
   * User registration
   * Creates new user and organization
   */
  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const passwordHash = await HashUtil.hashPassword(password);

    // Create user and organization in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          status: 'ACTIVE',
        },
      });

      // Create default organization
      const org = await tx.organization.create({
        data: {
          name: `${firstName}'s Workspace`,
          slug: this.generateSlug(email),
          status: 'ACTIVE',
          tier: 'FREE',
          maxMembers: 5,
          maxProjects: 10,
          maxStorageGB: 5,
        },
      });

      // Create admin role
      const adminRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: 'Admin',
          isSystem: true,
        },
      });

      // Create default permissions for admin role
      const permissions = [
        'create:content',
        'read:content',
        'update:content',
        'delete:content',
        'manage:users',
        'manage:organization',
        'manage:billing',
        'manage:integrations',
      ];

      await Promise.all(
        permissions.map((action) =>
          tx.permission.create({
            data: {
              roleId: adminRole.id,
              action: action.split(':')[0],
              resource: action.split(':')[1],
            },
          }),
        ),
      );

      // Add owner as organization member
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: adminRole.id,
          status: 'ACTIVE',
          roleName: 'Admin',
          permissions,
        },
      });

      return { user, org };
    });

    return this.generateAuthResponse(result.user, result.org.id);
  }

  /**
   * User login
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await HashUtil.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account has been banned');
    }

    // Get primary organization
    const primaryOrg = user.organizationMembers[0]?.organizationId;

    if (!primaryOrg) {
      throw new UnauthorizedException('No organization found for user');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return this.generateAuthResponse(user, primaryOrg);
  }

  /**
   * Validate JWT and return user payload
   */
  validateToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.config.getJwtSecret(),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.getJwtSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const permissions = await this.getUserPermissions(user.id, payload.orgId);
      const newAccessToken = this.createAccessToken(user, payload.orgId, permissions);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate authentication response with tokens
   */
  private async generateAuthResponse(user: User, organizationId: string) {
    const permissions = await this.getUserPermissions(user.id, organizationId);

    const accessToken = this.createAccessToken(user, organizationId, permissions);
    const refreshToken = this.createRefreshToken(user, organizationId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Create JWT access token
   */
  private createAccessToken(
    user: User,
    organizationId: string,
    permissions: string[],
  ): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: organizationId,
      permissions,
    };

    return this.jwtService.sign(payload, {
      secret: this.config.getJwtSecret(),
      expiresIn: this.config.getJwtExpiration(),
    });
  }

  /**
   * Create JWT refresh token
   */
  private createRefreshToken(user: User, organizationId: string): string {
    const payload = { sub: user.id, orgId: organizationId };

    return this.jwtService.sign(payload, {
      secret: this.config.getJwtSecret(),
      expiresIn: this.config.getRefreshTokenExpiration(),
    });
  }

  /**
   * Get user permissions for organization
   */
  private async getUserPermissions(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!member) {
      return [];
    }

    return member.role.permissions.map(
      (p) => `${p.action}:${p.resource}`,
    );
  }

  /**
   * Generate slug from email
   */
  private generateSlug(email: string): string {
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timestamp = Date.now().toString(36);
    return `${base}-${timestamp}`;
  }
}
