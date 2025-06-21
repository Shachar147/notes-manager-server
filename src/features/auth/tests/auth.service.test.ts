import { AuthService } from '../auth.service';
import { User } from '../user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../../config/constants';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn()
};

const { AppDataSource } = require('../../../config/database');

const mockUser: User = {
  id: 'user1',
  email: 'test@example.com',
  password: 'hashedPassword',
  salt: 'salt',
  googleId: undefined,
  profilePicture: undefined,
  createdAt: new Date(),
  updatedAt: new Date()
} as any;

const mockGoogleUser: User = {
  id: 'user2',
  email: 'google@example.com',
  password: undefined,
  salt: undefined,
  googleId: 'google123',
  profilePicture: 'https://example.com/picture.jpg',
  createdAt: new Date(),
  updatedAt: new Date()
} as any;

describe('AuthService', () => {
  let authService: AuthService;
  let bcryptMock: jest.Mocked<typeof bcrypt>;
  let jwtMock: jest.Mocked<typeof jwt>;

  beforeEach(() => {
    AppDataSource.getRepository.mockReturnValue(mockUserRepository);
    authService = new AuthService();
    
    bcryptMock = bcrypt as any;
    jwtMock = jwt as any;
    
    jest.clearAllMocks();
  });

  describe('upsertGoogleUser', () => {
    it('should create new user when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockGoogleUser);
      mockUserRepository.save.mockResolvedValue(mockGoogleUser);

      const result = await authService.upsertGoogleUser('google123', 'google@example.com', 'https://example.com/picture.jpg');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'google@example.com' } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'google@example.com',
        googleId: 'google123',
        profilePicture: 'https://example.com/picture.jpg'
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockGoogleUser);
      expect(result).toEqual(mockGoogleUser);
    });

    it('should return existing user when user exists with googleId', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockGoogleUser);

      const result = await authService.upsertGoogleUser('google123', 'google@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'google@example.com' } });
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockGoogleUser);
    });

    it('should update existing user when user exists but googleId is not set', async () => {
      const existingUser = { ...mockUser, googleId: undefined };
      const updatedUser = { ...existingUser, googleId: 'google123', profilePicture: 'https://example.com/picture.jpg' };
      
      mockUserRepository.findOne.mockResolvedValue(existingUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await authService.upsertGoogleUser('google123', 'test@example.com', 'https://example.com/picture.jpg');

      expect(mockUserRepository.save).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should handle repository errors', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('DB error'));

      await expect(authService.upsertGoogleUser('google123', 'test@example.com'))
        .rejects.toThrow('DB error');
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptMock.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwtMock.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = await authService.register('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcryptMock.genSalt).toHaveBeenCalled();
      expect(bcryptMock.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedPassword',
        salt: 'salt'
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
      expect(jwtMock.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        JWT_CONFIG.SECRET,
        { expiresIn: JWT_CONFIG.EXPIRES_IN }
      );
      expect(result).toEqual({ user: mockUser, token: 'jwt-token' });
    });

    it('should convert email to lowercase', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptMock.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwtMock.sign as jest.Mock).mockReturnValue('jwt-token');

      await authService.register('TEST@EXAMPLE.COM', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedPassword',
        salt: 'salt'
      });
    });

    it('should throw error when user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(authService.register('test@example.com', 'password123'))
        .rejects.toThrow('User with this email already exists');
      
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle bcrypt errors', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptMock.genSalt as jest.Mock).mockRejectedValue(new Error('bcrypt error'));

      await expect(authService.register('test@example.com', 'password123'))
        .rejects.toThrow('bcrypt error');
    });

    it('should handle repository save errors', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      (bcryptMock.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcryptMock.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockRejectedValue(new Error('Save error'));

      await expect(authService.register('test@example.com', 'password123'))
        .rejects.toThrow('Save error');
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      (jwtMock.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcryptMock.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(jwtMock.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        JWT_CONFIG.SECRET,
        { expiresIn: JWT_CONFIG.EXPIRES_IN }
      );
      expect(result).toEqual({ user: mockUser, token: 'jwt-token' });
    });

    it('should convert email to lowercase', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(true);
      (jwtMock.sign as jest.Mock).mockReturnValue('jwt-token');

      await authService.login('TEST@EXAMPLE.COM', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('User not found');
      
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid password');
      
      expect(jwtMock.sign).not.toHaveBeenCalled();
    });

    it('should handle bcrypt compare errors', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcryptMock.compare as jest.Mock).mockRejectedValue(new Error('bcrypt error'));

      await expect(authService.login('test@example.com', 'password123'))
        .rejects.toThrow('bcrypt error');
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      (jwtMock.sign as jest.Mock).mockReturnValue('jwt-token');

      const result = authService.generateToken(mockUser);

      expect(jwtMock.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        JWT_CONFIG.SECRET,
        { expiresIn: JWT_CONFIG.EXPIRES_IN }
      );
      expect(result).toBe('jwt-token');
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      const decodedToken = { userId: 'user1' };
      jwtMock.verify.mockReturnValue(decodedToken as any);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await authService.validateToken('valid-token');

      expect(jwtMock.verify).toHaveBeenCalledWith('valid-token', JWT_CONFIG.SECRET);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user1' } });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when token is invalid', async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow('Invalid token');
      
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const decodedToken = { userId: 'user1' };
      jwtMock.verify.mockReturnValue(decodedToken as any);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.validateToken('valid-token'))
        .rejects.toThrow('Invalid token');
    });

    it('should handle jwt verify errors', async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error('JWT error');
      });

      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow('Invalid token');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with limited fields', async () => {
      const users = [mockUser, mockGoogleUser];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await authService.getAllUsers();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual([
        { id: mockUser.id, email: mockUser.email, googleId: mockUser.googleId, profilePicture: mockUser.profilePicture },
        { id: mockGoogleUser.id, email: mockGoogleUser.email, googleId: mockGoogleUser.googleId, profilePicture: mockGoogleUser.profilePicture }
      ]);
    });

    it('should return empty array when no users exist', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await authService.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      mockUserRepository.find.mockRejectedValue(new Error('DB error'));

      await expect(authService.getAllUsers())
        .rejects.toThrow('DB error');
    });
  });
}); 