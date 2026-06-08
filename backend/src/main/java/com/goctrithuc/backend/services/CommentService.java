package com.goctrithuc.backend.services;

import com.goctrithuc.backend.common.util.HtmlSanitizer;
import com.goctrithuc.backend.dtos.CommentRequest;
import com.goctrithuc.backend.dtos.CommentResponse;
import com.goctrithuc.backend.entities.Announcement;
import com.goctrithuc.backend.entities.AnnouncementCommentEntity;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.LessonCommentEntity;
import com.goctrithuc.backend.entities.LessonEntity;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.AnnouncementCommentRepository;
import com.goctrithuc.backend.repositories.AnnouncementRepository;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.LessonCommentRepository;
import com.goctrithuc.backend.repositories.LessonRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentService {

  private final LessonCommentRepository lessonCommentRepository;
  private final AnnouncementCommentRepository announcementCommentRepository;
  private final LessonRepository lessonRepository;
  private final AnnouncementRepository announcementRepository;
  private final UserRepository userRepository;
  private final CourseRepository courseRepository;
  private final EnrollmentService enrollmentService;

  public CommentService(
      LessonCommentRepository lessonCommentRepository,
      AnnouncementCommentRepository announcementCommentRepository,
      LessonRepository lessonRepository,
      AnnouncementRepository announcementRepository,
      UserRepository userRepository,
      CourseRepository courseRepository,
      EnrollmentService enrollmentService) {
    this.lessonCommentRepository = lessonCommentRepository;
    this.announcementCommentRepository = announcementCommentRepository;
    this.lessonRepository = lessonRepository;
    this.announcementRepository = announcementRepository;
    this.userRepository = userRepository;
    this.courseRepository = courseRepository;
    this.enrollmentService = enrollmentService;
  }

  // === LESSON COMMENTS ===

  @Transactional
  public CommentResponse createLessonComment(Long lessonId, CommentRequest request, Long userId) {
    LessonEntity lesson =
        lessonRepository
            .findById(lessonId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long courseId = lesson.getModule().getCourse().getId();
    verifyCourseAccess(courseId, userId);

    User author =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    LessonCommentEntity parent = null;
    if (request.parentId() != null) {
      parent =
          lessonCommentRepository
              .findById(request.parentId())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.NOT_FOUND, "Parent comment not found"));
      if (!parent.getLesson().getId().equals(lessonId)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Parent comment belongs to a different lesson");
      }
    }

    String sanitized = HtmlSanitizer.sanitize(request.content());
    LessonCommentEntity comment = new LessonCommentEntity(author, sanitized, lesson, parent);

    LessonCommentEntity saved = lessonCommentRepository.save(comment);
    return CommentResponse.from(saved, new ArrayList<>());
  }

  @Transactional(readOnly = true)
  public Page<CommentResponse> getLessonComments(Long lessonId, Long userId, Pageable pageable) {
    LessonEntity lesson =
        lessonRepository
            .findById(lessonId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long courseId = lesson.getModule().getCourse().getId();
    verifyCourseAccess(courseId, userId);

    Page<LessonCommentEntity> rootsPage =
        lessonCommentRepository.findByLessonIdAndParentIsNullOrderByCreatedAtDesc(
            lessonId, pageable);

    if (rootsPage.isEmpty()) {
      return Page.empty();
    }

    List<Long> rootIds = rootsPage.getContent().stream().map(LessonCommentEntity::getId).toList();
    List<Long> descendantIds = lessonCommentRepository.findDescendantIds(rootIds);

    List<Long> allIds = new ArrayList<>(rootIds);
    allIds.addAll(descendantIds);

    List<LessonCommentEntity> allEntities = lessonCommentRepository.findAllByIdsWithAuthor(allIds);

    List<CommentResponse> rootsList = buildLessonCommentsTree(allEntities, rootIds);

    return new PageImpl<>(rootsList, pageable, rootsPage.getTotalElements());
  }

  @Transactional(readOnly = true)
  public CommentResponse getLessonCommentThread(Long commentId, Long userId) {
    LessonCommentEntity targetComment =
        lessonCommentRepository
            .findById(commentId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    Long courseId = targetComment.getLesson().getModule().getCourse().getId();
    verifyCourseAccess(courseId, userId);

    List<Long> ids = lessonCommentRepository.findSubtreeIdsFromRoot(commentId);
    List<LessonCommentEntity> allEntities = lessonCommentRepository.findAllByIdsWithAuthor(ids);

    List<CommentResponse> results = buildLessonCommentsTree(allEntities, List.of(commentId));
    if (results.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found");
    }
    return results.get(0);
  }

  @Transactional
  public CommentResponse updateLessonComment(Long commentId, CommentRequest request, Long userId) {
    LessonCommentEntity comment =
        lessonCommentRepository
            .findById(commentId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    if (!comment.getAuthor().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to update comment");
    }

    if (comment.getCreatedAt().plus(15, ChronoUnit.MINUTES).isBefore(ZonedDateTime.now())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "15-minute edit window has expired");
    }

    String sanitized = HtmlSanitizer.sanitize(request.content());
    comment.setContent(sanitized);
    comment.setEditedAt(ZonedDateTime.now());

    LessonCommentEntity saved = lessonCommentRepository.save(comment);
    return CommentResponse.from(saved, null);
  }

  @Transactional
  public void deleteLessonComment(Long commentId, Long userId, boolean isAdmin) {
    LessonCommentEntity comment =
        lessonCommentRepository
            .findById(commentId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    Course course = comment.getLesson().getModule().getCourse();
    boolean isCourseAuthor =
        course.getAuthor() != null && course.getAuthor().getId().equals(userId);
    boolean isCommentAuthor = comment.getAuthor().getId().equals(userId);

    if (!isCommentAuthor && !isCourseAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to delete comment");
    }

    lessonCommentRepository.delete(comment);
  }

  // === ANNOUNCEMENT COMMENTS ===

  @Transactional
  public CommentResponse createAnnouncementComment(
      Long announcementId, CommentRequest request, Long userId) {
    Announcement announcement =
        announcementRepository
            .findById(announcementId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));

    Long courseId = announcement.getCourse().getId();
    verifyCourseAccess(courseId, userId);

    User author =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    AnnouncementCommentEntity parent = null;
    if (request.parentId() != null) {
      parent =
          announcementCommentRepository
              .findById(request.parentId())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.NOT_FOUND, "Parent comment not found"));
      if (!parent.getAnnouncement().getId().equals(announcementId)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST, "Parent comment belongs to a different announcement");
      }
    }

    String sanitized = HtmlSanitizer.sanitize(request.content());
    AnnouncementCommentEntity comment =
        new AnnouncementCommentEntity(author, sanitized, announcement, parent);

    AnnouncementCommentEntity saved = announcementCommentRepository.save(comment);
    return CommentResponse.from(saved, new ArrayList<>());
  }

  @Transactional(readOnly = true)
  public Page<CommentResponse> getAnnouncementComments(
      Long announcementId, Long userId, Pageable pageable) {
    Announcement announcement =
        announcementRepository
            .findById(announcementId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));

    Long courseId = announcement.getCourse().getId();
    verifyCourseAccess(courseId, userId);

    Page<AnnouncementCommentEntity> rootsPage =
        announcementCommentRepository.findByAnnouncementIdAndParentIsNullOrderByCreatedAtDesc(
            announcementId, pageable);

    if (rootsPage.isEmpty()) {
      return Page.empty();
    }

    List<Long> rootIds =
        rootsPage.getContent().stream().map(AnnouncementCommentEntity::getId).toList();
    List<Long> descendantIds = announcementCommentRepository.findDescendantIds(rootIds);

    List<Long> allIds = new ArrayList<>(rootIds);
    allIds.addAll(descendantIds);

    List<AnnouncementCommentEntity> allEntities =
        announcementCommentRepository.findAllByIdsWithAuthor(allIds);

    List<CommentResponse> rootsList = buildAnnouncementCommentsTree(allEntities, rootIds);

    return new PageImpl<>(rootsList, pageable, rootsPage.getTotalElements());
  }

  @Transactional(readOnly = true)
  public CommentResponse getAnnouncementCommentThread(Long commentId, Long userId) {
    AnnouncementCommentEntity targetComment =
        announcementCommentRepository
            .findById(commentId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    Long courseId = targetComment.getAnnouncement().getCourse().getId();
    verifyCourseAccess(courseId, userId);

    List<Long> ids = announcementCommentRepository.findSubtreeIdsFromRoot(commentId);
    List<AnnouncementCommentEntity> allEntities =
        announcementCommentRepository.findAllByIdsWithAuthor(ids);

    List<CommentResponse> results = buildAnnouncementCommentsTree(allEntities, List.of(commentId));
    if (results.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found");
    }
    return results.get(0);
  }

  @Transactional
  public CommentResponse updateAnnouncementComment(
      Long commentId, CommentRequest request, Long userId) {
    AnnouncementCommentEntity comment =
        announcementCommentRepository
            .findById(commentId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    if (!comment.getAuthor().getId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to update comment");
    }

    if (comment.getCreatedAt().plus(15, ChronoUnit.MINUTES).isBefore(ZonedDateTime.now())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "15-minute edit window has expired");
    }

    String sanitized = HtmlSanitizer.sanitize(request.content());
    comment.setContent(sanitized);
    comment.setEditedAt(ZonedDateTime.now());

    AnnouncementCommentEntity saved = announcementCommentRepository.save(comment);
    return CommentResponse.from(saved, null);
  }

  @Transactional
  public void deleteAnnouncementComment(Long commentId, Long userId, boolean isAdmin) {
    AnnouncementCommentEntity comment =
        announcementCommentRepository
            .findById(commentId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

    Course course = comment.getAnnouncement().getCourse();
    boolean isCourseAuthor =
        course.getAuthor() != null && course.getAuthor().getId().equals(userId);
    boolean isCommentAuthor = comment.getAuthor().getId().equals(userId);

    if (!isCommentAuthor && !isCourseAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to delete comment");
    }

    announcementCommentRepository.delete(comment);
  }

  // === HELPERS ===

  private void verifyCourseAccess(Long courseId, Long userId) {
    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    boolean isAuthor = course.getAuthor() != null && course.getAuthor().getId().equals(userId);
    boolean isEnrolled = enrollmentService.isEnrolled(userId, courseId);
    boolean isAdmin =
        userRepository
            .findById(userId)
            .map(
                u ->
                    u.getUserRoles().stream()
                        .anyMatch(ur -> ur.getRole().getName().equals("admin")))
            .orElse(false);

    if (!isEnrolled && !isAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to comments thread");
    }
  }

  private List<CommentResponse> buildLessonCommentsTree(
      List<LessonCommentEntity> allEntities, List<Long> rootIds) {
    Map<Long, CommentResponse> dtoMap = new HashMap<>();
    Map<Long, List<CommentResponse>> parentToChildren = new HashMap<>();
    List<CommentResponse> roots = new ArrayList<>();

    for (LessonCommentEntity entity : allEntities) {
      CommentResponse dto = CommentResponse.from(entity, new ArrayList<>());
      dtoMap.put(entity.getId(), dto);

      Long parentId = entity.getParent() != null ? entity.getParent().getId() : null;
      if (parentId != null) {
        parentToChildren.computeIfAbsent(parentId, k -> new ArrayList<>()).add(dto);
      }
    }

    for (Long rootId : rootIds) {
      CommentResponse rootDto = dtoMap.get(rootId);
      if (rootDto != null) {
        roots.add(rootDto);
      }
    }

    assembleTree(roots, parentToChildren, 1);
    return roots;
  }

  private List<CommentResponse> buildAnnouncementCommentsTree(
      List<AnnouncementCommentEntity> allEntities, List<Long> rootIds) {
    Map<Long, CommentResponse> dtoMap = new HashMap<>();
    Map<Long, List<CommentResponse>> parentToChildren = new HashMap<>();
    List<CommentResponse> roots = new ArrayList<>();

    for (AnnouncementCommentEntity entity : allEntities) {
      CommentResponse dto = CommentResponse.from(entity, new ArrayList<>());
      dtoMap.put(entity.getId(), dto);

      Long parentId = entity.getParent() != null ? entity.getParent().getId() : null;
      if (parentId != null) {
        parentToChildren.computeIfAbsent(parentId, k -> new ArrayList<>()).add(dto);
      }
    }

    for (Long rootId : rootIds) {
      CommentResponse rootDto = dtoMap.get(rootId);
      if (rootDto != null) {
        roots.add(rootDto);
      }
    }

    assembleTree(roots, parentToChildren, 1);
    return roots;
  }

  private void assembleTree(
      List<CommentResponse> currentLevel,
      Map<Long, List<CommentResponse>> parentToChildren,
      int currentDepth) {
    if (currentDepth >= 5) {
      return;
    }
    for (CommentResponse comment : currentLevel) {
      List<CommentResponse> children = parentToChildren.get(comment.id());
      if (children != null) {
        children.sort(Comparator.comparing(CommentResponse::createdAt));
        comment.replies().addAll(children);
        assembleTree(children, parentToChildren, currentDepth + 1);
      }
    }
  }
}
