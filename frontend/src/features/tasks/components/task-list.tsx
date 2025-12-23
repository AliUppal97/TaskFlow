'use client';

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Plus, Filter, Search, Grid3X3, List } from 'lucide-react';

import { Task, TaskQueryParams, TaskStatus, TaskPriority } from '@/types';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

// Memoized component for header - only re-renders when tasks.length changes
interface TaskListHeaderProps {
  tasksCount: number;
  onCreateTask?: () => void;
}

const TaskListHeader = memo(function TaskListHeader({
  tasksCount,
  onCreateTask,
}: TaskListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Task List</h2>
        <p className="text-muted-foreground">{tasksCount} {tasksCount === 1 ? 'task' : 'tasks'} found</p>
      </div>
      <Button 
        onClick={onCreateTask} 
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        New Task
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if tasksCount or onCreateTask reference changes
  return (
    prevProps.tasksCount === nextProps.tasksCount &&
    prevProps.onCreateTask === nextProps.onCreateTask
  );
});

// Isolated Search Input Component - manages its own state, doesn't cause parent re-renders
interface SearchInputProps {
  initialValue?: string;
  onSearchChange: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = memo(function SearchInput({
  initialValue = '',
  onSearchChange,
  debounceMs = 300,
}: SearchInputProps) {
  // Use initialValue only on mount, then manage state completely independently
  const [localValue, setLocalValue] = useState(() => initialValue);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep ref updated
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  const handleChange = useCallback((value: string) => {
    setLocalValue(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced update
    debounceTimerRef.current = setTimeout(() => {
      onSearchChangeRef.current(value);
    }, debounceMs);
  }, [debounceMs]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10 pointer-events-none transition-opacity duration-200 will-change-transform" />
      <Input
        placeholder="Search tasks..."
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 pl-10 bg-card border border-border/80 text-foreground placeholder:text-muted-foreground focus:border-primary text-sm transition-all duration-200 ease-in-out"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if onSearchChange reference changes
  // initialValue changes don't cause re-render since component manages its own state
  return prevProps.onSearchChange === nextProps.onSearchChange;
});

// Memoized component for filters - only re-renders when filters or viewMode changes
interface TaskListFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: {
    status?: TaskStatus;
    priority?: TaskPriority;
  };
  onStatusFilter: (status: string) => void;
  onPriorityFilter: (priority: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const TaskListFilters = memo(function TaskListFilters({
  searchValue,
  onSearchChange,
  filters,
  onStatusFilter,
  onPriorityFilter,
  viewMode,
  onViewModeChange,
}: TaskListFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <SearchInput
        initialValue={searchValue}
        onSearchChange={onSearchChange}
      />

      <div className="flex gap-2 items-center">
        <Select value={filters.status || 'all'} onValueChange={onStatusFilter}>
          <SelectTrigger className="w-36 h-9 bg-card border border-border/80 text-foreground text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border/80">
            <SelectItem 
              value="all" 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              All Status
            </SelectItem>
            <SelectItem 
              value={TaskStatus.TODO} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              To Do
            </SelectItem>
            <SelectItem 
              value={TaskStatus.IN_PROGRESS} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              In Progress
            </SelectItem>
            <SelectItem 
              value={TaskStatus.REVIEW} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              Review
            </SelectItem>
            <SelectItem 
              value={TaskStatus.DONE} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              Done
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority || 'all'} onValueChange={onPriorityFilter}>
          <SelectTrigger className="w-36 h-9 bg-card border border-border/80 text-foreground text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border/80">
            <SelectItem 
              value="all" 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              All Priority
            </SelectItem>
            <SelectItem 
              value={TaskPriority.LOW} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              Low
            </SelectItem>
            <SelectItem 
              value={TaskPriority.MEDIUM} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              Medium
            </SelectItem>
            <SelectItem 
              value={TaskPriority.HIGH} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              High
            </SelectItem>
            <SelectItem 
              value={TaskPriority.URGENT} 
              className="text-foreground text-sm cursor-pointer focus:bg-accent"
            >
              Urgent
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="inline-flex border border-border/80 rounded-md bg-white dark:bg-card overflow-hidden h-9">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-r-none border-0 h-full px-3 m-0 shadow-none text-sm transition-all duration-200 ${
              viewMode === 'grid' 
                ? 'text-white hover:bg-blue-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' 
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-accent'
            }`}
            style={viewMode === 'grid' ? { backgroundColor: '#2563eb' } : undefined}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`rounded-l-none border-0 h-full px-3 m-0 shadow-none text-sm transition-all duration-200 ${
              viewMode === 'list' 
                ? 'text-white hover:bg-blue-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90' 
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-accent'
            }`}
            style={viewMode === 'list' ? { backgroundColor: '#2563eb' } : undefined}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if filters (status/priority) or viewMode changes
  // searchValue and onSearchChange changes don't cause re-render (SearchInput manages its own state)
  return (
    prevProps.filters.status === nextProps.filters.status &&
    prevProps.filters.priority === nextProps.filters.priority &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.onStatusFilter === nextProps.onStatusFilter &&
    prevProps.onPriorityFilter === nextProps.onPriorityFilter &&
    prevProps.onViewModeChange === nextProps.onViewModeChange
  );
});

// Memoized component for task list content - only re-renders when tasks change
interface TaskListContentProps {
  tasks: Task[];
  viewMode: 'grid' | 'list';
  filters: Partial<TaskQueryParams>;
  currentUserId?: string;
  onCreateTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssignTask?: (taskId: string) => void;
}

const TaskListContent = memo(function TaskListContent({
  tasks,
  viewMode,
  filters,
  currentUserId,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAssignTask,
}: TaskListContentProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground mb-4">
          <Filter className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No tasks found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {filters.search || filters.status || filters.priority
            ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
            : 'Get started by creating your first task and begin organizing your work.'}
        </p>
        <Button 
          onClick={onCreateTask}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Task
        </Button>
      </div>
    );
  }

  return (
    <div className={
      viewMode === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        : 'space-y-4'
    }>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          currentUserId={currentUserId}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onStatusChange={onStatusChange}
          onAssign={onAssignTask}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if tasks array reference changes or viewMode changes
  // Filters changes are handled by tasks prop (which comes from filtered results)
  return (
    prevProps.tasks === nextProps.tasks &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});

export function TaskList({
  tasks,
  isLoading,
  currentUserId,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onAssignTask,
  onFiltersChange,
  filters = {},
}: TaskListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounced search handler - only updates filters, doesn't cause component re-render
  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange?.({ ...filters, search: value || undefined });
  }, [filters, onFiltersChange]);

  const handleStatusFilter = useCallback((status: string) => {
    const statusValue = status === 'all' ? undefined : status as TaskStatus;
    onFiltersChange?.({ ...filters, status: statusValue });
  }, [filters, onFiltersChange]);

  const handlePriorityFilter = useCallback((priority: string) => {
    const priorityValue = priority === 'all' ? undefined : priority as TaskPriority;
    onFiltersChange?.({ ...filters, priority: priorityValue });
  }, [filters, onFiltersChange]);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  // Memoize header props to prevent re-renders when searchTerm changes
  // Only update when tasks.length or onCreateTask reference changes
  const headerProps = useMemo(() => ({
    tasksCount: tasks.length,
    onCreateTask,
  }), [tasks.length, onCreateTask]);

  // Extract searchValue - SearchInput manages its own state internally
  // Changes to searchValue will create a new filtersProps object, but TaskListFilters
  // comparison function ignores searchValue to prevent actual re-renders
  const searchValue = filters.search || '';

  // Memoize filters props - searchValue included for initialValue prop
  // TaskListFilters comparison function ignores searchValue to prevent re-renders
  const filtersProps = useMemo(() => ({
    searchValue,
    onSearchChange: handleSearchChange,
    filters: {
      status: filters.status,
      priority: filters.priority,
    },
    onStatusFilter: handleStatusFilter,
    onPriorityFilter: handlePriorityFilter,
    viewMode,
    onViewModeChange: handleViewModeChange,
  }), [
    searchValue,
    filters.status, 
    filters.priority, 
    handleSearchChange, 
    handleStatusFilter, 
    handlePriorityFilter, 
    viewMode, 
    handleViewModeChange
  ]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-card border border-border/80 h-48 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Memoized, only re-renders when tasks.length changes */}
      <TaskListHeader {...headerProps} />

      {/* Filters and Search - Memoized, re-renders when searchTerm changes but that's expected */}
      <TaskListFilters {...filtersProps} />

      {/* Tasks Grid/List - Memoized component that only re-renders when tasks change */}
      <TaskListContent
        tasks={tasks}
        viewMode={viewMode}
        filters={filters}
        currentUserId={currentUserId}
        onCreateTask={onCreateTask}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
        onAssignTask={onAssignTask}
      />
    </div>
  );
}



