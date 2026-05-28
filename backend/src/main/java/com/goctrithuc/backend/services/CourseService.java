package com.goctrithuc.backend.services;

import com.goctrithuc.backend.common.PermissionConstants;
import com.goctrithuc.backend.dtos.CreateCourseRequest;
import com.goctrithuc.backend.dtos.UpdateCourseRequest;
import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import com.goctrithuc.backend.entities.User;
import com.goctrithuc.backend.repositories.CourseRepository;
import com.goctrithuc.backend.repositories.UserRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // If own = true, user must be authenticated
    if (hasOwnParam) {
      if (principal == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
      }
      User user = getAuthenticatedUser(principal);
      Long authorId = user.getId();

      if (search != null && !search.isBlank()) {
        if (visibility != null) {
          return courseRepository.findByTitleContainingIgnoreCaseAndVisibilityAndAuthorId(
              search, visibility, authorId, pageable);
        }
        return courseRepository.findByTitleContainingIgnoreCaseAndAuthorId(
            search, authorId, pageable);
      } else {
        if (visibility != null) {
          return courseRepository.findByVisibilityAndAuthorId(visibility, authorId, pageable);
        }
        return courseRepository.findByAuthorId(authorId, pageable);
      }
    }

    // Checking if user is Admin
    boolean isAdmin = permissionService.isAdmin(principal);

    if (isAdmin) {
      // Admin sees everything
      if (search != null && !search.isBlank()) {
        if (visibility != null) {
          return courseRepository.findByTitleContainingIgnoreCaseAndVisibility(
              search, visibility, pageable);
        }
        return courseRepository.findByTitleContainingIgnoreCase(search, pageable);
      } else {
        if (visibility != null) {
          return courseRepository.findByVisibility(visibility, pageable);
        }
        return courseRepository.findAll(pageable);
      }
    }

    // Student or Guest can only see Public and Restricted courses
    List<CourseVisibility> guestVisibilities =
        Arrays.asList(CourseVisibility.Public, CourseVisibility.Restricted);

    if (visibility != null) {
      if (!guestVisibilities.contains(visibility)) {
        // Guest/Student cannot query Private courses
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN, "Access denied to requested visibility");
      }
      if (search != null && !search.isBlank()) {
        return courseRepository.findByTitleContainingIgnoreCaseAndVisibility(
            search, visibility, pageable);
      }
      return courseRepository.findByVisibility(visibility, pageable);
    }

    if (search != null && !search.isBlank()) {
      return courseRepository.findByTitleContainingIgnoreCaseAndVisibilityIn(
          search, guestVisibilities, pageable);
    }

    return courseRepository.findByVisibilityIn(guestVisibilities, pageable);
  }

  @Transactional(readOnly = true)
  public Course getCourseById(Long id, OAuth2User principal) {
    Course course =
        courseRepository
            .findWithAuthorById(id)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

    if (course.getVisibility() == CourseVisibility.Private) {
      // Check if current user is the author or admin
      if (principal == null) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
      }
      User user = getAuthenticatedUser(principal);
      boolean isAdmin = permissionService.isAdmin(principal);
      if (!course.getAuthor().getId().equals(user.getId()) && !isAdmin) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
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

    // Two-layer capability check (redundant but safe)
    if (!permissionService.hasPermission(principal, PermissionConstants.MANAGE_OWN_COURSES)) {
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "User does not have course creation permission");
    }

    // Handle defaults
    String title =
        (request.title() == null || request.title().isBlank()) ? "Khóa học mới" : request.title();
    String description = request.description() == null ? "" : request.description();
    CourseVisibility visibility =
        request.visibility() == null ? CourseVisibility.Private : request.visibility();
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
