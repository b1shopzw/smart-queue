import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getBranchPerformance(branch_id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.queue_tickets.findMany({
      where: {
        branch_id,
        joined_at: { gte: today },
      },
    });

    const servedTickets = tickets.filter(t => t.status === 'SERVED');
    const waitingCount = tickets.filter(t => t.status === 'WAITING' || t.status === 'PAUSED').length;
    const missedTickets = tickets.filter(t => t.status === 'SKIPPED' || t.status === 'CANCELLED');
    
    const totalServed = servedTickets.length;
    const avgWaitTime = totalServed > 0 
      ? servedTickets.reduce((acc, t) => acc + (t.served_at ? t.served_at.getTime() - t.joined_at.getTime() : 0), 0) / (totalServed * 60000)
      : 0;

    const totalProcessed = totalServed + missedTickets.length;
    const noShowRate = totalProcessed > 0 ? (missedTickets.length / totalProcessed) * 100 : 0;

    const appUsersCount = await this.prisma.app_users.count();

    return {
      waitingNow: waitingCount,
      servedToday: totalServed,
      avgWaitTime: Math.round(avgWaitTime),
      noShowRate: Math.round(noShowRate * 10) / 10,
      missedToday: missedTickets.length,
      appUsers: appUsersCount,
    };
  }

  async getHistoricalStats(branch_id: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.daily_stats.findMany({
      where: {
        branch_id,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  // Task to be called daily or periodically to update daily_stats
  async updateDailyStats(branch_id: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await this.getBranchPerformance(branch_id);

    return this.prisma.daily_stats.upsert({
      where: {
        branch_id_date: {
          branch_id,
          date: today,
        },
      },
      update: {
        served_tickets: stats.servedToday,
        avg_wait_time: stats.avgWaitTime,
      },
      create: {
        branch_id,
        date: today,
        served_tickets: stats.servedToday,
        avg_wait_time: stats.avgWaitTime,
      },
    });
  }

  async submitFeedback(data: any) {
    return this.prisma.user_feedback.create({
      data: {
        user_id: data.user_id,
        branch_id: data.branch_id,
        rating: data.rating,
        category: data.category,
        comments: data.comments || '',
        status: 'UNREAD',
      },
    });
  }
}
