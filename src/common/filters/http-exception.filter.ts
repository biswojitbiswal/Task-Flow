import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter
    implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const response =
            host.switchToHttp().getResponse();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null &&
                'error' in exceptionResponse &&
                'code' in exceptionResponse
            ) {
                return response.status(status).json(exceptionResponse);
            }

            let message = 'Request failed';

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null &&
                'message' in exceptionResponse
            ) {
                const exceptionMessage = exceptionResponse.message;

                if (typeof exceptionMessage === 'string') {
                    message = exceptionMessage;
                }
            }

            return response.status(status).json({
                error: message,
                code: this.getDefaultCode(status),
                details: {},
            });
        }

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: 'Internal server error',
            code: 'INTERNAL_SERVER_ERROR',
            details: {},
        });
    }

    private getDefaultCode(status: number) {
        switch (status) {
            case 400:
                return 'BAD_REQUEST';

            case 401:
                return 'UNAUTHORIZED';

            case 403:
                return 'FORBIDDEN';

            case 404:
                return 'NOT_FOUND';

            case 409:
                return 'CONFLICT';

            case 429:
                return 'TOO_MANY_REQUESTS';

            default:
                return 'HTTP_ERROR';
        }
    }
}