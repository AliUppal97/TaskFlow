# Testing Guide

This comprehensive guide covers all aspects of testing in TaskFlow, including unit tests, integration tests, end-to-end tests, and testing best practices.

## Table of Contents

- [Testing Overview](#testing-overview)
- [Testing Strategy](#testing-strategy)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Test Environments](#test-environments)
- [Test Data Management](#test-data-management)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Continuous Integration](#continuous-integration)
- [Test Coverage](#test-coverage)
- [Debugging Tests](#debugging-tests)
- [Best Practices](#best-practices)

## Testing Overview

### Testing Pyramid

TaskFlow follows a balanced testing pyramid approach:

```
End-to-End Tests (10-20%)
    │
    ├── Integration Tests (20-30%)
    │
    └── Unit Tests (50-70%)
```

### Test Categories

- **Unit Tests**: Test individual functions, classes, and modules in isolation
- **Integration Tests**: Test interactions between components and external services
- **End-to-End Tests**: Test complete user workflows from frontend to backend
- **Performance Tests**: Validate system performance under load
- **Security Tests**: Ensure application security and data protection

## Testing Strategy

### Testing Principles

1. **Test First**: Write tests before implementing features (TDD/BDD)
2. **Fast Feedback**: Tests should run quickly to provide immediate feedback
3. **Isolation**: Tests should not depend on external systems or each other
4. **Maintainability**: Tests should be easy to understand and maintain
5. **Coverage**: Aim for comprehensive coverage of business logic

### Test-Driven Development (TDD)

```typescript
// Example TDD workflow for a new feature

// 1. Write failing test first
describe('TaskService', () => {
  it('should create a task with valid data', async () => {
    const taskData = { title: 'Test Task', description: 'Test Description' };
    const user = { id: 'user-1', email: 'user@test.com' };

    const result = await taskService.create(taskData, user);

    expect(result.title).toBe(taskData.title);
    expect(result.creatorId).toBe(user.id);
  });
});

// 2. Implement minimal code to pass test
async create(taskData: CreateTaskDto, user: User): Promise<Task> {
  const task = this.taskRepository.create({
    ...taskData,
    creatorId: user.id,
  });
  return this.taskRepository.save(task);
}

// 3. Refactor while keeping tests passing
// 4. Repeat for edge cases and error conditions
```

## Unit Testing

### Backend Unit Testing

#### Setting Up Tests

```typescript
// task.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';

describe('TaskService', () => {
  let service: TaskService;
  let mockRepository: MockType<Repository<Task>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useFactory: jest.fn(() => ({
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          })),
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    mockRepository = module.get(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

#### Testing Service Methods

```typescript
describe('create', () => {
  it('should create a task successfully', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      priority: TaskPriority.MEDIUM,
    };
    const user = { id: 'user-1', email: 'user@test.com' } as User;
    const savedTask = { id: 'task-1', ...taskData, creatorId: user.id } as Task;

    mockRepository.create.mockReturnValue(savedTask);
    mockRepository.save.mockResolvedValue(savedTask);

    const result = await service.create(taskData, user);

    expect(mockRepository.create).toHaveBeenCalledWith({
      ...taskData,
      creatorId: user.id,
    });
    expect(mockRepository.save).toHaveBeenCalledWith(savedTask);
    expect(result).toBe(savedTask);
  });

  it('should throw error for invalid data', async () => {
    const invalidData = { title: '', description: 'Test' };
    const user = { id: 'user-1' } as User;

    await expect(service.create(invalidData, user)).rejects.toThrow(BadRequestException);
  });
});
```

#### Testing Guards and Interceptors

```typescript
// jwt-auth.guard.spec.ts
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(() => {
    const mockJwtService = {
      verify: jest.fn(),
    };
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    guard = new JwtAuthGuard(mockJwtService as any, mockReflector as any);
    jwtService = mockJwtService as any;
    reflector = mockReflector as any;
  });

  it('should allow access with valid token', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' },
    };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    };

    jwtService.verify.mockReturnValue({ sub: 'user-1', email: 'user@test.com' });

    const result = await guard.canActivate(mockContext as any);

    expect(result).toBe(true);
    expect(mockRequest['user']).toBeDefined();
  });

  it('should deny access without token', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    };

    await expect(guard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
  });
});
```

### Frontend Unit Testing

#### React Component Testing

```tsx
// TaskList.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskList from './TaskList';
import { Task } from '@/types/api';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    creatorId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    dueDate: null,
    version: 1,
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock API calls
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('TaskList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<TaskList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders tasks when data is loaded', async () => {
    const mockApiClient = require('@/lib/api-client').apiClient;
    mockApiClient.get.mockResolvedValue({ data: mockTasks, pagination: {} });

    render(<TaskList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  it('handles task status change', async () => {
    const mockApiClient = require('@/lib/api-client').apiClient;
    mockApiClient.get.mockResolvedValue({ data: mockTasks, pagination: {} });
    mockApiClient.patch.mockResolvedValue({ ...mockTasks[0], status: 'in_progress' });

    render(<TaskList />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('todo');
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalledWith('/tasks/1', {
        status: 'in_progress',
      });
    });
  });
});
```

#### Custom Hook Testing

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return initial auth state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should login user successfully', async () => {
    const mockUser = { id: '1', email: 'user@test.com' };
    const mockLoginResponse = { accessToken: 'token', user: mockUser };

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockLoginResponse),
      } as Response)
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.login('user@test.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });
});
```

