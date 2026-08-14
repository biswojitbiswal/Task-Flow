import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/users/users.service';
import { LoginDto, RegisterDto } from './dtos/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { OrganizationService } from 'src/organization/organization.service';
import { OrgMemberService } from 'src/org-member/org-member.service';
import { OrgRole, Prisma, User } from '../generated/prisma/client'
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { randomUUID } from 'crypto';



@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly organizationService: OrganizationService,
    private readonly orgMemberService: OrgMemberService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
  ) { }


  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await this.userService.create(
        {
          name: dto.name,
          email: dto.email,
          passwordHash,
        },
        tx,
      );

      const { passwordHash: _, ...safeUser } = user;

      if (!dto.organizationName) {
        return {
          user: safeUser,
          organization: null,
          membership: null,
        };
      }

      const organization = await this.organizationService.create(
        dto.organizationName,
        tx,
      );

      const membership = await this.orgMemberService.create(
        {
          userId: user.id,
          organizationId: organization.id,
          role: OrgRole.org_admin,
        },
        tx,
      );

      return {
        user: safeUser,
        organization,
        membership,
      };
    });

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      organizationId: result.organization?.id ?? null,
      role: result.membership?.role ?? null,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmailWithMemberships(
      dto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.memberships.length === 0) {
      return this.generateTokensWithoutOrganization(user);
    }

    // Multiple organizations → let user choose first
    if (user.memberships.length > 1) {
      const preAuthToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          type: 'pre_auth',
        },
        {
          secret: process.env.JWT_PRE_AUTH_SECRET,
          expiresIn: '5m',
        },
      );

      return {
        requiresOrganizationSelection: true,
        preAuthToken,
        organizations: user.memberships.map((membership) => ({
          organizationId: membership.organizationId,
          organizationName: membership.organization.name,
          role: membership.role,
        })),
      };
    }

    const membership = user.memberships[0];

    return this.generateTokens(user, membership);
  }


  private async generateTokens(
    user: User,
    membership: {
      organizationId: string;
      role: OrgRole;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const payload = {
      sub: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const jti = randomUUID();

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        organizationId: membership.organizationId,
        role: membership.role,
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
        jwtid: jti,
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 12);

    await this.refreshTokenService.create(
      {
        userId: user.id,
        jti,
        tokenHash,
        expiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ),
      },
      tx,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: membership.organizationId,
        role: membership.role,
      },
    };
  }


  async selectOrganization(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await this.orgMemberService.findByUserAndOrganization(
        userId,
        organizationId,
      );

    if (!membership) {
      throw new ForbiddenException(
        'You do not belong to this organization',
      );
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user, membership);
  }


  async refresh(refreshToken: string) {
    let payload: {
      sub: string;
      jti: string;
      organizationId: string;
      role: OrgRole;
    };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    const storedToken =
      await this.refreshTokenService.findByJti(payload.jti);

    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedException(
        'Invalid or revoked refresh token',
      );
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Refresh token expired',
      );
    }

    const membership =
      await this.orgMemberService.findByUserAndOrganization(
        payload.sub,
        payload.organizationId,
      );

    if (!membership) {
      throw new ForbiddenException(
        'User no longer belongs to this organization',
      );
    }

    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.refreshTokenService.revoke(
        storedToken.id,
      );

      return this.generateTokens(
        user,
        membership,
        tx,
      );
    });
  }


  private async generateTokensWithoutOrganization(
    user: User,
  ) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );

    const jti = randomUUID();

    const refreshToken =
      await this.jwtService.signAsync(
        {
          sub: user.id,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
          jwtid: jti,
        },
      );

    const tokenHash = await bcrypt.hash(
      refreshToken,
      12,
    );

    await this.refreshTokenService.create({
      userId: user.id,
      jti,
      tokenHash,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: null,
        role: null,
      },
    };
  }
}