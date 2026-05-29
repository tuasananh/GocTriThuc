package com.goctrithuc.backend.controllers;

import com.goctrithuc.backend.dtos.CourseResponse;
import com.goctrithuc.backend.dtos.CreateCourseRequest;
import com.goctrithuc.backend.dtos.UpdateCourseRequest;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.services.CourseService;
import jakarta.validation.Valid;
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

  public CourseController(CourseService courseService) {
    this.courseService = courseService;
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
}
