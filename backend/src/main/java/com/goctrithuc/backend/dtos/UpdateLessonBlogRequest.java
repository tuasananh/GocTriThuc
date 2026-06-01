package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotNull;

public record UpdateLessonBlogRequest(@NotNull(message = "Content is required") String content) {}
