import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { TokenService } from '../common/jwt/jwt.service';
import * as bcrypt from 'bcrypt';
import { ConflictException, BadRequestException, UnauthorizedException, HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;
  let tokenService: TokenService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockTokenService = {
    handleCreateTokens: jest.fn(),
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken('User'));
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });



  describe('signup', () => {
    it('should throw a ConflictException if email exists', async () => {
      const dto = { name: 'John Doe', email: 'john@example.com', password: '123456' };

      const existingUser: any = {
        _id: 'someId',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
      } as unknown as Document & User;

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(existingUser);

      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully', async () => {
      const dto = { email: 'john@example.com', password: '123456' };
      const hashedPassword = await bcrypt.hash('123456', 10); // Ensure password is hashed
      const user = {
        _id: 'someId',
        email: 'john@example.com',
        password: hashedPassword,
      };

      const tokens = {
        accessToken: 'someAccessToken',
        refreshToken: 'someRefreshToken',
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true); // Ensure bcrypt.compare returns true
      jest.spyOn(tokenService, 'handleCreateTokens').mockResolvedValueOnce(tokens);

      const result = await service.loginUser(dto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'User logged in successfully',
        data: user,
        token: tokens,
      });
    });

    it('should throw a BadRequestException if email is invalid', async () => {
      const dto = { email: 'invalid@example.com', password: '123456' };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

      await expect(service.loginUser(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw a BadRequestException if password is invalid', async () => {
      const dto = { email: 'john@example.com', password: 'wrongPassword' };
      const hashedPassword = await bcrypt.hash('123456', 10); // Ensure password is hashed
      const user = {
        _id: 'someId',
        email: 'john@example.com',
        password: hashedPassword,
      };

      jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false); // Ensure bcrypt.compare returns false

      await expect(service.loginUser(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'someRefreshToken';
      const decoded = { _id: 'someId' };
      const user = {
        _id: 'someId',
        email: 'john@example.com',
      };
      const tokens = {
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      };

      jest.spyOn(tokenService, 'verifyToken').mockReturnValueOnce(decoded);
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(user);
      jest.spyOn(tokenService, 'handleCreateTokens').mockResolvedValueOnce(tokens);

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Tokens refreshed successfully',
        tokens,
      });
    });

    it('should throw an UnauthorizedException if user is not found', async () => {
      const refreshToken = 'someRefreshToken';
      const decoded = { _id: 'someId' };

      jest.spyOn(tokenService, 'verifyToken').mockReturnValueOnce(decoded);
      jest.spyOn(userModel, 'findById').mockResolvedValueOnce(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });


});


