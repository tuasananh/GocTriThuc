package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotBlank;

public record UpdateLessonBlogRequest(@NotBlank(message = "Content is required") String content) {}
