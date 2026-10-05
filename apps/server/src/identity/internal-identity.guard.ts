import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { AuthSessionService } from './auth-session.service.js';

@Injectable()
export class InternalIdentityGuard implements CanActivate {
    constructor(private readonly sessions: AuthSessionService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: unknown;
        }>();

        const authorization = request.headers.authorization;

        if (!authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Authentication required');
        }

        const token = authorization.slice('Bearer '.length).trim();

        if (!token) {
            throw new UnauthorizedException('Authentication required');
        }

        request.user = await this.sessions.authenticate(token, 'INTERNAL');

        return true;
    }
}
