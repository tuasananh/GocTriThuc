import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// 1. Định nghĩa Type rõ ràng để linter không bắt bẻ
type LessonType = 'VIDEO' | 'QUIZ' | 'TEXT' | 'PDF';

const LessonEdit = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  // 2. Sử dụng Type vừa định nghĩa cho state
  const [lessonType, setLessonType] = useState<LessonType>('VIDEO');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <button onClick={() => navigate(`/studio/course/${courseId}/curriculum`)}>
        {'<- Quay lại Khung chương trình'}
      </button>

      <h2>Chỉnh sửa chi tiết Bài học</h2>
      <p>Lesson ID: {lessonId}</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>Loại bài học: </label>
        {/* 3. Ép kiểu an toàn bằng as LessonType thay vì as any */}
        <select value={lessonType} onChange={(e) => setLessonType(e.target.value as LessonType)}>
          <option value="VIDEO">Video</option>
          <option value="TEXT">Văn bản (Text)</option>
          <option value="PDF">Tài liệu (PDF)</option>
          <option value="QUIZ">Trắc nghiệm (Quiz)</option>
        </select>
      </div>

      <div
        style={{
          padding: '20px',
          border: '1px solid #007bff',
          borderRadius: '8px',
          minHeight: '300px',
        }}
      >
        {/* Render UI động dựa vào Loại Bài học */}
        {lessonType === 'VIDEO' && (
          <div>
            <h3>Video Settings</h3>
            <input
              type="text"
              placeholder="Nhập URL YouTube hoặc Vimeo..."
              style={{ width: '100%', padding: '8px' }}
            />
            <p>
              Thời lượng: <input type="number" placeholder="Phút" />
            </p>
          </div>
        )}

        {lessonType === 'TEXT' && (
          <div>
            <h3>Trình soạn thảo văn bản</h3>
            <textarea
              placeholder="Nhập nội dung bài học bằng Markdown hoặc Rich Text..."
              style={{ width: '100%', height: '200px', padding: '8px' }}
            ></textarea>
          </div>
        )}

        {lessonType === 'PDF' && (
          <div>
            <h3>Tải lên PDF</h3>
            <input type="file" accept="application/pdf" />
          </div>
        )}

        {lessonType === 'QUIZ' && (
          <div>
            <h3>Thiết lập Bài kiểm tra</h3>
            <button>+ Thêm câu hỏi trắc nghiệm</button>
            <p>
              Thời gian làm bài: <input type="number" placeholder="Phút" />
            </p>
          </div>
        )}
      </div>

      <button
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        Lưu thay đổi Lesson
      </button>
    </div>
  );
};

export default LessonEdit;
