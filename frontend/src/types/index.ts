// Barrel export — import tất cả types từ 1 chỗ duy nhất:
//   import type { CourseDto, PageResponse, UserDto } from '@/types';

export type { PageResponse, ApiError } from './api';
export type { UserDto, UserDetailDto, UpdateUserRequest, CurrentUserResponse } from './user';
export { CurrentUser } from './user';
export type {
  CourseDto,
  CourseVisibility,
  CreateCourseRequest,
  UpdateCourseRequest,
  AccessStatus,
  AccessStatusResponse,
  AccessRequestDto,
  AccessRequest,
  LessonType,
  ModuleDto,
  LessonDto,
  CreateModuleRequest,
  CreateLessonRequest,
  LessonDetailDto,
  CourseProgressDto,
} from './course';
export type {
  TestDto,
  QuestionDto,
  QuestionStudentDto,
  CreateQuestionRequest,
  TestQuestionDto,
  TestSessionDto,
  TestSessionAnswerDto,
  TestResultDto,
  MyTestSessionDto,
  TestSessionSummaryDto,
} from './question';
export type {
  CommentDto,
  CreateCommentRequest,
  AnnouncementDto,
  CreateAnnouncementRequest,
} from './comment';
export type { FileDto } from './file';
export { fileServeUrl } from './file';
export type { AdminUserResponse } from './admin';
