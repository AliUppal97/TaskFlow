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
        <h2 className="text-2xl font-bold text-[#212121] dark:text-slate-100 mb-1">Task List</h2>
        <p className="text-[#757575] dark:text-slate-400">{tasksCount} {tasksCount === 1 ? 'task' : 'tasks'} found</p>
      </div>
      <Button 
        onClick={onCreateTask} 
        className="flex items-center gap-2 bg-[#1976d2] hover:bg-[#1565c0] text-white shadow-md hover:shadow-lg"
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
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9e9e9e] dark:text-slate-500 h-4 w-4 z-10 pointer-events-none transition-opacity duration-200 will-change-transform" />
      <Input
        placeholder="Search tasks..."
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 pl-10 bg-white dark:bg-slate-800 border border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-100 placeholder:text-[#9e9e9e] dark:placeholder:text-slate-500 focus:border-[#1976d2] dark:focus:border-indigo-400 text-sm transition-all duration-200 ease-in-out"
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
          <SelectTrigger className="w-36 h-9 bg-white dark:bg-slate-800 border border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700">
            <SelectItem 
              value="all" 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              All Status
            </SelectItem>
            <SelectItem 
              value={TaskStatus.TODO} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              To Do
            </SelectItem>
            <SelectItem 
              value={TaskStatus.IN_PROGRESS} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              In Progress
            </SelectItem>
            <SelectItem 
              value={TaskStatus.REVIEW} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              Review
            </SelectItem>
            <SelectItem 
              value={TaskStatus.DONE} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              Done
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority || 'all'} onValueChange={onPriorityFilter}>
          <SelectTrigger className="w-36 h-9 bg-white dark:bg-slate-800 border border-[#e0e0e0] dark:border-slate-700 text-[#212121] dark:text-slate-300 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700">
            <SelectItem 
              value="all" 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              All Priority
            </SelectItem>
            <SelectItem 
              value={TaskPriority.LOW} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              Low
            </SelectItem>
            <SelectItem 
              value={TaskPriority.MEDIUM} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              Medium
            </SelectItem>
            <SelectItem 
              value={TaskPriority.HIGH} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              High
            </SelectItem>
            <SelectItem 
              value={TaskPriority.URGENT} 
              className="text-[#212121] dark:text-slate-100 text-sm cursor-pointer focus:bg-[#f5f5f5] dark:focus:bg-slate-700"
            >
              Urgent
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="inline-flex border border-[#e0e0e0] dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 overflow-hidden h-9">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-r-none border-0 h-full px-3 m-0 shadow-none text-sm ${viewMode === 'grid' ? 'bg-[#1976d2] text-white hover:bg-[#1565c0]' : 'text-[#757575] dark:text-slate-300 hover:text-[#212121] dark:hover:text-slate-100 hover:bg-[#f5f5f5] dark:hover:bg-slate-700'}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className={`rounded-l-none border-0 h-full px-3 m-0 shadow-none text-sm ${viewMode === 'list' ? 'bg-[#1976d2] text-white hover:bg-[#1565c0]' : 'text-[#757575] dark:text-slate-300 hover:text-[#212121] dark:hover:text-slate-100 hover:bg-[#f5f5f5] dark:hover:bg-slate-700'}`}
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
        <div className="text-[#9e9e9e] dark:text-slate-600 mb-4">
          <Filter className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-[#212121] dark:text-slate-100 mb-2">No tasks found</h3>
        <p className="text-[#757575] dark:text-slate-400 mb-6 max-w-md mx-auto">
          {filters.search || filters.status || filters.priority
            ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
            : 'Get started by creating your first task and begin organizing your work.'}
        </p>
        <Button 
          onClick={onCreateTask}
          className="bg-[#1976d2] hover:bg-[#1565c0] text-white shadow-md hover:shadow-lg"
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
            <div className="bg-white dark:bg-slate-800 border border-[#e0e0e0] dark:border-slate-700 h-48 rounded-xl"></div>
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



