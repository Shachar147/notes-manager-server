import { AppDataSource } from '../../config/database';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../config/constants';

export class AuthService {
    private userRepository = AppDataSource.getRepository(User);

    async register(email: string, password: string): Promise<{ user: User; token: string }> {
        email = email.toLocaleLowerCase();

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = this.userRepository.create({
            email: email,
            password: hashedPassword,
            salt
        });

        await this.userRepository.save(user);

        // Generate JWT token
        const token = this.generateToken(user);

        return { user, token };
    }

    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        email = email.toLocaleLowerCase();
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { userId: user.id, email: user.email },
            JWT_CONFIG.SECRET,
            { expiresIn: JWT_CONFIG.EXPIRES_IN }
        );
    }

    async validateToken(token: string): Promise<User> {
        try {
            const decoded = jwt.verify(token, JWT_CONFIG.SECRET) as { userId: string };
            const user = await this.userRepository.findOne({ where: { id: decoded.userId } });
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async getAllUsers(): Promise<{ id: string; email: string }[]> {
        const users = await this.userRepository.find();
        return users.map(user => ({ id: user.id, email: user.email }));
    }
} 