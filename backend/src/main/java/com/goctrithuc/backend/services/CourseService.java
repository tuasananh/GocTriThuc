package com.goctrithuc.backend.services;

import com.goctrithuc.backend.dtos.CreateCourseRequest;
import com.goctrithuc.backend.dtos.UpdateCourseRequest;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.CourseSpecifications;
import com.goctrithuc.backend.repositories.UserRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CourseService {

  private final CourseRepository courseRepository;
  private final UserRepository userRepository;
  private final PermissionService permissionService;

  public CourseService(
      CourseRepository courseRepository,
      UserRepository userRepository,
      PermissionService permissionService) {
    this.courseRepository = courseRepository;
    this.userRepository = userRepository;
    this.permissionService = permissionService;
  }

  @Transactional(readOnly = true)
  public Page<Course> listCourses(
      OAuth2User principal,
      String search,
      CourseVisibility visibility,
      Boolean own,
      Pageable pageable) {

    boolean hasOwnParam = Boolean.TRUE.equals(own);

    if (hasOwnParam && principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    boolean isAdmin = permissionService.isAdmin(principal);
    List<CourseVisibility> guestVisibilities =
        Arrays.asList(CourseVisibility.PUBLIC, CourseVisibility.RESTRICTED);

    // Students/guests cannot directly query Private courses (own=true bypasses this since
    // they're filtering to their own authored courses).
    if (visibility != null && !hasOwnParam && !isAdmin && !guestVisibilities.contains(visibility)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to requested visibility");
    }

    Specification<Course> spec = (root, query, cb) -> cb.conjunction();

    if (search != null && !search.isBlank()) {
      spec = spec.and(CourseSpecifications.titleContains(search));
    }

    if (hasOwnParam) {
      Long authorId = getAuthenticatedUser(principal).getId();
      spec = spec.and(CourseSpecifications.authorIdEquals(authorId));
    }

    if (visibility != null) {
      spec = spec.and(CourseSpecifications.visibilityEquals(visibility));
    } else if (!hasOwnParam && !isAdmin) {
      spec = spec.and(CourseSpecifications.visibilityIn(guestVisibilities));
    }

    return courseRepository.findAll(spec, pageable);
  }

  @Transactional(readOnly = true)
  public Course getCourseById(Long id, OAuth2User principal) {
    Course course =
        courseRepository
            .findWithAuthorById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    if (course.getVisibility() == CourseVisibility.PRIVATE) {
      // Check if current user is the author or admin
      if (principal == null) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
      }
      User user = getAuthenticatedUser(principal);
      boolean isAdmin = permissionService.isAdmin(principal);
      if (!course.getAuthor().getId().equals(user.getId()) && !isAdmin) {
        // Return 404 instead of 403 to avoid leaking information about existence of the course
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
      }
    }

    return course;
  }

  @Transactional
  public Course createCourse(CreateCourseRequest request, OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    User author = getAuthenticatedUser(principal);

    // Handle defaults
    String title =
        (request.title() == null || request.title().isBlank()) ? "Khóa học mới" : request.title();
    String description = request.description() == null ? "" : request.description();
    CourseVisibility visibility =
        request.visibility() == null ? CourseVisibility.PRIVATE : request.visibility();
    boolean isPublished = false;

    Course course =
        new Course(
            title,
            description,
            request.thumbnailUrl(),
            isPublished,
            visibility,
            author,
            request.settings());

    return courseRepository.save(course);
  }

  @Transactional
  public Course updateCourse(Long id, UpdateCourseRequest request, OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    Course course =
        courseRepository
            .findWithAuthorById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    User user = getAuthenticatedUser(principal);
    boolean isAdmin = permissionService.isAdmin(principal);

    // Ownership layer check
    if (!course.getAuthor().getId().equals(user.getId()) && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not the author or admin");
    }

    // Partial update
    if (request.title() != null) {
      course.setTitle(request.title());
    }
    if (request.description() != null) {
      course.setDescription(request.description());
    }
    if (request.thumbnailUrl() != null) {
      course.setThumbnailUrl(request.thumbnailUrl());
    }
    if (request.visibility() != null) {
      course.setVisibility(request.visibility());
    }
    if (request.isPublished() != null) {
      course.setPublished(request.isPublished());
    }
    if (request.settings() != null) {
      course.setSettings(request.settings());
    }

    return courseRepository.save(course);
  }

  @Transactional
  public void deleteCourse(Long id, OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    Course course =
        courseRepository
            .findWithAuthorById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    User user = getAuthenticatedUser(principal);
    boolean isAdmin = permissionService.isAdmin(principal);

    // Ownership layer check
    if (!course.getAuthor().getId().equals(user.getId()) && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not the author or admin");
    }

    courseRepository.delete(course);
  }

  private User getAuthenticatedUser(OAuth2User principal) {
    Object emailObj = principal.getAttribute("email");
    if (emailObj == null) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Email missing in OAuth2 user attributes");
    }
    String email = emailObj.toString();
    return userRepository
        .findByEmailWithRoles(email)
        .orElseThrow(
            () ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Authenticated user not found in database"));
  }
}
