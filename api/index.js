// Load environment variables
require('dotenv').config();

const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

let app = null;

async function bootstrap() {
  if (app) {
    return app;
  }

  try {
    const { AppModule } = require('../dist/app.module');
    
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
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
    
    return app.getHttpAdapter().getInstance();
  } catch (error) {
    console.error('Failed to initialize NestJS app:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    const server = await bootstrap();
    return server(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};