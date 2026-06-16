package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.CourseProgressResponse;
import com.goctrithuc.backend.entities.EnrollmentId;
import com.goctrithuc.backend.entities.LessonCompletionEntity;
import com.goctrithuc.backend.entities.LessonCompletionId;
import com.goctrithuc.backend.entities.LessonEntity;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.EnrollmentRepository;
import com.goctrithuc.backend.repositories.LessonCompletionRepository;
import com.goctrithuc.backend.repositories.LessonRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LessonCompletionService {

  private final LessonCompletionRepository completionRepo;
  private final LessonRepository lessonRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final UserRepository userRepo;

  public LessonCompletionService(
      LessonCompletionRepository completionRepo,
      LessonRepository lessonRepo,
      EnrollmentRepository enrollmentRepo,
      UserRepository userRepo) {
    this.completionRepo = completionRepo;
    this.lessonRepo = lessonRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.userRepo = userRepo;
  }

  @Transactional
  public void toggleCompletion(Long userId, Long lessonId) {
    LessonEntity lesson =
        lessonRepo
            .findById(lessonId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long courseId = lesson.getModule().getCourse().getId();
    if (!enrollmentRepo.existsById(new EnrollmentId(userId, courseId))) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "User is not enrolled in this course");
    }

    LessonCompletionId id = new LessonCompletionId(userId, lessonId);
    if (completionRepo.existsById(id)) {
      completionRepo.deleteById(id);
    } else {
      User user =
          userRepo
              .findById(userId)
              .orElseThrow(
                  () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
      LessonCompletionEntity e = new LessonCompletionEntity(user, lesson);
      completionRepo.save(e);
    }
  }

  /**
   * Idempotently marks a lesson as completed for the given user. No-op if already marked. Intended
   * to be called internally (e.g. after test submission) — skips enrollment check.
   */
  @Transactional
  public void markComplete(Long userId, Long lessonId) {
    LessonCompletionId id = new LessonCompletionId(userId, lessonId);
    if (completionRepo.existsById(id)) {
      return; // already done
    }
    LessonEntity lesson =
        lessonRepo
            .findById(lessonId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found"));

    Long courseId = lesson.getModule().getCourse().getId();
    if (!enrollmentRepo.existsById(new EnrollmentId(userId, courseId))) {
      return; // if not enrolled, do not mark complete (e.g. instructor or admin)
    }

    User user =
        userRepo
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    completionRepo.save(new LessonCompletionEntity(user, lesson));
  }

  @Transactional(readOnly = true)
  public CourseProgressResponse getProgress(
      Long userId, Long courseId, boolean bypassEnrollmentCheck) {
    if (!bypassEnrollmentCheck && !enrollmentRepo.existsById(new EnrollmentId(userId, courseId))) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "User is not enrolled in this course");
    }
    long totalLessons = lessonRepo.countByModuleCourseId(courseId);
    long completedLessons = completionRepo.countByUserIdAndCourseId(userId, courseId);
    int percent = totalLessons == 0 ? 0 : (int) (completedLessons * 100 / totalLessons);
    return new CourseProgressResponse(completedLessons, totalLessons, percent);
  }
}
