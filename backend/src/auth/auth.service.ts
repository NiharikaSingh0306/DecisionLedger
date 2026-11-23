
import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }
    // REGISTER
    async register(registerDto: RegisterDto) {
        const { email, password } = registerDto;
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });
        return {
            message: 'User registered successfully',
            user,
        };
    }
    // LOGIN
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        // Compare entered password with stored hash
        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }
        // Generate JWT access token
        const payload = {
            sub: user.id,
            email: user.email,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
            },
        };
    }
}
