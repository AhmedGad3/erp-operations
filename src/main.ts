import * as dotenv from 'dotenv';
import 'module-alias/register';

dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';

// للتشغيل المحلي
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });
  
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

// للـ Vercel Serverless
const expressApp: Express = express();
let app: any;

async function createNestApp() {
  if (!app) {
    app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { 
        logger: ['error', 'warn', 'log'],
        abortOnError: false 
      }
    );
    
    app.enableCors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    });
    
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    
    await app.init();
  }
  return expressApp;
}

// Export للـ Vercel
export default async (req: any, res: any) => {
  const server = await createNestApp();
  return server(req, res);
};

// للتشغيل المحلي
if (require.main === module) {
  bootstrap();
}