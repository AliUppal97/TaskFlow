import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { User, UserRole } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from '../../dto/auth.dto';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { EventsService } from '../events/events.service';
import { CacheService } from '../../common/cache/cache.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjQYMQdb8Ue', // 'password123'
    role: UserRole.USER,
    profile: { firstName: 'Test', lastName: 'User' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UserService,
        JwtStrategy,
        JwtRefreshStrategy,
        EventsService,
        CacheService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            })),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'jwt.accessTokenSecret': 'test-access-secret',
                'jwt.accessTokenExpiresIn': '15m',
                'jwt.refreshTokenSecret': 'test-refresh-secret',
                'jwt.refreshTokenExpiresIn': '7d',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            verify: jest.fn().mockReturnValue({
              sub: mockUser.id,
              email: mockUser.email,
              role: mockUser.role,
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Type-safe access to response body
      if (response && response.body && typeof response.body === 'object') {
        const body = response.body as { id?: string; email?: string; passwordHash?: string };
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('email', registerDto.email);
        expect(body).not.toHaveProperty('passwordHash');
      } else {
        throw new Error('Invalid response body');
      }
    });

    it('should return 409 if user already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should validate input data', async () => {
      const invalidRegisterDto = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidRegisterDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login user successfully', async () => {
      const loginDto: LoginDto = {
        email: mockUser.email,
        password: 'password123',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('mock-access-token');

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      // Type-safe access to response body
      if (response && response.body && typeof response.body === 'object') {
        const body = response.body as { accessToken?: string; tokenType?: string; expiresIn?: number };
        expect(body).toHaveProperty('accessToken');
        expect(body).toHaveProperty('tokenType', 'Bearer');
        expect(body).toHaveProperty('expiresIn');
      } else {
        throw new Error('Invalid response body');
      }
      if (response && response.headers && typeof response.headers === 'object' && 'set-cookie' in response.headers) {
        expect(response.headers['set-cookie']).toBeDefined();
      }
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: mockUser.email,
        password: 'wrong-password',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should return user profile when authenticated', async () => {
      const token = 'valid-jwt-token';
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Type-safe access to response body
      if (response && response.body && typeof response.body === 'object') {
        const body = response.body as { id?: string; email?: string; passwordHash?: string };
        expect(body).toHaveProperty('id', mockUser.id);
        expect(body).toHaveProperty('email', mockUser.email);
        expect(body).not.toHaveProperty('passwordHash');
      } else {
        throw new Error('Invalid response body');
      }
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user successfully', async () => {
      const token = 'valid-jwt-token';
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Type-safe access to response body
      if (response && response.body && typeof response.body === 'object') {
        const body = response.body as { message?: string };
        expect(body).toHaveProperty('message', 'Logout successful');
      } else {
        throw new Error('Invalid response body');
      }
    });
  });
});








