import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('branch/:branch_id/performance')
  @ApiOperation({ summary: 'Get real-time performance stats for a branch' })
  async getBranchPerformance(@Param('branch_id') branch_id: string) {
    return this.analyticsService.getBranchPerformance(branch_id);
  }

  @Get('branch/:branch_id/history')
  @ApiOperation({ summary: 'Get historical daily stats for a branch' })
  async getHistoricalStats(
    @Param('branch_id') branch_id: string,
    @Query('days') days: string,
  ) {
    return this.analyticsService.getHistoricalStats(branch_id, days ? parseInt(days) : 7);
  }

  @Post('feedback')
  @ApiOperation({ summary: 'Submit user feedback' })
  async submitFeedback(@Body() data: any) {
    return this.analyticsService.submitFeedback(data);
  }
}
