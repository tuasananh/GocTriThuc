# Day 6 — Modules & Lesson Editor (Backend Only)

**Goal**: Instructors can create, edit, delete and reorder modules and lessons within a course. Subtype tables (`lesson_videos`, `lesson_blogs`, `lesson_tests`) are created and integrated to hold rich-content lesson details.

**Done when**: API endpoints for Module/Lesson CRUD, subtype content updates, and Up/Down reordering work seamlessly. Subtype entities are created automatically with base defaults. A custom HTML sanitizer utility is ready and actively invoked to clean Blog HTML using the Jsoup library according to SRS constraints.

**SRS source of truth & Constraints confirmed**:
1. **Modules (SRS F3.1)**: Created/updated/deleted/reordered only by the course author (or admin). Reorder uses Up/Down commands, validating bounds and swapping sibling orders. Endpoint: `PATCH /api/modules/{id}/order`.
2. **Lessons (SRS F3.2)**: Has one `lesson_type`: `blog`, `video`, or `test`. On create, a corresponding row in the subtype table (`lesson_blogs`, `lesson_videos`, or `lesson_tests`) is created with the same `id` (table-per-type pattern). Deletion is **hard-delete** (`ON DELETE CASCADE` down to subtypes, resources, comments, completions). Endpoint: `POST /api/modules/{moduleId}/lessons`, `GET /api/lessons/{id}`, `DELETE /api/lessons/{id}`.
3. **Video Lessons (SRS F3.3)**: Store `provider` (`youtube` | `vimeo`) and `provider_value` (URL text). No media files or processing stored on server. Endpoint: `PUT /api/lessons/{id}/video`.
4. **Blog Lessons (SRS F3.4)**: Input HTML must pass through a custom Jsoup clean safelist extending `Safelist.relaxed()` to allow BlockNote-specific styles, classes, and `data-*` attributes, configured with `.preserveRelativeLinks(true)`. Endpoint: `PUT /api/lessons/{id}/blog`.
5. **Test Lessons (SRS F3.5)**: Store a `statement` (instructions), a `time_limit` (seconds), and optional `settings` (JSONB). Endpoint: `PUT /api/lessons/{id}/test`.

---

## Nhiệm Vụ Backend Cần Làm

### 1. Maven Dependency Configuration

#### 1.1 Add `jsoup` to `pom.xml`
Để thực hiện làm sạch mã HTML của bài học dạng Blog nhằm chống tấn công XSS theo ràng buộc **SRS F3.4**, chúng ta cần bổ sung thư viện `jsoup` vào `pom.xml`.

```xml
<!-- location: backend/pom.xml under <dependencies> -->
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.18.1</version>
</dependency>
```

---

### 2. Database Migrations

#### 2.1 `V202606010900_1__create_lesson_subtypes_tables.sql`
Tạo các bảng lưu trữ thông tin chi tiết cho từng loại bài học khác nhau (Subtype pattern). Mỗi bài học thuộc một type (`video`, `blog`, `test`) sẽ có một dòng tương ứng trong bảng subtype với `id` trùng với khóa chính `id` của bảng `lessons` thông qua ràng buộc Foreign Key `ON DELETE CASCADE`.

Tên Triggers sử dụng tiền tố chuẩn `trg_` nhằm đảm bảo tính đồng bộ với thiết kế sơ đồ blueprint của toàn dự án.

```sql
-- package: db.migration
-- location: src/main/resources/db/migration/V202606010900_1__create_lesson_subtypes_tables.sql

-- 1. Create enum type for video provider
CREATE TYPE video_provider AS ENUM ('youtube', 'vimeo');

-- 2. Create casts for video provider mapping
CREATE CAST (varchar AS video_provider) WITH INOUT AS IMPLICIT;
CREATE CAST (video_provider AS varchar) WITH INOUT AS IMPLICIT;
CREATE CAST (text AS video_provider) WITH INOUT AS IMPLICIT;
CREATE CAST (video_provider AS text) WITH INOUT AS IMPLICIT;

-- 3. Create lesson_videos table
CREATE TABLE lesson_videos (
  id             BIGINT PRIMARY KEY,
  provider       video_provider NOT NULL,
  provider_value TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_lesson_videos_updated_at
  BEFORE UPDATE ON lesson_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Create lesson_blogs table
CREATE TABLE lesson_blogs (
  id         BIGINT PRIMARY KEY,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_lesson_blogs_updated_at
  BEFORE UPDATE ON lesson_blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Create lesson_tests table
CREATE TABLE lesson_tests (
  id         BIGINT PRIMARY KEY,
  statement  TEXT NOT NULL,
  time_limit INT NOT NULL,
  settings   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_lesson_tests_updated_at
  BEFORE UPDATE ON lesson_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 3. JPA Entities & Converters

#### 3.1 `VideoProvider.java`
```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/VideoProvider.java

package com.goctrithuc.backend.entities;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum VideoProvider {
  YOUTUBE,
  VIMEO;

  @JsonValue
  public String toJson() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static VideoProvider fromJson(String value) {
    return VideoProvider.valueOf(value.toUpperCase());
  }
}
```

#### 3.2 `VideoProviderJpaConverter.java`
```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/VideoProviderJpaConverter.java

