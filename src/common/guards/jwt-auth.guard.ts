import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthenticatedUser } from 'src/common/types/authenticated-user.type';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Access token required',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload =
        await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_ACCESS_SECRET,
        });

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Invalid access token',
        );
      }

      const user: AuthenticatedUser = {
        userId: payload.sub,
        organizationId: payload.organizationId,
        role: payload.role,
      };

      request.user = user;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired access token',
      );
    }
  }
}