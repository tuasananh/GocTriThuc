package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.AccessRequestResponse;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseAccessRequestEntity;
import com.goctrithuc.backend.entities.CourseAccessRequestId;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.entities.EnrollmentEntity;
import com.goctrithuc.backend.entities.EnrollmentId;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.CourseAccessRequestRepository;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.EnrollmentRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccessRequestService {

  private final CourseAccessRequestRepository accessRequestRepo;
  private final EnrollmentRepository enrollmentRepo;
  private final CourseRepository courseRepo;
  private final UserRepository userRepo;

  public AccessRequestService(
      CourseAccessRequestRepository accessRequestRepo,
      EnrollmentRepository enrollmentRepo,
      CourseRepository courseRepo,
      UserRepository userRepo) {
    this.accessRequestRepo = accessRequestRepo;
    this.enrollmentRepo = enrollmentRepo;
    this.courseRepo = courseRepo;
    this.userRepo = userRepo;
  }

  @Transactional
  public void requestAccess(Long userId, Long courseId) {
    Course course =
        courseRepo
            .findById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    if (course.getVisibility() != CourseVisibility.RESTRICTED) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Only restricted courses accept access requests");
    }

    if (enrollmentRepo.existsById(new EnrollmentId(userId, courseId))) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled");
    }

    if (accessRequestRepo.existsByUserIdAndCourseId(userId, courseId)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Already requested");
    }

    User user =
        userRepo
            .findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    CourseAccessRequestEntity req = new CourseAccessRequestEntity(user, course);
    accessRequestRepo.save(req);
  }

  @Transactional
  public void approveAccessRequest(Long courseId, Long userId) {
    CourseAccessRequestId requestId = new CourseAccessRequestId(userId, courseId);
    CourseAccessRequestEntity req =
        accessRequestRepo
            .findById(requestId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "Access request not found"));

    EnrollmentId enrollmentId = new EnrollmentId(userId, courseId);
    if (!enrollmentRepo.existsById(enrollmentId)) {
      EnrollmentEntity e = new EnrollmentEntity(req.getUser(), req.getCourse());
      enrollmentRepo.save(e);
    }

    accessRequestRepo.delete(req);
  }

  @Transactional
  public void rejectAccessRequest(Long courseId, Long userId) {
    CourseAccessRequestId requestId = new CourseAccessRequestId(userId, courseId);
    CourseAccessRequestEntity req =
        accessRequestRepo
            .findById(requestId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "Access request not found"));

    accessRequestRepo.delete(req);
  }

  @Transactional(readOnly = true)
  public List<AccessRequestResponse> getAccessRequests(Long courseId) {
    if (!courseRepo.existsById(courseId)) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
    }
    return accessRequestRepo.findByCourseId(courseId).stream()
        .map(
            req ->
                new AccessRequestResponse(
                    req.getId().getUserId(),
                    req.getId().getCourseId(),
                    req.getUser().getDisplayName(),
                    req.getCreatedAt()))
        .toList();
  }
}
