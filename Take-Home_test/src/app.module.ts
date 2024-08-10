import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { RedisConsumerModule } from './user/redis_user_queue.ts/user_queue.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/medical'),
    AuthModule,
    UserModule,
    RedisConsumerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
