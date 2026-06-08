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
  private final com.goctrithuc.backend.repositories.CourseResourceRepository
      courseResourceRepository;
  private final com.goctrithuc.backend.repositories.FileRepository fileRepository;

  public CourseService(
      CourseRepository courseRepository,
      UserRepository userRepository,
      PermissionService permissionService,
      com.goctrithuc.backend.repositories.CourseResourceRepository courseResourceRepository,
      com.goctrithuc.backend.repositories.FileRepository fileRepository) {
    this.courseRepository = courseRepository;
    this.userRepository = userRepository;
    this.permissionService = permissionService;
    this.courseResourceRepository = courseResourceRepository;
    this.fileRepository = fileRepository;
  }

  @Transactional(readOnly = true)
  public Page<Course> listCourses(
      OAuth2User principal,
      String search,
      CourseVisibility visibility,
      Boolean own,
      Boolean enrolled,
      Pageable pageable) {

    boolean hasOwnParam = Boolean.TRUE.equals(own);
    boolean hasEnrolledParam = Boolean.TRUE.equals(enrolled);

    if ((hasOwnParam || hasEnrolledParam) && principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }

    User currentUser = null;
    boolean isAdmin = false;
    if (principal != null) {
      currentUser = getAuthenticatedUser(principal);
      isAdmin = permissionService.isAdminFromUser(currentUser);
    }
    List<CourseVisibility> guestVisibilities =
        Arrays.asList(CourseVisibility.PUBLIC, CourseVisibility.RESTRICTED);

    // Students/guests cannot directly query Private courses (own=true or enrolled=true bypasses
    // this
    // since they're filtering to their own or enrolled courses).
    if (visibility != null
        && !hasOwnParam
        && !hasEnrolledParam
        && !isAdmin
        && !guestVisibilities.contains(visibility)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Access denied to requested visibility");
    }

    Specification<Course> spec = (root, query, cb) -> cb.conjunction();

    if (search != null && !search.isBlank()) {
      spec = spec.and(CourseSpecifications.titleContains(search));
    }

    if (hasOwnParam && currentUser != null) {
      Long authorId = currentUser.getId();
      spec = spec.and(CourseSpecifications.authorIdEquals(authorId));
    }

    if (hasEnrolledParam && currentUser != null) {
      spec = spec.and(CourseSpecifications.enrolledBy(currentUser.getId()));
    }

    if (visibility != null) {
      spec = spec.and(CourseSpecifications.visibilityEquals(visibility));
    } else if (!hasOwnParam && !hasEnrolledParam && !isAdmin) {
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
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
      }
      User user = getAuthenticatedUser(principal);
      boolean isAdmin = permissionService.isAdminFromUser(user);
      if (!course.getAuthor().getId().equals(user.getId()) && !isAdmin) {
        // Return 404 instead of 403 to avoid leaking information about existence of the
        // course
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
    boolean isAdmin = permissionService.isAdminFromUser(user);

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
    boolean isAdmin = permissionService.isAdminFromUser(user);

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

  @Transactional(readOnly = true)
  public List<com.goctrithuc.backend.dtos.FileResponse> getCourseResources(Long courseId) {
    return courseResourceRepository.findByCourseId(courseId).stream()
        .map(r -> com.goctrithuc.backend.dtos.FileResponse.from(r.getFile()))
        .toList();
  }

  @Transactional
  public void attachResource(Long courseId, Long fileId, OAuth2User principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    Course course =
        courseRepository
            .findWithAuthorById(courseId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    User user = getAuthenticatedUser(principal);
    boolean isAdmin = permissionService.isAdminFromUser(user);

    if (!course.getAuthor().getId().equals(user.getId()) && !isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    com.goctrithuc.backend.entities.File file =
        fileRepository
            .findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

    if (!file.getAuthorId().equals(user.getId()) && !isAdmin) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "You do not own this file and cannot attach it");
    }

    if (!courseResourceRepository.existsByCourseIdAndFileId(courseId, fileId)) {
      com.goctrithuc.backend.entities.CourseResourceEntity cr =
          new com.goctrithuc.backend.entities.CourseResourceEntity(course, file);
      courseResourceRepository.save(cr);
    }
  }
}
