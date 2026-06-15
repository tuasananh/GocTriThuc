package com.goctrithuc.backend.dtos;

import com.goctrithuc.backend.entities.LessonType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateLessonRequest(
    @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        String title,
    @NotNull(message = "Lesson type is required") LessonType type) {}
