# 🌟 GocTriThuc - Nền Tảng Học Tập Trực Tuyến

**GocTriThuc** (Góc Tri Thức) là một nền tảng học tập trực tuyến (E-Learning) hiện đại được thiết kế và xây dựng theo mô hình Client-Server. Dự án cung cấp môi trường học tập, giảng dạy và quản lý toàn diện dành cho Học viên, Giảng viên và Quản trị viên, được phát triển trong khuôn khổ môn học **Nhập môn Công nghệ Phần mềm** tại Đại học Bách Khoa Hà Nội.

---

## 👥 Thành Viên Dự Án (Nhóm phát triển GocTriThuc)

| Vai trò | Họ và tên | Mã sinh viên | Nơi công tác | Email |
| :--- | :--- | :--- | :--- | :--- |
| **Quản lý dự án** | Trần Tuấn Anh | 202416124 | ĐH Bách Khoa HN | <anh.tt2416124@sis.hust.edu.vn> |
| **Trưởng nhóm Kỹ thuật** | Nguyễn Công Vinh | 202400083 | ĐH Bách Khoa HN | <vinh.nc2400083@sis.hust.edu.vn> |
| **Thành viên phát triển** | Phạm Văn Sâm | 202400114 | ĐH Bách Khoa HN | <sam.pv2400114@sis.hust.edu.vn> |
| **Thành viên phát triển** | Vũ Hoàng Tuấn | 202400080 | ĐH Bách Khoa HN | <tuan.vh2400080@sis.hust.edu.vn> |
| **Chuyên viên Phân tích** | Lê Thành Trung | 202400076 | ĐH Bách Khoa HN | <trung.lt2400076@sis.hust.edu.vn> |

---

## 📖 Tổng Quan Hệ Thống & Đặc Tả Yêu Cầu (SRS)

### 1. Mục Tiêu Dự Án
- **Học tập & Tương tác**: Cung cấp giao diện thân thiện, hỗ trợ học tập trực quan qua video, tài liệu bài viết (blog) và làm bài kiểm tra trực tuyến.
- **Quản lý nội dung**: Giúp giảng viên dễ dàng tổ chức các khóa học thành các module và bài học, xây dựng ngân hàng câu hỏi trắc nghiệm phong phú.
- **Bảo mật & Phân quyền**: Xác thực an toàn qua Google OAuth2, cấp quyền chi tiết dựa trên vai trò (Roles & Permissions) cho từng API endpoint.

### 2. Danh Sách Tác Nhân (Actors)
- **Khách vãng lai**: Người dùng chưa xác thực, có thể khám phá danh mục khóa học công khai và thực hiện đăng nhập qua OAuth2.
- **Học viên (Student)**: Đăng ký tham gia khóa học (tự động với khóa công khai hoặc gửi yêu cầu duyệt với khóa hạn chế), học tập, làm bài kiểm tra, bình luận thảo luận và theo dõi tiến độ hoàn thành.
- **Giảng viên (Instructor)**: Quản lý khóa học (soạn thảo module, bài học video/blog/test), quản trị ngân hàng câu hỏi, duyệt yêu cầu ghi danh của học viên và đăng thông báo lớp học.
- **Quản trị viên (Admin)**: Quản lý toàn bộ danh sách người dùng, gán/rút vai trò và giám sát hệ thống.

### 3. Phân Hệ Chức Năng Chính
- **FR-01 (Xác thực & Hồ sơ)**: Đăng nhập Google OAuth2, cấp JWT, quản lý thông tin cá nhân và avatar.
- **FR-02 (Quản lý Khóa học & Module)**: Tạo khóa học (nháp/xuất bản), thiết lập hiển thị (Công khai - Public, Hạn chế - Restricted, Riêng tư - Private), chia nhỏ khóa học thành các module.
- **FR-03 (Quản lý Bài học)**: Hỗ trợ 3 loại bài học:
  - **Bài học Video**: Nhúng link video từ các provider (YouTube, Vimeo, v.v.).
  - **Bài học Blog**: Tài liệu soạn thảo dạng HTML giàu định dạng (sử dụng trình soạn thảo BlockNote).
  - **Bài học Test**: Bài kiểm tra có tính thời gian làm bài (Countdown).
- **FR-04 (Ngân hàng Câu hỏi & Kiểm tra)**: Soạn câu hỏi trắc nghiệm (một/nhiều lựa chọn), gán câu hỏi vào bài test, ghi nhận phiên làm bài (TestSession), tự động chấm điểm và thống kê kết quả chi tiết.
- **FR-05 (Tiến độ & Tương tác)**: Đánh dấu bài học đã hoàn thành để tính % tiến độ khóa học; đăng thông báo và tham gia bình luận phân cấp (Comment Thread) dưới mỗi bài học/thông báo.

