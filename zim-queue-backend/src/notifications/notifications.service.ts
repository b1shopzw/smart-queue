import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async sendToUser(user_id: string, title: string, message: string) {
    this.logger.log(`Sending notification to user ${user_id}: ${title} - ${message}`);
    
    // Save to database
    return this.prisma.notifications.create({
      data: {
        title,
        message,
        target: 'USER', // Custom target
        created_by: 'SYSTEM',
      },
    });
  }

  async broadcastToBranch(branch_id: string, title: string, message: string) {
    this.logger.log(`Broadcasting to branch ${branch_id}: ${title}`);
    
    return this.prisma.notifications.create({
      data: {
        title,
        message,
        branch_id,
        target: 'BRANCH_ACTIVE',
        created_by: 'SYSTEM',
      },
    });
  }

  async notifyTicketStatus(ticket_id: string, status: string) {
    const ticket = await this.prisma.queue_tickets.findUnique({
      where: { id: ticket_id },
      include: { user: true },
    });

    if (ticket && ticket.user) {
      const message = status === 'SERVED' 
        ? `Your ticket ${ticket.ticket_number} is being served!` 
        : `Ticket ${ticket.ticket_number} status updated to ${status}`;
        
      await this.sendToUser(ticket.user_id, 'Queue Update', message);
    }
  }
}
