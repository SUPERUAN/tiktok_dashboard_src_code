import { Component, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TiktokDashboardService } from '../services/tiktok-dashboard.service';
import { TiktokExcelExportService } from '../services/tiktok-excel-export.service';
import {
  TiktokChannelInfo,
  TiktokVideo,
  TiktokDashboardData,
} from '../models/tiktok-video.model';

@Component({
  selector: 'app-tiktok-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tiktok-dashboard-page.component.html',
  styleUrl: './tiktok-dashboard-page.component.scss',
})
export class TiktokDashboardPageComponent {
  private readonly dashboardService = inject(TiktokDashboardService);
  private readonly excelExportService = inject(TiktokExcelExportService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  private readonly defaultText = '-';
  private readonly noVideosMessage = 'No videos to export';
  private readonly exportFailedMessage = 'Failed to export Excel';
  private readonly loadVideosFailedMessage = 'Failed to load videos';

  loading = false;
  errorMessage = '';

  videos: TiktokVideo[] = [];
  channel: TiktokChannelInfo = {
    displayName: '',
    username: '',
    followerCount: 0,
    likesCount: 0,
  };

  loginWithTiktok(): void {
    window.location.href = this.dashboardService.getLoginUrl();
  }

  loadVideos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.dashboardService.getDashboardData().subscribe({
      next: (data: TiktokDashboardData) => {
        this.zone.run(() => {
          this.videos = data.videos;
          this.channel = data.channel;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.zone.run(() => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            this.loadVideosFailedMessage;
          this.cdr.detectChanges();
        });
      },
    });
  }

  formatUnixTime(unixTime?: number): string {
    if (!unixTime) {
      return this.defaultText;
    }

    return new Date(unixTime * 1000).toLocaleString();
  }

  async exportExcel(): Promise<void> {
    if (!this.videos.length) {
      this.errorMessage = this.noVideosMessage;
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.excelExportService.exportDashboard(
        this.channel,
        this.videos,
      );
    } catch (error: any) {
      this.zone.run(() => {
        this.errorMessage = error?.message || this.exportFailedMessage;
        this.cdr.detectChanges();
      });
    } finally {
      this.zone.run(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }
}