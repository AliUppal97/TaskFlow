# Contributing to TaskFlow

Welcome! We appreciate your interest in contributing to TaskFlow. This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- **Be respectful**: Treat all people with respect, regardless of background or identity
- **Be collaborative**: Work together to improve the project
- **Be patient**: Understand that everyone contributes at different levels
- **Be constructive**: Focus on what we can do better
- **Accept responsibility**: Take ownership of your contributions

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: 18+ (LTS recommended)
- **npm**: 8+ or **yarn**: 1.22+
- **Docker**: 20.10+ (for local development)
- **Docker Compose**: 2.0+ (for local development)
- **Git**: 2.30+

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   # Clone your fork
   git clone https://github.com/your-username/taskflow.git
   cd taskflow
   ```

2. **Setup Development Environment**
   ```bash
   # Install dependencies
   npm install

   # Copy environment template
   cp backend/env.template backend/.env

   # Start infrastructure (PostgreSQL, MongoDB, Redis)
   docker-compose up -d postgres mongodb redis

   # Run database migrations (if any)
   cd backend && npm run migration:run

   # Start development servers
   npm run dev
   ```

3. **Verify Setup**
   ```bash
   # Backend should be running on http://localhost:3001
   curl http://localhost:3001/health

   # Frontend should be running on http://localhost:3000
   curl http://localhost:3000
   ```

### Project Structure

```
taskflow/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   ├── entities/        # Database entities
│   │   ├── dto/            # Data transfer objects
│   │   ├── guards/         # Authentication/authorization guards
│   │   ├── interceptors/   # Request/response interceptors
│   │   ├── decorators/     # Custom decorators
│   │   └── common/         # Shared utilities
│   └── test/               # Backend tests
├── frontend/               # Next.js web application
│   ├── src/
│   │   ├── app/            # Next.js app router
│   │   ├── components/     # React components
│   │   ├── features/       # Feature-based organization
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
│   └── __tests__/          # Frontend tests
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── docker-compose.yml      # Local development setup
```

## Development Workflow

### Branching Strategy

We use a simplified Git Flow:

```
main (production-ready)
├── develop (latest development)
│   ├── feature/feature-name
│   ├── bugfix/bug-description
│   ├── hotfix/critical-fix
│   └── refactor/refactor-description
```

**Branch Naming Conventions:**
- `feature/description-of-feature`
- `bugfix/description-of-bug`
- `hotfix/critical-fix-description`
- `refactor/description-of-refactor`

### Development Process

1. **Choose an Issue**
   - Check [GitHub Issues](https://github.com/your-org/taskflow/issues) for open tasks
   - Comment on the issue to indicate you're working on it
   - Create a new branch from `develop`

2. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Write code following our [coding standards](#coding-standards)
   - Add tests for new functionality
   - Update documentation as needed
   - Commit regularly with clear messages

4. **Test Your Changes**
   ```bash
   # Run tests
   npm run test

   # Run linting
   npm run lint

   # Build the project
   npm run build
   ```

5. **Submit Pull Request**
   - Push your branch to GitHub
   - Create a pull request to merge into `develop`
   - Fill out the pull request template
   - Request review from maintainers

### Commit Guidelines

We follow [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add task priority levels
fix: resolve memory leak in WebSocket handler
docs: update API documentation for task endpoints
refactor: simplify authentication middleware
test: add unit tests for task validation
```

## Coding Standards

### TypeScript/JavaScript

#### General Rules
- Use TypeScript for all new code
- Enable strict mode in `tsconfig.json`
- Use meaningful variable and function names
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals instead of string concatenation

#### Code Style
```typescript
// ✅ Good
interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async createTask(data: CreateTaskDto, user: User): Promise<Task> {
    // Implementation
  }
}

// ❌ Bad
interface task {  // PascalCase for interfaces
  id:string;     // Space after colon
  title:string;
  status:taskStatus;
}

class taskService {  // PascalCase for classes
  constructor(taskRepository) {}  // Type annotations

  async createtask(data, user) {  // camelCase for methods
    // Implementation
  }
}
```

#### NestJS Specific
- Use dependency injection properly
- Follow module organization patterns
- Use guards, interceptors, and decorators appropriately
- Implement proper error handling with exceptions

#### React/Next.js Specific
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for component props
- Implement proper error boundaries
- Use React Query for server state management

### File Organization

#### Backend Structure
```
src/
├── modules/
│   └── feature/
│       ├── feature.controller.ts    # HTTP endpoints
│       ├── feature.service.ts       # Business logic
│       ├── feature.gateway.ts       # WebSocket handling (if needed)
│       ├── feature.module.ts        # Module definition
│       └── dto/                     # Data transfer objects
├── entities/                        # Database entities
├── dto/                            # Shared DTOs
├── guards/                         # Route guards
├── interceptors/                   # Request interceptors
├── decorators/                     # Custom decorators
└── common/                         # Shared utilities
```

#### Frontend Structure
```
src/
├── app/                            # Next.js app router
├── components/                     # Reusable components
│   ├── ui/                         # Base UI components
│   └── feature/                    # Feature-specific components
├── features/                       # Feature-based organization
├── hooks/                          # Custom hooks
├── lib/                            # Utilities and configurations
├── types/                          # TypeScript definitions
└── utils/                          # Helper functions
```

### Naming Conventions

