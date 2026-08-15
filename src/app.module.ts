import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './users/users.module';
import { OrganizationModule } from './organization/organization.module';
import { OrgMemberModule } from './org-member/org-member.module';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { OrganizationInvitationModule } from './org-invitation/org-invitation.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    OrgMemberModule,
    RefreshTokenModule,
    OrganizationInvitationModule,
    ProjectModule,
    TaskModule,
    CommentModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
