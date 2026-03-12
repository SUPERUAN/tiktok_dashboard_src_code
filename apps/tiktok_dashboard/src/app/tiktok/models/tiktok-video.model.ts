export interface TiktokVideo {
  id: string;
  title?: string;
  share_url?: string;
  cover_image_url?: string;
  create_time?: number;
  duration?: number;
  width?: number;
  height?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  video_description?: string;
  embed_link?: string;
  embed_html?: string;
}

export interface TiktokVideosResponse {
  count: number;
  videos: TiktokVideo[];
}