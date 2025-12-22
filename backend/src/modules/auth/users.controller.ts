import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiExtraModels,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { JwtPermissionsGuard } from '../../guards/jwt-permissions.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Permission, RequirePermissions } from '../../decorators/permissions.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import {
  UserQueryDto,
  UserProfileDto,
  UserListResponseDto,
  UpdateUserRoleDto,
} from '../../dto/auth.dto';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { User } from '../../entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtPermissionsGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@RequirePermissions(Permission.USER_READ)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
@ApiExtraModels(UserListResponseDto, UserProfileDto)
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiQuery({ type: UserQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
  })
  async findAll(
    @Query() query: UserQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<UserListResponseDto> {
    const { page = 1, limit = 10, role } = query;

    const result = await this.userService.findAll({
      page,
      limit,
      role,
    });

    // Transform users to remove password hash
    const users = result.users.map(user => {
      const { passwordHash, ...userProfile } = user;
      return userProfile as UserProfileDto;
    });

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Patch(':id/role')
  @RequirePermissions(Permission.USER_MANAGE_ROLES)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid role or cannot change own role' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Request() req: RequestWithUser,
  ): Promise<UserProfileDto> {
    // Prevent users from changing their own role
    if (req.user.id === userId) {
      throw new Error('Cannot change your own role');
    }

    const updatedUser = await this.userService.updateUserRole(userId, updateRoleDto.role);

    // Remove password hash from response
    const { passwordHash, ...userProfile } = updatedUser;
    return userProfile as UserProfileDto;
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.USER_UPDATE)
  @ApiOperation({ summary: 'Update user status (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ schema: { type: 'object', properties: { isActive: { type: 'boolean' } } } })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateUserStatus(
    @Param('id') userId: string,
    @Body() body: { isActive: boolean },
    @Request() req: RequestWithUser,
  ): Promise<UserProfileDto> {
    // Prevent users from deactivating themselves
    if (req.user.id === userId && !body.isActive) {
      throw new Error('Cannot deactivate your own account');
    }

    const updatedUser = await this.userService.updateUserStatus(userId, body.isActive);

    // Remove password hash from response
    const { passwordHash, ...userProfile } = updatedUser;
    return userProfile as UserProfileDto;
  }
}

