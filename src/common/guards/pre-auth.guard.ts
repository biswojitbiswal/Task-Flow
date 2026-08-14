import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PreAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Pre-auth token required');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_PRE_AUTH_SECRET,
      });

      if (payload.type !== 'pre_auth') {
        throw new UnauthorizedException('Invalid pre-auth token');
      }

      request.user = {
        userId: payload.sub,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired pre-auth token');
    }
  }
}