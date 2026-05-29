package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.AccessStatus;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.entities.EnrollmentEntity;
import com.goctrithuc.backend.entities.EnrollmentId;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.CourseAccessRequestRepository;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.EnrollmentRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class EnrollmentService {

  private final EnrollmentRepository enrollmentRepo;
  private final CourseAccessRequestRepository accessRequestRepo;
  private final CourseRepository courseRepo;
  private final UserRepository userRepo;

  public EnrollmentService(
      EnrollmentRepository enrollmentRepo,
      CourseAccessRequestRepository accessRequestRepo,
      CourseRepository courseRepo,
      UserRepository userRepo) {
    this.enrollmentRepo = enrollmentRepo;
    this.accessRequestRepo = accessRequestRepo;
    this.courseRepo = courseRepo;
    this.userRepo = userRepo;
  }

  @Transactional
  public void enroll(Long userId, Long courseId) {
    Course course =
        courseRepo
            .findById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    if (!course.isPublished()) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Cannot enroll in an unpublished course");
    }

    if (course.getVisibility() == CourseVisibility.PRIVATE) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Private courses cannot be enrolled in directly");
    }

    if (course.getVisibility() == CourseVisibility.RESTRICTED) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Restricted courses require an access request — use POST /api/courses/{id}/access-requests");
    }

    EnrollmentId enrollmentId = new EnrollmentId(userId, courseId);
    if (enrollmentRepo.existsById(enrollmentId)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled");
    }

    User user =
        userRepo
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    EnrollmentEntity e = new EnrollmentEntity(user, course);
    enrollmentRepo.save(e);
  }

  @Transactional
  public void unenroll(Long userId, Long courseId) {
    EnrollmentId enrollmentId = new EnrollmentId(userId, courseId);
    if (!enrollmentRepo.existsById(enrollmentId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found");
    }
    enrollmentRepo.deleteById(enrollmentId);
  }

  @Transactional(readOnly = true)
  public AccessStatus getAccessStatus(Long userId, Long courseId) {
    if (isEnrolled(userId, courseId)) {
      return AccessStatus.ENROLLED;
    }
    if (accessRequestRepo.existsByUserIdAndCourseId(userId, courseId)) {
      return AccessStatus.REQUESTED;
    }
    return AccessStatus.NONE;
  }

  @Transactional(readOnly = true)
  public boolean isEnrolled(Long userId, Long courseId) {
    return enrollmentRepo.existsById(new EnrollmentId(userId, courseId));
  }
}