#### Files and Directories
- Use kebab-case for file names: `task.service.ts`, `user-profile.component.tsx`
- Use PascalCase for class names: `TaskService`, `UserProfileComponent`
- Use camelCase for variables and functions: `getUserById`, `isTaskOverdue`

#### Database
- Use snake_case for table names: `user_profiles`, `task_assignments`
- Use snake_case for column names: `created_at`, `updated_at`
- Use singular nouns for table names: `user`, `task` (not `users`, `tasks`)

#### API Endpoints
- Use RESTful conventions: `GET /users`, `POST /users`, `GET /users/:id`
- Use plural nouns for resource names
- Use lowercase with hyphens: `/api/v1/user-profiles`

### Documentation

#### Code Comments
- Use JSDoc for public APIs
- Explain complex business logic
- Document function parameters and return types
- Keep comments up to date

```typescript
/**
 * Creates a new task with validation and authorization checks
 * @param createTaskDto - Task creation data
 * @param user - User creating the task
 * @returns Promise<Task> - Created task entity
 * @throws BadRequestException - If validation fails
 * @throws ForbiddenException - If user lacks permissions
 */
async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
  // Implementation
}
```

#### README Files
- Keep module READMEs updated
- Document setup and usage instructions
- Include code examples
- Update API documentation for changes

## Testing

### Testing Strategy

We follow a comprehensive testing approach:

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user workflows
4. **Performance Tests**: Validate system performance

### Test Structure

#### Backend Tests
```typescript
// task.service.spec.ts
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

  describe('create', () => {
    it('should create a task successfully', async () => {
      // Test implementation
    });

    it('should throw error for invalid data', async () => {
      // Test implementation
    });
  });
});
```

#### Frontend Tests
```typescript
// TaskList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TaskList from './TaskList';

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

describe('TaskList', () => {
  it('renders loading state initially', () => {
    render(<TaskList />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders tasks when data is loaded', async () => {
    // Mock API and test implementation
  });
});
```

### Running Tests

```bash
# Backend tests
cd backend

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm run test task.service.spec.ts

# Run e2e tests
npm run test:e2e

# Frontend tests
cd frontend

# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Requirements

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

## Submitting Changes

### Pull Request Process

1. **Prepare Your Branch**
   ```bash
   # Ensure you're up to date
   git checkout develop
   git pull origin develop

   # Rebase your feature branch
   git checkout feature/your-feature
   git rebase develop

   # Resolve any conflicts
   # Test that everything still works
   ```

2. **Create Pull Request**
   - Go to GitHub and create a new pull request
   - Base branch: `develop`
   - Compare branch: `feature/your-feature`
   - Fill out the pull request template

3. **Pull Request Template**
   ```markdown
   ## Description
   Brief description of the changes

   ## Type of Change
   - [ ] Bug fix (non-breaking change)
   - [ ] New feature (non-breaking change)
   - [ ] Breaking change
   - [ ] Documentation update
   - [ ] Refactoring

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] E2E tests added/updated
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows project standards
   - [ ] Tests pass locally
   - [ ] Documentation updated
   - [ ] No breaking changes
   - [ ] Ready for review

   ## Screenshots (if applicable)
   Add screenshots for UI changes

   Closes #123
   ```

4. **Code Review Process**
   - Maintainers will review your PR
   - Address any feedback or requested changes
   - Once approved, your PR will be merged
   - Delete your feature branch after merge

### Review Guidelines

#### For Reviewers
- Check that code follows project standards
- Verify tests are adequate and passing
- Ensure documentation is updated
- Test the changes manually if needed
- Provide constructive feedback

#### For Contributors
- Be open to feedback and suggestions
- Explain your design decisions when asked
- Make requested changes promptly
- Keep conversations professional and focused

## Documentation

### Types of Documentation

1. **Code Documentation**: JSDoc comments, README files
2. **API Documentation**: Swagger/OpenAPI specs
3. **User Documentation**: Guides, tutorials
4. **Architecture Documentation**: System design, data flow

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Keep documentation up to date
- Use consistent formatting
- Include screenshots for UI features

### Updating Documentation

When making changes:

1. Update relevant README files
2. Update API documentation if endpoints change
3. Update swagger specs for new/updated endpoints
4. Add migration guides for breaking changes

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear title**: Summarize the issue
- **Steps to reproduce**: Detailed reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable
- **Error messages**: Full error output

**Bug Report Template:**
```markdown
## Bug Report

**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Node.js: [e.g., 18.0.0]

**Additional Context:**
Add any other context about the problem
```

### Feature Requests

For new features, please include:

- **Clear title**: Feature name or brief description
- **Problem**: What problem does this solve?
- **Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Additional context**: Screenshots, mockups, etc.

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussions and questions
- **Pull Request Comments**: Code review discussions

### Getting Help

If you need help:

1. Check existing documentation
2. Search existing issues and discussions
3. Create a new issue with detailed information
4. Join community discussions

### Recognition

Contributors are recognized through:

- GitHub contributor statistics
- Mention in release notes
- Attribution in documentation
- Community recognition posts

### Code of Conduct Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project maintainers. All complaints will be reviewed and investigated and will result in a response that is deemed necessary and appropriate to the circumstances.

## License

By contributing to TaskFlow, you agree that your contributions will be licensed under the same license as the project (MIT License).

Thank you for contributing to TaskFlow! Your efforts help make this project better for everyone.