## Integration Testing

### Database Integration Tests

```typescript
// task.repository.integration.spec.ts
describe('TaskRepository (Integration)', () => {
  let dataSource: DataSource;
  let taskRepository: Repository<Task>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.TEST_DATABASE_PORT) || 5433,
      username: process.env.TEST_DATABASE_USERNAME || 'postgres',
      password: process.env.TEST_DATABASE_PASSWORD || 'password',
      database: process.env.TEST_DATABASE_NAME || 'taskflow_test',
      entities: [User, Task],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();
    taskRepository = dataSource.getRepository(Task);
    userRepository = dataSource.getRepository(User);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await taskRepository.clear();
    await userRepository.clear();
  });

  describe('CRUD operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await userRepository.save({
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: UserRole.USER,
      });
    });

    it('should create and retrieve a task', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Testing database integration',
        priority: TaskPriority.HIGH,
        creatorId: testUser.id,
      };

      const savedTask = await taskRepository.save(taskData);
      expect(savedTask.id).toBeDefined();
      expect(savedTask.title).toBe(taskData.title);

      const retrievedTask = await taskRepository.findOne({
        where: { id: savedTask.id },
      });
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask!.title).toBe(taskData.title);
    });

    it('should handle relationships correctly', async () => {
      const task = await taskRepository.save({
        title: 'Relationship Test',
        description: 'Testing foreign keys',
        creatorId: testUser.id,
      });

      const taskWithCreator = await taskRepository.findOne({
        where: { id: task.id },
        relations: ['creator'],
      });

      expect(taskWithCreator!.creator.id).toBe(testUser.id);
      expect(taskWithCreator!.creator.email).toBe(testUser.email);
    });
  });
});
```

### API Integration Tests

```typescript
// auth.controller.integration.spec.ts
describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          envFilePath: ['.env.test'],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DATABASE_HOST,
          port: parseInt(process.env.TEST_DATABASE_PORT),
          username: process.env.TEST_DATABASE_USERNAME,
          password: process.env.TEST_DATABASE_PASSWORD,
          database: process.env.TEST_DATABASE_NAME,
          entities: [User],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());

    dataSource = moduleFixture.get(DataSource);
    authService = moduleFixture.get(AuthService);

    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean database
    await dataSource.getRepository(User).clear();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.email).toBe(registerData.email);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate email', async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password456',
          firstName: 'Test2',
          lastName: 'User2',
        })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });
  });
});
```

### Cache Integration Tests