package com.goctrithuc.backend.entities;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class VideoProviderJpaConverter implements AttributeConverter<VideoProvider, String> {

  @Override
  public String convertToDatabaseColumn(VideoProvider attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.name().toLowerCase();
  }

  @Override
  public VideoProvider convertToEntityAttribute(String dbData) {
    if (dbData == null) {
      return null;
    }
    return VideoProvider.valueOf(dbData.toUpperCase());
  }
}
```

#### 3.3 `LessonVideoEntity.java`
```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/LessonVideoEntity.java

package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "lesson_videos")
public class LessonVideoEntity {

  @Id
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private LessonEntity lesson;

  @Column(nullable = false)
  private VideoProvider provider; // Tự động áp dụng nhờ VideoProviderJpaConverter(autoApply = true)

  @Column(name = "provider_value", nullable = false)
  private String providerValue;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected LessonVideoEntity() {}

  public LessonVideoEntity(LessonEntity lesson, VideoProvider provider, String providerValue) {
    this.lesson = lesson;
    this.provider = provider;
    this.providerValue = providerValue;
  }

  public Long getId() {
    return id;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public VideoProvider getProvider() {
    return provider;
  }

  public void setProvider(VideoProvider provider) {
    this.provider = provider;
  }

  public String getProviderValue() {
    return providerValue;
  }

  public void setProviderValue(String providerValue) {
    this.providerValue = providerValue;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
```

#### 3.4 `LessonBlogEntity.java`
```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/LessonBlogEntity.java

package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import java.time.ZonedDateTime;

@Entity
@Table(name = "lesson_blogs")
public class LessonBlogEntity {

  @Id
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private LessonEntity lesson;

  @Column(nullable = false)
  private String content;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected LessonBlogEntity() {}

  public LessonBlogEntity(LessonEntity lesson, String content) {
    this.lesson = lesson;
    this.content = content;
  }

  public Long getId() {
    return id;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
```

#### 3.5 `LessonTestEntity.java`
```java
// package: com.goctrithuc.backend.entities
// location: src/main/java/com/goctrithuc/backend/entities/LessonTestEntity.java

package com.goctrithuc.backend.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.ZonedDateTime;
import java.util.Map;

@Entity
@Table(name = "lesson_tests")
public class LessonTestEntity {

  @Id
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "id")
  private LessonEntity lesson;

  @Column(nullable = false)
  private String statement;

  @Column(name = "time_limit", nullable = false)
  private Integer timeLimit;

  @JdbcTypeCode(SqlTypes.JSON)
  private Map<String, Object> settings;

  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private ZonedDateTime createdAt;

  @Column(name = "updated_at", nullable = false, insertable = false)
  private ZonedDateTime updatedAt;

  protected LessonTestEntity() {}

  public LessonTestEntity(LessonEntity lesson, String statement, Integer timeLimit, Map<String, Object> settings) {
    this.lesson = lesson;
    this.statement = statement;
    this.timeLimit = timeLimit;
    this.settings = settings;
  }

  public Long getId() {
    return id;
  }

  public LessonEntity getLesson() {
    return lesson;
  }

  public void setLesson(LessonEntity lesson) {
    this.lesson = lesson;
  }

  public String getStatement() {
    return statement;
  }

  public void setStatement(String statement) {
    this.statement = statement;
  }

  public Integer getTimeLimit() {
    return timeLimit;
  }

  public void setTimeLimit(Integer timeLimit) {
    this.timeLimit = timeLimit;
  }

  public Map<String, Object> getSettings() {
    // Kỹ thuật lập trình phòng thủ: Fallback về Empty Map nếu DB null settings
    return settings != null ? settings : Map.of();
  }

  public void setSettings(Map<String, Object> settings) {
    this.settings = settings;
  }

  public ZonedDateTime getCreatedAt() {
    return createdAt;
  }

  public ZonedDateTime getUpdatedAt() {
    return updatedAt;
  }
}
```

---

### 4. Repositories

#### 4.1 Subtype Repositories
```java
// package: com.goctrithuc.backend.repositories
// locations:
// - src/main/java/com/goctrithuc/backend/repositories/LessonVideoRepository.java
// - src/main/java/com/goctrithuc/backend/repositories/LessonBlogRepository.java
// - src/main/java/com/goctrithuc/backend/repositories/LessonTestRepository.java

package com.goctrithuc.backend.repositories;

import com.goctrithuc.backend.entities.LessonVideoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonVideoRepository extends JpaRepository<LessonVideoEntity, Long> {}

@Repository
public interface LessonBlogRepository extends JpaRepository<LessonBlogEntity, Long> {}

@Repository
public interface LessonTestRepository extends JpaRepository<LessonTestEntity, Long> {}
```

#### 4.2 Update `ModuleRepository` & `LessonRepository`
```java
// Trong ModuleRepository.java thêm:
int countByCourseId(Long courseId);

// Trong LessonRepository.java thêm:
int countByModuleId(Long moduleId);
```

---

### 5. DTOs

#### 5.1 Requests
```java
// package: com.goctrithuc.backend.dtos
// locations: src/main/java/com/goctrithuc/backend/dtos/

public record CreateModuleRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title
) {}

public record UpdateModuleRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title
) {}

public record CreateLessonRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title,

    @NotNull(message = "Lesson type is required")
    LessonType lessonType
) {}

public record UpdateLessonRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title
) {}

