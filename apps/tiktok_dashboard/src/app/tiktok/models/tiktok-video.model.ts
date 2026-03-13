export interface TiktokVideo {
  id?: string;
  create_time?: number;
  cover_image_url?: string;
  share_url?: string;
  video_description?: string;
  duration?: number;
  height?: number;
  width?: number;
  title?: string;
  embed_html?: string;
  embed_link?: string;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

export interface TiktokChannelInfo {
  displayName: string;
  username: string;
  followerCount: number;
  likesCount: number;
}

export interface TiktokVideosResponse {
  count: number;
  channel: TiktokChannelInfo;
  videos: TiktokVideo[];
}

export interface TiktokDashboardData {
  channel: TiktokChannelInfo;
  videos: TiktokVideo[];
}