import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from 'src/auth/schema/user.schema';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from 'src/common/auth-guard/auth.guard';
import { JwtPassportStrategy } from 'src/common/jwt-strategy';
import { BullModule } from '@nestjs/bull';
import { DELETE_USER_QUEUE } from './constants/queue.constant';
import { RedisConsumerModule } from './redis_user_queue.ts/user_queue.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule.forRoot(),
    UserModule,
    RedisConsumerModule,
    BullModule.registerQueue({
      name: DELETE_USER_QUEUE,
    }),
  ],
  controllers: [UserController],
  providers: [UserService, ConfigModule, JwtAuthGuard, JwtPassportStrategy],
  exports: [UserService],
})
export class UserModule {}
