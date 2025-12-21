'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

import { Task, TaskStatus, TaskPriority } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onAssign?: (taskId: string) => void;
  currentUserId?: string;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onAssign,
  currentUserId,
}: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.REVIEW:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return <Circle className="h-4 w-4" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4" />;
      case TaskStatus.REVIEW:
        return <AlertTriangle className="h-4 w-4" />;
      case TaskStatus.DONE:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (onStatusChange && newStatus !== task.status) {
      setIsUpdating(true);
      try {
        await onStatusChange(task.id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const canEdit = task.creatorId === currentUserId || task.assigneeId === currentUserId;
  const canDelete = task.creatorId === currentUserId;
  const canAssign = canEdit;
  const canChangeStatus = canEdit;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${task.isOverdue ? 'border-red-300 bg-red-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                {task.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canAssign && (
                <DropdownMenuItem onClick={() => onAssign?.(task.id)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </DropdownMenuItem>
              )}
              {canChangeStatus && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.TODO)}
                    disabled={task.status === TaskStatus.TODO || isUpdating}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Mark as To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                    disabled={task.status === TaskStatus.IN_PROGRESS || isUpdating}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.REVIEW)}
                    disabled={task.status === TaskStatus.REVIEW || isUpdating}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as Review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.DONE)}
                    disabled={task.status === TaskStatus.DONE || isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Done
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(task.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {task.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{task.assignee.profile?.firstName || task.assignee.email}</span>
              </div>
            )}

            {task.dueDate && (
              <div className={`flex items-center gap-1 ${task.isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
                {task.daysUntilDue !== null && task.daysUntilDue <= 7 && (
                  <span className={`text-xs ${task.daysUntilDue < 0 ? 'text-red-600' : task.daysUntilDue <= 2 ? 'text-orange-600' : 'text-yellow-600'}`}>
                    ({task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)}d overdue` : `${task.daysUntilDue}d left`})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400">
            Created {format(new Date(task.createdAt), 'MMM dd')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



