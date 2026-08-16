import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import {
  type LoginDto,
  loginSchema,
  type RegisterDto,
  registerSchema,
  type SelectOrganizationDto,
  selectOrganizationSchema,
  type RefreshTokenDto,
  refreshTokenSchema,
} from './dtos/auth.dto';

import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { PreAuthGuard } from 'src/common/guards/pre-auth.guard';

@ApiTags('Auth')
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          type: 'string',
          example: 'John Doe',
        },
        email: {
          type: 'string',
          format: 'email',
          example: 'john@example.com',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'Password123!',
        },
        organizationName: {
          type: 'string',
          example: 'TaskFlow Inc',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already registered',
  })
  register(
    @Body(new ZodValidationPipe(registerSchema))
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }


  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'john@example.com',
        },
        password: {
          type: 'string',
          format: 'password',
          example: 'Password123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  login(
    @Body(new ZodValidationPipe(loginSchema))
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }


  @UseGuards(PreAuthGuard)
  @Post('select-organization')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Select organization after multi-organization login',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['organizationId'],
      properties: {
        organizationId: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Organization selected and tokens issued',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not belong to the organization',
  })
  selectOrganization(
    @Request() req,
    @Body(new ZodValidationPipe(selectOrganizationSchema))
    dto: SelectOrganizationDto,
  ) {
    return this.authService.selectOrganization(
      req.user.userId,
      dto.organizationId,
    );
  }

  
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema))
    dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(dto.refreshToken);
  }
}