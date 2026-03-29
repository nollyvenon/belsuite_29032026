import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Param,
  Query,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UpdateUserDto } from './dto/user.dto';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /api/users/me
   * Get current user profile
   */
  @Get('me')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.getUserProfile(userId);
  }

  /**
   * PUT /api/users/me
   * Update current user profile
   */
  @Put('me')
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserProfile(userId, updateDto);
  }

  /**
   * GET /api/users/organizations
   * Get current user's organizations
   */
  @Get('organizations')
  async getOrganizations(@CurrentUser('sub') userId: string) {
    return this.usersService.getUserOrganizations(userId);
  }

  /**
   * GET /api/organizations/:organizationId/members
   * List members of organization
   */
  @Get(':organizationId/members')
  @UseGuards(TenantGuard)
  async getMembers(
    @Param('organizationId') organizationId: string,
    @CurrentUser('sub') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.usersService.getOrganizationMembers(
      organizationId,
      userId,
      page,
      limit,
    );
  }

  /**
   * DELETE /api/organizations/:organizationId/members/:targetUserId
   * Remove member from organization
   */
  @Delete(':organizationId/members/:targetUserId')
  @UseGuards(TenantGuard)
  @HttpCode(204)
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.removeOrganizationMember(
      organizationId,
      userId,
      targetUserId,
    );
  }
}