```typescript
// cache.integration.spec.ts
describe('Cache Integration', () => {
  let cacheService: CacheService;
  let redisClient: Redis;

  beforeAll(async () => {
    // Setup Redis test client
    redisClient = new Redis({
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: parseInt(process.env.TEST_REDIS_PORT) || 6380,
    });

    cacheService = new CacheService(redisClient);
  });

  afterAll(async () => {
    await redisClient.quit();
  });

  beforeEach(async () => {
    await redisClient.flushdb();
  });

  describe('User Profile Caching', () => {
    it('should cache user profile', async () => {
      const userId = 'user-123';
      const userProfile = {
        id: userId,
        email: 'user@example.com',
        profile: { firstName: 'John', lastName: 'Doe' },
      };

      // Cache user profile
      await cacheService.setUserProfile(userId, userProfile);

      // Retrieve from cache
      const cachedProfile = await cacheService.getUserProfile(userId);

      expect(cachedProfile).toEqual(userProfile);
    });

    it('should handle cache misses', async () => {
      const cachedProfile = await cacheService.getUserProfile('nonexistent-user');

      expect(cachedProfile).toBeNull();
    });

    it('should respect TTL', async () => {
      const userId = 'user-123';
      const userProfile = { id: userId, email: 'user@example.com' };

      // Cache with short TTL
      await cacheService.setUserProfile(userId, userProfile, 1); // 1 second

      // Should be available immediately
      let cachedProfile = await cacheService.getUserProfile(userId);
      expect(cachedProfile).toEqual(userProfile);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should be expired
      cachedProfile = await cacheService.getUserProfile(userId);
      expect(cachedProfile).toBeNull();
    });
  });
});
```

## End-to-End Testing

### E2E Test Setup

```typescript
// test/app.e2e-spec.ts
describe('TaskFlow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let testUser: User;
  let testTask: Task;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    dataSource = moduleFixture.get(DataSource);

    await app.init();

    // Seed test data
    const userRepository = dataSource.getRepository(User);
    const taskRepository = dataSource.getRepository(Task);

    testUser = await userRepository.save({
      email: 'e2e-test@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: UserRole.USER,
    });

    testTask = await taskRepository.save({
      title: 'E2E Test Task',
      description: 'Task for e2e testing',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      creatorId: testUser.id,
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      // Register new user
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'e2e-user@example.com',
          password: 'password123',
          firstName: 'E2E',
          lastName: 'User',
        })
        .expect(201);

      expect(registerResponse.body.id).toBeDefined();

      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e-user@example.com',
          password: 'password123',
        })
        .expect(200);

      jwtToken = loginResponse.body.accessToken;
      expect(jwtToken).toBeDefined();

      // Access protected route
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(profileResponse.body.email).toBe('e2e-user@example.com');
    });
  });

  describe('Task Management Flow', () => {
    beforeAll(async () => {
      // Get JWT token for test user
      const authService = app.get(AuthService);
      const tokens = await authService.login({
        email: 'e2e-test@example.com',
        password: 'password123',
      });
      jwtToken = tokens.accessToken;
    });

    it('should create, update, and delete a task', async () => {
      // Create task
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: 'E2E Created Task',
          description: 'Task created during e2e test',
          priority: 'high',
        })
        .expect(201);

      const taskId = createResponse.body.id;
      expect(taskId).toBeDefined();

      // Get task
      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(getResponse.body.title).toBe('E2E Created Task');

      // Update task
      const updateResponse = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          status: 'in_progress',
          description: 'Updated description',
        })
        .expect(200);

      expect(updateResponse.body.status).toBe('in_progress');
      expect(updateResponse.body.description).toBe('Updated description');

      // Delete task
      await request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(204);

      // Verify task is deleted
      await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });

    it('should handle task listing and filtering', async () => {
      // Create multiple tasks
      const tasks = [
        { title: 'Task 1', status: 'todo', priority: 'low' },
        { title: 'Task 2', status: 'in_progress', priority: 'medium' },
        { title: 'Task 3', status: 'done', priority: 'high' },
      ];

      for (const taskData of tasks) {
        await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${jwtToken}`)
          .send(taskData);
      }

      // Test filtering
      const todoResponse = await request(app.getHttpServer())
        .get('/tasks?status=todo')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(todoResponse.body.data.length).toBeGreaterThanOrEqual(1);
      todoResponse.body.data.forEach((task: any) => {
        expect(task.status).toBe('todo');
      });

      // Test pagination
      const paginatedResponse = await request(app.getHttpServer())
        .get('/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(paginatedResponse.body.data.length).toBeLessThanOrEqual(2);
      expect(paginatedResponse.body.pagination).toBeDefined();
    });
  });
});
```

### Frontend E2E Testing

```typescript
// e2e/task-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
  });

  test('should create a new task', async ({ page }) => {
    // Navigate to tasks page
    await page.goto('/tasks');

    // Click create task button
    await page.click('[data-testid="create-task-button"]');

    // Fill task form
    await page.fill('[data-testid="task-title-input"]', 'E2E Test Task');
    await page.fill('[data-testid="task-description-input"]', 'Created by Playwright');
    await page.selectOption('[data-testid="task-priority-select"]', 'high');

    // Submit form
    await page.click('[data-testid="submit-task-button"]');

    // Verify task appears in list
    await expect(page.locator('[data-testid="task-list"]')).toContainText('E2E Test Task');
  });

  test('should update task status', async ({ page }) => {
    await page.goto('/tasks');

    // Find first task
    const firstTask = page.locator('[data-testid="task-item"]').first();

    // Change status to in_progress
    await firstTask.locator('[data-testid="task-status-select"]').selectOption('in_progress');

    // Verify status changed
    await expect(firstTask.locator('[data-testid="task-status"]')).toHaveText('In Progress');
  });

  test('should delete a task', async ({ page }) => {
    await page.goto('/tasks');

    // Find first task
    const firstTask = page.locator('[data-testid="task-item"]').first();
    const taskTitle = await firstTask.locator('[data-testid="task-title"]').textContent();

    // Click delete button
    await firstTask.locator('[data-testid="delete-task-button"]').click();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify task is removed
    await expect(page.locator('[data-testid="task-list"]')).not.toContainText(taskTitle || '');
  });
});
```

## Test Environments

### Local Test Environment

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: taskflow_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data

  mongodb-test:
    image: mongo:6-jammy
    ports:
      - "27018:27017"
    tmpfs:
      - /data/db

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    command: redis-server --appendonly no
```

