import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { TokenService } from '../common/jwt/jwt.service';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<User>,
    private readonly tokenService: TokenService,
  ) { }

  /**
   * Sign up a new user.
   *
   * @param {CreateUserDto} dto - The data transfer object containing the user's first name, last name, email, and password.
   * @return {Promise<{statusCode: number, message: string, data: User, token: string}>} - A promise that resolves to an object containing the status code, message, created user data, and token.
   * @throws {ConflictException} - If the email already exists and the user needs to login.
   */
  async signup(dto: CreateUserDto) {
    const { name, email, password } = dto;

    const emailExist = await this.userModel.findOne({ email });

    if (emailExist)
      throw new ConflictException('Email already exists, please login');

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: createdUser,
    };
  }

  /**
   * Authenticates a user by checking the provided email and password against the database.
   *
   * @param {LoginUserDto} dto - The data transfer object containing the user's email and password.
   * @return {Promise<{statusCode: number, message: string, data: User, token: string}>} - A promise that resolves to an object containing the status code, message, user data, and token.
   * @throws {BadRequestException} - If the email or password is invalid.
   */
  async loginUser(dto: LoginUserDto) {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email: email.toLowerCase() });

    if (!user) throw new BadRequestException('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid)
      throw new BadRequestException('Invalid email or password');

    const token = await this.tokenService.handleCreateTokens(user.id, email);

    return {
      statusCode: HttpStatus.OK,
      message: 'User logged in successfully',
      data: user,
      token,
    };
  }

  /**
   * Refreshes the access and refresh tokens for a user.
   *
   * @param {string} refreshToken - The refresh token to be used for token refresh.
   * @return {Promise<{statusCode: number, message: string, tokens: {accessToken: string, refreshToken: string}}>} - A promise that resolves to an object containing the status code, message, and the new access and refresh tokens.
   * @throws {UnauthorizedException} - If the user is not found in the database.
   */
  async refreshTokens(refreshToken: string) {
    const decoded = this.tokenService.verifyToken(refreshToken);

    const user = await this.userModel.findById(decoded._id);

    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.tokenService.handleCreateTokens(
      user.id,
      user.email,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      tokens,
    };
  }
}
