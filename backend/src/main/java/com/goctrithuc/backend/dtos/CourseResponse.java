package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.Course;
import com.goctrithuc.backend.entities.CourseVisibility;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

public record CourseResponse(
    Long id,
    String title,
    String description,
    String thumbnailUrl,
    boolean isPublished,
    CourseVisibility visibility,
    String status,
    Map<String, Object> settings,
    PublicUserResponse author,
    List<FileResponse> resources,
    ZonedDateTime createdAt,
    ZonedDateTime updatedAt) {
  public static CourseResponse from(Course course) {
    return from(course, List.of());
  }

  public static CourseResponse from(Course course, List<FileResponse> resources) {
    String status = computeStatus(course.isPublished(), course.getVisibility());
    return new CourseResponse(
        course.getId(),
        course.getTitle(),
        course.getDescription(),
        course.getThumbnailUrl(),
        course.isPublished(),
        course.getVisibility(),
        status,
        course.getSettings(),
        course.getAuthor() != null ? PublicUserResponse.from(course.getAuthor()) : null,
        resources,
        course.getCreatedAt(),
        course.getUpdatedAt());
  }

  private static String computeStatus(boolean isPublished, CourseVisibility visibility) {
    if (!isPublished && visibility == CourseVisibility.PRIVATE) {
      return "draft";
    }
    if (!isPublished) {
      return "coming_soon";
    }
    if (visibility == CourseVisibility.PRIVATE) {
      return "published_hidden";
    }
    return "live";
  }
}
