
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    };

    const mockJwtService = {
        signAsync: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // REGISTER TESTS

    it('should register a user and hash their password', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

        const createdUser = {
            id: 'user-1',
            email: 'test@example.com',
            createdAt: new Date(),
        };

        mockPrisma.user.create.mockResolvedValue(createdUser);

        const result = await service.register({
            email: 'test@example.com',
            password: 'Password123',
        });

        expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
            data: {
                email: 'test@example.com',
                passwordHash: 'hashed-password',
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });

        expect(result.message).toBe('User registered successfully');
        expect(result.user).toEqual(createdUser);
    });

    it('should reject registration when email already exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'test@example.com',
        });

        await expect(
            service.register({
                email: 'test@example.com',
                password: 'Password123',
            }),
        ).rejects.toThrow(ConflictException);

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    // LOGIN TESTS

    it('should login successfully and return a JWT', async () => {
        const user = {
            id: 'user-1',
            email: 'test@example.com',
            passwordHash: 'hashed-password',
        };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        mockJwtService.signAsync.mockResolvedValue('mock-jwt-token');

        const result = await service.login({
            email: 'test@example.com',
            password: 'Password123',
        });

        expect(bcrypt.compare).toHaveBeenCalledWith(
            'Password123',
            'hashed-password',
        );

        expect(mockJwtService.signAsync).toHaveBeenCalledWith({
            sub: 'user-1',
            email: 'test@example.com',
        });

        expect(result.accessToken).toBe('mock-jwt-token');
        expect(result.message).toBe('Login successful');
        expect(result.user).toEqual({
            id: 'user-1',
            email: 'test@example.com',
        });
    });

    it('should reject login when user does not exist', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            service.login({
                email: 'unknown@example.com',
                password: 'Password123',
            }),
        ).rejects.toThrow(UnauthorizedException);

        expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should reject login when password is incorrect', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: 'user-1',
            email: 'test@example.com',
            passwordHash: 'hashed-password',
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(
            service.login({
                email: 'test@example.com',
                password: 'WrongPassword',
            }),
        ).rejects.toThrow(UnauthorizedException);

        expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
});
