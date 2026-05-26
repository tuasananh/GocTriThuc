import type { UserDto } from './user';

// ============================================================
// Comment & Announcement DTOs
// ============================================================

export interface CommentDto {
  id: number;
  content: string;
  author: UserDto;
  parentId: number | null;
  replies: CommentDto[]; // nested (max depth 5 từ server)
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number | null;
}

export interface AnnouncementDto {
  id: number;
  courseId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
}
