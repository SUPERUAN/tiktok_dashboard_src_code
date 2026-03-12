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
    async exchangeToken(
        @Query('code') code: string,
        @Res() res: Response,
    ) {
        if (!code) {
            return res.status(400).json({ message: 'Missing code' });
        }

        try {
            await this.tiktokService.exchangeCodeForToken(code);

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

            return res.redirect(`${frontendUrl}?login=success`);
        } catch (error: any) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.message ||
                'token_exchange_failed';

            return res.redirect(
                `${frontendUrl}?login=error&message=${encodeURIComponent(message)}`
            );
        }
    }

    @Get('videos')
    async getVideos() {
        console.log('GET /api/tiktok/videos called');
        const videos = await this.tiktokService.getVideosWithAllFields();
        console.log('videos count:', videos.length);

        return {
            count: videos.length,
            videos,
        };
    }
}