import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { PolicyGuard } from '../../guards/policy.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExtraModels,
} from '@nestjs/swagger';

import { TaskService } from './task.service';
import { JwtPermissionsGuard } from '../../guards/jwt-permissions.guard';
import { Permission, RequirePermissions } from '../../decorators/permissions.decorator';
import { UsePolicy } from '../../decorators/policy.decorator';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  TaskResponseDto,
  TaskListResponseDto,
} from '../../dto/task.dto';
import type { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import { LoggingInterceptor } from '../../interceptors/logging.interceptor';
import { Task } from '../../entities/task.entity';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtPermissionsGuard)
@RequirePermissions(Permission.TASK_READ)
@ApiBearerAuth()
@UseInterceptors(LoggingInterceptor)
@ApiExtraModels(TaskResponseDto, TaskListResponseDto)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Assignee not found' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<TaskResponseDto> {
    const task = await this.taskService.create(createTaskDto, req.user);
    return this.transformTaskResponse(task);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with pagination and filtering' })
  @ApiQuery({ type: TaskQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
    type: TaskListResponseDto,
  })
  async findAll(
    @Query() query: TaskQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<TaskListResponseDto> {
    const result = await this.taskService.findAll(query, req.user);
    return {
      data: result.data.map(task => this.transformTaskResponse(task)),
      pagination: result.pagination,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({
    status: 200,
    description: 'Task statistics retrieved successfully',
  })
  async getStats(@Request() req: RequestWithUser) {
    return this.taskService.getTaskStats(req.user);
  }

  @Get(':id')
  @UsePolicy({
    policyName: 'task',
    action: 'read',
    resourceType: 'task',
    getResource: (req) => ({ id: req.params!.id }),
  })
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task retrieved successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<TaskResponseDto> {
    const task = await this.taskService.findOne(id, req.user);
    return this.transformTaskResponse(task);
  }

  @Patch(':id')
  @UsePolicy({
    policyName: 'task',
    action: 'update',
    resourceType: 'task',
    getResource: (req) => ({ id: req.params!.id }),
  })
  @RequirePermissions(Permission.TASK_UPDATE)
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 409, description: 'Task has been modified by another user' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<TaskResponseDto> {
    const task = await this.taskService.update(id, updateTaskDto, req.user);
    return this.transformTaskResponse(task);
  }

  @Patch(':id/assign')
  @UseGuards(PolicyGuard)
  @UsePolicy({
    policyName: 'task',
    action: 'assign',
    resourceType: 'task',
    getResource: (req) => ({ id: req.params!.id }),
  })
  @RequirePermissions(Permission.TASK_ASSIGN)
  @ApiOperation({ summary: 'Assign a task to a user' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task assigned successfully',
    type: TaskResponseDto,
  })
  async assignTask(
    @Param('id') id: string,
    @Body() body: { assigneeId: string | null },
    @Request() req: RequestWithUser,
  ): Promise<TaskResponseDto> {
    const task = await this.taskService.assignTask(id, body.assigneeId, req.user);
    return this.transformTaskResponse(task);
  }

  @Delete(':id')
  @UsePolicy({
    policyName: 'task',
    action: 'delete',
    resourceType: 'task',
    getResource: (req) => ({ id: req.params!.id }),
  })
  @RequirePermissions(Permission.TASK_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    await this.taskService.remove(id, req.user);
  }

  private transformTaskResponse(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId,
      creatorId: task.creatorId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
      dueDate: task.dueDate,
      version: task.version,
      assignee: task.assignee ? {
        id: task.assignee.id,
        email: task.assignee.email,
        profile: task.assignee.profile,
      } : undefined,
      creator: task.creator ? {
        id: task.creator.id,
        email: task.creator.email,
        profile: task.creator.profile,
      } : {
        id: task.creatorId,
        email: '',
        profile: {},
      },
      isOverdue: task.isOverdue,
      daysUntilDue: task.daysUntilDue,
    };
  }
}
