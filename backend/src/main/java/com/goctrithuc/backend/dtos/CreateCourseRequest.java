package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.CourseVisibility;
import java.util.Map;

public record CreateCourseRequest(
    String title,
    String description,
    String thumbnailUrl,
    CourseVisibility visibility,
    Map<String, Object> settings) {}
