# Hướng dẫn Kỹ thuật: Lexical Editor & Poll Component

Tài liệu này hướng dẫn các nhà phát triển cách tích hợp và sử dụng trình soạn thảo Lexical (phiên bản nâng cao) và component Poll độc lập trong dự án **GocTriThuc**.

---

## 1. Lexical Editor (Giao diện kiểu Notion)

Trình soạn thảo này được xây dựng trên nền tảng [Lexical](https://lexical.dev/) với cấu trúc modular, hỗ trợ hơn 30 tính năng chuyên nghiệp từ bảng biển, công thức toán học đến quản lý tệp tin.

### Tích hợp vào dự án

Để sử dụng editor trong bất kỳ trang nào:

```tsx
import { Editor } from '@/components/Editor';
import { useState } from 'react';

export default function MyPage() {
  const [content, setContent] = useState<string>('');

  const handleUpdate = (editorState: any) => {
    // Chuyển đổi editorState sang JSON hoặc HTML/Markdown để lưu trữ
    const jsonString = JSON.stringify(editorState.toJSON());
    setContent(jsonString);
  };

  return (
    <div className="editor-container">
      <Editor 
        onUpdate={handleUpdate} 
        initialContent={null} // Truyền chuỗi JSON nếu muốn tải nội dung cũ
      />
    </div>
  );
}
```

### Các thành phần quan trọng
- **File chính**: `src/components/Editor.tsx`
- **Theme (Giao diện)**: `src/components/themes/EditorTheme.ts`
- **Plugins**: Các tiện ích mở rộng nằm trong `src/components/plugins/`.
- **Nodes**: Các thành phần nội dung tùy chỉnh (Ảnh, YouTube, Table, Equation, File) nằm trong `src/components/nodes/`.

### Các tính năng nổi bật
- **Table Toolbar**: Thanh công cụ riêng cho bảng (Gộp ô, đổi màu, thêm hàng/cột nhanh).
- **Equation Editor**: Hỗ trợ công thức toán học KaTeX cả dạng Inline và Block.
- **Slash Menu**: Gõ `/` để mở menu chèn nhanh nội dung.
- **File Attachments**: Cho phép đính kèm tệp tin với giao diện chuyên nghiệp.

---

## 2. Component Poll độc lập

Component Poll đã được bóc tách hoàn toàn khỏi editor và có thể sử dụng ở bất cứ đâu trong ứng dụng React.

### Vị trí file
- `src/components/ui/Poll.tsx`

### Cách sử dụng cơ bản

```tsx
import { Poll, Option } from '@/components/ui/Poll';
import { useState } from 'react';

const DemoPoll = () => {
    const [question, setQuestion] = useState("Dự án này có ích không?");
    const [options, setOptions] = useState([
        { uid: '1', text: 'Rất ích', votes: ['user-1', 'user-2'] },
        { uid: '2', text: 'Bình thường', votes: ['user-3'] },
    ]);

    const handleVote = (option: Option) => {
        const clientID = 'id-nguoi-dung-hien-tai'; // Thay bằng user ID thực tế
        const newOptions = options.map(opt => {
            if (opt.uid === option.uid) {
                const hasVoted = opt.votes.includes(clientID);
                return {
                    ...opt,
                    votes: hasVoted 
                        ? opt.votes.filter(id => id !== clientID) 
                        : [...opt.votes, clientID]
                };
            }
            return opt;
        });
        setOptions(newOptions);
    };

    return (
        <Poll 
            question={question}
            options={options}
            isEditable={true} // Cho phép sửa câu hỏi và thêm lựa chọn
            onVote={handleVote}
            onQuestionChange={setQuestion}
            onAddOption={() => {
                setOptions([...options, { uid: Math.random().toString(), text: '', votes: [] }]);
            }}
        />
    );
};
```

---

## 3. Hướng dẫn mở rộng

Để thêm một tính năng mới vào Editor:
1. Định nghĩa một **Node** trong `src/components/nodes/` nếu là loại nội dung mới.
2. Tạo một **Plugin** trong `src/components/plugins/` để xử lý logic/lệnh (Command).
3. Đăng ký Node và Plugin đó trong file `src/components/Editor.tsx`.
4. Cập nhật `src/components/plugins/blockOptions.tsx` để hiển thị trong Slash Menu.
