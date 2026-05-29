package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.*;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import com.goctrithuc.backend.services.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

  private static final Set<String> ALLOWED_SORT_FIELDS =
      Set.of("title", "createdAt", "updatedAt", "id");

  private final CourseService courseService;
  private final EnrollmentService enrollmentService;
  private final AccessRequestService accessRequestService;
  private final CurriculumService curriculumService;
  private final LessonCompletionService lessonCompletionService;
  private final PermissionService permissionService;
  private final UserRepository userRepository;
  private final CourseRepository courseRepository;

  public CourseController(
      CourseService courseService,
      EnrollmentService enrollmentService,
      AccessRequestService accessRequestService,
      CurriculumService curriculumService,
      LessonCompletionService lessonCompletionService,
      PermissionService permissionService,
      UserRepository userRepository,
      CourseRepository courseRepository) {
    this.courseService = courseService;
    this.enrollmentService = enrollmentService;
    this.accessRequestService = accessRequestService;
    this.curriculumService = curriculumService;
    this.lessonCompletionService = lessonCompletionService;
    this.permissionService = permissionService;
    this.userRepository = userRepository;
    this.courseRepository = courseRepository;
  }

  @GetMapping
  public ResponseEntity<Page<CourseResponse>> listCourses(
      @AuthenticationPrincipal OAuth2User principal,
      @RequestParam(value = "search", required = false) String search,
      @RequestParam(value = "visibility", required = false) CourseVisibility visibility,
      @RequestParam(value = "own", required = false) Boolean own,
      @PageableDefault() Pageable pageable) {

    validateSort(pageable);
    Page<Course> courses = courseService.listCourses(principal, search, visibility, own, pageable);
    Page<CourseResponse> response = courses.map(CourseResponse::from);
    return ResponseEntity.ok(response);
  }

  private static void validateSort(Pageable pageable) {
    pageable
        .getSort()
        .forEach(
            order -> {
              if (!ALLOWED_SORT_FIELDS.contains(order.getProperty())) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid sort field: "
                        + order.getProperty()
                        + ". Allowed: "
                        + ALLOWED_SORT_FIELDS);
              }
            });
  }

  @GetMapping("/{id}")
  public ResponseEntity<CourseResponse> getCourse(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {

    Course course = courseService.getCourseById(id, principal);
    return ResponseEntity.ok(CourseResponse.from(course));
  }

  @PostMapping
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<CourseResponse> createCourse(
      @Valid @RequestBody(required = false) CreateCourseRequest request,
      @AuthenticationPrincipal OAuth2User principal) {

    // If body is empty, pass empty request to service to trigger defaults
    CreateCourseRequest req = request != null ? request : new CreateCourseRequest();
    Course course = courseService.createCourse(req, principal);
    return ResponseEntity.status(HttpStatus.CREATED).body(CourseResponse.from(course));
  }

  @PutMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<CourseResponse> updateCourse(
      @PathVariable Long id,
      @Valid @RequestBody UpdateCourseRequest request,
      @AuthenticationPrincipal OAuth2User principal) {

    Course course = courseService.updateCourse(id, request, principal);
    return ResponseEntity.ok(CourseResponse.from(course));
  }

  @PatchMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<CourseResponse> patchCourse(
      @PathVariable Long id,
      @Valid @RequestBody UpdateCourseRequest request,
      @AuthenticationPrincipal OAuth2User principal) {

    Course course = courseService.updateCourse(id, request, principal);
    return ResponseEntity.ok(CourseResponse.from(course));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> deleteCourse(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {

    courseService.deleteCourse(id, principal);
    return ResponseEntity.noContent().build();
  }

  // === Enrollment Endpoints ===

  @GetMapping("/{id}/access-status")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<AccessStatusResponse> accessStatus(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = getCurrentUserId(principal);
    String status = enrollmentService.getAccessStatus(userId, id);
    return ResponseEntity.ok(new AccessStatusResponse(status));
  }

  @PostMapping("/{id}/enroll")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> enroll(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    enrollmentService.enroll(getCurrentUserId(principal), id);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @DeleteMapping("/{id}/enroll")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> unenroll(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    enrollmentService.unenroll(getCurrentUserId(principal), id);
    return ResponseEntity.noContent().build();
  }

  // === Access Requests Endpoints ===

  @PostMapping("/{id}/access-requests")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<Void> requestAccess(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    accessRequestService.requestAccess(getCurrentUserId(principal), id);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @GetMapping("/{id}/access-requests")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<List<AccessRequestResponse>> getAccessRequests(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    return ResponseEntity.ok(accessRequestService.getAccessRequests(id));
  }

  @PostMapping("/{courseId}/access-requests/{userId}/approve")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> approveAccessRequest(
      @PathVariable Long courseId,
      @PathVariable Long userId,
      @AuthenticationPrincipal OAuth2User principal) {
    accessRequestService.approveAccessRequest(courseId, userId);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @DeleteMapping("/{courseId}/access-requests/{userId}")
  @PreAuthorize(
      "@permissionService.hasPermission(#principal, T(com.goctrithuc.backend.common.PermissionConstants).MANAGE_OWN_COURSES)")
  public ResponseEntity<Void> rejectAccessRequest(
      @PathVariable Long courseId,
      @PathVariable Long userId,
      @AuthenticationPrincipal OAuth2User principal) {
    accessRequestService.rejectAccessRequest(courseId, userId);
    return ResponseEntity.noContent().build();
  }

  // === Curriculum Endpoints ===

  @GetMapping("/{id}/modules")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<List<ModuleResponse>> getModules(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = getCurrentUserId(principal);
    boolean isAdmin = permissionService.isAdmin(principal);
    boolean isEnrolled = enrollmentService.getAccessStatus(userId, id).equals("enrolled");
    boolean isAuthor = courseRepository.existsByIdAndAuthorId(id, userId);
    if (!isEnrolled && !isAuthor && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to course curriculum");
    }
    return ResponseEntity.ok(curriculumService.getModulesWithLessons(id));
  }

  // === Progress Endpoints ===

  @GetMapping("/{id}/progress")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<CourseProgressResponse> getProgress(
      @PathVariable Long id, @AuthenticationPrincipal OAuth2User principal) {
    Long userId = getCurrentUserId(principal);
    return ResponseEntity.ok(lessonCompletionService.getProgress(userId, id));
  }

  // === Helper Methods ===

  private Long getCurrentUserId(OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Email missing in OAuth2 user attributes");
    }
    String email = emailObj.toString();
    return userRepository
        .findByEmail(email)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Authenticated user not found in database"))
        .getId();
  }
}
