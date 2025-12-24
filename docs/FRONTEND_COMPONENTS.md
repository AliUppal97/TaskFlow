# Frontend Components Documentation

## Overview

TaskFlow's frontend is built with React, Next.js, TypeScript, and Tailwind CSS. This document provides comprehensive documentation for all frontend components, their features, props, and usage patterns.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query (TanStack Query) for server state
- **Real-time**: Socket.IO for WebSocket connections
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom component library built on Radix UI

### Design System
- **Theme**: Material Design 3 inspired light/dark theme
- **Colors**: Primary (Blue), Secondary (Teal), Error (Red)
- **Typography**: Geist Sans font family
- **Spacing**: 4px grid system (0.25rem increments)
- **Border Radius**: 0.5rem (8px) default

## Core Components

### Layout Components

#### Header (`/components/layout/header.tsx`)
Main navigation header with responsive design and user menu.

**Features:**
- Responsive navigation (desktop/mobile)
- User avatar and dropdown menu
- Theme toggle
- WebSocket connection status indicator
- Scroll-based styling changes
- Mobile menu overlay

**Props:**
```typescript
// No external props - uses internal state and providers
```

**Usage:**
```tsx
import { Header } from '@/components/layout/header';

// Automatically renders based on authentication state
<Header />
```

#### Logo (`/components/logo.tsx`)
Application logo component with multiple variants.

**Props:**
```typescript
interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import { Logo } from '@/components/logo';

<Logo size="md" clickable={true} />
```

### Authentication Components

#### ProtectedRoute (`/components/auth/protected-route.tsx`)
Wrapper component that ensures user authentication before rendering children.

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}
```

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

<ProtectedRoute requiredRole={UserRole.ADMIN}>
  <AdminPanel />
</ProtectedRoute>
```

#### RoleProtectedRoute (`/components/auth/role-protected-route.tsx`)
Advanced role-based access control component.

**Props:**
```typescript
interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}
```

**Usage:**
```tsx
import { RoleProtectedRoute } from '@/components/auth/role-protected-route';

<RoleProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
  <ManagementTools />
</RoleProtectedRoute>
```

### Task Management Components

#### TaskList (`/features/tasks/components/task-list.tsx`)
Comprehensive task list component with filtering, searching, and view modes.

**Features:**
- Grid and list view modes
- Real-time search with debouncing
- Status and priority filtering
- Pagination
- Performance optimized with memoization
- Loading states and error handling
- Empty state with call-to-action

**Props:**
```typescript
interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  currentUserId?: string;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssignTask?: (taskId: string) => void;
  onFiltersChange?: (filters: Partial<TaskQueryParams>) => void;
  filters?: Partial<TaskQueryParams>;
}
```

**Usage:**
```tsx
import { TaskList } from '@/features/tasks/components/task-list';

<TaskList
  tasks={tasks}
  isLoading={false}
  currentUserId={user?.id}
  onCreateTask={() => setShowCreateForm(true)}
  onEditTask={(task) => setSelectedTask(task)}
  onDeleteTask={handleDeleteTask}
  onStatusChange={handleStatusChange}
  onAssignTask={handleAssignTask}
  onFiltersChange={setFilters}
  filters={filters}
/>
```

#### TaskCard (`/features/tasks/components/task-card.tsx`)
Individual task display card with actions and status indicators.

**Features:**
- Status and priority badges with colors
- Due date display with overdue indicators
- Assignee information
- Action dropdown menu (edit, delete, assign, status change)
- Responsive design
- Hover effects and animations
- Permission-based action visibility

**Props:**
```typescript
interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssign?: (taskId: string) => void;
  currentUserId?: string;
}
```

**Usage:**
```tsx
import { TaskCard } from '@/features/tasks/components/task-card';

<TaskCard
  task={task}
  currentUserId={user?.id}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onStatusChange={handleStatusChange}
  onAssign={handleAssign}
/>
```

#### TaskForm (`/features/tasks/components/task-form.tsx`)
Modal form for creating and editing tasks with validation.

**Features:**
- Zod schema validation
- Date picker with past date restrictions
- Rich text description field
- Priority and status selection
- Form state management with React Hook Form
- Loading states and error handling
- Responsive modal design