---

## 🏗️ Kiến Trúc Hệ Thống & Cấu Trúc Mã Nguồn

Hệ thống hoạt động theo mô hình **Client-Server**:
- **Frontend**: Ứng dụng Single Page Application (SPA) xây dựng trên **ReactJS**, **Vite**, **TypeScript**, sử dụng thư viện component **Shadcn UI** và tiện ích styling **Tailwind CSS v4**.
- **Backend**: **Spring Boot 4.1.0 (Java 21)**, tổ chức theo mô hình Controller - Service - Repository phân lớp rõ ràng.
- **Cơ sở dữ liệu**: **PostgreSQL**, kiểm soát phiên bản cơ sở dữ liệu qua **Flyway Migration**.

```
    ┌────────────────┐ HTTPS / JSON ┌─────────────────────────┐
    │  Trình duyệt   ├─────────────>│       REST API          │
    │  Vite + React  │<─────────────┤  Spring Boot Controller │
    └────────────────┘              └───────────┬─────────────┘
                                                │ Service Layer
                                                ▼ (Nghiệp vụ)
                                    ┌─────────────────────────┐
                                    │    Cơ sở dữ liệu        │
                                    │      PostgreSQL         │
                                    └─────────────────────────┘
```

### 📂 1. Cấu Trúc Backend (`/backend`)
```
backend/src/main/java/com/goctrithuc/backend/
├── common/         # Định nghĩa hằng số quyền, vai trò (Roles, Permissions) và các Utility.
├── config/         # Cấu hình WebMvc, Jackson, bảo mật SecurityConfig (OAuth2/JWT).
├── controllers/    # Các REST Controllers nhận HTTP request và phản hồi dữ liệu JSON.
├── dtos/           # Định nghĩa các Data Transfer Objects (Request/Response API).
├── entities/       # Các thực thể JPA ánh xạ trực tiếp đến các bảng quan hệ trong DB.
├── errors/         # Xử lý ngoại lệ tập trung (Global Exception Handler & Custom Errors).
├── repositories/   # Giao tiếp cơ sở dữ liệu (Spring Data JPA Repositories).
└── services/       # Lớp nghiệp vụ chính xử lý logic nghiệp vụ của hệ thống.
```

### 📂 2. Cấu Trúc Frontend (`/frontend`)
```
frontend/src/
├── assets/         # Chứa hình ảnh tĩnh, SVG và các tệp tài nguyên tĩnh.
├── components/     # Các component UI dùng chung (RichTextEditor, CommentThread, Countdowns, v.v.).
├── contexts/       # Quản lý trạng thái ứng dụng (Xác thực AuthContext, ThemeContext).
├── layouts/        # Bố cục giao diện chính (MainLayout cho học viên, Layout quản lý cho giảng viên/admin).
├── lib/            # Quản lý cấu hình axios client và định nghĩa tập trung các đường dẫn ROUTES.
├── mocks/          # MSW (Mock Service Worker) dùng giả lập REST API khi phát triển ngoại tuyến.
├── pages/          # Các trang màn hình chính (Courses, CourseDetail, Classroom, LessonViewer, Test, Dashboard).
├── providers/      # Các Provider cung cấp context bổ trợ (ThemeProvider, ToasterProvider).
└── types/          # Định nghĩa kiểu dữ liệu TypeScript (Interfaces, Types).
```

---

## 🗄️ Thiết Kế Cơ Sở Dữ Liệu (Database Schema)

Cơ sở dữ liệu quan hệ PostgreSQL của GocTriThuc gồm các thực thể cốt lõi:
- **Tài khoản**: `users` (thông tin người dùng), `user_providers` (liên kết xác thực Google OAuth2), `roles` & `permissions` (phân quyền hệ thống).
- **Khóa học & Bài học**: `courses`, `modules`, `lessons` (gồm 3 bảng subtype phụ thuộc loại bài học: `lesson_blogs`, `lesson_videos`, `lesson_tests`), `lesson_resources` (file đính kèm).
- **Ghi danh & Tiến độ**: `enrollments` (ghi nhận học viên tham gia), `course_access_requests` (chờ duyệt ghi danh khóa restricted), `lesson_completions` (theo dõi tiến độ học tập).
- **Tương tác**: `announcements` (thông báo khóa học), `lesson_comments` (bình luận dưới bài học), `announcement_comments` (bình luận dưới thông báo) hỗ trợ liên kết phân cấp cha - con (`parent_id`).
- **Ngân hàng đề & Kiểm tra**: `questions` (ngân hàng câu hỏi trắc nghiệm), `answer_options` (các tùy chọn đáp án), `test_questions` (liên kết câu hỏi vào bài test), `test_sessions` (phiên làm bài kiểm tra của học viên), `test_session_answers` (chi tiết câu trả lời đã lưu).

