import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async signupOrganization(dto: {
    name: string;
    type: string;
    registration_number: string;
    contact_email: string;
    contact_phone: string;
    user_id: string;
  }) {
    const existing = await this.prisma.organizations.findUnique({
      where: { registration_number: dto.registration_number },
    });

    if (existing) {
      throw new BadRequestException('Organization registration number already registered.');
    }

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organizations.create({
        data: {
          name: dto.name,
          type: dto.type,
          registration_number: dto.registration_number,
          contact_email: dto.contact_email,
          contact_phone: dto.contact_phone,
          status: 'pending',
        },
      });

      await tx.org_members.create({
        data: {
          org_id: org.id,
          user_id: dto.user_id,
          role: 'owner',
        },
      });

      return {
        org_id: org.id,
        status: org.status,
        message: 'Organization created and pending super admin verification.',
      };
    });
  }

  async verifyOrganization(orgId: string, status: 'verified' | 'rejected', verifierId: string, reason?: string) {
    const org = await this.prisma.organizations.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found.');

    return this.prisma.organizations.update({
      where: { id: orgId },
      data: {
        status,
        verified_at: status === 'verified' ? new Date() : null,
        verified_by: status === 'verified' ? verifierId : null,
        rejection_reason: status === 'rejected' ? (reason || 'Registration details rejected.') : null,
      },
    });
  }

  async inviteStaff(orgId: string, email: string, role: string, inviterId: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    return this.prisma.org_invites.create({
      data: {
        org_id: orgId,
        email,
        role,
        token,
        expires_at: expiresAt,
        created_by: inviterId,
      },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.org_invites.findUnique({ where: { token } });
    if (!invite || invite.expires_at < new Date()) {
      throw new BadRequestException('Invitation token is invalid or expired.');
    }

    return this.prisma.$transaction(async (tx) => {
      const member = await tx.org_members.upsert({
        where: {
          org_id_user_id: {
            org_id: invite.org_id,
            user_id: userId,
          },
        },
        create: {
          org_id: invite.org_id,
          user_id: userId,
          role: invite.role,
          invited_by: invite.created_by,
        },
        update: {
          role: invite.role,
        },
      });

      await tx.org_invites.delete({ where: { id: invite.id } });

      return member;
    });
  }
}
