import type { UserDto } from './user';

// ============================================================
// Comment & Announcement DTOs
// ============================================================

export interface CommentDto {
  id: string;
  content: string;
  author: UserDto;
  parentId: string | null;
  replies: CommentDto[]; // nested (max depth 5 từ server)
  editedAt: string | null; // null nếu chưa chỉnh sửa
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string | null;
}

export interface AnnouncementDto {
  id: string;
  courseId: string;
  title: string;
  content: string;
  author: UserDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
}