**Props:**
```typescript
interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubmit: (data: CreateTaskRequest | UpdateTaskRequest) => Promise<void>;
  isLoading?: boolean;
}
```

**Usage:**
```tsx
import { TaskForm } from '@/features/tasks/components/task-form';

<TaskForm
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  task={selectedTask}
  onSubmit={handleSubmit}
  isLoading={isSubmitting}
/>
```

#### UserSelector (`/features/tasks/components/user-selector.tsx`)
User selection dropdown for task assignment.

**Features:**
- Searchable user list
- Avatar display with fallbacks
- Role-based filtering
- Loading states
- Clear selection option

**Props:**
```typescript
interface UserSelectorProps {
  users: User[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
import { UserSelector } from '@/features/tasks/components/user-selector';

<UserSelector
  users={users}
  value={selectedUserId}
  onValueChange={setSelectedUserId}
  placeholder="Select assignee"
/>
```

### UI Components

#### Button (`/components/ui/button.tsx`)
Enhanced button component with multiple variants and sizes.

**Variants:**
- `default` - Primary button
- `destructive` - Error/danger button
- `outline` - Outlined button
- `secondary` - Secondary button
- `ghost` - Minimal button
- `link` - Link-style button

**Sizes:**
- `default`
- `sm`
- `lg`
- `icon`

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="sm" onClick={handleClick}>
  Click me
</Button>
```

#### Card (`/components/ui/card.tsx`)
Card container component with header, content, and footer sections.

**Components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title component
- `CardDescription` - Description component
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content here
  </CardContent>
</Card>
```

#### Input (`/components/ui/input.tsx`)
Enhanced input component with consistent styling.

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Standard HTML input props
}
```

**Usage:**
```tsx
import { Input } from '@/components/ui/input';

<Input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Select (`/components/ui/select.tsx`)
Dropdown select component built on Radix UI.

**Components:**
- `Select` - Root component
- `SelectTrigger` - Trigger button
- `SelectValue` - Value display
- `SelectContent` - Dropdown content
- `SelectItem` - Individual option
- `SelectSeparator` - Visual separator

**Usage:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Dialog (`/components/ui/dialog.tsx`)
Modal dialog component for forms and confirmations.

**Components:**
- `Dialog` - Root component
- `DialogTrigger` - Trigger element
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Title component
- `DialogDescription` - Description component
- `DialogFooter` - Footer section
- `DialogClose` - Close button

**Usage:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

### Provider Components

#### AuthProvider (`/providers/auth-provider.tsx`)
Authentication context provider managing user state and auth operations.

**Features:**
- JWT token management
- Automatic token refresh
- Login/logout functionality
- User profile management
- Role-based permissions

**Usage:**
```tsx
import { AuthProvider } from '@/providers/auth-provider';

<AuthProvider>
  <App />
</AuthProvider>
```

#### WebSocketProvider (`/providers/websocket-provider.tsx`)
WebSocket connection management for real-time updates.

**Features:**
- Automatic connection management
- Authentication integration
- Event subscription system
- Connection status tracking
- Error handling and reconnection

**Usage:**
```tsx
import { WebSocketProvider } from '@/providers/websocket-provider';

<WebSocketProvider>
  <App />
</WebSocketProvider>
```

#### QueryProvider (`/providers/query-provider.tsx`)
React Query client provider with default configuration.

**Configuration:**
- Default stale time: 5 minutes
- Cache time: 10 minutes
- Retry logic for failed requests
- Background refetch on window focus

**Usage:**
```tsx
import { QueryProvider } from '@/providers/query-provider';

<QueryProvider>
  <App />
</QueryProvider>
```

### Hooks

#### useTasks (`/hooks/use-api.ts`)
React Query hook for fetching tasks with filtering and pagination.

**Parameters:**
```typescript
function useTasks(
  params?: TaskQueryParams,
  options?: UseQueryOptions<PaginatedResponse<Task>>
): UseQueryResult<PaginatedResponse<Task>>
```

**Usage:**
```tsx
const { data: tasks, isLoading, error } = useTasks({
  status: TaskStatus.IN_PROGRESS,
  limit: 20
});
```

