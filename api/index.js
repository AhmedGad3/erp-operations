const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');

const server = express();
let app = null;

async function bootstrap() {
  if (!app) {
    // Import AppModule من dist
    const { AppModule } = require('../dist/app.module');
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

module.exports = async (req, res) => {
  const appServer = await bootstrap();
  return appServer(req, res);
};