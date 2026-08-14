import { Module } from '@nestjs/common';
import { UserModule } from 'src/users/users.module';
import { OrgMemberModule } from 'src/org-member/org-member.module';
import { OrganizationInvitationController } from './org-invitation.controller';
import { OrganizationInvitationService } from './org-invitation.service';
import { OrganizationInvitationRepository } from './org-invitation.repository';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UserModule,
    OrgMemberModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [
    OrganizationInvitationController,
  ],
  providers: [
    OrganizationInvitationService,
    OrganizationInvitationRepository,
  ],
  exports: [
    OrganizationInvitationService,
  ],
})
export class OrganizationInvitationModule {}