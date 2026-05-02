import { http, HttpResponse, delay } from 'msw';

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  is_published: boolean;
  visibility: 'Public' | 'Restricted' | 'Private';
}

export const handlers = [
  http.get('/api/courses', async () => {
    await delay(500);
    const mockCourses: Course[] = [
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

    return HttpResponse.json(mockCourses);
  }),
];
