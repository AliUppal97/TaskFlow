import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiExtraModels,
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
}

