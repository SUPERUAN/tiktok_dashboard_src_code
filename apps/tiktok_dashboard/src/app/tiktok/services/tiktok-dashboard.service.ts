import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  TiktokChannelInfo,
  TiktokDashboardData,
  TiktokVideo,
  TiktokVideosResponse,
} from '../models/tiktok-video.model';

@Injectable({
  providedIn: 'root',
})
export class TiktokDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/tiktok';

  getLoginUrl(): string {
    return `${this.baseUrl}/login`;
  }

  getDashboardData(): Observable<TiktokDashboardData> {
    return this.http
      .get<TiktokVideosResponse>(`${this.baseUrl}/videos`)
      .pipe(
        map((response) => ({
          channel: this.mapChannel(response?.channel),
          videos: this.mapVideos(response?.videos),
        })),
      );
  }

  private mapChannel(channel?: TiktokChannelInfo | null): TiktokChannelInfo {
    return {
      displayName: channel?.displayName || '',
      username: channel?.username || '',
      followerCount: Number(channel?.followerCount || 0),
      likesCount: Number(channel?.likesCount || 0),
    };
  }

  private mapVideos(videos?: TiktokVideo[] | null): TiktokVideo[] {
    if (!Array.isArray(videos)) {
      return [];
    }

    return videos.map((video) => ({
      ...video,
      id: video?.id || '',
      title: video?.title || '',
      video_description: video?.video_description || '',
      share_url: video?.share_url || '',
      cover_image_url: video?.cover_image_url || '',
      create_time: video?.create_time || 0,
      duration: video?.duration || 0,
      like_count: video?.like_count || 0,
      comment_count: video?.comment_count || 0,
      share_count: video?.share_count || 0,
      view_count: video?.view_count || 0,
    }));
  }
}