import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, QueueModule, AnalyticsModule, NotificationsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
