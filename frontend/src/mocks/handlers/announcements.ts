import { http, HttpResponse } from 'msw';
import type { AnnouncementDto, CommentDto, PageResponse } from '@/types';

// In-memory store cho MSW
const getAnnouncements = (): AnnouncementDto[] => {
  const str = sessionStorage.getItem('mock_announcements');
  return str ? JSON.parse(str) : [];
};

const saveAnnouncements = (data: AnnouncementDto[]) => {
  sessionStorage.setItem('mock_announcements', JSON.stringify(data));
};

type MockCommentDto = CommentDto & { referenceId: string };

const getComments = (): MockCommentDto[] => {
  const str = sessionStorage.getItem('mock_announcement_comments');
  return str ? JSON.parse(str) : [];
};

const saveComments = (data: MockCommentDto[]) => {
  sessionStorage.setItem('mock_announcement_comments', JSON.stringify(data));
};

export const announcementsHandlers = [
  // Lấy danh sách thông báo của khóa học
  http.get('/api/courses/:courseId/announcements', ({ params, request }) => {
    const { courseId } = params;
    const url = new URL(request.url);
    const size = Number(url.searchParams.get('size') || '10');
    const page = Number(url.searchParams.get('page') || '0');

    const allAnnouncements = getAnnouncements();
    const filtered = allAnnouncements.filter((a) => a.courseId === courseId);
    // Sort desc by createdAt
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const start = page * size;
    const paginated = filtered.slice(start, start + size);

    const response: PageResponse<AnnouncementDto> = {
      content: paginated,
      page: {
        number: page,
        size: size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
      },
    };

    return HttpResponse.json(response);
  }),

  // Đăng thông báo mới
  http.post('/api/courses/:courseId/announcements', async ({ params, request }) => {
    const { courseId } = params;
    const data = (await request.json()) as { title: string; content: string };

    const allAnnouncements = getAnnouncements();
    const newAnnouncement: AnnouncementDto = {
      id: `ann-${Date.now()}`,
      courseId: courseId as string,
      title: data.title,
      content: data.content,
      author: {
        id: 'user-1',
        email: 'instructor@example.com',
        username: 'instructor1',
        displayName: 'Giảng viên',
        role: 'teacher',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allAnnouncements.push(newAnnouncement);
    saveAnnouncements(allAnnouncements);

    return HttpResponse.json(newAnnouncement, { status: 201 });
  }),

  // Lấy bình luận của thông báo
  http.get('/api/announcements/:id/comments', ({ params }) => {
    const { id } = params;
    const allComments = getComments();

    // Lọc ra các comment thuộc về announcement này
    const filtered = allComments.filter((c) => c.referenceId === id);

    // Dựng cây (tree)
    const buildTree = (parentId: string | null): CommentDto[] => {
      return filtered
        .filter((c) => c.parentId === parentId)
        .map((c) => ({
          ...c,
          replies: buildTree(c.id),
        }))
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    };

    const roots = buildTree(null);
    return HttpResponse.json(roots);
  }),

  // Thêm bình luận cho thông báo
  http.post('/api/announcements/:id/comments', async ({ params, request }) => {
    const { id } = params;
    const data = (await request.json()) as { content: string; parentId?: string };

    const allComments = getComments();
    const newComment: MockCommentDto = {
      id: `comment-${Date.now()}`,
      referenceId: id as string,
      content: data.content,
      parentId: data.parentId || null,
      replies: [],
      author: {
        id: 'user-1',
        email: 'user@example.com',
        username: 'user1',
        displayName: 'Người dùng',
        role: 'student',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editedAt: null,
    };

    allComments.push(newComment);
    saveComments(allComments);

    return HttpResponse.json(newComment, { status: 201 });
  }),

  // Sửa bình luận
  http.put('/api/announcements/comments/:commentId', async ({ params, request }) => {
    const { commentId } = params;
    const data = (await request.json()) as { content: string };

    const allComments = getComments();
    const commentIndex = allComments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    allComments[commentIndex].content = data.content;
    allComments[commentIndex].editedAt = new Date().toISOString();
    allComments[commentIndex].updatedAt = new Date().toISOString();

    saveComments(allComments);
    return HttpResponse.json(allComments[commentIndex]);
  }),

  // Xóa bình luận (cascade)
  http.delete('/api/announcements/comments/:commentId', ({ params }) => {
    const { commentId } = params;
    let allComments = getComments();

    // Tìm tất cả children cần xóa (cascade)
    const toDelete = new Set<string>();
    toDelete.add(commentId as string);

    let added: boolean;
    do {
      added = false;
      for (const c of allComments) {
        if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
          toDelete.add(c.id);
          added = true;
        }
      }
    } while (added);

    allComments = allComments.filter((c) => !toDelete.has(c.id));
    saveComments(allComments);

    return new HttpResponse(null, { status: 204 });
  }),
];
