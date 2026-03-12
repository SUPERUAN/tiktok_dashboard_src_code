import { Component, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { TiktokApiService } from '../services/tiktok-api.service';
import { TiktokVideo } from '../models/tiktok-video.model';

@Component({
  selector: 'app-tiktok-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tiktok-dashboard-page.component.html',
  styleUrl: './tiktok-dashboard-page.component.scss',
})
export class TiktokDashboardPageComponent {
  private readonly tiktokApi = inject(TiktokApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  videos: TiktokVideo[] = [];
  loading = false;
  errorMessage = '';

  loginWithTiktok(): void {
    window.location.href = this.tiktokApi.getLoginUrl();
  }

  loadVideos(): void {
    console.log('loadVideos clicked');
    this.loading = true;
    this.errorMessage = '';

    this.tiktokApi.getVideos().subscribe({
      next: (response) => {
        console.log('RAW response:', response);

        this.zone.run(() => {
          this.videos = Array.isArray(response?.videos) ? [...response.videos] : [];
          this.loading = false;

          console.log('videos after set:', this.videos);
          console.log('videos length after set:', this.videos.length);

          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('videos error:', error);

        this.zone.run(() => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || error?.message || 'Failed to load videos';
          this.cdr.detectChanges();
        });
      },
    });
  }

  exportExcel(): void {
    if (!this.videos.length) {
      this.errorMessage = 'No videos to export';
      return;
    }

    const rows = this.videos.map((video, index) => ({
      No: index + 1,
      Id: video.id,
      Title: video.title ?? '',
      Description: video.video_description ?? '',
      Views: video.view_count ?? 0,
      Likes: video.like_count ?? 0,
      Comments: video.comment_count ?? 0,
      Shares: video.share_count ?? 0,
      DurationSeconds: video.duration ?? 0,
      ShareUrl: video.share_url ?? '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'TikTok Videos');
    XLSX.writeFile(workbook, 'tiktok-videos.xlsx');
  }
}