import { JwtService } from '@nestjs/jwt';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Asynchronously generates a JWT token with the given user ID, email, and time-to-live (ttl).
   *
   * @param {string} userId - The ID of the user for whom the token is being generated.
   * @param {string} email - The email associated with the user.
   * @param {string} ttl - The time-to-live of the token in seconds.
   * @return {Promise<string>} A promise that resolves to the generated JWT token.
   */
  async generateToken(userId: string, email: string, ttl: string) {
    return this.jwtService.signAsync(
      {
        id: userId,
        email,
      },
      {
        expiresIn: ttl,
      },
    );
  }

  /**
   * @description Asynchronously creates and returns an object containing an access token and a refresh token.
   * @param {string | number} userId - The ID of the user for whom the tokens are being created.
   * @param {string} userType - The type of user for whom the tokens are being created.
   * @return {Promise<{ accessToken: string; refreshToken: string }>} - A promise that resolves to an object containing the access token and refresh token.
   * @throws {InternalServerErrorException} - If there is an error creating the tokens.
   */
  async handleCreateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const accessToken = await this.generateToken(userId, email, '1d');

      const refreshToken = await this.generateToken(userId, email, '30d');

      return { accessToken, refreshToken };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  /**
   * Verifies a given JWT token using the secret key stored in the configuration service.
   *
   * @param {string} token - The JWT token to be verified.
   * @return {object} The decoded token payload if verification is successful.
   */
  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }
}
