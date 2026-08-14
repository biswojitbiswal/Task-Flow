import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/users/users.module';
import { OrganizationModule } from 'src/organization/organization.module';
import { OrgMemberModule } from 'src/org-member/org-member.module';
import { RefreshTokenModule } from 'src/refresh-token/refresh-token.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UserModule, 
    OrganizationModule, 
    OrgMemberModule, 
    RefreshTokenModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}