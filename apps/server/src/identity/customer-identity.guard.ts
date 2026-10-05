import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthSessionService } from './auth-session.service.js';

@Injectable()
export class CustomerIdentityGuard implements CanActivate {
    constructor(
        private readonly authSessionService: AuthSessionService,
    ) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest<Request>();

        const authorization =
            request.headers.authorization;

        if (!authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedException(
                'Missing or invalid authorization header',
            );
        }

        const token = authorization.slice('Bearer '.length).trim();

        if (!token) {
            throw new UnauthorizedException(
                'Missing session token',
            );
        }

        const user =
            await this.authSessionService.authenticate(
                token,
                'CUSTOMER',
            );

        (request as Request & { user: typeof user }).user = user;

        return true;
    }
}