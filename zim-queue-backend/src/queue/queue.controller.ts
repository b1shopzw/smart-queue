import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { QueueService } from './queue.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('ticket')
  @ApiOperation({ summary: 'Create a new queue ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async createTicket(@Body() data: {
    branch_id: string;
    user_id: string;
    user_name?: string;
    user_email?: string;
    service_type: string;
    priority_level: string;
  }) {
    return this.queueService.createTicket(data);
  }

  @Post('next/:branch_id')
  @ApiOperation({ summary: 'Call the next ticket in line based on priority' })
  async getNextTicket(@Param('branch_id') branch_id: string) {
    return this.queueService.getNextTicket(branch_id);
  }

  @Get('branch/:branch_id')
  @ApiOperation({ summary: 'Get current waiting queue for a branch' })
  async getBranchQueue(@Param('branch_id') branch_id: string) {
    return this.queueService.getBranchQueue(branch_id);
  }
}