#### useCreateTask (`/hooks/use-api.ts`)
Mutation hook for creating new tasks with optimistic updates.

**Usage:**
```tsx
const createTaskMutation = useCreateTask();

const handleCreate = async (taskData: CreateTaskRequest) => {
  await createTaskMutation.mutateAsync(taskData);
};
```

#### useTaskUpdates (`/hooks/use-task-updates.ts`)
WebSocket integration hook for real-time task updates.

**Features:**
- Automatic cache invalidation on task events
- Optimistic UI updates
- Error handling for WebSocket events

**Usage:**
```tsx
import { useTaskUpdates } from '@/hooks/use-task-updates';

// Call in component to enable real-time updates
useTaskUpdates();
```

### Utility Components

#### Loading (`/components/ui/loading.tsx`)
Loading spinner component with multiple sizes.

**Props:**
```typescript
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Usage:**
```tsx
import { Loading } from '@/components/ui/loading';

<Loading size="md" />
```

#### ThemeToggle (`/components/ui/theme-toggle.tsx`)
Dark/light theme toggle button with smooth transitions.

**Features:**
- Automatic system preference detection
- Local storage persistence
- Smooth theme transitions

**Usage:**
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle />
```

#### ErrorBoundary (`/components/error-boundary.tsx`)
Error boundary component for graceful error handling.

**Features:**
- Catches JavaScript errors in component tree
- Displays user-friendly error messages
- Error reporting integration
- Recovery options

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/error-boundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## Responsive Design

All components follow a mobile-first responsive design approach:

### Breakpoints
- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up

### Grid System
- Uses CSS Grid and Flexbox
- Responsive columns: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Consistent spacing with Tailwind's spacing scale

### Mobile Optimizations
- Touch-friendly button sizes (minimum 44px)
- Swipe gestures where applicable
- Collapsible navigation menus
- Optimized typography scaling

## Performance Features

### Code Splitting
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based splitting

### Memoization
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers

### Caching
- React Query for API response caching
- Image optimization with Next.js Image component
- Font loading optimization

### Bundle Optimization
- Tree shaking for unused code
- CSS optimization with Tailwind purging
- Compression and minification

## Accessibility

### ARIA Support
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Color Contrast
- WCAG AA compliance (4.5:1 ratio)
- Dark theme support
- High contrast mode compatibility

### Keyboard Navigation
- Tab navigation through interactive elements
- Enter/Space activation
- Escape key for closing modals
- Arrow key navigation for dropdowns

## Testing

### Component Testing
- Jest for unit tests
- React Testing Library for component testing
- Test coverage reporting

### E2E Testing
- Playwright for end-to-end testing
- Cross-browser compatibility testing
- Mobile device simulation

## Development Guidelines

### Component Structure
```tsx
// 1. Imports
import React from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface ComponentProps {
  // props definition
}

// 3. Component with forwardRef if needed
export const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ prop1, prop2 }, ref) => {
    // 4. Hooks at the top
    const [state, setState] = useState(initialState);

    // 5. Event handlers
    const handleClick = useCallback(() => {
      // handler logic
    }, []);

    // 6. Effects
    useEffect(() => {
      // effect logic
    }, [dependencies]);

    // 7. Render
    return (
      <div ref={ref}>
        {/* JSX */}
      </div>
    );
  }
);

// 8. displayName for debugging
Component.displayName = 'Component';
```

### Styling Guidelines
- Use Tailwind utility classes
- Follow the design system color palette
- Use CSS custom properties for theming
- Maintain consistent spacing (4px grid)
- Use responsive utilities consistently

### Performance Best Practices
- Memoize expensive computations
- Use lazy loading for heavy components
- Optimize re-renders with proper dependency arrays
- Use React DevTools Profiler for optimization

## Conclusion

This documentation covers all major frontend components and their usage patterns. The component library is designed to be:

- **Modular**: Each component has a single responsibility
- **Reusable**: Components can be used across different parts of the application
- **Accessible**: Built with accessibility best practices
- **Performant**: Optimized for speed and efficiency
- **Maintainable**: Well-documented and tested

For any questions or contributions, please refer to the main project documentation or create an issue in the repository.


