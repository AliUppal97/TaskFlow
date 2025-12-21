import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Task } from '../../entities/task.entity';
import { User } from '../../entities/user.entity';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskGateway } from './task.gateway';
import { TaskPolicy } from '../../common/policies/task.policy';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { CacheService } from '../../common/cache/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User]),
    EventsModule,
    AuthModule,
  ],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskGateway,
    TaskPolicy,
    CacheService,
    {
      provide: 'POLICIES',
      useValue: new Map([
        ['task', new TaskPolicy()],
      ]),
    },
  ],
  exports: [TaskService, TaskGateway],
})
export class TasksModule {}
