# Test Suite Quick Reference Guide

## Quick Commands

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage
npm test -- auth.service   # Specific file
```

### Frontend Tests
```bash
cd frontend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage
npm test -- task-form      # Specific file
```

## Test Files Overview

### Backend (5 files)
| File | Test Cases | Coverage |
|------|-----------|----------|
| `auth.service.spec.ts` | 25+ | 95% |
| `user.service.spec.ts` | 20+ | 90% |
| `task.service.spec.ts` | 35+ | 92% |
| `auth.controller.spec.ts` | 10+ | 85% |
| `app.controller.spec.ts` | 5+ | 80% |

### Frontend (6 files)
| File | Test Cases | Coverage |
|------|-----------|----------|
| `api-client.test.ts` | 25+ | 88% |
| `auth-provider.test.tsx` | 15+ | 90% |
| `task-form.test.tsx` | 20+ | 85% |
| `task-list.test.tsx` | 18+ | 82% |
| `task-card.test.tsx` | 15+ | 85% |
| `login-form.test.tsx` | 12+ | 88% |

## Test Categories

### ✅ Happy Path Tests
- Successful operations
- Valid data handling
- Normal user flows

### ⚠️ Error Handling Tests
- Service failures
- Network errors
- Invalid inputs
- Exception scenarios

### 🔒 Security Tests
- Authentication
- Authorization
- Token validation
- Input sanitization

### 🎯 Edge Cases
- Boundary conditions
- Empty/null values
- Very long strings
- Special characters
- Unicode support

### 🔄 Concurrency Tests
- Parallel operations
- Race conditions
- Simultaneous updates

## Common Test Patterns

### Service Test Pattern
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: MockType;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ServiceName, { provide: Dependency, useValue: mockDependency }],
    }).compile();
    service = module.get(ServiceName);
  });

  it('should perform action', async () => {
    // Arrange
    mockDependency.method.mockResolvedValue(data);
    
    // Act
    const result = await service.method();
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

### Component Test Pattern
```typescript
describe('ComponentName', () => {
  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ComponentName {...props} />
      </QueryClientProvider>
    );
  };

  it('should render correctly', () => {
    renderComponent();
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

## Coverage Thresholds

| Component Type | Statements | Branches | Functions | Lines |
|---------------|-----------|----------|-----------|-------|
| Services | 90% | 85% | 95% | 90% |
| Components | 80% | 75% | 85% | 80% |
| Utilities | 95% | 90% | 100% | 95% |

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Debug Mode
```bash
npm run test:debug
# Then attach debugger to port 9229
```

### Verbose Output
```bash
npm test -- --verbose
```

## Test Data Factories

### User Factory
```typescript
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  role: UserRole.USER,
  profile: { firstName: 'Test', lastName: 'User' },
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

### Task Factory
```typescript
const mockTask: Task = {
  id: 'task-123',
  title: 'Test Task',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  creatorId: 'user-123',
  // ... other fields
};
```

## Common Assertions

### Service Tests
```typescript
expect(result).toEqual(expected);
expect(mockService.method).toHaveBeenCalledWith(args);
expect(mockService.method).toHaveBeenCalledTimes(1);
expect(() => service.method()).toThrow(Error);
```

### Component Tests
```typescript
expect(screen.getByText('Text')).toBeInTheDocument();
expect(screen.getByRole('button')).toBeEnabled();
expect(mockFunction).toHaveBeenCalled();
await waitFor(() => expect(...).toBeInTheDocument());
```

## Mock Setup Checklist

- [ ] Clear mocks in `beforeEach`
- [ ] Reset mocks between tests
- [ ] Use realistic mock data
- [ ] Mock all external dependencies
- [ ] Verify mock calls in assertions

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Timeout errors | Increase `jest.setTimeout()` |
| Mock not working | Check `jest.clearAllMocks()` |
| Import errors | Verify `moduleNameMapping` |
| Element not found | Use accessible queries first |
| Coverage missing | Run with `--coverage` flag |

## Quick Links

- [Full Documentation](./TEST_CASES_DOCUMENTATION.md)
- [Testing Guide](./TESTING.md)
- [Jest Docs](https://jestjs.io)
- [React Testing Library](https://testing-library.com/react)

---

**Last Updated**: 2024

