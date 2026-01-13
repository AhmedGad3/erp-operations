import * as dotenv from 'dotenv';
import 'module-alias/register';

dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

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

// Serverless Handler للـ Vercel
const server = express();
let nestApp: any = null;

const handler = async (req: any, res: any) => {
  if (!nestApp) {
    const expressAdapter = new ExpressAdapter(server);
    nestApp = await NestFactory.create(AppModule, expressAdapter, {
      logger: ['error', 'warn', 'log'],
    });

    nestApp.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    });

    nestApp.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await nestApp.init();
  }

  return server(req, res);
};

// للتشغيل المحلي
if (process.env.VERCEL !== '1' && require.main === module) {
  bootstrap();
}

// Export للـ Vercel
module.exports = handler;
module.exports.default = handler;