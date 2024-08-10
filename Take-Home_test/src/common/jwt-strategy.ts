import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/auth/schema/user.schema';

@Injectable()
export class JwtPassportStrategy extends PassportStrategy(Strategy) {
  @InjectModel('User')
  private readonly userModel: Model<User>;
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Validates the payload of a JWT.
   *
   * @param {any} payload - The payload of the JWT to validate.
   * @return {Promise<any>} - A Promise that resolves to the validated user if the payload is valid, otherwise throws an UnauthorizedException.
   */
  async validate(payload: any) {
    if (!payload) throw new UnauthorizedException();

    console.log(payload);

    const user = await this.userModel.findById(payload.id);

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
