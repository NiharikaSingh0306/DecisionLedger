
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (
            !authHeader ||
            typeof authHeader !== 'string' ||
            !authHeader.startsWith('Bearer ')
        ) {
            throw new UnauthorizedException('Authentication token missing');
        }

        const token = authHeader.slice(7).trim();

        if (!token || token.includes(' ')) {
            throw new UnauthorizedException('Invalid authentication token');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token);

            if (
                !payload ||
                typeof payload.sub !== 'string' ||
                payload.sub.trim() === '' ||
                typeof payload.email !== 'string' ||
                payload.email.trim() === ''
            ) {
                throw new UnauthorizedException('Invalid token payload');
            }

            request.user = {
                id: payload.sub,
                email: payload.email,
            };

            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
