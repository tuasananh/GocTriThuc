import { http, HttpResponse, delay } from 'msw';
import type { Course } from '@/entities/Course';

// ===== MOCK DATA =====

interface MockCourse {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  visibility: 'Public' | 'Restricted' | 'Private';
}

const mockPublicCourses: MockCourse[] = [
  {
    id: 1,
    title: 'Nhập Môn Lập Trình React 19',
    description:
      'Bắt đầu hành trình Frontend với những tính năng mới nhất của React 19. Nhanh, mượt mà và trực quan.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
    is_published: true,
    visibility: 'Public',
  },
  {
    id: 2,
    title: 'Thiết Kế Trải Nghiệm Người Dùng (UX)',
    description:
      'Tạo nên những sản phẩm tinh tế, đơn giản theo phong cách Apple. Tập trung vào trải nghiệm cốt lõi.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60',
    is_published: true,
    visibility: 'Public',
  },
  {
    id: 3,
    title: 'Kiến Trúc Hệ Thống Backend',
    description: 'Xây dựng API vững chắc và mạnh mẽ với Spring Boot.',
    thumbnail_url:
      'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&auto=format&fit=crop&q=60',
    is_published: true,
    visibility: 'Restricted',
  },
];

let nextCourseId = 100;
const ownCourses: Course[] = [
  {
    id: 10,
    title: 'Lập Trình Java Nâng Cao',
    description:
      'Khóa học chuyên sâu về Java bao gồm Generics, Concurrency, và Design Patterns cho lập trình viên có kinh nghiệm.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
    isPublished: true,
    visibility: 'Public',
    settings: 0,
    authorId: 1,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-15T14:30:00Z',
  },
  {
    id: 11,
    title: 'Docker & Kubernetes Thực Chiến',
    description:
      'Từ container hóa đến orchestration. Triển khai ứng dụng quy mô lớn với Docker Compose và K8s.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=60',
    isPublished: false,
    visibility: 'Private',
    settings: 0,
    authorId: 1,
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-05-18T09:15:00Z',
  },
  {
    id: 12,
    title: 'Cơ Sở Dữ Liệu PostgreSQL',
    description: 'Thiết kế schema, tối ưu query, indexing và các kỹ thuật nâng cao với PostgreSQL.',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=60',
    isPublished: false,
    visibility: 'Restricted',
    settings: 0,
    authorId: 1,
    createdAt: '2026-05-12T15:00:00Z',
    updatedAt: '2026-05-19T11:45:00Z',
  },
];

// ===== HANDLERS =====

export const handlers = [
  // Mock authenticated user (teacher role with MANAGE_OWN_COURSES permission)
  // Permission bits: teacher = 0x3E = bits 1-5 on
  // NOTE: /api/users/me is NOT mocked — it goes to the real backend for OAuth auth.

  // Public: list published courses for landing page
  http.get('/api/courses', async () => {
    await delay(500);
    return HttpResponse.json(mockPublicCourses);
  }),

  // Studio: get own courses
  http.get('/api/courses/own', async () => {
    await delay(300);
    return HttpResponse.json(ownCourses);
  }),

  // Studio: get single course by ID
  http.get('/api/courses/:id', async ({ params }) => {
    await delay(200);
    const id = Number(params.id);
    const course = ownCourses.find((c) => c.id === id);
    if (!course) {
      return HttpResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return HttpResponse.json(course);
  }),

  // Studio: create a new course
  http.post('/api/courses', async () => {
    await delay(300);
    const newCourse: Course = {
      id: nextCourseId++,
      title: 'Khóa học mới',
      description: '',
      thumbnailUrl: null,
      isPublished: false,
      visibility: 'Private',
      settings: 0,
      authorId: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ownCourses.push(newCourse);
    return HttpResponse.json(newCourse, { status: 201 });
  }),

  // Studio: update a course
  http.put('/api/courses/:id', async ({ params, request }) => {
    await delay(300);
    const id = Number(params.id);
    const idx = ownCourses.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const body = (await request.json()) as Partial<Course>;
    ownCourses[idx] = {
      ...ownCourses[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(ownCourses[idx]);
  }),

  // Studio: delete a course
  http.delete('/api/courses/:id', async ({ params }) => {
    await delay(300);
    const id = Number(params.id);
    const idx = ownCourses.findIndex((c) => c.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    ownCourses.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
