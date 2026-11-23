
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;

    const mockJwtService = {
        verifyAsync: jest.fn(),
    };

    const mockRequest: any = {
        headers: {},
    };

    const mockContext: any = {
        switchToHttp: () => ({
            getRequest: () => mockRequest,
        }),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        mockRequest.headers = {};
        delete mockRequest.user;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JwtAuthGuard,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should reject requests without an authorization header', async () => {
        mockRequest.headers = {};

        await expect(
            guard.canActivate(mockContext),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });
    it('should reject an empty Bearer token', async () => {
        mockRequest.headers = {
            authorization: 'Bearer ',
        };

        await expect(
            guard.canActivate(mockContext),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should reject tokens with an invalid payload', async () => {
        mockRequest.headers = {
            authorization: 'Bearer valid-token',
        };

        mockJwtService.verifyAsync.mockResolvedValue({
            email: 'test@example.com',
            // Missing sub
        });

        await expect(
            guard.canActivate(mockContext),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject requests without a Bearer token', async () => {
        mockRequest.headers = {
            authorization: 'Basic some-token',
        };

        await expect(
            guard.canActivate(mockContext),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid or expired tokens', async () => {
        mockRequest.headers = {
            authorization: 'Bearer invalid-token',
        };

        mockJwtService.verifyAsync.mockRejectedValue(
            new Error('Token expired'),
        );

        await expect(
            guard.canActivate(mockContext),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should allow valid tokens and attach user details to the request', async () => {
        mockRequest.headers = {
            authorization: 'Bearer valid-token',
        };

        mockJwtService.verifyAsync.mockResolvedValue({
            sub: 'user-1',
            email: 'test@example.com',
        });

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);

        expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
            'valid-token',
        );

        expect(mockRequest.user).toEqual({
            id: 'user-1',
            email: 'test@example.com',
        });
    });
});
