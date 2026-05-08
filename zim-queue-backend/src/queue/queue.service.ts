import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  private priorityWeights = {
    'Elderly': 3,
    'Disabled': 3,
    'VIP': 2,
    'Standard': 1,
  };

  async createTicket(data: {
    branch_id: string;
    user_id: string;
    service_type: string;
    priority_level: string;
  }) {
    // Generate ticket number (e.g., A001, B002)
    const count = await this.prisma.queue_tickets.count({
      where: {
        branch_id: data.branch_id,
        joined_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const prefix = data.service_type.charAt(0).toUpperCase();
    const ticketNumber = `${prefix}${String(count + 1).padStart(3, '0')}`;

    // Calculate estimated wait time (simplified: 5 mins per person in WAITING state)
    const waitingCount = await this.prisma.queue_tickets.count({
      where: {
        branch_id: data.branch_id,
        status: 'WAITING',
      },
    });
    const estimatedWaitTime = (waitingCount + 1) * 5;

    return this.prisma.queue_tickets.create({
      data: {
        ...data,
        ticket_number: ticketNumber,
        estimated_wait_time: estimatedWaitTime,
        status: 'WAITING',
      },
    });
  }

  async getNextTicket(branch_id: string) {
    // Complex prioritization logic
    // We order by priority level first, then by joined_at
    // Since SQL ORDER BY doesn't naturally know our weights, we can use a CASE statement or handle it in JS if small
    // But for DB logic, we can fetch all WAITING and sort, or use raw query.
    // For now, let's fetch the top 50 and sort in JS for precise control.
    
    const tickets = await this.prisma.queue_tickets.findMany({
      where: {
        branch_id,
        status: 'WAITING',
      },
      orderBy: {
        joined_at: 'asc',
      },
      take: 50,
    });

    if (tickets.length === 0) {
      throw new NotFoundException('No tickets in queue');
    }

    // Sort by priority weight descending, then by joined_at ascending
    const sorted = tickets.sort((a, b) => {
      const weightA = this.priorityWeights[a.priority_level] || 1;
      const weightB = this.priorityWeights[b.priority_level] || 1;
      
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return a.joined_at.getTime() - b.joined_at.getTime();
    });

    const nextTicket = sorted[0];

    // Update status to SERVED (or ACTIVE/CALLING)
    return this.prisma.queue_tickets.update({
      where: { id: nextTicket.id },
      data: {
        status: 'SERVED', // In a real app, this might be 'BEING_SERVED'
        served_at: new Date(),
      },
    });
  }

  async getBranchQueue(branch_id: string) {
    return this.prisma.queue_tickets.findMany({
      where: { branch_id, status: 'WAITING' },
      orderBy: { joined_at: 'asc' },
      include: { user: true },
    });
  }
}
