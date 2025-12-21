'use client';

import { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange?.({ ...filters, search: value || undefined });
  };

  const handleStatusFilter = (status: string) => {
    const statusValue = status === 'all' ? undefined : status as TaskStatus;
    onFiltersChange?.({ ...filters, status: statusValue });
  };

  const handlePriorityFilter = (priority: string) => {
    const priorityValue = priority === 'all' ? undefined : priority as TaskPriority;
    onFiltersChange?.({ ...filters, priority: priorityValue });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 h-48 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Task List</h2>
          <p className="text-white/70">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} found</p>
        </div>
        <Button 
          onClick={onCreateTask} 
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white/5 backdrop-blur-md border-white/10 text-white placeholder:text-white/50 focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 backdrop-blur-md border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value={TaskStatus.TODO} className="text-white">To Do</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS} className="text-white">In Progress</SelectItem>
              <SelectItem value={TaskStatus.REVIEW} className="text-white">Review</SelectItem>
              <SelectItem value={TaskStatus.DONE} className="text-white">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority || 'all'} onValueChange={handlePriorityFilter}>
            <SelectTrigger className="w-36 bg-white/5 backdrop-blur-md border-white/10 text-white">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all" className="text-white">All Priority</SelectItem>
              <SelectItem value={TaskPriority.LOW} className="text-white">Low</SelectItem>
              <SelectItem value={TaskPriority.MEDIUM} className="text-white">Medium</SelectItem>
              <SelectItem value={TaskPriority.HIGH} className="text-white">High</SelectItem>
              <SelectItem value={TaskPriority.URGENT} className="text-white">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <div className="inline-flex border border-white/10 rounded-md bg-white/5 backdrop-blur-md overflow-hidden m-0 p-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-r-none border-0 h-9 px-3 m-0 ${viewMode === 'grid' ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-l-none border-0 h-9 px-3 m-0 ${viewMode === 'list' ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks Grid/List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-white/30 mb-4">
            <Filter className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            {searchTerm || filters.status || filters.priority
              ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
              : 'Get started by creating your first task and begin organizing your work.'}
          </p>
          <Button 
            onClick={onCreateTask}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Task
          </Button>
        </div>
      ) : (
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
      )}
    </div>
  );
}



