import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException, HttpStatus } from '@nestjs/common';
import { Document } from 'mongoose';
import { UserController } from '../user/user.controller'
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from './schema/user.schema';
import { RefreshTokenDto } from './dto/refresh-token.dto';


describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let mockUserModel: any; // Mocked model

  const mockUser = {
    _id: 'someId',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    save: jest.fn(),
    $isNew: false,
  } as unknown as Document & { _id: string; name: string; email: string; password: string; };

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };

    authService = {
      signup: jest.fn(),
      loginUser: jest.fn(),
      refreshTokens: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call AuthService.signup with the correct parameters', async () => {
      const dto: CreateUserDto = { name: 'John Doe', email: 'john@example.com', password: '123456' };
      const result = {
        statusCode: HttpStatus.CREATED,
        message: 'User created successfully',
        data: mockUser, // Use the mockUser with Document type
      };

      jest.spyOn(authService, 'signup').mockResolvedValue(result);

      expect(await controller.signup(dto)).toEqual(result);
      expect(authService.signup).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto: CreateUserDto = { name: 'John Doe', email: 'john@example.com', password: '123456' };

      jest.spyOn(authService, 'signup').mockRejectedValue(new ConflictException('Email already exists, please login'));

      await expect(controller.signup(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });
  describe('login', () => {
    it('should call AuthService.loginUser with the correct parameters', async () => {
      const dto: LoginUserDto = { email: 'john@example.com', password: '123456' };
      const result = {
        statusCode: HttpStatus.OK,
        message: 'User logged in successfully',
        data: {
          _id: 'someId',
          email: 'john@example.com',
          password: 'hashedPassword',
          // Mock additional Mongoose document properties if necessary
          save: jest.fn(),
          populate: jest.fn(),
          // ... any other properties that might be accessed during the test
        } as unknown as Document<unknown, {}, User> & User & Required<{ _id: unknown }>,
        token: {
          accessToken: 'someAccessToken',
          refreshToken: 'someRefreshToken',
        },
      };

      jest.spyOn(authService, 'loginUser').mockResolvedValue(result);

      expect(await controller.login(dto)).toEqual(result);
      expect(authService.loginUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('refreshToken', () => {
    it('should call AuthService.refreshTokens with the correct parameters', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'someRefreshToken' };
      const result = {
        statusCode: HttpStatus.OK,
        message: 'Tokens refreshed successfully',
        tokens: { accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' },
      };

      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(result);

      expect(await controller.refreshToken(dto)).toEqual(result);
      expect(authService.refreshTokens).toHaveBeenCalledWith(dto.refreshToken);
    });


  });
});