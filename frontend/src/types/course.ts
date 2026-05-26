import type { UserDto } from './user';

// ============================================================
// Course DTOs
// ============================================================

export type CourseVisibility = 'Public' | 'Restricted' | 'Private';

/** Thông tin khóa học hiển thị trong danh sách & chi tiết */
export interface CourseDto {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  visibility: CourseVisibility;
  author: UserDto;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Request body cho POST /api/courses */
export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  visibility: CourseVisibility;
}

/** Request body cho PUT/PATCH /api/courses/{id} */
export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  visibility?: CourseVisibility;
  isPublished?: boolean;
}

/** Trạng thái truy cập khóa học của user hiện tại */
export type AccessStatus = 'none' | 'requested' | 'enrolled';

export interface AccessStatusResponse {
  status: AccessStatus;
}

// ============================================================
// Module & Lesson DTOs
// ============================================================

export type LessonType = 'blog' | 'video' | 'test';

export interface ModuleDto {
  id: number;
  courseId: number;
  title: string;
  order: number;
  lessons: LessonDto[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonDto {
  id: number;
  title: string;
  lessonType: LessonType;
  order: number;
  moduleId: number;
  isCompleted?: boolean; // có khi lấy theo context enrolled student
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleRequest {
  title: string;
}

export interface CreateLessonRequest {
  title: string;
  lessonType: LessonType;
}

/** Chi tiết lesson (bao gồm nội dung video/blog/test) */
export interface LessonDetailDto extends LessonDto {
  video?: {
    provider: 'youtube' | 'vimeo';
    providerValue: string; // raw URL
  };
  blog?: {
    content: string; // HTML sanitized
  };
  test?: {
    testId: number;
    statement: string;
    timeLimit: number; // seconds
    settings?: Record<string, unknown>; // extensible config (passing_score, max_retakes, etc.)
  };
}

// ============================================================
// Progress
// ============================================================

export interface CourseProgressDto {
  completedLessons: number;
  totalLessons: number;
  percent: number;
}
