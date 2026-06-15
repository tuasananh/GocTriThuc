package com.goctrithuc.backend.services;

import com.goctrithuc.backend.common.util.HtmlSanitizer;
import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.*;
import com.goctrithuc.backend.repositories.*;
import java.util.HashMap;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

  private final LessonResourceRepository lessonResourceRepo;
  private final LessonCompletionRepository completionRepo;
  private final FileRepository fileRepo;

  public LessonService(
      LessonRepository lessonRepo,
      ModuleRepository moduleRepo,
      CourseRepository courseRepo,
      EnrollmentRepository enrollmentRepo,
      PermissionService permissionService,
      LessonVideoRepository videoRepo,
      LessonBlogRepository blogRepo,
      LessonTestRepository testRepo,
      LessonResourceRepository lessonResourceRepo,
      LessonCompletionRepository completionRepo,
      FileRepository fileRepo) {
    this.lessonRepo = lessonRepo;
    this.moduleRepo = moduleRepo;
    this.courseRepo = courseRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.permissionService = permissionService;
    this.videoRepo = videoRepo;
    this.blogRepo = blogRepo;
    this.testRepo = testRepo;
    this.lessonResourceRepo = lessonResourceRepo;
    this.completionRepo = completionRepo;
    this.fileRepo = fileRepo;
  }

  @Transactional
  public LessonSummaryResponse createLesson(Long moduleId, CreateLessonRequest req, Long userId) {
    ModuleEntity module =
        moduleRepo
            .findById(moduleId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

    Course course = module.getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    int nextOrder = lessonRepo.findNextOrderByModuleId(moduleId);
    LessonEntity lesson = new LessonEntity(module, req.title(), req.type(), nextOrder);
    LessonEntity saved = lessonRepo.save(lesson);

    // Đồng bộ hóa việc tạo Subtype Row tương ứng theo Table-Per-Type (SRS F3.2)
    switch (req.type()) {
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

    return new LessonSummaryResponse(
        saved.getId(), saved.getTitle(), saved.getType(), saved.getOrder());
  }

  @Transactional
  public LessonSummaryResponse updateLesson(Long id, UpdateLessonRequest req, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    lesson.setTitle(req.title());
    LessonEntity saved = lessonRepo.save(lesson);
    return new LessonSummaryResponse(
        saved.getId(), saved.getTitle(), saved.getType(), saved.getOrder());
  }

  @Transactional
  public void deleteLesson(Long id, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long moduleId = lesson.getModule().getId();
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    // Hard-delete bài giảng khỏi Database, tự động Cascade tới các subtype tables
    // thông qua DB FK
    // constraints (SRS F3.2)
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
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

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
          videoRes =
              new LessonVideoResponse(video.getProvider().toJson(), video.getProviderValue());
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
          testRes =
              new LessonTestResponse(test.getStatement(), test.getTimeLimit(), test.getSettings());
        }
      }
    }

    boolean completed =
        completionRepo.existsById(
            new com.goctrithuc.backend.entities.LessonCompletionId(userId, id));
    List<LessonResourceEntity> resources = lessonResourceRepo.findByLessonId(id);
    List<FileResponse> fileResponses =
        resources.stream().map(r -> FileResponse.from(r.getFile())).toList();

    return new LessonDetailResponse(
        lesson.getId(),
        lesson.getModule().getId(),
        lesson.getTitle(),
        lesson.getType(),
        lesson.getOrder(),
        videoRes,
        blogRes,
        testRes,
        completed,
        fileResponses);
  }

  @Transactional
  public void attachResource(Long lessonId, Long fileId, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(lessonId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    File file =
        fileRepo
            .findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

    if (!file.getAuthorId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "You do not own this file and cannot attach it");
    }

    if (!lessonResourceRepo.existsByLessonIdAndFileId(lessonId, fileId)) {
      LessonResourceEntity lr = new LessonResourceEntity(lesson, file);
      lessonResourceRepo.save(lr);
    }
  }

  // --- CẬP NHẬT NỘI DUNG CHI TIẾT CHO SUBTYPE ---

  @Transactional
  public void updateLessonVideo(Long id, UpdateLessonVideoRequest req, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    LessonVideoEntity video =
        videoRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a video lesson"));

    video.setProvider(req.provider());
    video.setProviderValue(req.providerValue());
    videoRepo.save(video);
  }

  @Transactional
  public void updateLessonBlog(Long id, UpdateLessonBlogRequest req, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    LessonBlogEntity blog =
        blogRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a blog lesson"));

    // Áp dụng lọc bảo mật làm sạch mã HTML chống XSS theo đặc tả SRS F3.4
    String cleanHtml = HtmlSanitizer.sanitize(req.content());
    blog.setContent(cleanHtml);
    blogRepo.save(blog);
  }

  @Transactional
  public void updateLessonTest(Long id, UpdateLessonTestRequest req, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));
    Course course = lesson.getModule().getCourse();
    if (!course.getAuthor().getId().equals(userId) && !permissionService.isAdmin(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    LessonTestEntity test =
        testRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not a test lesson"));

    test.setStatement(req.statement());
    test.setTimeLimit(req.timeLimit());
    test.setSettings(req.settings());
    testRepo.save(test);
  }

  @Transactional
  public void reorderLesson(Long id, String direction, Long userId) {
    LessonEntity lesson =
        lessonRepo
            .findById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

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
    } else {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Direction must be 'up' or 'down'");
    }
  }
}