### CI Test Environment

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      mongodb:
        image: mongo:6
        options: >-
          --health-cmd mongo --eval 'db.adminCommand("ping")'
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd redis-cli ping
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run backend tests
        run: npm run test:cov
        working-directory: backend

      - name: Run frontend tests
        run: npm run test:cov
        working-directory: frontend

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
```

## Test Data Management

### Test Data Factories

```typescript
// test/factories/user.factory.ts
import { User, UserRole } from '../../src/entities/user.entity';
import { faker } from '@faker-js/faker';

export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      passwordHash: faker.internet.password(),
      role: UserRole.USER,
      profile: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as User;
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}

// test/factories/task.factory.ts
import { Task, TaskStatus, TaskPriority } from '../../src/entities/task.entity';
import { faker } from '@faker-js/faker';

export class TaskFactory {
  static create(overrides: Partial<Task> = {}): Task {
    const createdAt = faker.date.past();
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(Object.values(TaskStatus)),
      priority: faker.helpers.arrayElement(Object.values(TaskPriority)),
      assigneeId: faker.string.uuid(),
      creatorId: faker.string.uuid(),
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
      completedAt: null,
      dueDate: faker.date.future(),
      deletedAt: null,
      version: 1,
      ...overrides,
    } as Task;
  }

  static createMany(count: number, overrides: Partial<Task> = {}): Task[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createOverdue(overrides: Partial<Task> = {}): Task {
    return this.create({
      dueDate: faker.date.past(),
      status: TaskStatus.TODO,
      ...overrides,
    });
  }

  static createCompleted(overrides: Partial<Task> = {}): Task {
    const completedAt = faker.date.past();
    return this.create({
      status: TaskStatus.DONE,
      completedAt,
      ...overrides,
    });
  }
}
```

### Database Seeding for Tests

```typescript
// test/seeders/test-database.seeder.ts
import { DataSource } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { Task } from '../../src/entities/task.entity';
import { UserFactory } from '../factories/user.factory';
import { TaskFactory } from '../factories/task.factory';

export class TestDatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seed(): Promise<{ users: User[]; tasks: Task[] }> {
    // Create users
    const users = UserFactory.createMany(5, {
      passwordHash: await bcrypt.hash('password123', 10),
    });

    await this.dataSource.getRepository(User).save(users);

    // Create tasks
    const tasks = [];
    for (const user of users) {
      const userTasks = TaskFactory.createMany(3, {
        creatorId: user.id,
        assigneeId: faker.helpers.arrayElement(users.map(u => u.id)),
      });
      tasks.push(...userTasks);
    }

    await this.dataSource.getRepository(Task).save(tasks);