public record ReorderRequest(
    @NotBlank(message = "Direction is required")
    @Pattern(regexp = "^(?i)(up|down)$", message = "Direction must be 'up' or 'down'")
    String direction
) {}

// Requests phục vụ việc Cập nhật nội dung subtype bài học
public record UpdateLessonVideoRequest(
    @NotNull(message = "Provider is required")
    VideoProvider provider,
    
    @NotBlank(message = "Video value is required")
    String providerValue
) {}

public record UpdateLessonBlogRequest(
    @NotBlank(message = "Content is required")
    String content
) {}

public record UpdateLessonTestRequest(
    @NotBlank(message = "Statement is required")
    String statement,
    
    @NotNull(message = "Time limit is required")
    @Min(value = 1, message = "Time limit must be at least 1 second")
    Integer timeLimit,
    
    Map<String, Object> settings
) {}
```

#### 5.2 Responses (Lesson detail & Subtypes)
```java
// package: com.goctrithuc.backend.dtos
// locations: src/main/java/com/goctrithuc/backend/dtos/

public record LessonDetailResponse(
    Long id,
    Long moduleId,
    String title,
    LessonType type,
    Integer order,
    LessonVideoResponse video,
    LessonBlogResponse blog,
    LessonTestResponse test
) {}

public record LessonVideoResponse(
    String provider,
    String providerValue
) {}

public record LessonBlogResponse(
    String content
) {}

public record LessonTestResponse(
    String statement,
    Integer timeLimit,
    Map<String, Object> settings
) {}
```

---

### 6. Common Utilities & Extension

#### 6.1 Add `isAdmin(Long)` in `PermissionService.java`
Để tránh lỗi biên dịch khi phân quyền ở lớp Service, chúng ta cần bổ sung thêm phương thức lấy quyền Admin trực tiếp bằng `userId`.

```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/PermissionService.java

@Transactional(readOnly = true)
public boolean isAdmin(Long userId) {
  return userRepository.findById(userId)
      .map(this::isAdminFromUser)
      .orElse(false);
}
```

#### 6.2 `HtmlSanitizer.java`
Thiết lập bộ lọc HTML bảo mật dựa theo các điều kiện ràng buộc đặc thù của thư viện BlockNote trong **SRS F3.4**.
* Lưu ý: Khắc phục lỗi biên dịch của Jsoup bằng cách parse và thiết lập cấu hình thủ công qua đối tượng `Cleaner`.
* Whitelist toàn bộ attributes `data-*` cho tất cả các tags hợp lệ bằng từ khóa `:all` giúp tránh việc phá vỡ cấu trúc hiển thị heading hay list của BlockNote.

```java
// package: com.goctrithuc.backend.common.util
// location: src/main/java/com/goctrithuc/backend/common/util/HtmlSanitizer.java

package com.goctrithuc.backend.common.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Cleaner;
import org.jsoup.safety.Safelist;

public class HtmlSanitizer {

  private static final Safelist CUSTOM_SAFELIST = Safelist.relaxed()
      .addTags("span", "div", "section")
      .addAttributes(":all", "class", "style", "id")
      .addAttributes(":all", "data-content-type", "data-id", "data-level", "data-text-alignment")
      .addEnforcedAttribute("a", "rel", "nofollow")
      .preserveRelativeLinks(true);

  public static String sanitize(String rawHtml) {
    if (rawHtml == null) {
      return null;
    }
    Document.OutputSettings outputSettings = new Document.OutputSettings().prettyPrint(false);
    Document dirty = Jsoup.parseBodyFragment(rawHtml, "");
    Cleaner cleaner = new Cleaner(CUSTOM_SAFELIST);
    Document clean = cleaner.clean(dirty);
    clean.outputSettings(outputSettings);
    return clean.body().html();
  }
}
```

---

### 7. Services

#### 7.1 `ModuleService.java`
```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/ModuleService.java

