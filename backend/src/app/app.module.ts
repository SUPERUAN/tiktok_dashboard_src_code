import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TiktokController } from './tiktok/tiktok.controller';
import { TiktokService } from './tiktok/tiktok.service';
import { TiktokModule } from './tiktok/tiktok.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TiktokModule,
  ],
  controllers: [AppController, TiktokController],
  providers: [AppService, TiktokService],
})
export class AppModule {}
