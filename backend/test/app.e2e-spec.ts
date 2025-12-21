import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import redisStore from 'cache-manager-ioredis';

import { AppModule } from './../src/app.module';
import { User, UserRole } from '../src/entities/user.entity';
import { Task, TaskStatus, TaskPriority } from '../src/entities/task.entity';
import { getDatabaseConfig } from '../src/config/database.config';
import { getMongoConfig } from '../src/config/mongodb.config';
import { getRedisConfig } from '../src/config/redis.config';
import configuration from '../src/config/configuration';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from '../src/common/interceptors/request-logging.interceptor';
import { TimeoutInterceptor } from '../src/common/interceptors/timeout.interceptor';

describe('App (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as the main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          const messages = errors.map(error => {
            const constraints = error.constraints;
            return constraints ? Object.values(constraints)[0] : 'Validation error';
          });
          return new Error(messages.join(', '));
        },
      }),
    );

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(
      new RequestLoggingInterceptor(),
      new TimeoutInterceptor()
    );

    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');

    // Swagger setup
    const config = new DocumentBuilder()
      .setTitle('TaskFlow API')
      .setDescription('Real-time collaborative task management system API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('version');
        });
    });

    it('/ping (GET) - should return pong', () => {
      return request(app.getHttpServer())
        .get('/ping')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'pong');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('POST /auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('role', UserRole.USER);
          expect(res.body).toHaveProperty('profile');
          expect(res.body.profile).toHaveProperty('firstName', testUser.firstName);
          expect(res.body.profile).toHaveProperty('lastName', testUser.lastName);
          expect(res.body).not.toHaveProperty('passwordHash');

          userId = res.body.id;
        });
    });

    it('POST /auth/login - should login user and return tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('tokenType', 'Bearer');
          expect(res.body).toHaveProperty('expiresIn');
          expect(res.headers['set-cookie']).toBeDefined();

          accessToken = res.body.accessToken;

          // Extract refresh token from cookies
          const cookies = res.headers['set-cookie'];
          const refreshTokenCookie = cookies.find(cookie => cookie.startsWith('refreshToken='));
          expect(refreshTokenCookie).toBeDefined();
        });
    });

    it('GET /auth/profile - should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('role', UserRole.USER);
          expect(res.body).toHaveProperty('profile');
        });
    });

    it('POST /auth/logout - should logout user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Logout successful');
        });
    });
  });

  describe('Task Management (Authenticated)', () => {
    const testUser = {
      email: `task-test-${Date.now()}@example.com`,
      password: 'TestPass123!',
    };

    const testTask = {
      title: 'Integration Test Task',
      description: 'This is a test task created during E2E testing',
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    beforeAll(async () => {
      // Register and login to get access token
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(testUser);

      accessToken = loginResponse.body.accessToken;
      userId = loginResponse.body.id;
    });

    it('POST /tasks - should create a new task', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testTask)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', testTask.title);
          expect(res.body).toHaveProperty('description', testTask.description);
          expect(res.body).toHaveProperty('status', TaskStatus.TODO);
          expect(res.body).toHaveProperty('priority', testTask.priority);
          expect(res.body).toHaveProperty('creatorId', userId);
          expect(res.body).toHaveProperty('version', 1);
          expect(res.body).toHaveProperty('isOverdue', false);

          taskId = res.body.id;
        });
    });

    it('GET /tasks - should return user tasks with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(res.body.pagination).toHaveProperty('page', 1);
          expect(res.body.pagination).toHaveProperty('limit', 10);
          expect(res.body.pagination).toHaveProperty('total');
          expect(res.body.pagination).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('GET /tasks/:id - should return specific task', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', taskId);
          expect(res.body).toHaveProperty('title', testTask.title);
          expect(res.body).toHaveProperty('creator');
          expect(res.body.creator).toHaveProperty('id', userId);
        });
    });

    it('PATCH /tasks/:id - should update task', () => {
      const updateData = {
        title: 'Updated Integration Test Task',
        status: TaskStatus.IN_PROGRESS,
        version: 1,
      };

      return request(app.getHttpServer())
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', taskId);
          expect(res.body).toHaveProperty('title', updateData.title);
          expect(res.body).toHaveProperty('status', updateData.status);
          expect(res.body).toHaveProperty('version', 2);
        });
    });

    it('GET /tasks/stats - should return task statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('byStatus');
          expect(res.body).toHaveProperty('byPriority');
          expect(res.body).toHaveProperty('overdue');
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.overdue).toBe('number');
        });
    });

    it('DELETE /tasks/:id - should delete task', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('GET /tasks/:id - should return 404 for deleted task', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', false);
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code');
          expect(res.body.error).toHaveProperty('message');
        });
    });

    it('should handle unauthorized access', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(401);
    });

    it('should handle not found resources', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle too many requests gracefully', async () => {
      const requests = Array(15).fill().map(() =>
        request(app.getHttpServer())
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const responses = await Promise.allSettled(requests);

      // At least some requests should succeed, and some might be rate limited
      const successfulRequests = responses.filter(
        (result) => result.status === 'fulfilled' &&
        (result.value.status === 200 || result.value.status === 429)
      );

      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });
});