package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.CreateModuleRequest;
import com.goctrithuc.backend.dtos.UpdateModuleRequest;
import com.goctrithuc.backend.dtos.ModuleResponse;
import com.goctrithuc.backend.dtos.LessonSummaryResponse;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.ModuleEntity;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.ModuleRepository;
import com.goctrithuc.backend.repositories.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ModuleService {

  private final ModuleRepository moduleRepo;
  private final CourseRepository courseRepo;
  private final LessonRepository lessonRepo;
  private final PermissionService permissionService;

  public ModuleService(
      ModuleRepository moduleRepo,
      CourseRepository courseRepo,
      LessonRepository lessonRepo,
      PermissionService permissionService) {
    this.moduleRepo = moduleRepo;
    this.courseRepo = courseRepo;
    this.lessonRepo = lessonRepo;
    this.permissionService = permissionService;
  }

  @Transactional
  public ModuleResponse createModule(Long courseId, CreateModuleRequest req, Long userId) {
    Course course = courseRepo.findById(courseId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only course author or admin can add modules");
    }

    int nextOrder = moduleRepo.countByCourseId(courseId);
    ModuleEntity m = new ModuleEntity(course, req.title(), nextOrder);
    ModuleEntity saved = moduleRepo.save(m);
    return new ModuleResponse(saved.getId(), saved.getTitle(), saved.getOrder(), new ArrayList<>());
  }

  @Transactional
  public ModuleResponse updateModule(Long id, UpdateModuleRequest req, Long userId) {
    ModuleEntity m = moduleRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = m.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only course author or admin can update modules");
    }

    m.setTitle(req.title());
    ModuleEntity saved = moduleRepo.save(m);
    
    List<LessonSummaryResponse> lessons = lessonRepo.findByModuleIdOrderByOrderAsc(id).stream()
        .map(l -> new LessonSummaryResponse(l.getId(), l.getTitle(), l.getType(), l.getOrder()))
        .toList();
        
    return new ModuleResponse(saved.getId(), saved.getTitle(), saved.getOrder(), lessons);
  }

  @Transactional
  public void deleteModule(Long id, Long userId) {
    ModuleEntity m = moduleRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = m.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only course author or admin can delete modules");
    }

    moduleRepo.delete(m);

    // Re-index remaining modules sequence (giữ cho orders liên tục từ 0 -> N-1)
    List<ModuleEntity> remaining = moduleRepo.findByCourseIdOrderByOrderAsc(course.getId());
    for (int i = 0; i < remaining.size(); i++) {
      remaining.get(i).setOrder(i);
      moduleRepo.save(remaining.get(i));
    }
  }

  @Transactional
  public void reorderModule(Long id, String direction, Long userId) {
    ModuleEntity m = moduleRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = m.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    int currentOrder = m.getOrder();
    List<ModuleEntity> siblings = moduleRepo.findByCourseIdOrderByOrderAsc(course.getId());

    int index = -1;
    for (int i = 0; i < siblings.size(); i++) {
      if (siblings.get(i).getId().equals(id)) {
        index = i;
        break;
      }
    }

    if (index == -1) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Sequence corruption");
    }

    // Ném ngoại lệ ResponseStatusException cụ thể khi vượt biên để UI hiển thị lỗi thay vì bỏ qua im lặng (SRS 1113)
    if ("up".equalsIgnoreCase(direction)) {
      if (index == 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move first module up");
      }
      ModuleEntity prev = siblings.get(index - 1);
      m.setOrder(prev.getOrder());
      prev.setOrder(currentOrder);
      moduleRepo.save(m);
      moduleRepo.save(prev);
    } else if ("down".equalsIgnoreCase(direction)) {
      if (index == siblings.size() - 1) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move last module down");
      }
      ModuleEntity next = siblings.get(index + 1);
      m.setOrder(next.getOrder());
      next.setOrder(currentOrder);
      moduleRepo.save(m);
      moduleRepo.save(next);
    }
  }
}
```

#### 7.2 `LessonService.java`
```java
// package: com.goctrithuc.backend.services
// location: src/main/java/com/goctrithuc/backend/services/LessonService.java

package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import com.goctrithuc.backend.common.util.HtmlSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashMap;
import java.util.List;

@Service
public class LessonService {

  private final LessonRepository lessonRepo;
  private final ModuleRepository moduleRepo;
  private final CourseRepository courseRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final PermissionService permissionService;
  
  // Subtype Repositories
  private final LessonVideoRepository videoRepo;
  private final LessonBlogRepository blogRepo;
  private final LessonTestRepository testRepo;

  public LessonService(
      LessonRepository lessonRepo,
      ModuleRepository moduleRepo,
      CourseRepository courseRepo,
      EnrollmentRepository enrollmentRepo,
      PermissionService permissionService,
      LessonVideoRepository videoRepo,
      LessonBlogRepository blogRepo,
      LessonTestRepository testRepo) {
    this.lessonRepo = lessonRepo;
    this.moduleRepo = moduleRepo;
    this.courseRepo = courseRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.permissionService = permissionService;
    this.videoRepo = videoRepo;
    this.blogRepo = blogRepo;
    this.testRepo = testRepo;
  }

