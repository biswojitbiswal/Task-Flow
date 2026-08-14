import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.setGlobalPrefix('api')

  app.enableVersioning({
    type: VersioningType.URI
  })

  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('TaskFlow backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application starts on ${process.env.PORT ?? 3000}`);
}
bootstrap();