    return { users, tasks };
  }

  async clear(): Promise<void> {
    await this.dataSource.getRepository(Task).clear();
    await this.dataSource.getRepository(User).clear();
  }
}
```

## Performance Testing

### Load Testing with Artillery

```yaml
# tests/performance/load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Load testing
    - duration: 60
      arrivalRate: 100
      name: Stress testing
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: 'User registration and task creation'
    weight: 30
    flow:
      - post:
          url: '/auth/register'
          json:
            email: 'user-{{ $randomInt }}@example.com'
            password: 'password123'
            firstName: 'Test'
            lastName: 'User'
      - post:
          url: '/auth/login'
          json:
            email: 'user-{{ $randomInt }}@example.com'
            password: 'password123'
          capture:
            json: '$.accessToken'
            as: 'token'
      - post:
          url: '/tasks'
          headers:
            Authorization: 'Bearer {{ token }}'
          json:
            title: 'Load test task {{ $randomInt }}'
            description: 'Performance testing task'
            priority: 'medium'

  - name: 'Task listing and filtering'
    weight: 40
    flow:
      - post:
          url: '/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
          capture:
            json: '$.accessToken'
            as: 'token'
      - get:
          url: '/tasks?page=1&limit=20'
          headers:
            Authorization: 'Bearer {{ token }}'

  - name: 'Task updates'
    weight: 30
    flow:
      - post:
          url: '/auth/login'
          json:
            email: 'test@example.com'
            password: 'password123'
          capture:
            json: '$.accessToken'
            as: 'token'
      - get:
          url: '/tasks?page=1&limit=1'
          headers:
            Authorization: 'Bearer {{ token }}'
          capture:
            json: '$.data[0].id'
            as: 'taskId'
      - patch:
          url: '/tasks/{{ taskId }}'
          headers:
            Authorization: 'Bearer {{ token }}'
          json:
            status: 'in_progress'
```

### Running Performance Tests

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery run tests/performance/load-test.yml

# Generate HTML report
artillery run --output report.json tests/performance/load-test.yml
artillery report report.json
```

### Performance Benchmarks

```typescript
// tests/performance/benchmarks.spec.ts
describe('Performance Benchmarks', () => {
  it('should handle task creation within time limits', async () => {
    const startTime = Date.now();

    const taskData = {
      title: 'Performance Test Task',
      description: 'Testing response time',
      priority: 'medium',
    };

    const response = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(taskData);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(201);
    expect(responseTime).toBeLessThan(500); // Should respond within 500ms
  });

  it('should handle concurrent task creation', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          title: `Concurrent Task ${i}`,
          description: 'Testing concurrency',
          priority: 'low',
        })
    );

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    const totalTime = endTime - startTime;

    responses.forEach(response => {
      expect(response.status).toBe(201);
    });

    // All requests should complete within 2 seconds
    expect(totalTime).toBeLessThan(2000);
  });
});
```

## Security Testing

### Authentication Testing

```typescript
// tests/security/auth.spec.ts
describe('Authentication Security', () => {
  it('should reject weak passwords', async () => {
    const weakPasswords = ['123', 'password', 'abc', ''];

    for (const password of weakPasswords) {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password,
          firstName: 'Test',
          lastName: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    }
  });

  it('should implement rate limiting', async () => {
    const requests = Array.from({ length: 15 }, () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
    );

    const responses = await Promise.all(requests);

    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    // Some requests should be rate limited
    expect(rateLimitedCount).toBeGreaterThan(0);
  });

  it('should not leak sensitive information', async () => {
    // Attempt SQL injection
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "' OR '1'='1",
        password: "' OR '1'='1",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
    expect(response.body).not.toHaveProperty('stack');
    expect(response.body).not.toHaveProperty('sql');
  });
});
```

### Authorization Testing

```typescript
// tests/security/authorization.spec.ts
describe('Authorization Security', () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;

  beforeAll(async () => {
    // Create test users and get tokens
    const users = await seedTestUsers();
    userToken = await getAuthToken(users.regularUser);
    adminToken = await getAuthToken(users.adminUser);
    otherUserToken = await getAuthToken(users.otherUser);
  });

  it('should prevent unauthorized task access', async () => {
    // Create task as regular user
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Private Task',
        description: 'Should not be accessible by others',
      });

    const taskId = createResponse.body.id;

    // Try to access as different user
    const accessResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    expect(accessResponse.status).toBe(403);
  });

  it('should allow admin access to all tasks', async () => {
    // Create task as regular user
    const createResponse = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Admin Access Test',
        description: 'Admin should be able to access',
      });

    const taskId = createResponse.body.id;

    // Access as admin
    const adminResponse = await request(app.getHttpServer())
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.id).toBe(taskId);
  });
});
```

