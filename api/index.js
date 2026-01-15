// Load environment variables
require('dotenv').config();

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const express = require('express');
const { ExpressAdapter } = require('@nestjs/platform-express');

// Create express instance
const expressApp = express();
let isAppInitialized = false;

async function bootstrap() {
  if (isAppInitialized) {
    return expressApp;
  }

  try {
    const { AppModule } = require('../dist/app.module');
    
    // Create NestJS app with Express adapter
    const app = await NestFactory.create(
      AppModule, 
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn', 'log'],
      }
    );

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
    isAppInitialized = true;
    
    console.log('✅ NestJS app initialized successfully');
    return expressApp;
    
  } catch (error) {
    console.error('❌ Failed to initialize NestJS app:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const app = await bootstrap();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
};