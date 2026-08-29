import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post('signup')
  async signup(@Body() dto: {
    name: string;
    type: string;
    registration_number: string;
    contact_email: string;
    contact_phone: string;
    user_id: string;
  }) {
    return this.orgsService.signupOrganization(dto);
  }

  @Patch(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() dto: { status: 'verified' | 'rejected'; verifier_id: string; reason?: string },
  ) {
    return this.orgsService.verifyOrganization(id, dto.status, dto.verifier_id, dto.reason);
  }

  @Post(':id/invite')
  async invite(
    @Param('id') id: string,
    @Body() dto: { email: string; role: string; inviter_id: string },
  ) {
    return this.orgsService.inviteStaff(id, dto.email, dto.role, dto.inviter_id);
  }

  @Post('accept-invite')
  async acceptInvite(@Body() dto: { token: string; user_id: string }) {
    return this.orgsService.acceptInvite(dto.token, dto.user_id);
  }
}
