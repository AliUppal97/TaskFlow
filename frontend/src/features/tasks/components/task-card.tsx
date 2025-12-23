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

import { Task, TaskStatus, TaskPriority, UserRole } from '@/types';
import { useAuth } from '@/providers/auth-provider';
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
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
      case TaskStatus.IN_PROGRESS:
        return 'bg-[#e3f2fd] dark:bg-blue-500/20 text-[#1976d2] dark:text-blue-300 border border-[#bbdefb] dark:border-blue-500/30';
      case TaskStatus.REVIEW:
        return 'bg-[#fff3e0] dark:bg-yellow-500/20 text-[#f57c00] dark:text-yellow-300 border border-[#ffe0b2] dark:border-yellow-500/30';
      case TaskStatus.DONE:
        return 'bg-[#e0f2f1] dark:bg-green-500/20 text-[#00796b] dark:text-green-300 border border-[#b2dfdb] dark:border-green-500/30';
      default:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-[#e0f2f1] dark:bg-emerald-500/20 text-[#00796b] dark:text-emerald-300 border border-[#b2dfdb] dark:border-emerald-500/30';
      case TaskPriority.MEDIUM:
        return 'bg-[#fff3e0] dark:bg-yellow-500/20 text-[#f57c00] dark:text-yellow-300 border border-[#ffe0b2] dark:border-yellow-500/30';
      case TaskPriority.HIGH:
        return 'bg-[#ffe0b2] dark:bg-orange-500/20 text-[#e65100] dark:text-orange-300 border border-[#ffcc80] dark:border-orange-500/30';
      case TaskPriority.URGENT:
        return 'bg-[#ffebee] dark:bg-red-500/20 text-[#d32f2f] dark:text-red-300 border border-[#ffcdd2] dark:border-red-500/30';
      default:
        return 'bg-[#f5f5f5] dark:bg-slate-700/50 text-[#757575] dark:text-slate-200 border border-[#e0e0e0] dark:border-slate-600/50';
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

  // Admins can perform all actions on any task
  const canEdit = isAdmin || task.creatorId === currentUserId || task.assigneeId === currentUserId;
  const canDelete = isAdmin || task.creatorId === currentUserId;
  const canAssign = isAdmin; // Only admins can change assignees
  const canChangeStatus = isAdmin || canEdit;
  const hasAnyActions = canEdit || canAssign || canChangeStatus || canDelete;

  return (
    <Card className={`relative overflow-visible transition-all duration-300 hover:shadow-lg hover:shadow-[#1976d2]/10 dark:hover:shadow-purple-500/30 bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 ${task.isOverdue ? 'border-[#d32f2f] dark:border-red-500/50 bg-[#ffebee] dark:bg-red-500/10 ring-2 ring-[#ffcdd2] dark:ring-red-500/30' : ''}`}>
      <CardHeader className="pb-3 overflow-visible">
        <div className="flex items-start justify-between relative">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-[#212121] dark:text-slate-100 truncate mb-2">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                {task.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#757575] dark:text-slate-300 hover:text-[#212121] dark:hover:text-slate-100 hover:bg-[#f5f5f5] dark:hover:bg-slate-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-[#e0e0e0] dark:border-slate-700 z-[100]">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(task)} className="text-[#212121] dark:text-slate-100 focus:bg-[#f5f5f5] dark:focus:bg-slate-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canAssign && (
                <DropdownMenuItem onClick={() => onAssign?.(task.id)} className="text-[#212121] dark:text-slate-100 focus:bg-[#f5f5f5] dark:focus:bg-slate-700">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </DropdownMenuItem>
              )}
              {canChangeStatus && (
                <>
                  {(canEdit || canAssign) && <DropdownMenuSeparator className="bg-[#e0e0e0] dark:bg-slate-700" />}
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.TODO)}
                    disabled={task.status === TaskStatus.TODO || isUpdating}
                    className="text-[#212121] dark:text-slate-100 focus:bg-[#f5f5f5] dark:focus:bg-slate-700 disabled:opacity-50"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Mark as To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                    disabled={task.status === TaskStatus.IN_PROGRESS || isUpdating}
                    className="text-[#212121] dark:text-slate-100 focus:bg-[#f5f5f5] dark:focus:bg-slate-700 disabled:opacity-50"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.REVIEW)}
                    disabled={task.status === TaskStatus.REVIEW || isUpdating}
                    className="text-[#212121] dark:text-slate-100 focus:bg-[#f5f5f5] dark:focus:bg-slate-700 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as Review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.DONE)}
                    disabled={task.status === TaskStatus.DONE || isUpdating}
                    className="text-[#212121] dark:text-slate-100 focus:bg-[#f5f5f5] dark:focus:bg-slate-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Done
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  {(canEdit || canAssign || canChangeStatus) && <DropdownMenuSeparator className="bg-[#e0e0e0] dark:bg-slate-700" />}
                  <DropdownMenuItem
                    onClick={() => onDelete?.(task.id)}
                    className="text-[#d32f2f] dark:text-red-400 focus:text-[#c62828] dark:focus:text-red-300 focus:bg-[#ffebee] dark:focus:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              {!hasAnyActions && (
                <DropdownMenuItem disabled className="text-[#9e9e9e] dark:text-slate-500 text-xs italic">
                  No actions available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {task.description && (
          <p className="text-[#757575] dark:text-slate-300 text-sm mb-4 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm pt-3 border-t border-[#e0e0e0] dark:border-slate-700">
          <div className="flex items-center gap-4 flex-wrap">
            {isAdmin && (
              <div className="flex items-center gap-1.5 text-[#212121] dark:text-slate-300">
                <div className="p-1.5 rounded-full bg-[#e3f2fd] dark:bg-indigo-500/20 border border-[#bbdefb] dark:border-indigo-500/30">
                  <User className="h-3.5 w-3.5 text-[#1976d2] dark:text-indigo-400" />
                </div>
                {task.assignee ? (
                  <span className="text-xs font-medium">
                    {task.assignee.profile?.firstName && task.assignee.profile?.lastName
                      ? `${task.assignee.profile.firstName} ${task.assignee.profile.lastName}`
                      : task.assignee.email || 'Unknown'}
                  </span>
                ) : (
                  <span className="text-xs font-medium italic text-[#757575] dark:text-slate-400">Unassigned</span>
                )}
              </div>
            )}

            {task.dueDate && (
              <div className={`flex items-center gap-1.5 ${task.isOverdue ? 'text-[#d32f2f] dark:text-red-400' : 'text-[#212121] dark:text-slate-300'}`}>
                <div className={`p-1.5 rounded-full ${task.isOverdue ? 'bg-[#ffebee] dark:bg-red-500/20 border border-[#ffcdd2] dark:border-red-500/30' : 'bg-[#e3f2fd] dark:bg-blue-500/20 border border-[#bbdefb] dark:border-blue-500/30'}`}>
                  <Calendar className={`h-3.5 w-3.5 ${task.isOverdue ? 'text-[#d32f2f] dark:text-red-400' : 'text-[#1976d2] dark:text-blue-400'}`} />
                </div>
                <span className="text-xs font-medium">{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                {task.daysUntilDue !== null && task.daysUntilDue <= 7 && (
                  <span className={`text-xs font-semibold ml-1 ${task.daysUntilDue < 0 ? 'text-[#d32f2f] dark:text-red-400' : task.daysUntilDue <= 2 ? 'text-[#e65100] dark:text-orange-400' : 'text-[#f57c00] dark:text-yellow-400'}`}>
                    ({task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)}d overdue` : `${task.daysUntilDue}d left`})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-[#9e9e9e] dark:text-slate-500">
            {format(new Date(task.createdAt), 'MMM dd')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