---

## 🛠️ Hướng Dẫn Cài Đặt & Phát Triển Local

### Yêu cầu hệ thống
- **Java 21+** (JDK 21)
- **Node.js** (v18+)
- **pnpm** (Trình quản lý package của Frontend)
- **Docker & Docker Compose** (Để chạy database PostgreSQL cục bộ)

---

### 🚀 Bước 0. Cấu hình biến môi trường (`.env`)
Tại thư mục gốc của dự án, sao chép file cấu hình mẫu `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Mở file `.env` vừa tạo và cập nhật các thông tin kết nối cơ sở dữ liệu và thông tin cấu hình Google OAuth Client (Client ID & Secret).

---

### 🚀 Bước 1. Khởi chạy Cơ Sở Dữ Liệu
Hệ thống sử dụng Docker để khởi chạy nhanh PostgreSQL cho môi trường phát triển:
```bash
# Đảm bảo Docker đang chạy trên máy của bạn
docker compose -f docker-compose.dev.yml up -d
```
Cơ sở dữ liệu sẽ chạy trên cổng được cấu hình trong file `.env` (mặc định: `5432`). Khi khởi động backend lần đầu, Flyway sẽ tự động chạy các tệp migration để khởi tạo cấu trúc bảng dữ liệu.

---

### 🚀 Bước 2. Khởi chạy Backend (Spring Boot)
Di chuyển vào thư mục `backend` và chạy ứng dụng thông qua Maven Wrapper:
```bash
cd backend
./mvnw spring-boot:run
```
Backend sẽ khởi chạy mặc định tại cổng `8080`.

#### 📝 Tài liệu API tự động (Swagger UI & OpenAPI)
Khi chạy ở môi trường phát triển (Local/Dev profile), tài liệu API sẽ tự động được sinh và truy cập trực quan qua:
- **Swagger UI**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html) (Thử nghiệm gọi API trực tiếp).
- **OpenAPI JSON Spec**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs) (Có thể import vào Postman).

*Lưu ý bảo mật*: Tài liệu API Swagger sẽ bị **vô hiệu hóa hoàn toàn trên môi trường Production** (thông qua cấu hình `application-prod.yaml`) nhằm ngăn chặn việc rò rỉ cấu trúc hệ thống.

---

### 🚀 Bước 3. Khởi chạy Frontend (Vite + React)
Mở một terminal mới, di chuyển vào thư mục `frontend`, cài đặt thư viện và khởi chạy máy chủ phát triển local:
```bash
cd frontend
pnpm install
pnpm dev
```
Trình duyệt sẽ tự động mở trang web phát triển tại địa chỉ [http://localhost:5173](http://localhost:5173).

---

## 🌐 Quy Trình CI/CD & Triển Khai Production

### 1. GitHub Workflows Tự Động
Dự án được thiết lập quy trình tích hợp liên tục tự động:
- **Backend/Frontend CI**: Tự động kiểm tra code style (Spotless/ESLint) và chạy biên dịch (build/test) mỗi khi có Pull Request hoặc Push lên nhánh `main`.
- **CodeQL Analysis**: Định kỳ quét mã nguồn để phân tích bảo mật tìm kiếm lỗ hổng nguy hiểm (XSS, SQL Injection).
- **Dependabot**: Tự động giám sát, đề xuất nâng cấp các phiên bản thư viện lỗi thời hàng tuần.
- **Docker Build & Publish**: Tự động đóng gói ứng dụng full-stack thành Docker image và đẩy lên GitHub Container Registry (GHCR).

### 2. Triển khai nhanh trên Server (Production)
Do toàn bộ ứng dụng đã được đóng gói tự động thành Docker Image trên GHCR, máy chủ của bạn không cần cài đặt JDK, Maven hay Node.js. Chỉ cần thiết lập file cấu hình môi trường `.env` và khởi chạy qua Docker Compose Production:
```bash
# Tải về Docker image mới nhất từ GHCR
docker compose -f docker-compose.prod.yml pull

