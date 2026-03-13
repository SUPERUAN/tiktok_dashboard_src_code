import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TiktokChannelInfo, TiktokVideo } from '../models/tiktok-video.model';

@Injectable({
  providedIn: 'root',
})
export class TiktokExcelExportService {
  private readonly worksheetName = 'TikTok Dashboard';
  private readonly exportFileName = 'tiktok-dashboard.xlsx';

  private readonly imageHeightPx = 250;
  private readonly imageWidthPx = 180;
  private readonly defaultText = '-';

  private readonly channelTopicRow = 1;
  private readonly channelHeaderRow = 2;
  private readonly channelDataRow = 3;

  private readonly videosTopicRow = 5;
  private readonly videosHeaderRow = 6;
  private readonly videosDataStartRow = 7;

  async exportDashboard(
    channel: TiktokChannelInfo,
    videos: TiktokVideo[],
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.worksheetName);

    worksheet.columns = [
      { key: 'cover', width: 28 },       // A
      { key: 'id', width: 28 },          // B
      { key: 'title', width: 42 },       // C
      { key: 'description', width: 42 }, // D
      { key: 'createTime', width: 28 },  // E
      { key: 'views', width: 14 },       // F
      { key: 'likes', width: 14 },       // G
      { key: 'comments', width: 14 },    // H
      { key: 'shares', width: 14 },      // I
      { key: 'duration', width: 14 },    // J
      { key: 'link', width: 48 },        // K
      { key: 'coverUrl', width: 48 },    // L hidden
    ];

    worksheet.getColumn('coverUrl').hidden = true;

    this.buildChannelSection(worksheet, channel);
    this.buildVideosSectionHeader(worksheet);

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
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
  }

  private buildChannelSection(
    worksheet: ExcelJS.Worksheet,
    channel: TiktokChannelInfo,
  ): void {
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
      channel.displayName || this.defaultText,
      channel.username || this.defaultText,
      channel.followerCount || 0,
      channel.likesCount || 0,
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
        horizontal: colNumber <= 2 ? 'left' : 'right',
      };

      if (colNumber === 3 || colNumber === 4) {
        cell.numFmt = '#,##0';
      }
    });

    worksheet.getColumn(1).width = 24;
    worksheet.getColumn(2).width = 24;
    worksheet.getColumn(3).width = 18;
    worksheet.getColumn(4).width = 18;
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

  private formatUnixTime(unixTime?: number): string {
    if (!unixTime) {
      return this.defaultText;
    }

    return new Date(unixTime * 1000).toLocaleString();
  }

  private pixelsToPoints(px: number): number {
    return px * 0.75;
  }
}