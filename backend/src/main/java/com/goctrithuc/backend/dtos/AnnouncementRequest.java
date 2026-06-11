package com.goctrithuc.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(
    @NotBlank(message = "Title cannot be blank")
        @Size(max = 200, message = "Title cannot exceed 200 characters")
        String title,
    @NotBlank(message = "Content cannot be blank")
        @Size(max = 10000, message = "Content cannot exceed 10000 characters")
        String content) {}
