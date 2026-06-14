import { http, HttpResponse } from 'msw';
import type { CommentDto, PageResponse } from '@/types';

type MockCommentDto = CommentDto & { referenceId: string };

const getComments = (type: 'lessons' | 'announcements'): MockCommentDto[] => {
  const key = `mock_${type}_comments`;
  const str = sessionStorage.getItem(key);
  return str ? JSON.parse(str) : [];
};

const saveComments = (type: 'lessons' | 'announcements', data: MockCommentDto[]) => {
  const key = `mock_${type}_comments`;
  sessionStorage.setItem(key, JSON.stringify(data));
};

export const commentsHandlers = [
  // GET /api/:type/:id/comments (lessons or announcements)
  http.get('/api/:type/:id/comments', ({ params, request }) => {
    const { type, id } = params as { type: string; id: string };
    if (type !== 'lessons' && type !== 'announcements') {
      return new HttpResponse(null, { status: 404 });
    }

    const url = new URL(request.url);
    const size = Number(url.searchParams.get('size') || '20');
    const page = Number(url.searchParams.get('page') || '0');

    const allComments = getComments(type as 'lessons' | 'announcements');
    const filtered = allComments.filter((c) => c.referenceId === id);

    // Root comments (no parentId)
    const roots = filtered.filter((c) => c.parentId === null);
    roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = page * size;
    const paginatedRoots = roots.slice(start, start + size);

    // Helper to recursively build replies up to depth 5
    const buildTree = (parentId: string, currentDepth: number): CommentDto[] => {
      if (currentDepth >= 5) {
        return [];
      }
      return filtered
        .filter((c) => c.parentId === parentId)
        .map((c) => ({
          ...c,
          replies: buildTree(c.id, currentDepth + 1),
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    const treeContent = paginatedRoots.map((root) => ({
      ...root,
      replies: buildTree(root.id, 1),
    }));

    const response: PageResponse<CommentDto> = {
      content: treeContent,
      totalElements: roots.length,
      totalPages: Math.ceil(roots.length / size),
      number: page,
      size: size,
      first: page === 0,
      last: start + size >= roots.length,
      empty: treeContent.length === 0,
    };

    return HttpResponse.json(response);
  }),

  // GET /api/:type/comments/:commentId/thread
  http.get('/api/:type/comments/:commentId/thread', ({ params }) => {
    const { type, commentId } = params as { type: string; commentId: string };
    if (type !== 'lessons' && type !== 'announcements') {
      return new HttpResponse(null, { status: 404 });
    }

    const allComments = getComments(type as 'lessons' | 'announcements');
    const target = allComments.find((c) => c.id === commentId);

    if (!target) {
      return new HttpResponse(null, { status: 404 });
    }

    const filtered = allComments.filter((c) => c.referenceId === target.referenceId);

    const buildTree = (parentId: string, currentDepth: number): CommentDto[] => {
      if (currentDepth >= 5) {
        return [];
      }
      return filtered
        .filter((c) => c.parentId === parentId)
        .map((c) => ({
          ...c,
          replies: buildTree(c.id, currentDepth + 1),
        }))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    };

    const thread = {
      ...target,
      replies: buildTree(target.id, 1),
    };

    return HttpResponse.json(thread);
  }),

  // POST /api/:type/:id/comments
  http.post('/api/:type/:id/comments', async ({ params, request }) => {
    const { type, id } = params as { type: string; id: string };
    if (type !== 'lessons' && type !== 'announcements') {
      return new HttpResponse(null, { status: 404 });
    }

    const data = (await request.json()) as { content: string; parentId?: string };

    if (!data.content || !data.content.trim()) {
      return new HttpResponse(JSON.stringify({ message: 'Comment content cannot be blank' }), {
        status: 400,
      });
    }

    const allComments = getComments(type as 'lessons' | 'announcements');
    const newComment: MockCommentDto = {
      id: `comment-${Date.now()}`,
      referenceId: id,
      content: data.content,
      parentId: data.parentId ?? null,
      replies: [],
      author: { id: '1', displayName: 'Ngo Ba Kha', username: 'khaba', avatarUrl: null },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      editedAt: null,
    };

    allComments.push(newComment);
    saveComments(type as 'lessons' | 'announcements', allComments);

    return HttpResponse.json(newComment, { status: 201 });
  }),

  // PATCH /api/:type/comments/:commentId
  http.patch('/api/:type/comments/:commentId', async ({ params, request }) => {
    const { type, commentId } = params as { type: string; commentId: string };
    if (type !== 'lessons' && type !== 'announcements') {
      return new HttpResponse(null, { status: 404 });
    }

    const data = (await request.json()) as { content: string };

    if (!data.content || !data.content.trim()) {
      return new HttpResponse(JSON.stringify({ message: 'Comment content cannot be blank' }), {
        status: 400,
      });
    }

    const allComments = getComments(type as 'lessons' | 'announcements');
    const commentIndex = allComments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    allComments[commentIndex].content = data.content;
    allComments[commentIndex].editedAt = new Date().toISOString();
    allComments[commentIndex].updatedAt = new Date().toISOString();

    saveComments(type as 'lessons' | 'announcements', allComments);
    return HttpResponse.json(allComments[commentIndex]);
  }),

  // DELETE /api/:type/comments/:commentId
  http.delete('/api/:type/comments/:commentId', ({ params }) => {
    const { type, commentId } = params as { type: string; commentId: string };
    if (type !== 'lessons' && type !== 'announcements') {
      return new HttpResponse(null, { status: 404 });
    }

    let allComments = getComments(type as 'lessons' | 'announcements');

    const toDelete = new Set<string>();
    toDelete.add(commentId);

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
    saveComments(type as 'lessons' | 'announcements', allComments);

    return new HttpResponse(null, { status: 204 });
  }),
];
