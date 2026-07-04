import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Prefix all API routes with /api so they don't conflict with the SPA
  app.setGlobalPrefix('api');

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Serve the frontend SPA from the frontend/dist directory (built output).
  // Falls back to frontend/build for Create-React-App projects.
  const frontendDistPath = join(__dirname, '..', 'frontend', 'dist');
  const frontendBuildPath = join(__dirname, '..', 'frontend', 'build');
  const frontendPath = existsSync(frontendDistPath)
    ? frontendDistPath
    : frontendBuildPath;

  if (existsSync(frontendPath)) {
    // Serve static assets (JS, CSS, images, etc.)
    app.useStaticAssets(frontendPath);

    // Catch-all: serve index.html for any route not matched by the API or
    // static file middleware, enabling client-side routing in the SPA.
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('*', (_req: any, res: any) => {
      res.sendFile(join(frontendPath, 'index.html'));
    });
  } else {
    console.warn(
      'Frontend build not found. Expected at frontend/dist or frontend/build. ' +
      'The backend will serve API routes only.',
    );
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Aplicação rodando na porta ${port}`);
}

bootstrap();
