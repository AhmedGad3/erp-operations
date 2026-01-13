import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import type { Request, Response } from 'express';

// Import AppModule من dist
const getAppModule = () => {
  // في production هيكون compiled
  if (process.env.NODE_ENV === 'production') {
    return require('../dist/app.module').AppModule;
  }
  // في development
  return require('../src/app.module').AppModule;
};

const server = express();
let app: any;

async function bootstrap() {
  if (!app) {
    const AppModule = getAppModule();
    const nestAdapter = new ExpressAdapter(server);
    
    app = await NestFactory.create(AppModule, nestAdapter, {
      logger: ['error', 'warn'],
    });

    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    });

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();
  }
  return server;
}

export default async (req: Request, res: Response) => {
  const server = await bootstrap();
  return server(req, res);
};