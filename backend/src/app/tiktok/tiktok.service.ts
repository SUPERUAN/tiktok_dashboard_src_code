import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TiktokService {
    private accessToken: string | null = null;

    getLoginUrl() {
        const clientKey = process.env.TIKTOK_CLIENT_KEY;
        const redirectUri = encodeURIComponent(process.env.TIKTOK_REDIRECT_URI || '');
        const scope = encodeURIComponent('user.info.basic,user.info.stats,video.list');
        const state = 'test123';

        return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
    }

    async exchangeCodeForToken(code: string) {
        const params = new URLSearchParams();
        params.append('client_key', process.env.TIKTOK_CLIENT_KEY || '');
        params.append('client_secret', process.env.TIKTOK_CLIENT_SECRET || '');
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', process.env.TIKTOK_REDIRECT_URI || '');

        const response = await axios.post(
            'https://open.tiktokapis.com/v2/oauth/token/',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        this.accessToken = response.data.access_token;
        return response.data;
    }

    async getVideoIds() {
        if (!this.accessToken) {
            throw new Error('No access token. Please login first.');
        }

        const response = await axios.post(
            'https://open.tiktokapis.com/v2/video/list/?fields=id',
            {
                max_count: 20,
            },
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data?.data?.videos || [];
    }

    async getVideosWithAllFields() {
        if (!this.accessToken) {
            throw new Error('No access token. Please login first.');
        }

        const videoList = await this.getVideoIds();
        const videoIds = videoList.map((v: any) => v.id).filter(Boolean);

        if (videoIds.length === 0) {
            return [];
        }

        const fields = [
            'id',
            'create_time',
            'cover_image_url',
            'share_url',
            'video_description',
            'duration',
            'height',
            'width',
            'title',
            'embed_html',
            'embed_link',
            'like_count',
            'comment_count',
            'share_count',
            'view_count',
        ].join(',');

        const response = await axios.post(
            `https://open.tiktokapis.com/v2/video/query/?fields=${fields}`,
            {
                filters: {
                    video_ids: videoIds.slice(0, 20),
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data?.data?.videos || [];
    }
}