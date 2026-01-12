import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './Auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardModule } from './Dashboard/dashboard.module';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'ar',
      loaderOptions: {
        path: path.join(__dirname, '../src/i18n/'), // عدلنا المسار
        watch: process.env.NODE_ENV !== 'production', // watch بس في development
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },        
        AcceptLanguageResolver,                          
        new HeaderResolver(['x-lang']),                  
      ],
    }),
    MongooseModule.forRoot(process.env.DB_URL as string),
    AuthModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}