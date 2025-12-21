import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Response,
  Get,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';

import { AuthService } from './auth.service';
import { UserService } from './user.service';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  UserProfileDto,
} from '../../dto/auth.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../guards/jwt-refresh.guard';
import { User } from '../../entities/user.entity';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(LoggingInterceptor)
@ApiExtraModels(UserProfileDto)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<UserProfileDto> {
    const user = await this.authService.register(registerDto);
    // Remove password hash from response
    const { passwordHash, ...userProfile } = user;
    return userProfile as UserProfileDto;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const tokens = await this.authService.login(loginDto);

    // Set refresh token as HttpOnly cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only access token in response body
    const { refreshToken, ...responseTokens } = tokens;
    return responseTokens;
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const user = req.user;
    const tokens = await this.authService.refreshToken(user);

    // Update refresh token cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return only access token in response body
    const { refreshToken, ...responseTokens } = tokens;
    return responseTokens;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Request() req: RequestWithUser,
    @Response({ passthrough: true }) response: ExpressResponse,
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.authService.logout(userId);

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return { message: 'Logout successful' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  async getProfile(@Request() req: RequestWithUser): Promise<UserProfileDto> {
    const user = await this.userService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...userProfile } = user;
    return userProfile as UserProfileDto;
  }
}
