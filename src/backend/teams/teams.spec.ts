import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TeamsService } from '../teams.service';
import { TeamsController } from '../teams.controller';
import { TeamPermissionGuard } from '../../common/guards/team-permission.guard';
import { TeamRoleGuard } from '../../common/guards/team-role.guard';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Reflector } from '@nestjs/core';
import { TeamRole } from '@prisma/client';

/**
 * Teams Module Integration Tests
 * Tests CRUD, RBAC, permissions, and approval workflows
 */
describe('TeamsModule Integration Tests', () => {
  let app: INestApplication;
  let teamsService: TeamsService;
  let prismaService: PrismaService;

  // Mock data
  const mockOrganizationId = 'org_test_123';
  const mockUserId = 'user_test_123';
  const mockUser2Id = 'user_test_456';
  const mockTeamId = 'team_test_789';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [TeamsController],
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            organizationMember: { findUnique: jest.fn() },
            team: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            teamMember: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            teamInvitation: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            teamWorkflow: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            workflowApproval: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            approval: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            teamAuditLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        TeamPermissionGuard,
        TeamRoleGuard,
        Reflector,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    teamsService = moduleFixture.get<TeamsService>(TeamsService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('Team CRUD Operations', () => {
    it('should create a team with creator as OWNER', async () => {
      const createTeamDto = {
        name: 'Content Team',
        description: 'Our content creation team',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
      };

      jest.spyOn(prismaService.organizationMember, 'findUnique').mockResolvedValue({
        id: 'orgmember_1',
        organizationId: mockOrganizationId,
        userId: mockUserId,
        role: 'OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockCreatedTeam = {
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: createTeamDto.name,
        slug: 'content-team',
        description: createTeamDto.description,
        isPublic: createTeamDto.isPublic,
        requiresApproval: createTeamDto.requiresApproval,
        maxMembers: createTeamDto.maxMembers,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      };

      jest.spyOn(prismaService, '$transaction').mockResolvedValue(mockCreatedTeam);

      const result = await teamsService.createTeam(mockOrganizationId, mockUserId, createTeamDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createTeamDto.name);
      expect(result.createdById).toBe(mockUserId);
    });

    it('should fail to create team if user not in organization', async () => {
      const createTeamDto = {
        name: 'Content Team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
      };

      jest.spyOn(prismaService.organizationMember, 'findUnique').mockResolvedValue(null);

      await expect(
        teamsService.createTeam(mockOrganizationId, mockUserId, createTeamDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should list teams with pagination', async () => {
      jest.spyOn(prismaService.teamMember, 'findMany').mockResolvedValue([
        {
          id: 'member_1',
          teamId: mockTeamId,
          userId: mockUserId,
          role: TeamRole.OWNER,
          joinedAt: new Date(),
          lastActivityAt: new Date(),
          permissions: ['team:read', 'team:update'],
        },
      ]);

      jest.spyOn(prismaService.team, 'findMany').mockResolvedValue([
        {
          id: mockTeamId,
          organizationId: mockOrganizationId,
          name: 'Content Team',
          slug: 'content-team',
          description: 'Team description',
          isPublic: false,
          requiresApproval: true,
          maxMembers: 50,
          memberCount: 5,
          createdById: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          archivedAt: null,
        },
      ]);

      jest.spyOn(prismaService.team, 'count').mockResolvedValue(1);

      const result = await teamsService.listTeams(mockOrganizationId, mockUserId, {
        page: 1,
        pageSize: 20,
        search: undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.teams).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should get team details with members', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 2,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findMany').mockResolvedValue([
        {
          id: 'member_1',
          teamId: mockTeamId,
          userId: mockUserId,
          role: TeamRole.OWNER,
          joinedAt: new Date(),
          lastActivityAt: new Date(),
          permissions: ['team:read', 'team:update'],
        },
        {
          id: 'member_2',
          teamId: mockTeamId,
          userId: mockUser2Id,
          role: TeamRole.EDITOR,
          joinedAt: new Date(),
          lastActivityAt: new Date(),
          permissions: ['content:create', 'content:update'],
        },
      ]);

      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([
        {
          id: mockUserId,
          email: 'owner@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: mockUser2Id,
          email: 'editor@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      ]);

      const result = await teamsService.getTeam(mockOrganizationId, mockTeamId, mockUserId);

      expect(result).toBeDefined();
      expect(result.name).toBe('Content Team');
      expect(result.memberCount).toBe(2);
    });

    it('should update team details', async () => {
      const updateTeamDto = {
        name: 'Updated Team Name',
        description: 'Updated description',
        isPublic: true,
        requiresApproval: false,
        maxMembers: 100,
      };

      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.OWNER,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:read', 'team:update'],
      });

      jest.spyOn(prismaService.team, 'update').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: updateTeamDto.name,
        slug: 'content-team',
        description: updateTeamDto.description,
        isPublic: updateTeamDto.isPublic,
        requiresApproval: updateTeamDto.requiresApproval,
        maxMembers: updateTeamDto.maxMembers,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      const result = await teamsService.updateTeam(
        mockOrganizationId,
        mockTeamId,
        mockUserId,
        updateTeamDto,
      );

      expect(result.name).toBe(updateTeamDto.name);
      expect(result.isPublic).toBe(updateTeamDto.isPublic);
    });

    it('should archive team (soft delete)', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.OWNER,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:read', 'team:update', 'team:delete'],
      });

      jest.spyOn(prismaService.team, 'update').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: new Date(),
      });

      const result = await teamsService.archiveTeam(mockOrganizationId, mockTeamId, mockUserId);

      expect(result.archivedAt).not.toBeNull();
    });
  });

  describe('Member Management', () => {
    it('should invite member to team', async () => {
      const inviteDto = {
        email: 'newmember@example.com',
        role: TeamRole.EDITOR,
        message: 'Welcome to our team!',
      };

      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.OWNER,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:manage_members'],
      });

      jest.spyOn(prismaService.teamInvitation, 'findUnique').mockResolvedValue(null);

      jest.spyOn(prismaService.teamInvitation, 'create').mockResolvedValue({
        id: 'invite_1',
        teamId: mockTeamId,
        invitedEmail: inviteDto.email,
        role: inviteDto.role,
        invitedBy: mockUserId,
        token: 'token_123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        message: inviteDto.message,
        acceptedAt: null,
        createdAt: new Date(),
      });

      const result = await teamsService.inviteMember(mockOrganizationId, mockTeamId, mockUserId, inviteDto);

      expect(result).toBeDefined();
      expect(result.invitedEmail).toBe(inviteDto.email);
      expect(result.role).toBe(inviteDto.role);
    });

    it('should accept team invitation', async () => {
      const token = 'valid_token_123';
      const user = {
        id: mockUser2Id,
        email: 'newmember@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(user);

      jest.spyOn(prismaService.teamInvitation, 'findUnique').mockResolvedValue({
        id: 'invite_1',
        teamId: mockTeamId,
        invitedEmail: user.email,
        role: TeamRole.EDITOR,
        invitedBy: mockUserId,
        token: token,
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Not expired
        message: 'Welcome!',
        acceptedAt: null,
        createdAt: new Date(),
      });

      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService, '$transaction').mockResolvedValue({
        id: 'member_2',
        teamId: mockTeamId,
        userId: mockUser2Id,
        role: TeamRole.EDITOR,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['content:create', 'content:update'],
      });

      const result = await teamsService.acceptInvitation(mockOrganizationId, token, mockUser2Id);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUser2Id);
      expect(result.role).toBe(TeamRole.EDITOR);
    });

    it('should remove member from team', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 2,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValueOnce({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.OWNER,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:manage_members'],
      }).mockResolvedValueOnce({
        id: 'member_2',
        teamId: mockTeamId,
        userId: mockUser2Id,
        role: TeamRole.EDITOR,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['content:create'],
      });

      jest.spyOn(prismaService, '$transaction').mockResolvedValue(undefined);

      await teamsService.removeMember(mockOrganizationId, mockTeamId, 'member_2', mockUserId);

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should update member role', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 2,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValueOnce({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.OWNER,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:manage_members'],
      }).mockResolvedValueOnce({
        id: 'member_2',
        teamId: mockTeamId,
        userId: mockUser2Id,
        role: TeamRole.EDITOR,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['content:create'],
      });

      jest.spyOn(prismaService.teamMember, 'update').mockResolvedValue({
        id: 'member_2',
        teamId: mockTeamId,
        userId: mockUser2Id,
        role: TeamRole.ADMIN,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:manage_members', 'team:update'],
      });

      const result = await teamsService.updateMemberRole(
        mockOrganizationId,
        mockTeamId,
        'member_2',
        mockUserId,
        { role: TeamRole.ADMIN },
      );

      expect(result.role).toBe(TeamRole.ADMIN);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should deny non-OWNER/ADMIN from updating team', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 2,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_3',
        teamId: mockTeamId,
        userId: mockUser2Id,
        role: TeamRole.VIEWER,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:read'],
      });

      const updateDto = {
        name: 'Updated Team',
        description: 'Updated',
        isPublic: true,
        requiresApproval: false,
        maxMembers: 100,
      };

      await expect(
        teamsService.updateTeam(mockOrganizationId, mockTeamId, mockUser2Id, updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow OWNER/ADMIN to manage team', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 1,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.ADMIN,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:read', 'team:update', 'team:manage_members'],
      });

      // Admin should be able to get their team role
      const member = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId: mockTeamId,
            userId: mockUserId,
          },
        },
      });

      expect(member.role).toBe(TeamRole.ADMIN);
    });
  });

  describe('Approval Workflows', () => {
    it('should create approval workflow', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 2,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_1',
        teamId: mockTeamId,
        userId: mockUserId,
        role: TeamRole.ADMIN,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['team:manage_workflows'],
      });

      jest.spyOn(prismaService.teamWorkflow, 'create').mockResolvedValue({
        id: 'workflow_1',
        teamId: mockTeamId,
        name: 'Content Review',
        description: 'Review all content before publishing',
        requiredApprovals: 2,
        requiresApprovals: true,
        allowRejectReason: true,
        applicableContentTypes: ['video', 'post'],
        triggerConfig: null,
        notificationConfig: null,
        isActive: true,
        totalSubmissions: 0,
        approvedCount: 0,
        rejectedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createWorkflowDto = {
        name: 'Content Review',
        description: 'Review all content before publishing',
        requiredApprovals: 2,
        requiresApprovals: true,
        allowRejectReason: true,
        applicableContentTypes: ['video', 'post'],
      };

      const result = await teamsService.createWorkflow(
        mockOrganizationId,
        mockTeamId,
        mockUserId,
        createWorkflowDto,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(createWorkflowDto.name);
      expect(result.requiredApprovals).toBe(2);
    });

    it('should submit content for approval', async () => {
      jest.spyOn(prismaService.team, 'findUnique').mockResolvedValue({
        id: mockTeamId,
        organizationId: mockOrganizationId,
        name: 'Content Team',
        slug: 'content-team',
        description: 'Team description',
        isPublic: false,
        requiresApproval: true,
        maxMembers: 50,
        memberCount: 2,
        createdById: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        archivedAt: null,
      });

      jest.spyOn(prismaService.teamMember, 'findUnique').mockResolvedValue({
        id: 'member_2',
        teamId: mockTeamId,
        userId: mockUser2Id,
        role: TeamRole.CONTRIBUTOR,
        joinedAt: new Date(),
        lastActivityAt: new Date(),
        permissions: ['approval:submit'],
      });

      jest.spyOn(prismaService.teamWorkflow, 'findUnique').mockResolvedValue({
        id: 'workflow_1',
        teamId: mockTeamId,
        name: 'Content Review',
        description: 'Review all content before publishing',
        requiredApprovals: 2,
        requiresApprovals: true,
        allowRejectReason: true,
        applicableContentTypes: ['video'],
        triggerConfig: null,
        notificationConfig: null,
        isActive: true,
        totalSubmissions: 1,
        approvedCount: 0,
        rejectedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(prismaService, '$transaction').mockResolvedValue({
        id: 'approval_1',
        workflowId: 'workflow_1',
        contentId: 'content_123',
        contentType: 'video',
        submittedById: mockUser2Id,
        status: 'PENDING',
        comments: 'Please review',
        requiredApprovals: 2,
        receivedApprovals: 0,
        version: 1,
        contentSnapshot: { title: 'New Video', description: 'Description' },
        submittedAt: new Date(),
        dueAt: null,
        approvedAt: null,
        rejectedAt: null,
        updatedAt: new Date(),
      });

      const submitDto = {
        contentId: 'content_123',
        contentType: 'video',
        comments: 'Please review',
        version: 1,
        contentSnapshot: { title: 'New Video', description: 'Description' },
      };

      const result = await teamsService.submitForApproval(
        mockOrganizationId,
        mockTeamId,
        mockUser2Id,
        submitDto,
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('PENDING');
      expect(result.requiredApprovals).toBe(2);
    });
  });
});