# Khởi chạy toàn bộ hệ thống ở chế độ background
docker compose -f docker-compose.prod.yml up -d
```

---

## 📏 Quy Tắc & Chuẩn Code (Development Guidelines)

### 1. Quy tắc đặt tên Schema Migration (Flyway)
Mỗi thay đổi cấu trúc database cần viết file SQL migration mới tại thư mục `backend/src/main/resources/db/migration/` theo quy tắc đặt tên:
```
V{DATE_TIME}_{ISSUE_NUMBER}__{DESCRIPTION}.sql
```
*Trong đó:*
- `DATE_TIME`: Thời gian tạo migration theo định dạng `yyyyMMddHHmm` (Ví dụ: `202606161200`).
- `ISSUE_NUMBER`: Số hiệu của Issue/Task tương ứng trên bảng quản lý (Ví dụ: `42`).
- `DESCRIPTION`: Mô tả ngắn gọn bằng tiếng Anh, viết thường, phân cách bởi dấu gạch dưới (Ví dụ: `create_users_table`).
*Ví dụ cụ thể:* `V202606161200_42__create_users_table.sql`

### 2. Java Code Style
- Dự án áp dụng chặt chẽ quy chuẩn **Google Java Style** thông qua plugin **Spotless**.
- Khi chạy build qua Maven, Spotless sẽ kiểm tra và báo lỗi nếu mã nguồn không đúng định dạng.
- Để tự động format code trong quá trình làm việc, hãy cài đặt plugin `google-java-format` trong IDE (IntelliJ IDEA/Eclipse) và bật tính năng *Format on Save*.

### 3. TypeScript / React Code Style
- Sử dụng công cụ **Prettier** kết hợp với **ESLint** (Quy tắc được định hình tại `frontend/.prettierrc`).
- Kiểm tra lỗi tĩnh và cảnh báo: `pnpm run lint`
- Tự động format toàn bộ mã nguồn frontend: `pnpm run format`
- Khuyến nghị cấu hình VS Code tự động format khi lưu bằng cách thêm vào thiết lập `.vscode/settings.json`:
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
  ```

---

## 🧪 Kế Hoạch & Ma Trận Kiểm Thử (Testing)

Nhằm đảm bảo tính đúng đắn và bảo mật, dự án thực hiện kiểm thử ở nhiều cấp độ:

| Mức kiểm thử | Phạm vi kiểm thử | Kỹ thuật áp dụng | Tiêu chí hoàn thành |
| :--- | :--- | :--- | :--- |
| **Unit Test** | Lớp Service logic, định dạng dữ liệu, Mapper, Utils | Mocking dữ liệu (Mockito), kiểm thử phân nhánh | Đảm bảo logic xử lý đúng với mọi trường hợp biên và trả ngoại lệ phù hợp. |
| **Integration Test** | API Controller, Flyway Migrations, Repository liên kết DB | Chạy API thử nghiệm với Testcontainers PostgreSQL | API phản hồi đúng cấu trúc JSON, mã trạng thái HTTP chính xác và rollback dữ liệu sau test. |
| **E2E Test** | Luồng nghiệp vụ liên tục (Đăng nhập -> Xem khóa học -> Ghi danh -> Học bài -> Làm quiz) | MSW Mocking và kiểm thử luồng giao diện người dùng | Người dùng hoàn thành toàn bộ kịch bản nghiệp vụ mượt mà không gặp lỗi layout/lỗi gọi API. |
| **Security Test** | Cơ chế phân quyền API endpoints, chống mã độc | Thử nghiệm gọi API bằng token giả/sai vai trò, tấn công thử XSS | Trả về mã lỗi `401 Unauthorized` hoặc `403 Forbidden` đối với người dùng không hợp lệ. Script độc hại trong Blog được tự động loại bỏ. |
| **Usability & Responsive** | UI Layout trên nhiều độ phân giải màn hình | Kiểm thử hiển thị trên các thiết bị mobile, tablet và desktop | Giao diện tự động co giãn linh hoạt, không tràn khung màn hình, giữ nguyên khả năng tương tác. |

---

## 🚀 Hướng Phát Triển Tương Lai
1. **Phân tích kết quả học tập nâng cao**: Bổ sung bảng dashboard thống kê tỷ lệ hoàn thành, thời gian học trung bình, gợi ý bài học dựa trên hành vi học tập.
2. **Hệ thống chứng chỉ**: Tự động cấp chứng chỉ E-Certificate dưới dạng mã xác thực công khai khi học viên vượt qua điểm yêu cầu của khóa học.
3. **Bài tập tự luận nâng cao**: Hỗ trợ bài học tự luận, cho phép học viên tải tệp câu trả lời và giảng viên tham gia chấm điểm bằng tay/gợi ý đáp án bằng AI.
4. **Thông báo đẩy (Push/Email Notification)**: Tích hợp gửi thư điện tử nhắc nhở hạn nộp bài test, cập nhật bài học mới hoặc duyệt ghi danh tự động.
5. **Mobile Application**: Xây dựng phiên bản Native Mobile App hoặc chuyển đổi dự án sang Progressive Web App (PWA) phục vụ học tập di động ngoại tuyến.
