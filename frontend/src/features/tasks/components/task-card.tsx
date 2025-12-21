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

import { Task, TaskStatus, TaskPriority } from '@/types';
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
        return 'bg-slate-700/50 text-slate-200 border border-slate-600/50';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case TaskStatus.REVIEW:
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case TaskStatus.DONE:
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      default:
        return 'bg-slate-700/50 text-slate-200 border border-slate-600/50';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case TaskPriority.HIGH:
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case TaskPriority.URGENT:
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      default:
        return 'bg-slate-700/50 text-slate-200 border border-slate-600/50';
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
    <Card className={`transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] bg-white/5 backdrop-blur-md border-white/10 ${task.isOverdue ? 'border-red-500/50 bg-red-500/10 ring-2 ring-red-500/30' : 'hover:border-indigo-500/50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-white truncate mb-2">
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
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-white/10">
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(task)} className="text-white focus:bg-white/10">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canAssign && (
                <DropdownMenuItem onClick={() => onAssign?.(task.id)} className="text-white focus:bg-white/10">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign
                </DropdownMenuItem>
              )}
              {canChangeStatus && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.TODO)}
                    disabled={task.status === TaskStatus.TODO || isUpdating}
                    className="text-white focus:bg-white/10 disabled:opacity-50"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Mark as To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
                    disabled={task.status === TaskStatus.IN_PROGRESS || isUpdating}
                    className="text-white focus:bg-white/10 disabled:opacity-50"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.REVIEW)}
                    disabled={task.status === TaskStatus.REVIEW || isUpdating}
                    className="text-white focus:bg-white/10 disabled:opacity-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Mark as Review
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(TaskStatus.DONE)}
                    disabled={task.status === TaskStatus.DONE || isUpdating}
                    className="text-white focus:bg-white/10 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Done
                  </DropdownMenuItem>
                </>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(task.id)}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/20"
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
          <p className="text-white/70 text-sm mb-4 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
          <div className="flex items-center gap-4 flex-wrap">
            {task.assignee && (
              <div className="flex items-center gap-1.5 text-white/80">
                <div className="p-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                  <User className="h-3.5 w-3.5 text-indigo-300" />
                </div>
                <span className="text-xs font-medium">{task.assignee.profile?.firstName || task.assignee.email}</span>
              </div>
            )}

            {task.dueDate && (
              <div className={`flex items-center gap-1.5 ${task.isOverdue ? 'text-red-400' : 'text-white/80'}`}>
                <div className={`p-1.5 rounded-full ${task.isOverdue ? 'bg-red-500/20 border border-red-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
                  <Calendar className={`h-3.5 w-3.5 ${task.isOverdue ? 'text-red-300' : 'text-blue-300'}`} />
                </div>
                <span className="text-xs font-medium">{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                {task.daysUntilDue !== null && task.daysUntilDue <= 7 && (
                  <span className={`text-xs font-semibold ml-1 ${task.daysUntilDue < 0 ? 'text-red-400' : task.daysUntilDue <= 2 ? 'text-orange-400' : 'text-yellow-400'}`}>
                    ({task.daysUntilDue < 0 ? `${Math.abs(task.daysUntilDue)}d overdue` : `${task.daysUntilDue}d left`})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-white/50">
            {format(new Date(task.createdAt), 'MMM dd')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