  @Transactional
  public LessonSummaryResponse createLesson(Long moduleId, CreateLessonRequest req, Long userId) {
    ModuleEntity module = moduleRepo.findById(moduleId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = module.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    int nextOrder = lessonRepo.countByModuleId(moduleId);
    LessonEntity lesson = new LessonEntity(module, req.title(), req.lessonType(), nextOrder);
    LessonEntity saved = lessonRepo.save(lesson);

    // Đồng bộ hóa việc tạo Subtype Row tương ứng theo Table-Per-Type (SRS F3.2)
    switch (req.lessonType()) {
      case VIDEO -> {
        LessonVideoEntity video = new LessonVideoEntity(saved, VideoProvider.YOUTUBE, "");
        videoRepo.save(video);
      }
      case BLOG -> {
        LessonBlogEntity blog = new LessonBlogEntity(saved, "<p></p>");
        blogRepo.save(blog);
      }
      case TEST -> {
        // Test mặc định cần statement và timeLimit tối thiểu (v.d. 15 phút = 900 giây)
        LessonTestEntity test = new LessonTestEntity(saved, "Quiz Statement", 900, new HashMap<>());
        testRepo.save(test);
      }
    }

    return new LessonSummaryResponse(saved.getId(), saved.getTitle(), saved.getType(), saved.getOrder());
  }

  @Transactional
  public LessonSummaryResponse updateLesson(Long id, UpdateLessonRequest req, Long userId) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    lesson.setTitle(req.title());
    LessonEntity saved = lessonRepo.save(lesson);
    return new LessonSummaryResponse(saved.getId(), saved.getTitle(), saved.getType(), saved.getOrder());
  }

  @Transactional
  public void deleteLesson(Long id, Long userId) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long moduleId = lesson.getModule().getId();
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    // Hard-delete bài giảng khỏi Database, tự động Cascade tới các subtype tables thông qua DB FK constraints (SRS F3.2)
    lessonRepo.delete(lesson);

    // Re-index remaining lessons sequence (giữ cho orders liên tục từ 0 -> N-1)
    List<LessonEntity> remaining = lessonRepo.findByModuleIdOrderByOrderAsc(moduleId);
    for (int i = 0; i < remaining.size(); i++) {
      remaining.get(i).setOrder(i);
      lessonRepo.save(remaining.get(i));
    }
  }

  @Transactional(readOnly = true)
  public LessonDetailResponse getLessonDetail(Long id, Long userId, boolean isAdmin) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long courseId = lesson.getModule().getCourse().getId();
    boolean isEnrolled = enrollmentRepo.existsById(new EnrollmentId(userId, courseId));
    boolean isAuthor = courseRepo.existsByIdAndAuthorId(courseId, userId);

    if (!isEnrolled && !isAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to lesson content");
    }

    LessonVideoResponse videoRes = null;
    LessonBlogResponse blogRes = null;
    LessonTestResponse testRes = null;

    switch (lesson.getType()) {
      case VIDEO -> {
        LessonVideoEntity video = videoRepo.findById(id).orElse(null);
        if (video != null) {
          videoRes = new LessonVideoResponse(video.getProvider().toJson(), video.getProviderValue());
        }
      }
      case BLOG -> {
        LessonBlogEntity blog = blogRepo.findById(id).orElse(null);
        if (blog != null) {
          blogRes = new LessonBlogResponse(blog.getContent());
        }
      }
      case TEST -> {
        LessonTestEntity test = testRepo.findById(id).orElse(null);
        if (test != null) {
          testRes = new LessonTestResponse(test.getStatement(), test.getTimeLimit(), test.getSettings());
        }
      }
    }

    return new LessonDetailResponse(
        lesson.getId(),
        lesson.getModule().getId(),
        lesson.getTitle(),
        lesson.getType(),
        lesson.getOrder(),
        videoRes,
        blogRes,
        testRes
    );
  }

  // --- CẬP NHẬT NỘI DUNG CHI TIẾT CHO SUBTYPE ---
  
  @Transactional
  public void updateLessonVideo(Long id, UpdateLessonVideoRequest req, Long userId) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }
    
    LessonVideoEntity video = videoRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a video lesson"));
    
    video.setProvider(req.provider());
    video.setProviderValue(req.providerValue());
    videoRepo.save(video);
  }

  @Transactional
  public void updateLessonBlog(Long id, UpdateLessonBlogRequest req, Long userId) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }
    
    LessonBlogEntity blog = blogRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a blog lesson"));
    
    // Áp dụng lọc bảo mật làm sạch mã HTML chống XSS theo đặc tả SRS F3.4
    String cleanHtml = HtmlSanitizer.sanitize(req.content());
    blog.setContent(cleanHtml);
    blogRepo.save(blog);
  }

  @Transactional
  public void updateLessonTest(Long id, UpdateLessonTestRequest req, Long userId) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }
    
    LessonTestEntity test = testRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a test lesson"));
    
    test.setStatement(req.statement());
    test.setTimeLimit(req.timeLimit());
    test.setSettings(req.settings());
    testRepo.save(test);
  }

  @Transactional
  public void reorderLesson(Long id, String direction, Long userId) {
    LessonEntity lesson = lessonRepo.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    ModuleEntity module = lesson.getModule();
    Course course = module.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    int currentOrder = lesson.getOrder();
    List<LessonEntity> siblings = lessonRepo.findByModuleIdOrderByOrderAsc(module.getId());

    int index = -1;
    for (int i = 0; i < siblings.size(); i++) {
      if (siblings.get(i).getId().equals(id)) {
        index = i;
        break;
      }
    }

    if (index == -1) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Sequence corruption");
    }

    // Ném ngoại lệ cụ thể khi vi phạm giới hạn biên thay vì bỏ qua im lặng (SRS 1113)
    if ("up".equalsIgnoreCase(direction)) {
      if (index == 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move first lesson up");
      }
      LessonEntity prev = siblings.get(index - 1);
      lesson.setOrder(prev.getOrder());
      prev.setOrder(currentOrder);
      lessonRepo.save(lesson);
      lessonRepo.save(prev);
    } else if ("down".equalsIgnoreCase(direction)) {
      if (index == siblings.size() - 1) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move last lesson down");
      }
      LessonEntity next = siblings.get(index + 1);
      lesson.setOrder(next.getOrder());
      next.setOrder(currentOrder);
      lessonRepo.save(lesson);
      lessonRepo.save(next);
    }
  }
}
```

---

### 8. Controller Endpoints

#### 8.1 `CourseController.java` Updates
Thêm module creation endpoint.

```java
// Thêm vào CourseController.java:

