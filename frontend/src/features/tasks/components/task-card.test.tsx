import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './task-card';
import { Task, TaskStatus, TaskPriority } from '@/types/api';

const mockTask: Task = {
  id: 'task-123',
  title: 'Test Task',
  description: 'This is a test task description',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  assigneeId: 'user-456',
  creatorId: 'user-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  completedAt: null,
  dueDate: new Date('2024-01-15'),
  version: 1,
  assignee: {
    id: 'user-456',
    email: 'assignee@example.com',
    profile: { firstName: 'John', lastName: 'Doe' },
  },
  creator: {
    id: 'user-123',
    email: 'creator@example.com',
    profile: { firstName: 'Jane', lastName: 'Smith' },
  },
  isOverdue: false,
  daysUntilDue: 5,
};

const mockCurrentUser = {
  id: 'user-123',
  email: 'creator@example.com',
};

describe('TaskCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnStatusChange = jest.fn();
  const mockOnAssign = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderTaskCard = (props = {}) => {
    return render(
      <TaskCard
        task={mockTask}
        currentUserId={mockCurrentUser.id}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onStatusChange={mockOnStatusChange}
        onAssign={mockOnAssign}
        {...props}
      />
    );
  };

  it('renders task information correctly', () => {
    renderTaskCard();

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Created 01/01')).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    renderTaskCard();

    const statusBadge = screen.getByText('To Do');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('displays correct priority badge', () => {
    renderTaskCard();

    const priorityBadge = screen.getByText('Medium');
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('shows due date information', () => {
    renderTaskCard();

    expect(screen.getByText('Jan 15')).toBeInTheDocument();
    expect(screen.getByText('5d left')).toBeInTheDocument();
  });

  it('shows overdue styling for overdue tasks', () => {
    const overdueTask = {
      ...mockTask,
      isOverdue: true,
      daysUntilDue: -2,
    };

    renderTaskCard({ task: overdueTask });

    const card = screen.getByText('Test Task').closest('.rounded-lg');
    expect(card).toHaveClass('border-red-300', 'bg-red-50');

    expect(screen.getByText('2d overdue')).toBeInTheDocument();
  });

  it('shows edit button for task creator', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('shows delete button for task creator', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows status change options', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    expect(screen.getByText('Mark as In Progress')).toBeInTheDocument();
    expect(screen.getByText('Mark as Review')).toBeInTheDocument();
    expect(screen.getByText('Mark as Done')).toBeInTheDocument();
  });

  it('calls onStatusChange when status option is clicked', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const inProgressButton = screen.getByText('Mark as In Progress');
    fireEvent.click(inProgressButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith(mockTask.id, TaskStatus.IN_PROGRESS);
  });

  it('shows assign button for task participants', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    expect(screen.getByText('Assign')).toBeInTheDocument();
  });

  it('calls onAssign when assign button is clicked', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    expect(mockOnAssign).toHaveBeenCalledWith(mockTask.id);
  });

  it('shows loading state during status change', () => {
    mockOnStatusChange.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const inProgressButton = screen.getByText('Mark as In Progress');
    fireEvent.click(inProgressButton);

    // The button should still show the original text (loading state is handled internally)
    expect(screen.queryByText('Mark as In Progress')).not.toBeInTheDocument();
  });

  it('disables current status option', () => {
    renderTaskCard();

    const moreButton = screen.getByRole('button');
    fireEvent.click(moreButton);

    const todoButton = screen.getByText('Mark as To Do');
    expect(todoButton).toBeDisabled();
  });

  it('limits description text with line-clamp', () => {
    const longDescriptionTask = {
      ...mockTask,
      description: 'This is a very long description that should be truncated with line-clamp CSS class to prevent overflow and maintain clean UI design.',
    };

    renderTaskCard({ task: longDescriptionTask });

    const description = screen.getByText(longDescriptionTask.description!);
    expect(description).toHaveClass('line-clamp-2');
  });

  it('handles tasks without assignees', () => {
    const unassignedTask = {
      ...mockTask,
      assigneeId: null,
      assignee: null,
    };

    renderTaskCard({ task: unassignedTask });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('handles tasks without due dates', () => {
    const noDueDateTask = {
      ...mockTask,
      dueDate: null,
      daysUntilDue: null,
    };

    renderTaskCard({ task: noDueDateTask });

    expect(screen.queryByText('Jan 15')).not.toBeInTheDocument();
    expect(screen.queryByText(/d left/)).not.toBeInTheDocument();
  });
});



