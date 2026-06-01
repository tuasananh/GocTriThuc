package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.LessonType;

public record LessonDetailResponse(
    Long id,
    Long moduleId,
    String title,
    LessonType type,
    Integer order,
    LessonVideoResponse video,
    LessonBlogResponse blog,
    LessonTestResponse test) {}