## Continuous Integration

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd redis-cli ping
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run backend tests
        run: npm run test:cov -- --runInBand
        working-directory: backend

      - name: Run frontend tests
        run: npm run test:cov
        working-directory: frontend

      - name: Build backend
        run: npm run build
        working-directory: backend

      - name: Build frontend
        run: npm run build
        working-directory: frontend

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    needs: test

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres

      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: backend

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run security audit
        run: npm audit --audit-level high

      - name: Run SAST
        uses: github/super-linter/slim@v5
        env:
          DEFAULT_BRANCH: main
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Test Coverage

### Coverage Configuration

```json
// backend/jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Coverage Reports

```bash
# Generate coverage reports
npm run test:cov

# View HTML coverage report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm run test:cov -- --coverageThreshold='{"global":{"branches":80,"functions":90,"lines":85,"statements":85}}'
```

### Coverage Goals by Component

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| Entities | 100% | 100% | 100% | 100% |
| Services | 90% | 85% | 95% | 90% |
| Controllers | 95% | 90% | 100% | 95% |
| Guards | 95% | 90% | 100% | 95% |
| DTOs | 100% | 100% | 100% | 100% |
| Utils | 95% | 90% | 100% | 95% |

## Debugging Tests

### Common Debugging Techniques

```typescript
// Add debugging logs to tests
describe('Debugging Example', () => {
  it('should debug test execution', async () => {
    console.log('Starting test execution');

    const result = await someAsyncOperation();
    console.log('Operation result:', result);

    expect(result).toBeDefined();

    // Use debugger in Node.js
    debugger;

    expect(result.value).toBe('expected');
  });
});
```

### Test Debugging Tools

```typescript
// Custom test utilities for debugging
export class TestDebugger {
  static logContext(context: any, label = 'Context') {
    console.log(`\n=== ${label} ===`);
    console.dir(context, { depth: 3, colors: true });
    console.log('='.repeat(50));
  }

  static logDatabaseState(dataSource: DataSource) {
    // Log current database state for debugging
  }

  static logHttpRequest(request: any) {
    console.log('HTTP Request:', {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
    });
  }
}

// Usage in tests
it('should debug complex operation', async () => {
  TestDebugger.logContext({ userId, taskData }, 'Test Input');

  const result = await service.complexOperation(userId, taskData);

  TestDebugger.logContext(result, 'Operation Result');

  expect(result.success).toBe(true);
});
```

### Visual Debugging

```typescript
// Screenshot debugging for E2E tests
import { test, expect } from '@playwright/test';

test('debug with screenshots', async ({ page }) => {
  await page.goto('/login');

  // Take screenshot before action
  await page.screenshot({ path: 'before-login.png' });

  await page.fill('[data-testid="email-input"]', 'user@example.com');
  await page.fill('[data-testid="password-input"]', 'password');

  // Take screenshot after filling form
  await page.screenshot({ path: 'filled-form.png' });

  await page.click('[data-testid="login-button"]');

  // Take screenshot after login attempt
  await page.screenshot({ path: 'after-login.png' });

  await expect(page).toHaveURL('/dashboard');
});
```

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** - no shared state between tests
5. **Use beforeEach/afterEach** for setup and cleanup

### Test Quality

1. **Test behavior, not implementation**
2. **Avoid testing private methods** directly
3. **Use realistic test data**
4. **Test error conditions** and edge cases
5. **Keep tests fast** and reliable

### Maintenance

1. **Regular test maintenance** - update tests when code changes
2. **Remove obsolete tests** that no longer provide value
3. **Refactor tests** when they become hard to maintain
4. **Document complex test scenarios**
5. **Use test helpers** to reduce duplication

### Performance

1. **Run tests in parallel** when possible
2. **Use test doubles** (mocks, stubs) to avoid slow dependencies
3. **Cache expensive setup operations**
4. **Profile slow tests** and optimize them
5. **Use appropriate test timeouts**

This comprehensive testing guide ensures TaskFlow maintains high code quality, reliability, and performance through systematic testing practices.








