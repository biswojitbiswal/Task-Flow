import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    error: string,
    code: string,
    status: HttpStatus,
    details: Record<string, unknown> = {},
  ) {
    super(
      {
        error,
        code,
        details,
      },
      status,
    );
  }
}