import { Component, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TiktokApiService } from '../services/tiktok-api.service';
import {
  TiktokChannelInfo,
  TiktokVideo,
  TiktokVideosResponse,
} from '../models/tiktok-video.model';

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

  private readonly worksheetName = 'TikTok Dashboard';
  private readonly exportFileName = 'tiktok-dashboard.xlsx';

  private readonly imageHeightPx = 250;
  private readonly imageWidthPx = 180;

  private readonly defaultText = '-';
  private readonly noVideosMessage = 'No videos to export';
  private readonly exportFailedMessage = 'Failed to export Excel';
  private readonly loadVideosFailedMessage = 'Failed to load videos';

  private readonly channelTopicRow = 1;
  private readonly channelHeaderRow = 2;
  private readonly channelDataRow = 3;

  private readonly videosTopicRow = 5;
  private readonly videosHeaderRow = 6;
  private readonly videosDataStartRow = 7;

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
    window.location.href = this.tiktokApi.getLoginUrl();
  }

  loadVideos(): void {
    this.loading = true;
    this.errorMessage = '';

    this.tiktokApi.getVideos().subscribe({
      next: (response: TiktokVideosResponse) => {
        this.zone.run(() => {
          this.videos = Array.isArray(response?.videos)
            ? [...response.videos]
            : [];

          this.channel = {
            displayName: response?.channel?.displayName || '',
            username: response?.channel?.username || '',
            followerCount: Number(response?.channel?.followerCount || 0),
            likesCount: Number(response?.channel?.likesCount || 0),
          };

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
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(this.worksheetName);

      worksheet.columns = [
        { key: 'cover', width: 28 }, // A
        { key: 'id', width: 24 }, // B
        { key: 'title', width: 42 }, // C
        { key: 'description', width: 42 }, // D
        { key: 'createTime', width: 24 }, // E
        { key: 'views', width: 14 }, // F
        { key: 'likes', width: 14 }, // G
        { key: 'comments', width: 14 }, // H
        { key: 'shares', width: 14 }, // I
        { key: 'duration', width: 14 }, // J
        { key: 'link', width: 48 }, // K
        { key: 'coverUrl', width: 10 }, // L hidden
      ];

      worksheet.getColumn('coverUrl').hidden = true;

      this.buildChannelSection(worksheet);
      this.buildVideosSectionHeader(worksheet);

      for (let i = 0; i < this.videos.length; i++) {
        const video = this.videos[i];
        const rowNumber = this.videosDataStartRow + i;

        worksheet.getRow(rowNumber).values = [
          video.cover_image_url ? '' : this.defaultText,
          video.id || this.defaultText,
          video.title || this.defaultText,
          video.video_description || this.defaultText,
          this.formatUnixTime(video.create_time),
          video.view_count || 0,
          video.like_count || 0,
          video.comment_count || 0,
          video.share_count || 0,
          video.duration || 0,
          video.share_url || this.defaultText,
          video.cover_image_url || '',
        ];

        const row = worksheet.getRow(rowNumber);
        row.height = this.pixelsToPoints(this.imageHeightPx);
        row.alignment = { vertical: 'middle' };

        row.eachCell((cell, colNumber) => {
          if (colNumber === 12) {
            return;
          }

          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        this.setCoverImageFormula(worksheet, rowNumber);
        this.setLinkCell(worksheet, rowNumber, video.share_url);
        this.setVideoNumericFormatting(worksheet, rowNumber);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      saveAs(blob, this.exportFileName);
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

  private buildChannelSection(worksheet: ExcelJS.Worksheet): void {
    worksheet.mergeCells(this.channelTopicRow, 1, this.channelTopicRow, 4);

    const topicCell = worksheet.getCell(this.channelTopicRow, 1);
    topicCell.value = 'Channel';
    topicCell.font = { bold: true, size: 12 };
    topicCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    topicCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAF7' },
    };

    const headerRow = worksheet.getRow(this.channelHeaderRow);
    headerRow.values = [
      'Channel Display Name',
      'Channel Username',
      'Channel Follower',
      'Channel Likes',
    ];
    headerRow.height = 22;
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F3F3' },
      };
    });

    const dataRow = worksheet.getRow(this.channelDataRow);
    dataRow.values = [
      this.channel.displayName || this.defaultText,
      this.channel.username || this.defaultText,
      this.channel.followerCount || 0,
      this.channel.likesCount || 0,
    ];
    dataRow.height = 22;

    dataRow.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 ? 'left' : 'right',
      };

      if (colNumber === 2 || colNumber === 3) {
        cell.numFmt = '#,##0';
      }
    });

    worksheet.getColumn(1).width = 24;
    worksheet.getColumn(2).width = 24;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 18;
  }

  private buildVideosSectionHeader(worksheet: ExcelJS.Worksheet): void {
    worksheet.mergeCells(this.videosTopicRow, 1, this.videosTopicRow, 11);

    const topicCell = worksheet.getCell(this.videosTopicRow, 1);
    topicCell.value = 'Videos';
    topicCell.font = { bold: true, size: 12 };
    topicCell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };
    topicCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFCE4D6' },
    };

    const headerRow = worksheet.getRow(this.videosHeaderRow);
    headerRow.values = [
      'Cover',
      'Id',
      'Title',
      'Description',
      'Create Time',
      'Views',
      'Likes',
      'Comments',
      'Shares',
      'Duration',
      'Link',
      'CoverUrl',
    ];
    headerRow.height = 22;
    headerRow.font = { bold: true };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
    };

    headerRow.eachCell((cell, colNumber) => {
      if (colNumber === 12) {
        return;
      }

      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F3F3' },
      };
    });
  }

  private setCoverImageFormula(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
  ): void {
    const coverCell = worksheet.getCell(`A${rowNumber}`);
    const coverUrlCell = worksheet.getCell(`L${rowNumber}`);

    if (
      typeof coverUrlCell.value === 'string' &&
      coverUrlCell.value.startsWith('https://')
    ) {
      coverCell.value = {
        formula: `_xlfn.IMAGE(L${rowNumber}, "cover", 3, ${this.imageHeightPx}, ${this.imageWidthPx})`,
      };
      coverCell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    } else {
      coverCell.value = this.defaultText;
    }
  }

  private setLinkCell(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
    shareUrl?: string,
  ): void {
    const linkCell = worksheet.getCell(`K${rowNumber}`);

    if (!shareUrl) {
      linkCell.value = this.defaultText;
      return;
    }

    linkCell.value = {
      text: shareUrl,
      hyperlink: shareUrl,
    };
    linkCell.font = {
      color: { argb: 'FF0563C1' },
      underline: true,
    };
  }

  private setVideoNumericFormatting(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
  ): void {
    const numericColumns = ['F', 'G', 'H', 'I', 'J'];

    for (const column of numericColumns) {
      const cell = worksheet.getCell(`${column}${rowNumber}`);
      cell.numFmt = '#,##0';
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'right',
      };
    }
  }

  private pixelsToPoints(px: number): number {
    return px * 0.75;
  }
}