private final ModuleService moduleService; // Đã thêm vào Constructor và tiêm

// POST /api/courses/{id}/modules
@PostMapping("/{id}/modules")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<ModuleResponse> createModule(
    @PathVariable Long id,
    @Valid @RequestBody CreateModuleRequest req,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  ModuleResponse res = moduleService.createModule(id, req, userId);
  return ResponseEntity.status(HttpStatus.CREATED).body(res);
}
```

#### 8.2 `ModuleController.java` [NEW]
Mở rộng để hỗ trợ thêm endpoints Lesson Creation nhằm tuân thủ tuyệt đối cấu trúc REST của **SRS line 758**: `POST /api/modules/{moduleId}/lessons`.

```java
// package: com.goctrithuc.backend.controllers
// location: src/main/java/com/goctrithuc/backend/controllers/ModuleController.java

package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.ModuleService;
import com.goctrithuc.backend.services.LessonService;
import com.goctrithuc.backend.common.AuthUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

  private final ModuleService moduleService;
  private final LessonService lessonService;
  private final UserRepository userRepository;

  public ModuleController(
      ModuleService moduleService, 
      LessonService lessonService, 
      UserRepository userRepository) {
    this.moduleService = moduleService;
    this.lessonService = lessonService;
    this.userRepository = userRepository;
  }

  // PUT /api/modules/{id}
  @PutMapping("/{id}")
  @PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<ModuleResponse> updateModule(
      @PathVariable Long id,
      @Valid @RequestBody UpdateModuleRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    ModuleResponse res = moduleService.updateModule(id, req, userId);
    return ResponseEntity.ok(res);
  }

  // DELETE /api/modules/{id}
  @DeleteMapping("/{id}")
  @PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> deleteModule(
      @PathVariable Long id,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    moduleService.deleteModule(id, userId);
    return ResponseEntity.noContent().build();
  }

  // PATCH /api/modules/{id}/order
  @PatchMapping("/{id}/order")
  @PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> reorderModule(
      @PathVariable Long id,
      @Valid @RequestBody ReorderRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    moduleService.reorderModule(id, req.direction(), userId);
    return ResponseEntity.noContent().build();
  }

  // POST /api/modules/{moduleId}/lessons — Create new lesson inside module (SRS line 758)
  @PostMapping("/{moduleId}/lessons")
  @PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<LessonSummaryResponse> createLesson(
      @PathVariable Long moduleId,
      @Valid @RequestBody CreateLessonRequest req,
      @AuthenticationPrincipal OAuth2User principal) {
    Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
    LessonSummaryResponse res = lessonService.createLesson(moduleId, req, userId);
    return ResponseEntity.status(HttpStatus.CREATED).body(res);
  }
}
```

#### 8.3 `LessonController.java` Updates
Mở rộng thêm các endpoints để cập nhật chi tiết nội dung từng dạng bài học subtype.

```java
// Mở rộng LessonController.java hiện có:

private final LessonService lessonService;
private final PermissionService permissionService;

// Nhớ cập nhật Constructor đầy đủ:
public LessonController(
    LessonCompletionService lessonCompletionService,
    UserRepository userRepository,
    LessonService lessonService,
    PermissionService permissionService) {
  this.lessonCompletionService = lessonCompletionService;
  this.userRepository = userRepository;
  this.lessonService = lessonService;
  this.permissionService = permissionService;
}

// GET /api/lessons/{id} — Retrieve complete lesson detail with subtype content
@GetMapping("/{id}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<LessonDetailResponse> getLesson(
    @PathVariable Long id,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  boolean isAdmin = permissionService.isAdmin(principal);
  LessonDetailResponse res = lessonService.getLessonDetail(id, userId, isAdmin);
  return ResponseEntity.ok(res);
}

// PUT /api/lessons/{id} — Edit lesson title
@PutMapping("/{id}")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<LessonSummaryResponse> updateLesson(
    @PathVariable Long id,
    @Valid @RequestBody UpdateLessonRequest req,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  LessonSummaryResponse res = lessonService.updateLesson(id, req, userId);
  return ResponseEntity.ok(res);
}

