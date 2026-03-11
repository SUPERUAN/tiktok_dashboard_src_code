import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TiktokController } from './tiktok/tiktok.controller';
import { TiktokService } from './tiktok/tiktok.service';
import { TiktokModule } from './tiktok/tiktok.module';

@Module({
  imports: [TiktokModule],
  controllers: [AppController, TiktokController],
  providers: [AppService, TiktokService],
})
export class AppModule {}
