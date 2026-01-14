require('dotenv').config();
const serverless = require('serverless-http');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');

let server;

async function bootstrap() {
  if (!server) {
    const { AppModule } = require('../dist/app.module');
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
      allowedHeaders: ['Content-Type','Authorization','Accept-Language'],
    });

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    await app.init();

    server = serverless(app.getHttpAdapter().getInstance(),{
  request: {
    payload: true
  }
});
  }
  return server;
}

module.exports = async (req, res) => {
  try {
    const handler = await bootstrap();
    return handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
