import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TiktokVideosResponse } from '../models/tiktok-video.model';

@Injectable({
  providedIn: 'root',
})
export class TiktokApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/tiktok';

  getLoginUrl(): string {
    return `${this.baseUrl}/login`;
  }

  getVideos(): Observable<TiktokVideosResponse> {
    return this.http.get<TiktokVideosResponse>(`${this.baseUrl}/videos`);
  }
}