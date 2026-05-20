export type CourseVisibility = 'Public' | 'Restricted' | 'Private';

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  visibility: CourseVisibility;
  settings: number;
  authorId: number;
  createdAt: string;
  updatedAt: string;
}
