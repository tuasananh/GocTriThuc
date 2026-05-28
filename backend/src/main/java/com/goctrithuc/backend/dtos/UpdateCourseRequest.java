package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.CourseVisibility;
import java.util.Map;

public record UpdateCourseRequest(
    String title,
    String description,
    String thumbnailUrl,
    CourseVisibility visibility,
    Boolean isPublished,
    Map<String, Object> settings) {}
