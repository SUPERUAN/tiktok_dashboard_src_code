import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TiktokService {
  private accessToken: string | null = null;
  private readonly authState = 'test123';

  getLoginUrl() {
    const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    const redirectUri = process.env.TIKTOK_REDIRECT_URI || '';

    const scope = [
      'user.info.basic',
      'user.info.profile',
      'user.info.stats',
      'video.list',
    ].join(',');

    const params = new URLSearchParams({
      client_key: clientKey,
      scope,
      response_type: 'code',
      redirect_uri: redirectUri,
      state: this.authState,
      disable_auto_auth: '1',
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
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
      },
    );

    this.accessToken =
      response.data?.access_token || response.data?.data?.access_token || null;

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
      },
    );

    return response.data?.data?.videos || [];
  }

  async getUserInfo() {
    if (!this.accessToken) {
      throw new Error('No access token. Please login first.');
    }

    const fields = [
      'display_name',
      'username',
      'follower_count',
      'likes_count',
      'video_count',
      'avatar_url',
    ].join(',');

    const response = await axios.get(
      `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    return response.data?.data?.user || response.data?.data || {};
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
      },
    );

    return response.data?.data?.videos || [];
  }

  async getVideosDashboard() {
    if (!this.accessToken) {
      throw new Error('No access token. Please login first.');
    }

    const [userInfo, videos] = await Promise.all([
      this.getUserInfo(),
      this.getVideosWithAllFields(),
    ]);

    return {
      channel: {
        displayName: userInfo?.display_name || '',
        username: userInfo?.username || '',
        followerCount: Number(userInfo?.follower_count || 0),
        likesCount: Number(userInfo?.likes_count || 0),
      },
      videos: videos || [],
    };
  }
}
