import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'QUIZ' | 'TEXT' | 'PDF';
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

const initialData: Module[] = [
  {
    id: 'm1',
    title: 'Module 1: Giới thiệu tổng quan',
    lessons: [
      { id: 'l1', title: 'Bài 1: Cài đặt môi trường', type: 'VIDEO' },
      { id: 'l2', title: 'Bài 2: Tài liệu khóa học', type: 'PDF' },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2: Kiến thức cốt lõi',
    lessons: [{ id: 'l3', title: 'Bài 1: Cú pháp cơ bản', type: 'VIDEO' }],
  },
];

const CurriculumManager = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>(initialData);

  // States để xử lý Inline Edit
  const [editingModule, setEditingModule] = useState<{ id: string; title: string } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{
    id: string;
    title: string;
    moduleId: string;
  } | null>(null);

  // --- CRUD MODULES ---
  const addModule = (index: number) => {
    const newModules = [...modules];
    newModules.splice(index + 1, 0, { id: `m${Date.now()}`, title: 'Module mới', lessons: [] });
    setModules(newModules);
  };

  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === modules.length - 1)
    )
      return;
    const newModules = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index], newModules[swapIndex]] = [newModules[swapIndex], newModules[index]];
    setModules(newModules);
  };

  const saveModuleTitle = (id: string) => {
    if (!editingModule) return;
    setModules(modules.map((m) => (m.id === id ? { ...m, title: editingModule.title } : m)));
    setEditingModule(null);
  };

  // --- CRUD LESSONS ---
  const addLesson = (moduleId: string, lessonIndex: number) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          const newLessons = [...m.lessons];
          newLessons.splice(lessonIndex + 1, 0, {
            id: `l${Date.now()}`,
            title: 'Lesson mới',
            type: 'VIDEO',
          });
          return { ...m, lessons: newLessons };
        }
        return m;
      }),
    );
  };

  const moveLesson = (moduleId: string, lessonIndex: number, direction: 'up' | 'down') => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          if (
            (direction === 'up' && lessonIndex === 0) ||
            (direction === 'down' && lessonIndex === m.lessons.length - 1)
          )
            return m;
          const newLessons = [...m.lessons];
          const swapIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
          [newLessons[lessonIndex], newLessons[swapIndex]] = [
            newLessons[swapIndex],
            newLessons[lessonIndex],
          ];
          return { ...m, lessons: newLessons };
        }
        return m;
      }),
    );
  };

  const saveLessonTitle = (moduleId: string, lessonId: string) => {
    if (!editingLesson) return;
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, title: editingLesson.title } : l,
            ),
          };
        }
        return m;
      }),
    );
    setEditingLesson(null);
  };

  // --- RENDER ---
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Khung chương trình (Course ID: {courseId})</h2>
      <button onClick={() => addModule(-1)} style={{ marginBottom: '15px' }}>
        + Thêm Module lên đầu
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {modules.map((mod, modIndex) => (
          <div
            key={mod.id}
            style={{ border: '2px solid #ccc', padding: '15px', borderRadius: '8px' }}
          >
            {/* MODULE HEADER */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
                padding: '10px',
                borderRadius: '4px',
              }}
            >
              {editingModule?.id === mod.id ? (
                <input
                  autoFocus
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  onBlur={() => saveModuleTitle(mod.id)}
                  onKeyDown={(e) => e.key === 'Enter' && saveModuleTitle(mod.id)}
                />
              ) : (
                <h3
                  style={{ margin: 0, cursor: 'text' }}
                  onClick={() => setEditingModule({ id: mod.id, title: mod.title })}
                >
                  {mod.title}
                </h3>
              )}

              <div>
                <button onClick={() => moveModule(modIndex, 'up')} disabled={modIndex === 0}>
                  ^
                </button>
                <button
                  onClick={() => moveModule(modIndex, 'down')}
                  disabled={modIndex === modules.length - 1}
                >
                  v
                </button>
                <button onClick={() => addModule(modIndex)} style={{ marginLeft: '10px' }}>
                  + Module dưới
                </button>
              </div>
            </div>

            {/* LESSONS LIST */}
            <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {mod.lessons.length === 0 && (
                <button onClick={() => addLesson(mod.id, -1)}>+ Thêm Lesson đầu tiên</button>
              )}

              {mod.lessons.map((lesson, lessIndex) => (
                <div
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  {editingLesson?.id === lesson.id ? (
                    <input
                      autoFocus
                      value={editingLesson.title}
                      onChange={(e) =>
                        setEditingLesson({ ...editingLesson, title: e.target.value })
                      }
                      onBlur={() => saveLessonTitle(mod.id, lesson.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveLessonTitle(mod.id, lesson.id)}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span
                        style={{ cursor: 'text' }}
                        onClick={() =>
                          setEditingLesson({ id: lesson.id, title: lesson.title, moduleId: mod.id })
                        }
                      >
                        {lesson.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8em',
                          background: '#ddd',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {lesson.type}
                      </span>
                      <button
                        onClick={() => navigate(`/studio/course/${courseId}/lesson/${lesson.id}`)}
                        style={{ fontSize: '0.8em', marginLeft: '10px' }}
                      >
                        Sửa Nội dung →
                      </button>
                    </div>
                  )}

                  <div>
                    <button
                      onClick={() => moveLesson(mod.id, lessIndex, 'up')}
                      disabled={lessIndex === 0}
                    >
                      ^
                    </button>
                    <button
                      onClick={() => moveLesson(mod.id, lessIndex, 'down')}
                      disabled={lessIndex === mod.lessons.length - 1}
                    >
                      v
                    </button>
                    <button
                      onClick={() => addLesson(mod.id, lessIndex)}
                      style={{ marginLeft: '10px' }}
                    >
                      + Thêm Lesson dưới
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurriculumManager;
