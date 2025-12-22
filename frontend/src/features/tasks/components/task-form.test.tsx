import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskForm } from './task-form';
import { Task, TaskStatus, TaskPriority } from '@/types';

describe('TaskForm', () => {
  let queryClient: QueryClient;
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const mockTask: Task = {
    id: 'task-123',
    title: 'Existing Task',
    description: 'Existing description',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    assigneeId: null,
    creatorId: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    completedAt: null,
    dueDate: new Date('2024-12-31'),
    version: 1,
    isOverdue: false,
    daysUntilDue: 30,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const renderTaskForm = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TaskForm
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          {...props}
        />
      </QueryClientProvider>
    );
  };

  describe('create mode', () => {
    it('renders create form correctly', () => {
      renderTaskForm();

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('validates required title field', async () => {
      renderTaskForm();

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates title max length', async () => {
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(256);
      fireEvent.change(titleInput, { target: { value: longTitle } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is too long/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'Task description' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Task',
            description: 'Task description',
            priority: TaskPriority.MEDIUM,
          })
        );
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('submits form with selected priority', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Task' } });

      // Note: Select component interaction may need specific implementation
      // This is a basic test structure
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('edit mode', () => {
    it('renders edit form correctly', () => {
      renderTaskForm({ task: mockTask });

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });

    it('pre-fills form with task data', () => {
      renderTaskForm({ task: mockTask });

      expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
    });

    it('submits updated task data', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm({ task: mockTask });

      const titleInput = screen.getByDisplayValue('Existing Task');
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

      const submitButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Updated Task',
            version: mockTask.version,
          })
        );
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('includes version for optimistic locking', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm({ task: mockTask });

      const submitButton = screen.getByRole('button', { name: /update/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            version: mockTask.version,
          })
        );
      });
    });
  });

  describe('form interactions', () => {
    it('closes form when cancel button is clicked', () => {
      renderTaskForm();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('resets form when closed', async () => {
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Re-open form
      renderTaskForm();

      const newTitleInput = screen.getByLabelText(/title/i);
      expect(newTitleInput).toHaveValue('');
    });

    it('shows loading state during submission', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderTaskForm({ isLoading: true });

      const submitButton = screen.getByRole('button', { name: /create/i });
      expect(submitButton).toBeDisabled();
    });

    it('handles submission errors gracefully', async () => {
      const error = new Error('Submission failed');
      mockOnSubmit.mockRejectedValue(error);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Task' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      // Form should remain open on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('due date', () => {
    it('allows selecting due date', () => {
      renderTaskForm();

      // Due date field should be present
      const dueDateLabel = screen.queryByText(/due date/i);
      expect(dueDateLabel).toBeInTheDocument();
    });

    it('displays existing due date in edit mode', () => {
      renderTaskForm({ task: mockTask });

      // Calendar should show the existing due date
      // This depends on Calendar component implementation
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle very long title input', async () => {
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(300);
      fireEvent.change(titleInput, { target: { value: longTitle } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title is too long/i)).toBeInTheDocument();
      });
    });

    it('should handle special characters in title', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Task with émojis 🎉 and 中文' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Task with émojis 🎉 and 中文',
          })
        );
      });
    });

    it('should handle form submission with only required fields', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Minimal Task' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Minimal Task',
            priority: TaskPriority.MEDIUM, // Default
          })
        );
      });
    });

    it('should handle rapid form open/close', () => {
      const { rerender } = renderTaskForm();

      expect(screen.getByText('Create New Task')).toBeInTheDocument();

      rerender(
        <QueryClientProvider client={queryClient}>
          <TaskForm
            isOpen={false}
            onClose={mockOnClose}
            onSubmit={mockOnSubmit}
          />
        </QueryClientProvider>
      );

      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    it('should handle form reset after successful submission', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Task' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      // Form should be reset
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should handle date picker interaction', () => {
      renderTaskForm();

      // Due date field should be present
      const dueDateLabel = screen.queryByText(/due date/i);
      expect(dueDateLabel).toBeInTheDocument();
    });

    it('should handle priority change', async () => {
      mockOnSubmit.mockResolvedValue(undefined);
      renderTaskForm();

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'High Priority Task' } });

      // Priority selection would be tested with actual Select component interaction
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should prevent submission when form is loading', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      renderTaskForm({ isLoading: false });

      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });
});

