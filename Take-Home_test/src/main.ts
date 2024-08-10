import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // swagger configuration
  const config = new DocumentBuilder()
    .setTitle('My api')
    .setDescription('My API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
  console.log(
    'listening on port: http://localhost:3000/api',
    'swaggerLink: http://localhost:3000/api/docs',
    'Bull Queue: http://localhost:3000/api/queues',
  );
}
bootstrap();
