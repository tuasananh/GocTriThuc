package com.goctrithuc.backend.services;

import com.goctrithuc.backend.common.util.HtmlSanitizer;
import com.goctrithuc.backend.dtos.AnnouncementRequest;
import com.goctrithuc.backend.dtos.AnnouncementResponse;
import com.goctrithuc.backend.entities.Announcement;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.AnnouncementRepository;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AnnouncementService {

  private final AnnouncementRepository announcementRepository;
  private final CourseRepository courseRepository;
  private final UserRepository userRepository;
  private final EnrollmentService enrollmentService;

  public AnnouncementService(
      AnnouncementRepository announcementRepository,
      CourseRepository courseRepository,
      UserRepository userRepository,
      EnrollmentService enrollmentService) {
    this.announcementRepository = announcementRepository;
    this.courseRepository = courseRepository;
    this.userRepository = userRepository;
    this.enrollmentService = enrollmentService;
  }

  @Transactional(readOnly = true)
  public Page<AnnouncementResponse> getAnnouncements(
      Long courseId, Long userId, boolean isAdmin, Pageable pageable) {
    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    boolean isAuthor = course.getAuthor() != null && course.getAuthor().getId().equals(userId);
    boolean isEnrolled = enrollmentService.isEnrolled(userId, courseId);

    if (!isEnrolled && !isAuthor && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to course announcements");
    }

    Page<Announcement> announcements =
        announcementRepository.findByCourseIdOrderByCreatedAtDesc(courseId, pageable);

    if (announcements.isEmpty()) {
      return new PageImpl<>(List.of(), pageable, 0);
    }

    List<Long> authorIds =
        announcements.getContent().stream().map(Announcement::getAuthorId).distinct().toList();
    List<User> authors = userRepository.findAllById(authorIds);
    java.util.Map<Long, User> authorMap = new java.util.HashMap<>();
    for (User u : authors) {
      authorMap.put(u.getId(), u);
    }

    return announcements.map(
        ann -> {
          User author = authorMap.get(ann.getAuthorId());
          return AnnouncementResponse.from(ann, author);
        });
  }

  @Transactional
  public AnnouncementResponse createAnnouncement(
      Long courseId, AnnouncementRequest request, Long authorId, boolean isAdmin) {
    Course course =
        courseRepository
            .findById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    boolean isAuthor = course.getAuthor() != null && course.getAuthor().getId().equals(authorId);
    if (!isAuthor && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to create announcement");
    }

    String sanitizedContent = HtmlSanitizer.sanitize(request.content());

    Announcement announcement =
        new Announcement(course, authorId, request.title(), sanitizedContent);

    Announcement saved = announcementRepository.save(announcement);
    User author = userRepository.findById(authorId).orElse(null);
    return AnnouncementResponse.from(saved, author);
  }

  @Transactional
  public AnnouncementResponse updateAnnouncement(
      Long courseId,
      Long announcementId,
      AnnouncementRequest request,
      Long userId,
      boolean isAdmin) {
    Announcement announcement =
        announcementRepository
            .findById(announcementId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));

    if (!announcement.getCourse().getId().equals(courseId)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Announcement does not belong to this course");
    }

    Course course = announcement.getCourse();
    boolean isAuthor = course.getAuthor() != null && course.getAuthor().getId().equals(userId);
    if (!isAuthor && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to update announcement");
    }

    String sanitizedContent = HtmlSanitizer.sanitize(request.content());
    announcement.setTitle(request.title());
    announcement.setContent(sanitizedContent);

    Announcement saved = announcementRepository.save(announcement);
    User author = userRepository.findById(announcement.getAuthorId()).orElse(null);
    return AnnouncementResponse.from(saved, author);
  }

  @Transactional
  public void deleteAnnouncement(Long courseId, Long announcementId, Long userId, boolean isAdmin) {
    Announcement announcement =
        announcementRepository
            .findById(announcementId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Announcement not found"));

    if (!announcement.getCourse().getId().equals(courseId)) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Announcement does not belong to this course");
    }

    Course course = announcement.getCourse();
    boolean isAuthor = course.getAuthor() != null && course.getAuthor().getId().equals(userId);
    if (!isAuthor && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to delete announcement");
    }

    announcementRepository.delete(announcement);
  }
}