// DELETE /api/lessons/{id} — Hard delete lesson
@DeleteMapping("/{id}")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<Void> deleteLesson(
    @PathVariable Long id,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  lessonService.deleteLesson(id, userId);
  return ResponseEntity.noContent().build();
}

// PATCH /api/lessons/{id}/order — Reorder lesson up/down
@PatchMapping("/{id}/order")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<Void> reorderLesson(
    @PathVariable Long id,
    @Valid @RequestBody ReorderRequest req,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  lessonService.reorderLesson(id, req.direction(), userId);
  return ResponseEntity.noContent().build();
}

// --- ENDPOINTS CẬP NHẬT CHI TIẾT SUBTYPE BÀI HỌC ---

// PUT /api/lessons/{id}/video — Cập nhật link video YouTube/Vimeo
@PutMapping("/{id}/video")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<Void> updateVideoContent(
    @PathVariable Long id,
    @Valid @RequestBody UpdateLessonVideoRequest req,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  lessonService.updateLessonVideo(id, req, userId);
  return ResponseEntity.noContent().build();
}

// PUT /api/lessons/{id}/blog — Cập nhật nội dung HTML của Blog (Được lọc bảo mật Jsoup)
@PutMapping("/{id}/blog")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<Void> updateBlogContent(
    @PathVariable Long id,
    @Valid @RequestBody UpdateLessonBlogRequest req,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  lessonService.updateLessonBlog(id, req, userId);
  return ResponseEntity.noContent().build();
}

