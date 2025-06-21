import { Request, Response } from 'express';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { OAuth2Client } from 'google-auth-library';
import redisClient from '../../../config/redis';

// Mock console.error to suppress expected error logging during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock dependencies
jest.mock('../../../utils/response-utils', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn()
}));

jest.mock('../auth.service');
jest.mock('google-auth-library');
jest.mock('../../../config/redis');
jest.mock('../../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

const { sendSuccess, sendError } = require('../../../utils/response-utils');

const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  password: 'hashedPassword',
  salt: 'salt',
  googleId: undefined,
  profilePicture: undefined,
  notes: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockGoogleUser = {
  id: 'user2',
  email: 'google@example.com',
  password: null,
  salt: null,
  googleId: 'google123',
  profilePicture: 'https://example.com/picture.jpg',
  notes: [],
  createdAt: new Date(),
  updatedAt: new Date()
} as any;

describe('AuthController', () => {
  let authController: AuthController;
  let authService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockOAuth2Client: jest.Mocked<OAuth2Client>;
  let redisClientMock: jest.Mocked<typeof redisClient>;

  beforeEach(() => {
    authService = new (AuthService as any)();
    authController = new AuthController();
    
    // Inject mock service
    (authController as any).authService = authService;

    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    mockOAuth2Client = new (OAuth2Client as any)();
    redisClientMock = redisClient as any;

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const mockResult = { user: mockUser, token: 'jwt-token' };
      authService.register.mockResolvedValue(mockResult);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(authService.register).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        {
          user: {
            id: mockUser.id,
            email: mockUser.email
          },
          token: 'jwt-token'
        },
        201
      );
    });

    it('should return 400 error when email is missing', async () => {
      mockRequest.body = { password: 'password123' };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Email and password are required',
        400
      );
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should return 400 error when password is missing', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Email and password are required',
        400
      );
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('should return 409 error when user already exists', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const error = new Error('User with this email already exists');
      authService.register.mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'User with this email already exists',
        409
      );
    });

    it('should return 500 error for other service errors', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const error = new Error('Service error');
      authService.register.mockRejectedValue(error);

      await authController.register(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Internal server error',
        500,
        error
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const mockResult = { user: mockUser, token: 'jwt-token' };
      authService.login.mockResolvedValue(mockResult);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        {
          user: {
            id: mockUser.id,
            email: mockUser.email
          },
          token: 'jwt-token'
        }
      );
    });

    it('should return 400 error when email is missing', async () => {
      mockRequest.body = { password: 'password123' };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Email and password are required',
        400
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 error when password is missing', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Email and password are required',
        400
      );
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 401 error for invalid credentials', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };
      const error = new Error('User not found');
      authService.login.mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Invalid credentials',
        401
      );
    });

    it('should return 401 error for invalid password', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrongpassword' };
      const error = new Error('Invalid password');
      authService.login.mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Invalid credentials',
        401
      );
    });

    it('should return 500 error for other service errors', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password123' };
      const error = new Error('Service error');
      authService.login.mockRejectedValue(error);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Internal server error',
        500,
        error
      );
    });
  });

  describe('loginWithGoogle', () => {
    beforeEach(() => {
      // Mock the Google OAuth client
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue({
          sub: 'google123',
          email: 'google@example.com',
          name: 'Google User',
          picture: 'https://example.com/picture.jpg'
        })
      };
      
      (mockOAuth2Client.verifyIdToken as jest.Mock).mockResolvedValue(mockTicket);
    });

    it('should login with Google successfully', async () => {
      mockRequest.body = { idToken: 'google-id-token' };
      authService.upsertGoogleUser.mockResolvedValue(mockGoogleUser);
      authService.generateToken.mockReturnValue('jwt-token');

      await authController.loginWithGoogle(mockRequest as Request, mockResponse as Response);

      expect(mockOAuth2Client.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'google-id-token',
        audience: process.env.GOOGLE_CLIENT_ID
      });
      expect(authService.upsertGoogleUser).toHaveBeenCalledWith(
        'google123',
        'google@example.com',
        'https://example.com/picture.jpg'
      );
      expect(authService.generateToken).toHaveBeenCalledWith(mockGoogleUser);
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        {
          token: 'jwt-token',
          user: {
            id: mockGoogleUser.id,
            email: mockGoogleUser.email,
            picture: mockGoogleUser.profilePicture
          }
        }
      );
    });

    it('should return 400 error when idToken is missing', async () => {
      mockRequest.body = {};

      await authController.loginWithGoogle(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Missing idToken',
        400
      );
      expect(mockOAuth2Client.verifyIdToken).not.toHaveBeenCalled();
    });

    it('should return 404 error when Google payload is empty', async () => {
      mockRequest.body = { idToken: 'google-id-token' };
      const mockTicket = {
        getPayload: jest.fn().mockReturnValue(null)
      };
      (mockOAuth2Client.verifyIdToken as jest.Mock).mockResolvedValue(mockTicket);

      await authController.loginWithGoogle(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'User not found in google',
        404
      );
    });

    it('should return 401 error for invalid Google token', async () => {
      mockRequest.body = { idToken: 'invalid-token' };
      (mockOAuth2Client.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await authController.loginWithGoogle(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Invalid Google Token',
        401
      );
    });

    it('should handle service errors', async () => {
      mockRequest.body = { idToken: 'google-id-token' };
      authService.upsertGoogleUser.mockRejectedValue(new Error('Service error'));

      await authController.loginWithGoogle(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Invalid Google Token',
        401
      );
    });
  });

  describe('getUsers', () => {
    it('should return users from cache when available', async () => {
      const cachedUsers = { users: [mockUser, mockGoogleUser] };
      redisClientMock.get.mockResolvedValue(JSON.stringify(cachedUsers));

      await authController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(redisClientMock.get).toHaveBeenCalledWith('users:all');
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        expect.objectContaining({ users: expect.arrayContaining([expect.any(Object)]) })
      );
      expect(authService.getAllUsers).not.toHaveBeenCalled();
    });

    it('should fetch users from service and cache when not in cache', async () => {
      const users = [mockUser, mockGoogleUser];
      redisClientMock.get.mockResolvedValue(null);
      authService.getAllUsers.mockResolvedValue(users);
      redisClientMock.set.mockResolvedValue('OK' as any);

      await authController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(redisClientMock.get).toHaveBeenCalledWith('users:all');
      expect(authService.getAllUsers).toHaveBeenCalled();
      expect(redisClientMock.set).toHaveBeenCalledWith(
        'users:all',
        JSON.stringify({ users }),
        'EX',
        expect.any(Number)
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        { users }
      );
    });

    it('should handle service errors', async () => {
      redisClientMock.get.mockResolvedValue(null);
      const error = new Error('Service error');
      authService.getAllUsers.mockRejectedValue(error);

      await authController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Failed to fetch users',
        500,
        error
      );
    });

    it('should handle Redis errors gracefully', async () => {
      redisClientMock.get.mockRejectedValue(new Error('Redis error'));

      await authController.getUsers(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Failed to fetch users',
        500,
        expect.any(Error)
      );
    });
  });
}); 