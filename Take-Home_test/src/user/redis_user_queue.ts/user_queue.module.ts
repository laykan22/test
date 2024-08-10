// user_queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from '../user.service';
import {
  DELETE_USER_QUEUE,
  QUEUE_BULL_ROUTE,
} from '../constants/queue.constant';
import { User, UserSchema } from 'src/auth/schema/user.schema';
import { UserDeletionProcessor } from './user_queue.controller';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.getOrThrow<string>('REDIS_HOST', 'localhost'),
          port: configService.getOrThrow<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: DELETE_USER_QUEUE,
    }),
    BullBoardModule.forRoot({
      route: QUEUE_BULL_ROUTE,
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: DELETE_USER_QUEUE,
      adapter: BullAdapter,
    }),
  ],
  providers: [UserDeletionProcessor, UserService],
  exports: [BullModule],
})
export class RedisConsumerModule {}
