import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { TiktokService } from './tiktok.service';

@Controller('tiktok')
export class TiktokController {
    constructor(private readonly tiktokService: TiktokService) { }

    @Get('login')
    login(@Res() res: Response) {
        const loginUrl = this.tiktokService.getLoginUrl();
        return res.redirect(loginUrl);
    }

    @Get('exchange-token')
    async exchangeToken(@Query('code') code: string) {
        if (!code) {
            return { message: 'Missing code' };
        }

        const tokenData = await this.tiktokService.exchangeCodeForToken(code);
        return {
            message: 'Token exchange successful',
            tokenData,
        };
    }

    @Get('videos')
    async getVideos() {
        const videos = await this.tiktokService.getVideosWithAllFields();
        return {
            count: videos.length,
            videos,
        };
    }
}