// PUT /api/lessons/{id}/test — Cập nhật cài đặt bài thi
@PutMapping("/{id}/test")
@PreAuthorize("@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
public ResponseEntity<Void> updateTestContent(
    @PathVariable Long id,
    @Valid @RequestBody UpdateLessonTestRequest req,
    @AuthenticationPrincipal OAuth2User principal) {
  Long userId = AuthUtils.getCurrentUserId(principal, userRepository);
  lessonService.updateLessonTest(id, req, userId);
  return ResponseEntity.noContent().build();
}
```

---

### 9. Checklist kiểm tra - Cuối ngày 6

- [ ] Maven `pom.xml` đã thêm thư viện `jsoup` version `1.18.1`.
- [ ] `mvn clean compile` biên dịch mã nguồn backend hoàn tất không lỗi cú pháp.
- [ ] Migration chạy thành công qua Flyway; các bảng `lesson_videos`, `lesson_blogs`, `lesson_tests` được định nghĩa chính xác.
- [ ] Enum `VideoProvider` và `VideoProviderJpaConverter` hoạt động đúng kỳ vọng.
- [ ] Khởi tạo module thành công (`POST /api/courses/{id}/modules`) và cập nhật thành công (`PUT /api/modules/{id}`).
- [ ] Tạo mới bài giảng (`POST /api/modules/{moduleId}/lessons`) tuân thủ đúng định dạng đường dẫn của **SRS line 758** và tự động đồng bộ hóa tạo các row subtype tương ứng với id chung.
- [ ] API chi tiết (`GET /api/lessons/{id}`) hiển thị chính xác toàn bộ trường subtype tương ứng với `lesson_type` được truy vấn, đồng thời chặn người dùng chưa enroll khóa học.
- [ ] Xóa bài giảng (`DELETE /api/lessons/{id}`) thực hiện hard-delete đồng thời cascade xóa toàn bộ bản ghi subtype, completions tương ứng, và cập nhật lại thứ tự index (`order`) các bài giảng còn lại liên tục từ `0` đến `N-1`.
- [ ] Reorder Module & Reorder Lesson dịch chuyển thứ tự Up/Down chính xác, trả về lỗi `400 Bad Request` khi vượt quá giới hạn biên (up ở index 0 hoặc down ở index cuối), thay vì bỏ qua im lặng.
- [ ] Cập nhật chi tiết nội dung các bài học subtype (`PUT /api/lessons/{id}/video`, `/api/lessons/{id}/blog`, `/api/lessons/{id}/test`) hoạt động chuẩn xác và bọc bảo mật làm sạch HTML BlockNote.
- [ ] Các logic thao tác CRUD/Reorder đều áp dụng kiểm tra phân quyền chặt chẽ (chỉ Author hoặc Admin được phép thực thi).

---

### 10. Kịch Bản Kiểm Thử Thực Tế Trên Trình Duyệt (Browser Manual Testing Scenarios)

Dưới đây là kịch bản kiểm thử từng bước trực quan trên trình duyệt để kiểm tra chéo các tính năng được phát triển trên Day 6:

#### 10.1 Kịch bản 1: Quản lý Module & Lesson (Quyền Giảng viên sở hữu)
1. **Chuẩn bị**: Đăng nhập hệ thống dưới tài khoản Giảng viên (Teacher A - người tạo khóa học).
2. **Truy cập**: Đi tới màn hình *Instructor Dashboard*, chọn khóa học hiện có và bấm nút **"Chỉnh sửa khóa học"** để mở không gian làm việc *Curriculum Workspace*.
3. **Thêm Module**: 
   * Click nút **"Thêm Module"** (Add Module).
   * Nhập tiêu đề `"Module 1: Nhập môn lập trình"` -> Nhấn *Save*.
   * *Kết quả mong đợi*: Module hiển thị lập tức trong danh sách outline với số thứ tự mặc định là 0.
4. **Thêm Bài học (Subtype creation)**:
   * Trên Module vừa tạo, click nút **"Thêm bài giảng"** (Add Lesson).
   * Nhập tiêu đề `"Bài 1.1: Khái niệm cơ bản"`, chọn Loại bài học là **Blog**. Nhấn *Save*.
   * *Kết quả mong đợi*: Bài giảng hiển thị trong Module dưới dạng biểu tượng icon Blog, cơ sở dữ liệu tự động tạo một dòng blog trống có giá trị là `<p></p>`.
5. **Cập nhật nội dung Blog (Jsoup Sanitizer Check)**:
   * Click vào nút chỉnh sửa bài giảng `"Bài 1.1: Khái niệm cơ bản"` để mở BlockNote Editor.
   * Gõ văn bản có định dạng: một tiêu đề Heading 1, chữ in đậm, danh sách có dấu đầu dòng (Bullet List), và chèn một liên kết. Nhấn *Lưu*.
   * *Kết quả mong đợi*: Giao diện lưu thành công. Dưới Database, bảng `lesson_blogs` lưu chuỗi HTML đã qua xử lý Jsoup (giữ nguyên class, style, data-id của BlockNote nhưng loại bỏ hoàn toàn các mã script độc hại).

#### 10.2 Kịch bản 2: Hoán đổi thứ tự Up/Down và Kiểm tra giới hạn biên (Reordering & Boundary Check)
1. **Chuẩn bị**: Tạo thêm 2 Modules nữa là `"Module 2"` và `"Module 3"` (thứ tự tự động gán là 1 và 2).
2. **Kiểm tra giới hạn biên (Boundary Check)**:
   * Tìm đến `"Module 1"` (ở vị trí đầu tiên), kiểm tra mũi tên **Up** (hoặc nhấn mũi tên Up).
   * *Kết quả mong đợi*: Mũi tên Up bị vô hiệu hóa (disabled) trên frontend. Nếu cố tình gửi request `PATCH /api/modules/{id}/order` với direction `up`, hệ thống backend phải lập tức trả về mã lỗi `400 Bad Request` kèm thông báo không thể di chuyển module đầu tiên lên.
   * Tương tự, tìm đến `"Module 3"` (ở vị trí cuối cùng), kiểm tra mũi tên **Down**. Backend trả về `400 Bad Request` nếu cố tình dịch chuyển vượt giới hạn cuối.
3. **Thao tác hoán đổi**:
   * Tìm đến `"Module 2"` (đang ở giữa), nhấn nút **Up** để hoán đổi với `"Module 1"`.
   * *Kết quả mong đợi*: Màn hình lập tức đổi vị trí của Module 2 lên đầu tiên và Module 1 xuống thứ hai. Dưới Database, order của Module 2 trở thành 0 và Module 1 trở thành 1.

#### 10.3 Kịch bản 3: Học viên học tập & Rào cản bảo mật (Classroom & Security Gate)
1. **Chưa Đăng ký (Guest/Student chưa Enroll)**:
   * Đăng nhập bằng tài khoản Học viên khác chưa đăng ký học, cố tình sao chép link chi tiết bài học và truy cập thẳng (v.d. `/api/lessons/{id}`).
   * *Kết quả mong đợi*: Backend trả về mã lỗi `403 Forbidden` chặn truy cập nội dung bài học.
2. **Sau khi Đăng ký (Enrolled Student)**:
   * Học viên thực hiện đăng ký khóa học (*Enroll*).
   * Truy cập lại không gian bài học (*Classroom Viewer*).
   * *Kết quả mong đợi*: Outline bài học hiển thị đầy đủ. Click vào bài giảng `"Bài 1.1: Khái niệm cơ bản"` sẽ đọc được toàn bộ chi tiết nội dung Blog được hiển thị đúng định dạng tiêu đề, danh sách dưới chế độ Read-only của BlockNote.

#### 10.4 Kịch bản 4: Xóa bài giảng / Module (Hard-delete Cascade Check)
1. **Thao tác**: Giảng viên bấm nút **Xóa bài giảng** `"Bài 1.1: Khái niệm cơ bản"`.
2. **Xác nhận**: Xác nhận hộp thoại cảnh báo trên trình duyệt.
3. **Kết quả mong đợi**:
   * Bài giảng biến mất hoàn toàn khỏi cây thư mục.
   * Dưới Database, bảng `lessons` và `lesson_blogs` mất hẳn dòng bản ghi có ID của bài học đó (Hard-delete). Mọi completions tương ứng của học viên đối với bài học đó cũng tự động bị xóa sạch nhờ cơ chế Cascade.

