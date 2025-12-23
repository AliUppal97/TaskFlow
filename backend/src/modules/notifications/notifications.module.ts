import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User]),
    AuthModule, // Import AuthModule to provide UserService for JwtPermissionsGuard
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // Export service so it can be used by other modules (e.g., tasks module)
})
export class NotificationsModule {}

