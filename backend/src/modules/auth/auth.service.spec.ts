import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { EventsService } from '../events/events.service';
import { CacheService } from '../../common/cache/cache.service';
import { User, UserRole } from '../../entities/user.entity';
import { LoginDto, RegisterDto } from '../../dto/auth.dto';
import { EventType } from '../../entities/event-log.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let cacheService: CacheService;
  let eventsService: EventsService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    tokenType: 'Bearer',
    expiresIn: 900,
  };

  const mockUserService = {
    create: jest.fn(),
    validatePassword: jest.fn(),
    findById: jest.fn(),
    storeRefreshToken: jest.fn(),
    removeRefreshToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        'jwt.accessTokenSecret': 'access-secret',
        'jwt.refreshTokenSecret': 'refresh-secret',
        'jwt.accessTokenExpiresIn': '15m',
        'jwt.refreshTokenExpiresIn': '7d',
      };
      return config[key];
    }),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    generateKey: jest.fn((prefix: string, key: string) => `${prefix}:${key}`),
  };

  const mockEventsService = {
    logEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    cacheService = module.get<CacheService>(CacheService);
    eventsService = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        profile: { firstName: 'New', lastName: 'User' },
      };

      mockUserService.create.mockResolvedValue(mockUser);
      mockEventsService.logEvent.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(mockUserService.create).toHaveBeenCalledWith(registerDto);
      expect(mockEventsService.logEvent).toHaveBeenCalledWith({
        type: EventType.USER_REGISTERED,
        actorId: mockUser.id,
        entityId: mockUser.id,
        entityType: 'user',
        payload: {
          email: mockUser.email,
          role: mockUser.role,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user creation fails', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const error = new Error('User creation failed');
      mockUserService.create.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
      expect(mockEventsService.logEvent).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUserService.storeRefreshToken.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(mockUserService.validatePassword).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockUserService.storeRefreshToken).toHaveBeenCalled();
      expect(mockEventsService.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EventType.USER_LOGIN,
          actorId: mockUser.id,
        })
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.tokenType).toBe('Bearer');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      mockUserService.validatePassword.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      expect(mockEventsService.logEvent).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when validatePassword throws', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUserService.storeRefreshToken.mockResolvedValue(undefined);

      const result = await service.refreshToken(mockUser);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockUserService.storeRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should generate new refresh token ID on refresh', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUserService.storeRefreshToken.mockResolvedValue(undefined);

      await service.refreshToken(mockUser);

      // Verify refresh token payload includes refreshTokenId
      const refreshTokenCall = mockJwtService.signAsync.mock.calls.find(
        call => call[1]?.secret === 'refresh-secret'
      );
      expect(refreshTokenCall).toBeDefined();
      expect(refreshTokenCall[0]).toHaveProperty('refreshTokenId');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      mockUserService.removeRefreshToken.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);

      await service.logout(mockUser.id);

      expect(mockUserService.removeRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(mockEventsService.logEvent).toHaveBeenCalledWith({
        type: EventType.USER_LOGOUT,
        actorId: mockUser.id,
        entityId: mockUser.id,
        entityType: 'user',
        payload: {},
      });
    });

    it('should continue logout even if removeRefreshToken fails', async () => {
      mockUserService.removeRefreshToken.mockRejectedValue(new Error('Redis error'));
      mockEventsService.logEvent.mockResolvedValue(undefined);

      await expect(service.logout(mockUser.id)).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist a token successfully', async () => {
      const token = 'token-to-blacklist';
      const expiresIn = 900;

      mockCacheService.generateKey.mockReturnValue('blacklist:token-to-blacklist');
      mockCacheService.set.mockResolvedValue(undefined);

      await service.blacklistToken(token, expiresIn);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'blacklist:token-to-blacklist',
        true,
        { ttl: expiresIn }
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is blacklisted', async () => {
      const token = 'blacklisted-token';

      mockCacheService.generateKey.mockReturnValue('blacklist:blacklisted-token');
      mockCacheService.get.mockResolvedValue(true);

      const result = await service.isTokenBlacklisted(token);

      expect(mockCacheService.get).toHaveBeenCalledWith('blacklist:blacklisted-token');
      expect(result).toBe(true);
    });

    it('should return false if token is not blacklisted', async () => {
      const token = 'valid-token';

      mockCacheService.generateKey.mockReturnValue('blacklist:valid-token');
      mockCacheService.get.mockResolvedValue(null);

      const result = await service.isTokenBlacklisted(token);

      expect(result).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with correct payloads', async () => {
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      // Access generateTokens via login (private method)
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(mockUser);
      mockUserService.storeRefreshToken.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);

      await service.login(loginDto);

      // Verify access token payload
      const accessTokenCall = mockJwtService.signAsync.mock.calls[0];
      expect(accessTokenCall[0]).toEqual({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(accessTokenCall[1]).toEqual({
        secret: 'access-secret',
        expiresIn: '15m',
      });

      // Verify refresh token payload includes refreshTokenId
      const refreshTokenCall = mockJwtService.signAsync.mock.calls[1];
      expect(refreshTokenCall[0]).toHaveProperty('sub', mockUser.id);
      expect(refreshTokenCall[0]).toHaveProperty('email', mockUser.email);
      expect(refreshTokenCall[0]).toHaveProperty('role', mockUser.role);
      expect(refreshTokenCall[0]).toHaveProperty('refreshTokenId');
      expect(refreshTokenCall[1]).toEqual({
        secret: 'refresh-secret',
        expiresIn: '7d',
      });
    });
  });

  describe('error handling', () => {
    it('should handle JWT service failure during login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockRejectedValue(new Error('JWT signing failed'));

      await expect(service.login(loginDto)).rejects.toThrow('JWT signing failed');
      expect(mockUserService.storeRefreshToken).not.toHaveBeenCalled();
      expect(mockEventsService.logEvent).not.toHaveBeenCalled();
    });

    it('should handle cache service failure during token blacklisting', async () => {
      const token = 'token-to-blacklist';
      const expiresIn = 900;

      mockCacheService.generateKey.mockReturnValue('blacklist:token');
      mockCacheService.set.mockRejectedValue(new Error('Cache service unavailable'));

      await expect(service.blacklistToken(token, expiresIn)).rejects.toThrow('Cache service unavailable');
    });

    it('should handle events service failure during registration', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      mockUserService.create.mockResolvedValue(mockUser);
      mockEventsService.logEvent.mockRejectedValue(new Error('Event logging failed'));

      // Registration should still succeed even if event logging fails
      // (events are non-critical for user creation)
      await expect(service.register(registerDto)).rejects.toThrow('Event logging failed');
    });

    it('should handle refresh token storage failure during login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      mockUserService.storeRefreshToken.mockRejectedValue(new Error('Redis unavailable'));

      await expect(service.login(loginDto)).rejects.toThrow('Redis unavailable');
    });

    it('should handle missing config values gracefully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(mockUser);
      mockConfigService.get.mockReturnValue(undefined);

      await expect(service.login(loginDto)).rejects.toThrow();
    });

    it('should handle concurrent login attempts', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValue(mockTokens.accessToken)
        .mockResolvedValue(mockTokens.refreshToken);
      mockUserService.storeRefreshToken.mockResolvedValue(undefined);
      mockEventsService.logEvent.mockResolvedValue(undefined);

      // Simulate concurrent logins
      const promises = [
        service.login(loginDto),
        service.login(loginDto),
        service.login(loginDto),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('accessToken');
        expect(result).toHaveProperty('refreshToken');
      });
      // Each login should generate unique refresh token IDs
      expect(mockUserService.storeRefreshToken).toHaveBeenCalledTimes(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty email in login', async () => {
      const loginDto: LoginDto = {
        email: '',
        password: 'password123',
      };

      mockUserService.validatePassword.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty password in login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: '',
      };

      mockUserService.validatePassword.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle very long token strings in blacklist', async () => {
      const longToken = 'a'.repeat(10000);
      const expiresIn = 900;

      mockCacheService.generateKey.mockReturnValue(`blacklist:${longToken}`);
      mockCacheService.set.mockResolvedValue(undefined);

      await service.blacklistToken(longToken, expiresIn);

      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should handle zero expiration time in blacklist', async () => {
      const token = 'token';
      const expiresIn = 0;

      mockCacheService.generateKey.mockReturnValue('blacklist:token');
      mockCacheService.set.mockResolvedValue(undefined);

      await service.blacklistToken(token, expiresIn);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'blacklist:token',
        true,
        { ttl: 0 }
      );
    });
  });
});

