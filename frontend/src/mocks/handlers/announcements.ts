import { http, HttpResponse } from 'msw';
import type { AnnouncementDto, PageResponse } from '@/types';

// In-memory store cho MSW
const getAnnouncements = (): AnnouncementDto[] => {
  const str = sessionStorage.getItem('mock_announcements');
  return str ? JSON.parse(str) : [];
};

const saveAnnouncements = (data: AnnouncementDto[]) => {
  sessionStorage.setItem('mock_announcements', JSON.stringify(data));
};

export const announcementsHandlers = [
  // GET /api/courses/:courseId/announcements
  http.get('/api/courses/:courseId/announcements', ({ params, request }) => {
    const { courseId } = params;
    const url = new URL(request.url);
    const size = Number(url.searchParams.get('size') || '10');
    const page = Number(url.searchParams.get('page') || '0');

    const allAnnouncements = getAnnouncements();
    const filtered = allAnnouncements.filter((a) => a.courseId === courseId);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = page * size;
    const paginated = filtered.slice(start, start + size);

    const response: PageResponse<AnnouncementDto> = {
      content: paginated,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      number: page,
      size: size,
      first: page === 0,
      last: start + size >= filtered.length,
      empty: paginated.length === 0,
    };

    return HttpResponse.json(response);
  }),

  // POST /api/courses/:courseId/announcements
  http.post('/api/courses/:courseId/announcements', async ({ params, request }) => {
    const { courseId } = params;
    const data = (await request.json()) as { title: string; content: string };

    const allAnnouncements = getAnnouncements();
    const newAnnouncement: AnnouncementDto = {
      id: `ann-${Date.now()}`,
      courseId: courseId as string,
      title: data.title,
      content: data.content,
      author: { id: '1', displayName: 'Ngo Ba Kha', username: 'khaba', avatarUrl: null },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    allAnnouncements.push(newAnnouncement);
    saveAnnouncements(allAnnouncements);

    return HttpResponse.json(newAnnouncement, { status: 201 });
  }),
];
