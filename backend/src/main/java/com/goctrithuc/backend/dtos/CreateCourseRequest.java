package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.CourseVisibility;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record CreateCourseRequest(
    @Size(max = 200) String title,
    @Size(max = 10000) String description,
    @Size(max = 500) String thumbnailUrl,
    CourseVisibility visibility,
    Map<String, Object> settings) {}
